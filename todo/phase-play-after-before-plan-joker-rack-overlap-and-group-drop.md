# Phase Play: Mahjong JOKER Exchange Animation & UI/UX (Dual-Input Support)

## 1. Overview & Objective
Implement the complete dual-input Joker exchange sequence:
1. **Mode A (Double-Tap):** Double-tap / double-click on either the exposed Joker OR the matching natural tile in the rack triggers simultaneous automated flight (250ms–300ms `ease-out`).
2. **Mode B (Drag-and-Drop):** Drag matching natural tile with rack slot opacity at 30%, `pointer-events: none` on drag proxy, 40px magnetic proximity snap on exposed Joker (scale-down + target highlight/border), and 200ms `ease-in-out` snap-back on cancellation.
3. **Flight & Landing:**
   - In Mode B: Natural tile hidden at drop point; *only* `jokerClone` flies downward (200ms `ease-out`) while exposure displays natural tile.
   - In Mode A: Both `naturalClone` and `jokerClone` fly simultaneously (260ms `ease-out`). No flips during flight.
   - On landing: reveal static tiles, commit data, trigger horizontal slide layout refresh (`layoutRackTiles(true)`) to snap Joker into place.
4. **Rack Overlap Fix:** Correct rack slot indexing (`pendingLocalJokerSwap.rackIndex`), clean up natural tile from `tileMap` for opponent seats, and use unified `slotForIndex` coordinate calculation.

---

## 2. Before / After Code Changes

### File 1: `src/app/module/business/game/phaser/animation.ts`

#### Before:
```typescript
  // Flips only naturalClone upon landing; no support for Mode B single-clone downward flight
  animateJokerExchange(...) { ... }
```

#### After:
```typescript
  /* OLDCODE
  animateJokerExchange(
    jokerClone: Phaser.GameObjects.Container | Phaser.GameObjects.Image,
    naturalClone: Phaser.GameObjects.Container | Phaser.GameObjects.Image,
    destJokerPos: { x: number, y: number, scale: number },
    destNaturalPos: { x: number, y: number, scale: number },
    duration: number,
    onFinished: () => void
  ): void {
  ...
  }
  OLDCODE */
  /* NEWCODE */
  animateJokerExchange(
    jokerClone: Phaser.GameObjects.Container | Phaser.GameObjects.Image,
    naturalClone: Phaser.GameObjects.Container | Phaser.GameObjects.Image | null,
    destJokerPos: { x: number, y: number, scale: number },
    destNaturalPos: { x: number, y: number, scale: number },
    duration: number,
    mode: "double-tap" | "drag-and-drop",
    onFinished: () => void
  ): void {
    if (mode === "drag-and-drop" || !naturalClone) {
      // Mode B: Natural tile is already at target; animate only jokerClone downward
      if (naturalClone) naturalClone.destroy();
      this.scene.tweens.add({
        targets: jokerClone,
        x: Math.round(destJokerPos.x),
        y: Math.round(destJokerPos.y),
        scaleX: destJokerPos.scale,
        scaleY: destJokerPos.scale,
        duration: 200,
        ease: "Cubic.easeOut",
        onComplete: () => {
          jokerClone.destroy();
          onFinished();
        }
      });
      return;
    }

    // Mode A (Double-Tap): Simultaneous flight of both clones
    let completedCount = 0;
    const checkDone = () => {
      completedCount++;
      if (completedCount === 2) {
        jokerClone.destroy();
        naturalClone.destroy();
        onFinished();
      }
    };

    this.scene.tweens.add({
      targets: jokerClone,
      x: Math.round(destJokerPos.x),
      y: Math.round(destJokerPos.y),
      scaleX: destJokerPos.scale,
      scaleY: destJokerPos.scale,
      duration: duration || 260,
      ease: "Cubic.easeOut",
      onComplete: checkDone
    });

    this.scene.tweens.add({
      targets: naturalClone,
      x: Math.round(destNaturalPos.x),
      y: Math.round(destNaturalPos.y),
      scaleX: destNaturalPos.scale,
      scaleY: destNaturalPos.scale,
      duration: duration || 260,
      ease: "Cubic.easeOut",
      onComplete: checkDone
    });
  }
  /* NEWCODE */
```

---

### File 2: `src/app/module/business/game/phaser/scenes/scene.ts`

1. **`slotForIndex(slotIndex: number): Point`**:
   - Single source of truth for rack slot positions. Used by both `slotFor(runtime)` and `handleJokerExchange`.
2. **Rack Slot Preservation in `reconcileRackTiles`**:
   - If `this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === id`, insert at `pendingLocalJokerSwap.rackIndex`.
3. **Natural Tile Clean Up**:
   - When swapping with opponent (`to_seat !== "bottom"`), destroy `naturalTile.image` and delete from `this.tileMap`.
4. **Group-Wide Drop & Proximity Magnetic Hint**:
   - Detect matching exposed Joker within 40px proximity: scale down target Joker (`baseScale * 0.92`) and apply gold border tint (`0xffe066`).
   - Restore on drag leave or drag end.
   - If dropped over any tile in the meld group, execute swap with the group's Joker.
5. **Dual-Trigger Mode Support**:
   - `executeJokerSwap` takes `mode: "double-tap" | "drag-and-drop"` and stores it in `pendingLocalJokerSwap.mode`.
   - Double-tap on either the exposed Joker OR the matching rack tile triggers Mode A.
   - Drag-and-drop triggers Mode B.
