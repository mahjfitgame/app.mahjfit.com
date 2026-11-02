# Phase Play - Opponent Discard Animation Fix (Before & After Plan)

## Problem Summary
The opponent discard tile animation stopped showing:
1. In `state.ts`, `subscribeDebug` was calling `this.setPlay(data.play)` with partial debug data. This overwrote the active game state and discard rack, causing `component.ts` to skip discard animations and treat updates as bulk loads.
2. In `scene.ts`, `handleOpponentDiscard` used an old hardcoded `500ms` check. When the bot pick animation takes `1000ms`, the discard triggered prematurely while the pick flight was still mid-air.
3. In `scene.ts`, `processOpponentDiscard` hardcoded flight duration to `CLAIM_DISCARD_FLIGHT_MS` (320ms) instead of matching the active bot speed `this.animationDuration`.

---

## File Changes Overview
1. **`src/app/module/business/game/state/state.ts`**:
   - Stop calling `this.setPlay(data.play)` in `subscribeDebug`. Debug data is already stored safely in `captureDevelopmentPayload(data)` for debug hand displays.
2. **`src/app/module/business/game/phaser/scenes/scene.ts`**:
   - Update `handleOpponentDiscard` to wait for `this.animationDuration` instead of the hardcoded 500ms.
   - Update `processOpponentDiscard` flight duration to use `this.animationDuration`.

---

## Before & After Code Snippets

---

### File 1: `src/app/module/business/game/state/state.ts`
**Location**: around line 1618 in `subscribeDebug()`

#### Before Code:
```typescript
                    // Save debug payload so UI can read all tiles
                    this.captureDevelopmentPayload(data);

                    // If debug payload contains play or seats data, update it
                    if (data?.play) {
                        this.setPlay(data.play);
                    }
```

#### After Code:
```typescript
                    // Save debug payload so UI can read all tiles
                    this.captureDevelopmentPayload(data);

                    /* OLDCODE
                    // If debug payload contains play or seats data, update it
                    if (data?.play) {
                        this.setPlay(data.play);
                    }
                    OLDCODE */
                    /* NEWCODE */
                    // Do not call setPlay with partial debug data as it overwrites full play state and discards
                    /* NEWCODE */
```

---

### File 2: `src/app/module/business/game/phaser/scenes/scene.ts`
**Location 1**: around line 6488 in `handleOpponentDiscard()`

#### Before Code:
```typescript
  private handleOpponentDiscard(payload: { seat: TableSeat, tile: GameTileEntityGSDto }): void {
    if (this.deferClaimVisualUpdate({ type: "opponent-discard", payload })) return;
    const timeSincePick = Date.now() - this.lastOpponentPickTime;
    if (timeSincePick < 500) {
      setTimeout(() => {
        this.processOpponentDiscard(payload);
      }, 500 - timeSincePick);
    } else {
      this.processOpponentDiscard(payload);
    }
  }
```

#### After Code:
```typescript
  /* OLDCODE
  private handleOpponentDiscard(payload: { seat: TableSeat, tile: GameTileEntityGSDto }): void {
    if (this.deferClaimVisualUpdate({ type: "opponent-discard", payload })) return;
    const timeSincePick = Date.now() - this.lastOpponentPickTime;
    if (timeSincePick < 500) {
      setTimeout(() => {
        this.processOpponentDiscard(payload);
      }, 500 - timeSincePick);
    } else {
      this.processOpponentDiscard(payload);
    }
  }
  OLDCODE */
  /* NEWCODE */
  // Delay opponent discard until pick animation finishes
  private handleOpponentDiscard(payload: { seat: TableSeat, tile: GameTileEntityGSDto }): void {
    if (this.deferClaimVisualUpdate({ type: "opponent-discard", payload })) return;
    const timeSincePick = Date.now() - this.lastOpponentPickTime;
    const waitTime = this.animationDuration;
    if (timeSincePick < waitTime) {
      setTimeout(() => {
        this.processOpponentDiscard(payload);
      }, waitTime - timeSincePick);
    } else {
      this.processOpponentDiscard(payload);
    }
  }
  /* NEWCODE */
```

---

**Location 2**: around line 6982 in `processOpponentDiscard()`

#### Before Code:
```typescript
    this.tweens.add({
      targets: image,
      x: Math.round(targetX),
      y: Math.round(targetY),
      duration: CLAIM_DISCARD_FLIGHT_MS,
      ease: "Cubic.Out",
    });

    setTimeout(() => {
      this.scrollToBottomDiscard(true);
    }, CLAIM_DISCARD_FLIGHT_MS);
```

#### After Code:
```typescript
    /* OLDCODE
    this.tweens.add({
      targets: image,
      x: Math.round(targetX),
      y: Math.round(targetY),
      duration: CLAIM_DISCARD_FLIGHT_MS,
      ease: "Cubic.Out",
    });

    setTimeout(() => {
      this.scrollToBottomDiscard(true);
    }, CLAIM_DISCARD_FLIGHT_MS);
    OLDCODE */
    /* NEWCODE */
    // Animate opponent discard flight using the active bot speed
    const flightDuration = this.animationDuration;
    this.tweens.add({
      targets: image,
      x: Math.round(targetX),
      y: Math.round(targetY),
      duration: flightDuration,
      ease: "Cubic.Out",
    });

    setTimeout(() => {
      this.scrollToBottomDiscard(true);
    }, flightDuration);
    /* NEWCODE */
```

