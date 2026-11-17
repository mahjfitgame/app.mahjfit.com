# Phase Play: Wall Game Standard Exposure Architecture Plan

## Architectural Review & Root Cause
Instead of creating custom events, ad-hoc arrays, and 100+ lines of custom sprite tracking in `scene.ts` and `component.ts`, this feature cleanly aligns with Mahjfit's reactive state architecture:

1. **Single Source of Truth (`state.ts`)**:
   - `all_seat_exposures` is the authoritative computed signal for all 4 seats' exposures.
   - When `play_finished_reason === "WALL_EMPTY"`, `all_seat_exposures` includes each player's rack hand tiles as a meld.
2. **Automatic Synchronization (`component.ts -> scene.ts`)**:
   - When the signal updates, the existing `exposures:update` effect sends the data to Phaser.
   - Phaser's existing `renderExposuresSet()` already knows how to layout and render melds across all seats.
3. **No Event Conflicts**:
   - Eliminates the conflict where `exposures:update` wiped out manual `table:wall-game` sprites.
   - Requires minimal code, zero new state variables, and preserves existing coding standards.

---

## Detailed Before & After Snippets

### 1. `src/app/module/business/game/state/state.ts`

#### Snippet: `all_seat_exposures` Computed Signal (~line 635)
**BEFORE:**
```typescript
    // ████ all_seat_exposures SIGNAL ███████████████████████████████████████████
    public readonly all_seat_exposures = computed(() => {
        const seats = this.ordered_seats();
        const mapping = this.seat_mapping();

        const result = { bottom: [], right: [], top: [], left: [] } as any;

        const getExposures = (seat: any) => {
            return seat?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.exposures_meld || [];
        };

        if (seats[mapping.bottom]) result.bottom = getExposures(seats[mapping.bottom]);
        if (seats[mapping.right]) result.right = getExposures(seats[mapping.right]);
        if (seats[mapping.top]) result.top = getExposures(seats[mapping.top]);
        if (seats[mapping.left]) result.left = getExposures(seats[mapping.left]);

        return result;
    });
```

**AFTER:**
```typescript
    // ████ all_seat_exposures SIGNAL ███████████████████████████████████████████
    /* OLDCODE
    public readonly all_seat_exposures = computed(() => {
        const seats = this.ordered_seats();
        const mapping = this.seat_mapping();

        const result = { bottom: [], right: [], top: [], left: [] } as any;

        const getExposures = (seat: any) => {
            return seat?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.exposures_meld || [];
        };

        if (seats[mapping.bottom]) result.bottom = getExposures(seats[mapping.bottom]);
        if (seats[mapping.right]) result.right = getExposures(seats[mapping.right]);
        if (seats[mapping.top]) result.top = getExposures(seats[mapping.top]);
        if (seats[mapping.left]) result.left = getExposures(seats[mapping.left]);

        return result;
    });
    OLDCODE */
    /* NEWCODE */
    // Appends hand tiles to each seat's exposures list when game ends in Wall Game
    public readonly all_seat_exposures = computed(() => {
        const seats = this.ordered_seats();
        const mapping = this.seat_mapping();
        const isWallGame = this.play_finished_reason() === "WALL_EMPTY";

        const result = { bottom: [], right: [], top: [], left: [] } as any;

        const getExposures = (seat: any) => {
            const melds = [...(seat?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.exposures_meld || [])];
            if (isWallGame && seat?.racks) {
                const rack = seat.racks[GameRackIDEnumAddon.RACK_FIRST]
                    || seat.racks[1]
                    || Object.values(seat.racks)[0];
                const tileIds = rack?.hand_order && Array.isArray(rack.hand_order) && rack.hand_order.length > 0
                    ? rack.hand_order
                    : rack?.hand && typeof rack.hand === 'object'
                        ? Object.keys(rack.hand).map(Number)
                        : [];
                if (tileIds.length > 0) {
                    melds.push({
                        tiles: tileIds.map((id: number) => ({ tile_id: id }))
                    });
                }
            }
            return melds;
        };

        if (seats[mapping.bottom]) result.bottom = getExposures(seats[mapping.bottom]);
        if (seats[mapping.right]) result.right = getExposures(seats[mapping.right]);
        if (seats[mapping.top]) result.top = getExposures(seats[mapping.top]);
        if (seats[mapping.left]) result.left = getExposures(seats[mapping.left]);

        return result;
    });
    /* NEWCODE */
```

---

### 2. `src/app/module/business/game/phaser/scenes/scene.ts`

#### Snippet A: Allow Bottom Hand in Exposure on Finished Game (~line 4788)
**BEFORE:**
```typescript
        // Prevent rendering tiles that are actually in our rack (compensates for backend sync lag/bugs where swapped jokers remain in exposures)
        if (this.rackOrder.includes(tile.tile_id)) continue;
```

**AFTER:**
```typescript
        /* OLDCODE
        // Prevent rendering tiles that are actually in our rack (compensates for backend sync lag/bugs where swapped jokers remain in exposures)
        if (this.rackOrder.includes(tile.tile_id)) continue;
        OLDCODE */
        /* NEWCODE */
        // During active play, prevent rack tiles in exposures; on game finish (Wall Game), allow them into exposure
        if (this.tablePhase !== GamePhaseEnum.FINISHED && this.rackOrder.includes(tile.tile_id)) continue;
        /* NEWCODE */
```

---

#### Snippet B: Hide Bottom Rack Tiles on Game Finish (~line 1270)
**BEFORE:**
```typescript
    if (phase !== GamePhaseEnum.PASSING) {
      this.clearBotPassVisualTiles();
      this.isBotPassVisualAnimating = false;
      this.hasCompletedFirstCharlestonVisualPass = false;
    }
```

**AFTER:**
```typescript
    if (phase !== GamePhaseEnum.PASSING) {
      this.clearBotPassVisualTiles();
      this.isBotPassVisualAnimating = false;
      this.hasCompletedFirstCharlestonVisualPass = false;
    }
    /* NEWCODE */
    // Hide bottom rack tiles on game finish so tiles are shown cleanly in the exposure tray
    if (phase === GamePhaseEnum.FINISHED) {
      for (const runtime of this.tileMap.values()) {
        if (runtime.zone === "rack" && runtime.image) {
          runtime.image.setVisible(false);
        }
      }
    }
    /* NEWCODE */
```

---

#### Snippet C: Suppress Floating Debug Hands on Game Finish (~line 5140)
**BEFORE:**
```typescript
  // Render debug rack hand tiles for top, left, and right seats
  private renderDebugOpponentHands(hands: { bottom: any[], right: any[], top: any[], left: any[] }): void {
    if (!this.layout || Object.keys(this.allTiles).length === 0) return;

    for (const seat of ["top", "left", "right"] as const) {
```

**AFTER:**
```typescript
  // Render debug rack hand tiles for top, left, and right seats
  private renderDebugOpponentHands(hands: { bottom: any[], right: any[], top: any[], left: any[] }): void {
    if (!this.layout || Object.keys(this.allTiles).length === 0) return;
    /* NEWCODE */
    // Exposure trays display the tiles at game finish; do not render floating debug rack tiles
    if (this.tablePhase === GamePhaseEnum.FINISHED) return;
    /* NEWCODE */

    for (const seat of ["top", "left", "right"] as const) {
```

---

### 3. `src/app/module/business/game/phaser/component.ts`

#### Snippet: Wall Game Sound & Popup (~lines 1024-1060)
Removes the redundant manual extraction and custom `table:wall-game` event. The reactive `all_seat_exposures()` signal automatically handles the exposures update for all seats.

**BEFORE:**
```typescript
          /* OLDCODE
          // Reveal all seats' hands to exposures on wall game
          const seats = this.gameState.play_seats();
          this.phaser?.events.emit("table:wall-game", seats);
          OLDCODE */
          /* NEWCODE */
          // Map play.seats key-by-value directly to table positions (top, left, right)
          const seats = this.gameState.play_seats();
          const getSeatPos = this.gameState.seat_position_by_gseat_id();
          const opponentHands: Record<string, number[]> = {};

          if (seats && typeof seats === 'object') {
            for (const seat of Object.values(seats) as any[]) {
              const seatPos = getSeatPos(seat?.id);
              // Only reveal opponent seats (bottom is already visible on the player's rack)
              if (seatPos && seatPos !== 'bottom') {
                const rack = seat?.racks?.[GameRackIDEnumAddon.RACK_FIRST] || seat?.racks?.["1"];
                const tileIds: number[] = rack?.hand_order && Array.isArray(rack.hand_order)
                  ? rack.hand_order
                  : rack?.hand && typeof rack.hand === 'object'
                    ? Object.keys(rack.hand).map(Number)
                    : [];
                if (tileIds.length > 0) {
                  opponentHands[seatPos] = tileIds;
                }
              }
            }
          }
          this.phaser?.events.emit("ui:wall-game-sound");
          this.phaser?.events.emit("table:wall-game", opponentHands);
          /* NEWCODE */
```

**AFTER:**
```typescript
          /* OLDCODE
          // Map play.seats key-by-value directly to table positions (top, left, right)
          const seats = this.gameState.play_seats();
          const getSeatPos = this.gameState.seat_position_by_gseat_id();
          const opponentHands: Record<string, number[]> = {};

          if (seats && typeof seats === 'object') {
            for (const seat of Object.values(seats) as any[]) {
              const seatPos = getSeatPos(seat?.id);
              // Only reveal opponent seats (bottom is already visible on the player's rack)
              if (seatPos && seatPos !== 'bottom') {
                const rack = seat?.racks?.[GameRackIDEnumAddon.RACK_FIRST] || seat?.racks?.["1"];
                const tileIds: number[] = rack?.hand_order && Array.isArray(rack.hand_order)
                  ? rack.hand_order
                  : rack?.hand && typeof rack.hand === 'object'
                    ? Object.keys(rack.hand).map(Number)
                    : [];
                if (tileIds.length > 0) {
                  opponentHands[seatPos] = tileIds;
                }
              }
            }
          }
          this.phaser?.events.emit("ui:wall-game-sound");
          this.phaser?.events.emit("table:wall-game", opponentHands);
          OLDCODE */
          /* NEWCODE */
          // Play wall game sound (all_seat_exposures signal automatically supplies all seats' rack hands to exposures)
          this.phaser?.events.emit("ui:wall-game-sound");
          /* NEWCODE */
```

