# Phase Play: Do Not Show Winner Tiles in Exposure Area

## 1. Problem & Context
When a player (such as a top, left, or right bot) wins the game by Mahjong:
1. `PhaserComponent` was sending all 14 tiles of the winner's hand in `result.opponentHands`.
2. `TableScene.revealOpponentHands()` was creating exposure tiles for all seats in `opponentHands`, dumping the winner's 14 tiles into the winner's exposure tray on the board.
3. Because the complete winning hand is already displayed in the Mahjong popup dialog, displaying the winner's tiles in their exposure tray was redundant and cluttered the board.

---

## 2. Before & After Code Snippets

### File 1: `src/app/module/business/game/phaser/component.ts`

#### Change: Skip the winner seat when building `opponentHands` for Mahjong win

**Before:**
```typescript
            for (const seat of opponentSeatList) {
              const seatHand = allHands[seat];
              const tileIdList: number[] = [];

              if (seatHand && Array.isArray(seatHand)) {
                for (const tileItem of seatHand) {
                  const id = tileItem?.tile_id ?? tileItem?.id;
                  if (typeof id === 'number') {
                    tileIdList.push(id);
                  }
                }
              }

              if (tileIdList.length > 0) {
                opponentHands[seat] = tileIdList;
              }
            }

            // 2. Fallback: if any opponent seat is still empty, check play_seats()
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const seatId of Object.keys(seats)) {
                const seatData = (seats as any)[seatId];
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));

                if (seatPos && seatPos !== 'bottom') {
```

**After:**
```typescript
            /* OLDCODE
            for (const seat of opponentSeatList) {
              const seatHand = allHands[seat];
              const tileIdList: number[] = [];

              if (seatHand && Array.isArray(seatHand)) {
                for (const tileItem of seatHand) {
                  const id = tileItem?.tile_id ?? tileItem?.id;
                  if (typeof id === 'number') {
                    tileIdList.push(id);
                  }
                }
              }

              if (tileIdList.length > 0) {
                opponentHands[seat] = tileIdList;
              }
            }

            // 2. Fallback: if any opponent seat is still empty, check play_seats()
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const seatId of Object.keys(seats)) {
                const seatData = (seats as any)[seatId];
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));

                if (seatPos && seatPos !== 'bottom') {
            OLDCODE */
            /* NEWCODE */
            for (const seat of opponentSeatList) {
              // The winner hand is already shown in the Mahjong popup - do not add winner to exposure
              if (seat === tableSeat) continue;

              const seatHand = allHands[seat];
              const tileIdList: number[] = [];

              if (seatHand && Array.isArray(seatHand)) {
                for (const tileItem of seatHand) {
                  const id = tileItem?.tile_id ?? tileItem?.id;
                  if (typeof id === 'number') {
                    tileIdList.push(id);
                  }
                }
              }

              if (tileIdList.length > 0) {
                opponentHands[seat] = tileIdList;
              }
            }

            // 2. Fallback: if any opponent seat is still empty, check play_seats()
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const seatId of Object.keys(seats)) {
                const seatData = (seats as any)[seatId];
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));

                // Skip bottom player and skip the winner seat
                if (seatPos && seatPos !== 'bottom' && seatPos !== tableSeat) {
            /* NEWCODE */
```

---

### File 2: `src/app/module/business/game/phaser/scenes/scene.ts`

#### Change: Clear and skip exposure tiles for the winner seat in `revealOpponentHands`

**Before:**
```typescript
  private revealOpponentHands(result: MahjongWinCelebration): void {
    if (!result.opponentHands) return;

    for (const [seatPos, ids] of Object.entries(result.opponentHands)) {
      if (seatPos === "bottom") continue;
      const seat = seatPos as "top" | "left" | "right";
      const tileIds = ids as number[];
      if (tileIds.length === 0) continue;
```

**After:**
```typescript
  /* OLDCODE
  private revealOpponentHands(result: MahjongWinCelebration): void {
    if (!result.opponentHands) return;

    for (const [seatPos, ids] of Object.entries(result.opponentHands)) {
      if (seatPos === "bottom") continue;
      const seat = seatPos as "top" | "left" | "right";
      const tileIds = ids as number[];
      if (tileIds.length === 0) continue;
  OLDCODE */
  /* NEWCODE */
  private revealOpponentHands(result: MahjongWinCelebration): void {
    // 1. Clean up exposure area for the winner seat (winner hand is displayed in the popup)
    if (result.winner && result.winner !== "bottom") {
      const winnerSeat = result.winner as Exclude<TableSeat, "bottom">;
      this.calledOpponentExposureTiles[winnerSeat]?.forEach((img) => img.destroy());
      this.calledOpponentExposureTiles[winnerSeat] = [];
      this.layoutCalledOpponentExposureTiles(winnerSeat);
    } else if (result.winner === "bottom") {
      // If bottom won, hide bottom exposure tiles as well
      for (const img of this.calledBottomExposureTiles) {
        if (img && img.active) img.setVisible(false);
      }
    }

    if (!result.opponentHands) return;

    // 2. Reveal remaining hands only for players who did NOT win
    for (const [seatPos, ids] of Object.entries(result.opponentHands)) {
      if (seatPos === "bottom") continue;
      if (seatPos === result.winner) continue; // Never reveal winner tiles in exposure area

      const seat = seatPos as "top" | "left" | "right";
      const tileIds = ids as number[];
      if (tileIds.length === 0) continue;
  /* NEWCODE */
```

---

## 3. Verification Plan
1. **Compile Check**: Run `npx tsc -p tsconfig.app.json --noEmit` to verify 0 errors.
2. **Invariants**: Ensure `/* OLDCODE */` and `/* NEWCODE */` comments are strictly maintained.
3. **Behavior**:
   - When a top/left/right player wins, their exposure area stays clean and empty.
   - The winner's hand is displayed exclusively in the central Mahjong popup.
   - Non-winning players' hands are revealed normally.

