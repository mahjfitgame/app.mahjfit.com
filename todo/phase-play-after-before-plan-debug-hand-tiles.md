# Play Phase Debug Hand Tiles - Before & After Plan

## Problem & Feature Summary
During testing and development in the **debug environment** (`environment.DEBUG === true`), developers need to see the concealed rack hand tiles for all opponent seats (bot seats: `top`, `left`, `right`) to understand and inspect how bots make decisions and play.

Currently:
1. Only the bottom player's rack hand tiles are rendered on the table.
2. Opponent seats only display called melds in their exposure area; their concealed rack hand is not visible.
3. The server now provides full unmasked seat data when in debug mode, and BFW API SDK includes WebSocket support for debug state.

### BFW API SDK Cross-Check
In `node_modules/@bfw/api-sdk`:
1. **`gameEngine.subscribeDebug`**:
   - Listens to WebSocket event: `game.publish.debug`.
   - Receives the unmasked state containing full hand tiles for all seats.
2. **`gameEngine.publishGetDebugState`**:
   - Emits WebSocket event: `game.subscribe.debug.state`.
   - Payload: `{ input: { keyid: game_keyid } }`.
   - Requests the server to publish the latest debug state.
3. **Play State Payload**:
   - When the server runs in debug mode, `play.seats` also includes the full seat rack hand data (`racks[1].hand` and `racks[1].hand_order`).

### UI Requirements
1. **Bottom Seat**: No change required (human player's rack is already displayed).
2. **Opponent Seats (`top`, `left`, `right`)**:
   - Display all concealed rack hand tiles above the exposure area of each specific seat.
   - Tile size must be smaller than standard tiles for clear visibility without obstructing gameplay.
   - Only active when `environment.DEBUG === true`.

---

## File Changes: Before & After Code Snippets

---

### File 1: `src/app/module/business/game/state/state.ts`

#### Snippet 1.1: Add `unsubscribeDebug` property
**Location**: `src/app/module/business/game/state/state.ts` (around line 56)

##### Before:
```typescript
    private unsubscribePlay: unknown = null;
    private unsubscribePersonal: unknown = null;
```

##### After:
```typescript
    /* OLDCODE
    private unsubscribePlay: unknown = null;
    private unsubscribePersonal: unknown = null;
    OLDCODE */
    /* NEWCODE */
    // Store unsubscribe callbacks for websocket listeners
    private unsubscribePlay: unknown = null;
    private unsubscribePersonal: unknown = null;
    private unsubscribeDebug: unknown = null;
    /* NEWCODE */
```

---

#### Snippet 1.2: Subscribe to debug state in constructor
**Location**: `src/app/module/business/game/state/state.ts` (around line 1097)

##### Before:
```typescript
        this.subscribePlay();
        this.subscribePersonal();
```

##### After:
```typescript
        /* OLDCODE
        this.subscribePlay();
        this.subscribePersonal();
        OLDCODE */
        /* NEWCODE */
        // Listen to play and personal state updates from websocket
        this.subscribePlay();
        this.subscribePersonal();

        // When debug mode is active, also listen to debug state
        if (environment.DEBUG) {
            this.subscribeDebug();
        }
        /* NEWCODE */
```

---

#### Snippet 1.3: Add `subscribeDebug`, `subscribeDebugCleanup`, and `publishGetDebugState`
**Location**: `src/app/module/business/game/state/state.ts` (around line 1522)

##### Before:
```typescript
    private async subscribePersonalCleanup(): Promise<void> {
        if (!this.unsubscribePersonal) {
            return;
        }

        if (typeof this.unsubscribePersonal === 'function') {
            this.unsubscribePersonal();
            this.unsubscribePersonal = null;
            return;
        }

        if (
            typeof this.unsubscribePersonal === 'object' &&
            'unsubscribe' in this.unsubscribePersonal &&
            typeof this.unsubscribePersonal.unsubscribe === 'function'
        ) {
            this.unsubscribePersonal.unsubscribe();
            this.unsubscribePersonal = null;
        }
    }

    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬
    // ████ WEB SOCKET CALL PUBLISH JOIN ████████████████████████████████████████████
```

##### After:
```typescript
    /* OLDCODE
    private async subscribePersonalCleanup(): Promise<void> {
        if (!this.unsubscribePersonal) {
            return;
        }

        if (typeof this.unsubscribePersonal === 'function') {
            this.unsubscribePersonal();
            this.unsubscribePersonal = null;
            return;
        }

        if (
            typeof this.unsubscribePersonal === 'object' &&
            'unsubscribe' in this.unsubscribePersonal &&
            typeof this.unsubscribePersonal.unsubscribe === 'function'
        ) {
            this.unsubscribePersonal.unsubscribe();
            this.unsubscribePersonal = null;
        }
    }

    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬
    // ████ WEB SOCKET CALL PUBLISH JOIN ████████████████████████████████████████████
    OLDCODE */
    /* NEWCODE */
    private async subscribePersonalCleanup(): Promise<void> {
        if (!this.unsubscribePersonal) {
            return;
        }

        if (typeof this.unsubscribePersonal === 'function') {
            this.unsubscribePersonal();
            this.unsubscribePersonal = null;
            return;
        }

        if (
            typeof this.unsubscribePersonal === 'object' &&
            'unsubscribe' in this.unsubscribePersonal &&
            typeof this.unsubscribePersonal.unsubscribe === 'function'
        ) {
            this.unsubscribePersonal.unsubscribe();
            this.unsubscribePersonal = null;
        }
    }

    // ████ WEB SOCKET CALL SUBSCRIBE DEBUG ████████████████████████████████████████████
    // Listen to debug state updates sent from server (event: game.publish.debug)
    private async subscribeDebug(): Promise<void> {
        try {
            this.unsubscribeDebug = await this.api.sdk.graphql.ws.gameEngine?.subscribeDebug({
                response: (payload: any) => {
                    const data = payload?.data ?? payload;
                    console.log('[subscribeDebug] data received: ', data);

                    // Save debug payload so UI can read all tiles
                    this.captureDevelopmentPayload(data);

                    // If debug payload contains play or seats data, update it
                    if (data?.play) {
                        this.setPlay(data.play);
                    }
                },
            });

            const remove = async () => this.subscribeDebugCleanup();
            this.registerAsyncCleanup(remove, 'subscribe debug listener');
        } catch (error) {
            console.error('[subscribe debug error]', error);
        }
    }

    // Clean up debug websocket listener
    private async subscribeDebugCleanup(): Promise<void> {
        if (!this.unsubscribeDebug) {
            return;
        }

        if (typeof this.unsubscribeDebug === 'function') {
            this.unsubscribeDebug();
            this.unsubscribeDebug = null;
            return;
        }

        if (
            typeof this.unsubscribeDebug === 'object' &&
            'unsubscribe' in this.unsubscribeDebug &&
            typeof this.unsubscribeDebug.unsubscribe === 'function'
        ) {
            this.unsubscribeDebug.unsubscribe();
            this.unsubscribeDebug = null;
        }
    }

    // Request debug state from server via websocket (event: game.subscribe.debug.state)
    public async publishGetDebugState(): Promise<void> {
        try {
            const keyid = this.game_keyid();
            if (!keyid) return;
            await this.api.sdk.graphql.ws.gameEngine?.publishGetDebugState({
                input: { keyid },
            });
        } catch (error) {
            console.error('[publishGetDebugState error]', error);
        }
    }

    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬
    // ████ WEB SOCKET CALL PUBLISH JOIN ████████████████████████████████████████████
    /* NEWCODE */
```

---

#### Snippet 1.4: Add `all_seat_rack_hands` computed signal
**Location**: `src/app/module/business/game/state/state.ts` (around line 601)

##### Before:
```typescript
        if (seats[mapping.bottom]) result.bottom = getExposures(seats[mapping.bottom]);
        if (seats[mapping.right]) result.right = getExposures(seats[mapping.right]);
        if (seats[mapping.top]) result.top = getExposures(seats[mapping.top]);
        if (seats[mapping.left]) result.left = getExposures(seats[mapping.left]);

        return result;
    });

    // ████ all_seat_dead_states SIGNAL ███████████████████████████████████████████
```

##### After:
```typescript
        if (seats[mapping.bottom]) result.bottom = getExposures(seats[mapping.bottom]);
        if (seats[mapping.right]) result.right = getExposures(seats[mapping.right]);
        if (seats[mapping.top]) result.top = getExposures(seats[mapping.top]);
        if (seats[mapping.left]) result.left = getExposures(seats[mapping.left]);

        return result;
    });

    /* NEWCODE */
    // ████ all_seat_rack_hands SIGNAL (DEBUG ONLY) ██████████████████████████████████
    // Returns hand tiles for each seat (bottom, right, top, left) when in debug mode
    public readonly all_seat_rack_hands = computed(() => {
        const result = { bottom: [] as any[], right: [] as any[], top: [] as any[], left: [] as any[] };
        if (!environment.DEBUG) {
            return result;
        }

        const seats = this.ordered_seats();
        const mapping = this.seat_mapping();
        const allTiles = this.game_all_tiles();

        // Helper to extract hand tiles in correct order
        const getRackHand = (seat: any): any[] => {
            if (!seat || !seat.racks) return [];
            const rack = seat.racks[GameRackIDEnumAddon.RACK_FIRST] || seat.racks[1];
            if (!rack || !rack.hand) return [];

            let tileList: any[] = [];
            // If hand_order array exists, use that order
            if (rack.hand_order && Array.isArray(rack.hand_order) && rack.hand_order.length > 0) {
                tileList = rack.hand_order
                    .map((id: number) => rack.hand[id])
                    .filter((t: any) => !!t);
            } else {
                // Otherwise take all hand tiles
                tileList = Object.values(rack.hand);
            }

            // Fill full tile details (code, name, image) from allTiles
            return tileList.map((t: any) => {
                const fullDef = allTiles[t.tile_id] || {};
                return { ...fullDef, ...t };
            });
        };

        // Also check development state as fallback if play state did not have opponent hands
        const dev = this.development_with_actual_tiles();
        const devSeats = dev?.seats;

        const getHandForSeatIndex = (seatIndex: number): any[] => {
            const seat = seats[seatIndex];
            let hand = getRackHand(seat);
            if (hand.length === 0 && devSeats && seat) {
                const devSeat = devSeats[seat.id] || devSeats[String(seat.id)];
                hand = getRackHand(devSeat);
            }
            return hand;
        };

        if (seats[mapping.bottom]) result.bottom = getHandForSeatIndex(mapping.bottom);
        if (seats[mapping.right]) result.right = getHandForSeatIndex(mapping.right);
        if (seats[mapping.top]) result.top = getHandForSeatIndex(mapping.top);
        if (seats[mapping.left]) result.left = getHandForSeatIndex(mapping.left);

        return result;
    });
    /* NEWCODE */

    // ████ all_seat_dead_states SIGNAL ███████████████████████████████████████████
```

---

### File 2: `src/app/module/business/game/phaser/component.ts`

#### Snippet 2.1: Import `environment`
**Location**: `src/app/module/business/game/phaser/component.ts` (around line 51)

##### Before:
```typescript
import { COLOR_BLUE, COLOR_FUSHIA, COLOR_GRAY } from "./const";
```

##### After:
```typescript
import { COLOR_BLUE, COLOR_FUSHIA, COLOR_GRAY } from "./const";
/* NEWCODE */
import { environment } from "../../../../../../env/env";
/* NEWCODE */
```

---

#### Snippet 2.2: Emit `debug:opponent-hands` event to Phaser
**Location**: `src/app/module/business/game/phaser/component.ts` (around line 630)

##### Before:
```typescript
    effect(() => {
      const exposures = this.gameState.all_seat_exposures();
      if (this.phaser && this.sceneReady()) {
        // Keep the claim presentation and its exposure update in the same
        // synchronous path. Independent effects do not guarantee their event
        // order, which allowed a bot exposure to render before its discard.
        const claimPresentationStarted = this.emitResolvedClaimPresentation(exposures);
        this.emitExposureClaimPresentationFallback(exposures, claimPresentationStarted);
        this.phaser.events.emit("exposures:update", exposures);
      }
    });
```

##### After:
```typescript
    effect(() => {
      const exposures = this.gameState.all_seat_exposures();
      if (this.phaser && this.sceneReady()) {
        // Keep the claim presentation and its exposure update in the same
        // synchronous path. Independent effects do not guarantee their event
        // order, which allowed a bot exposure to render before its discard.
        const claimPresentationStarted = this.emitResolvedClaimPresentation(exposures);
        this.emitExposureClaimPresentationFallback(exposures, claimPresentationStarted);
        this.phaser.events.emit("exposures:update", exposures);
      }
    });

    /* NEWCODE */
    // Send bot hand tiles to Phaser when in debug mode
    effect(() => {
      if (!environment.DEBUG) return;
      const hands = this.gameState.all_seat_rack_hands();
      if (this.phaser && this.sceneReady()) {
        this.phaser.events.emit("debug:opponent-hands", hands);
      }
    });
    /* NEWCODE */
```

---

### File 3: `src/app/module/business/game/phaser/scenes/scene.ts`

#### Snippet 3.1: Declare debug opponent hand tile arrays
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 175)

##### Before:
```typescript
  private readonly calledOpponentExposureTiles: Record<"top" | "left" | "right", Phaser.GameObjects.Image[]> = {
    top: [],
    left: [],
    right: [],
  };
```

##### After:
```typescript
  /* OLDCODE
  private readonly calledOpponentExposureTiles: Record<"top" | "left" | "right", Phaser.GameObjects.Image[]> = {
    top: [],
    left: [],
    right: [],
  };
  OLDCODE */
  /* NEWCODE */
  // Sprites for opponent exposure tiles
  private readonly calledOpponentExposureTiles: Record<"top" | "left" | "right", Phaser.GameObjects.Image[]> = {
    top: [],
    left: [],
    right: [],
  };

  // Sprites for debug opponent hand tiles (shown only in debug mode)
  private readonly debugOpponentHandTiles: Record<"top" | "left" | "right", Phaser.GameObjects.Image[]> = {
    top: [],
    left: [],
    right: [],
  };
  private latestDebugOpponentHands?: { bottom: any[], right: any[], top: any[], left: any[] };
  /* NEWCODE */
```

---

#### Snippet 3.2: Listen to `debug:opponent-hands` event in `create()`
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 715 and line 760)

##### Before (line 715):
```typescript
    this.game.events.on("exposures:update", this.handleExposuresSet, this);
    this.game.events.on("opponent:pick", this.handleOpponentPick, this);
```

##### After (line 715):
```typescript
    this.game.events.on("exposures:update", this.handleExposuresSet, this);
    /* NEWCODE */
    // Listen for debug opponent hands updates
    this.game.events.on("debug:opponent-hands", this.handleDebugOpponentHands, this);
    /* NEWCODE */
    this.game.events.on("opponent:pick", this.handleOpponentPick, this);
```

##### Before (line 760):
```typescript
      this.game.events.off("exposures:update", this.handleExposuresSet, this);
      this.game.events.off("opponent:pick", this.handleOpponentPick, this);
```

##### After (line 760):
```typescript
      this.game.events.off("exposures:update", this.handleExposuresSet, this);
      /* NEWCODE */
      this.game.events.off("debug:opponent-hands", this.handleDebugOpponentHands, this);
      /* NEWCODE */
      this.game.events.off("opponent:pick", this.handleOpponentPick, this);
```

---

#### Snippet 3.3: Re-layout debug hand tiles on resize
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (inside `resize()` around line 1170)

##### Before:
```typescript
    for (const seat of ["top", "left", "right"] as const) {
      this.layoutCalledOpponentExposureTiles(seat);
    }
```

##### After:
```typescript
    /* OLDCODE
    for (const seat of ["top", "left", "right"] as const) {
      this.layoutCalledOpponentExposureTiles(seat);
    }
    OLDCODE */
    /* NEWCODE */
    for (const seat of ["top", "left", "right"] as const) {
      this.layoutCalledOpponentExposureTiles(seat);
      this.layoutDebugOpponentHandTiles(seat);
    }
    /* NEWCODE */
```

---

#### Snippet 3.4: Add methods to render and layout debug opponent hand tiles
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 3775)

##### Before:
```typescript
      this.layoutCalledOpponentExposureTiles(seat);
    }

    // Refresh the discard grid to clear any gap left by the claimed discard
    if (discardAreaChanged) {
      this.layoutDiscardTiles(true);
      this.layoutOpponentDiscardTiles();
    }
  }
```

##### After:
```typescript
      this.layoutCalledOpponentExposureTiles(seat);
    }

    /* NEWCODE */
    // Also re-position debug hands after exposure changes
    for (const seat of ["top", "left", "right"] as const) {
      this.layoutDebugOpponentHandTiles(seat);
    }
    /* NEWCODE */

    // Refresh the discard grid to clear any gap left by the claimed discard
    if (discardAreaChanged) {
      this.layoutDiscardTiles(true);
      this.layoutOpponentDiscardTiles();
    }
  }

  /* NEWCODE */
  // Handle debug opponent hands received from Angular
  private handleDebugOpponentHands(hands: { bottom: any[], right: any[], top: any[], left: any[] }): void {
    this.latestDebugOpponentHands = hands;
    this.renderDebugOpponentHands(hands);
  }

  // Render debug rack hand tiles for top, left, and right seats
  private renderDebugOpponentHands(hands: { bottom: any[], right: any[], top: any[], left: any[] }): void {
    if (!this.layout || Object.keys(this.allTiles).length === 0) return;

    for (const seat of ["top", "left", "right"] as const) {
      const tileList = hands[seat] || [];

      // Clean up previous debug sprites for this seat
      this.debugOpponentHandTiles[seat].forEach((img) => img.destroy());
      this.debugOpponentHandTiles[seat] = [];

      // Calculate smaller tile size for debug hand display (70% of opponent exposure tile size)
      const baseSize = this.calledOpponentExposureTileSize(seat);
      const smallTileWidth = Math.round(baseSize.width * 0.70);
      const smallTileHeight = Math.round(baseSize.height * 0.70);

      for (const tile of tileList) {
        if (!tile || tile.tile_id == null) continue;
        const fullTile = this.allTiles[tile.tile_id] || tile;

        const texture = this.gameService.resolve(fullTile as any, smallTileWidth);
        if (!texture) continue;

        let frameKey = texture.frameKey;
        let atlasKey = texture.atlasKey;

        // Fallback to 1x atlas if 2x frame is not loaded
        if (!this.textures.exists(atlasKey) || !this.textures.get(atlasKey).has(frameKey)) {
          const fallback = this.gameService.resolve(fullTile as any, 10);
          if (fallback && this.textures.exists(fallback.atlasKey) && this.textures.get(fallback.atlasKey).has(fallback.frameKey)) {
            atlasKey = fallback.atlasKey;
            frameKey = fallback.frameKey;
          } else {
            continue;
          }
        }

        const image = this.add.image(-1000, -1000, atlasKey, frameKey);
        image.setDisplaySize(smallTileWidth, smallTileHeight);
        image.setDepth(30); // Display clearly above table background
        image.disableInteractive();

        this.debugOpponentHandTiles[seat].push(image);
      }

      // Position the debug tiles above the exposure area
      this.layoutDebugOpponentHandTiles(seat);
    }
  }

  // Layout debug hand tiles in the space between the table border and exposure
  private layoutDebugOpponentHandTiles(seat: "top" | "left" | "right"): void {
    if (!this.layout) return;
    const tiles = this.debugOpponentHandTiles[seat];
    if (!tiles || tiles.length === 0) return;

    const baseSize = this.calledOpponentExposureTileSize(seat);
    const tileWidth = Math.round(baseSize.width * 0.70);
    const tileHeight = Math.round(baseSize.height * 0.70);
    const gap = Math.max(2, Math.round(tileWidth * 0.05));
    const step = tileWidth + gap;

    if (seat === "top") {
      // Top seat: Place in the space between the top table border and top exposure
      const exposure = this.layout.topExposure;
      const totalWidth = tiles.length * step - gap;
      const startX = exposure.x + exposure.width / 2 - totalWidth / 2 + tileWidth / 2;
      // Center vertically in the space between table top border and top exposure
      const posY = Math.round((this.layout.tableOuter.y + exposure.y) / 2);

      tiles.forEach((image, index) => {
        image.setDisplaySize(tileWidth, tileHeight);
        image.setAngle(0);
        image.setPosition(Math.round(startX + index * step), posY);
      });
    } else if (seat === "left") {
      // Left seat: Place in the space between the left table border and left exposure
      const exposure = this.layout.leftExposure;
      const totalHeight = tiles.length * step - gap;
      const startY = exposure.y + exposure.height / 2 - totalHeight / 2 + tileWidth / 2;
      // Center horizontally in the space between left table border and left exposure
      const posX = Math.round((this.layout.tableOuter.x + exposure.x) / 2);

      tiles.forEach((image, index) => {
        image.setDisplaySize(tileWidth, tileHeight);
        image.setAngle(90);
        image.setPosition(posX, Math.round(startY + index * step));
      });
    } else if (seat === "right") {
      // Right seat: Place in the space between right exposure and right table border
      const exposure = this.layout.rightExposure;
      const totalHeight = tiles.length * step - gap;
      const startY = exposure.y + exposure.height / 2 - totalHeight / 2 + tileWidth / 2;
      // Center horizontally in the space between right exposure and right table border
      const rightBorderX = this.layout.tableOuter.x + this.layout.tableOuter.width;
      const posX = Math.round((exposure.x + exposure.width + rightBorderX) / 2);

      tiles.forEach((image, index) => {
        image.setDisplaySize(tileWidth, tileHeight);
        image.setAngle(-90);
        image.setPosition(posX, Math.round(startY + index * step));
      });
    }
  }
  /* NEWCODE */
```

---

## Verification Plan

### Test Scenarios
1. **Debug Environment Verification**:
   - Run app in debug mode (`npm run start.web` or with `environment.DEBUG === true`).
   - Start or join a game.
   - Verify `subscribeDebug` connects and logs received data.
   - Verify `all_seat_rack_hands` signal contains the 13 or 14 hand tiles for `top`, `left`, and `right` seats.

2. **Visual Layout Verification**:
   - Verify the bottom seat rack tiles and exposure area remain completely unchanged.
   - Verify for the `top` seat, concealed hand tiles are rendered in a smaller size directly above the exposure area.
   - Verify for `left` and `right` seats, concealed hand tiles are rendered rotated along the seat's exposure area.
   - When a bot picks or discards a tile, verify the debug hand tiles update automatically.

3. **Production Mode Safety Verification**:
   - Set `environment.DEBUG = false`.
   - Verify `subscribeDebug` is never called.
   - Verify no debug hand tiles are created or rendered for opponent seats.

