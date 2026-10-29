# Charleston Courtesy Pass Gap Fix - Before & After Plan

## Problem Summary
During the Charleston Courtesy Pass (Optional Across):
1. The user offers 2 tiles to pass (e.g. Tile 79 and another tile).
2. The opponent across only passes 1 tile (Tile 110), so by rule, only 1 tile is exchanged and Tile 79 remains in the user's hand.
3. The server API response returns all 14 tiles in `hand` and `hand_order` (including Tile 79 at index 12 and Tile 110 at index 13).
4. However, the Phaser screen displays only 13 tiles, leaving an empty gap at slot 12 between 9 Dot and 6 Crak.

---

## Root Cause
1. **Stuck in `"pass"` zone**: When Tile 79 was staged for passing, `runtime.zone` was set to `"pass"`, its image was hidden (`setVisible(false)`), its interaction was disabled, and its horizontal scale was collapsed (`scaleX: 0`).
2. **Missing zone reset in `reconcileRackTiles`**: When the server confirms Tile 79 is still in `this.rackTiles`, `reconcileRackTiles` only revived tiles with `zone === "exposure"`. It ignored tiles with `zone === "pass"`.
3. **Skipped during rack layout**: Because Tile 79's zone remained `"pass"`, `layoutRackTiles` skipped it (`if (runtime.zone === "pass") continue;`).
4. **Physical gap in rack**: `this.rackOrder` correctly had all 14 tiles. Tile 110 was positioned at slot 13 (the 14th slot), leaving slot 12 empty because Tile 79 was invisible and skipped.

---

## File Changes: Before & After Code Snippet

### File: `src/app/module/business/game/phaser/scenes/scene.ts`
**Location**: `reconcileRackTiles()` (around lines 1536–1572)

#### Before Code:
```typescript
    for (const tile of this.rackTiles) {
      const existingRuntime = this.tileMap.get(tile.tile_id!);

      if (existingRuntime && existingRuntime.zone === "exposure" && !this.isTileInAnyExposure(tile.tile_id!)) {
        // Tile was swapped or returned from exposure to rack
        existingRuntime.zone = "rack";
        existingRuntime.selected = false;
        existingRuntime.isDragging = false;
        existingRuntime.image.clearTint();
        existingRuntime.image.setData("joker-swap-enabled", false);
        existingRuntime.image.setData("exposure-asset", undefined);
        existingRuntime.image.setData("joker-tile-id", undefined);
        existingRuntime.image.setData("joker-seat", undefined);
        existingRuntime.image.off("pointerup");
        existingRuntime.image.setDepth(30);
        this.applyTileTextureFilter(existingRuntime.image, true);
        existingRuntime.image.removeAllListeners();
        this.registerTileInput(existingRuntime);
        if (!this.rackOrder.includes(tile.tile_id!)) {
          if (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === tile.tile_id!) {
            const safeIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, this.rackOrder.length);
            this.rackOrder.splice(safeIdx, 0, tile.tile_id!);
          } else {
            this.rackOrder.push(tile.tile_id!);
          }
        }
      } else if (existingRuntime && existingRuntime.zone === "rack") {
        existingRuntime.image.setVisible(true);
        existingRuntime.image.setInteractive();
        if (!this.isPickAnimating || existingRuntime !== this.pendingLocalPickRuntime) {
          existingRuntime.image.setAlpha(1);
        }
        if (!existingRuntime.image.getData("hasShadow")) {
          this.applyTileTextureFilter(existingRuntime.image, true);
        }
      }

      /* NEWCODE */
      // Include new tile into rack order so it is displayed on the rack
      const isOptimisticPassing = this.tablePhase === GamePhaseEnum.PASSING && this.stateManager.optimisticPassTileIds.includes(tile.tile_id!);
      if (
        !this.rackOrder.includes(tile.tile_id!) &&
        !this.discardedTileIds.includes(tile.tile_id!) &&
        !isOptimisticPassing &&
        existingRuntime?.zone !== "exposure"
      ) {
        this.rackOrder.push(tile.tile_id!);
      }
      /* NEWCODE */

      if (existingRuntime) continue;
```

---

#### After Code:
```typescript
    /* OLDCODE
    for (const tile of this.rackTiles) {
      const existingRuntime = this.tileMap.get(tile.tile_id!);

      if (existingRuntime && existingRuntime.zone === "exposure" && !this.isTileInAnyExposure(tile.tile_id!)) {
        // Tile was swapped or returned from exposure to rack
        existingRuntime.zone = "rack";
        existingRuntime.selected = false;
        existingRuntime.isDragging = false;
        existingRuntime.image.clearTint();
        existingRuntime.image.setData("joker-swap-enabled", false);
        existingRuntime.image.setData("exposure-asset", undefined);
        existingRuntime.image.setData("joker-tile-id", undefined);
        existingRuntime.image.setData("joker-seat", undefined);
        existingRuntime.image.off("pointerup");
        existingRuntime.image.setDepth(30);
        this.applyTileTextureFilter(existingRuntime.image, true);
        existingRuntime.image.removeAllListeners();
        this.registerTileInput(existingRuntime);
        if (!this.rackOrder.includes(tile.tile_id!)) {
          if (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === tile.tile_id!) {
            const safeIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, this.rackOrder.length);
            this.rackOrder.splice(safeIdx, 0, tile.tile_id!);
          } else {
            this.rackOrder.push(tile.tile_id!);
          }
        }
      } else if (existingRuntime && existingRuntime.zone === "rack") {
        existingRuntime.image.setVisible(true);
        existingRuntime.image.setInteractive();
        if (!this.isPickAnimating || existingRuntime !== this.pendingLocalPickRuntime) {
          existingRuntime.image.setAlpha(1);
        }
        if (!existingRuntime.image.getData("hasShadow")) {
          this.applyTileTextureFilter(existingRuntime.image, true);
        }
      }

      // Include new tile into rack order so it is displayed on the rack
      const isOptimisticPassing = this.tablePhase === GamePhaseEnum.PASSING && this.stateManager.optimisticPassTileIds.includes(tile.tile_id!);
      if (
        !this.rackOrder.includes(tile.tile_id!) &&
        !this.discardedTileIds.includes(tile.tile_id!) &&
        !isOptimisticPassing &&
        existingRuntime?.zone !== "exposure"
      ) {
        this.rackOrder.push(tile.tile_id!);
      }

      if (existingRuntime) continue;
    OLDCODE */
    /* NEWCODE */
    // Ensure all tiles confirmed in rack by server are visible, interactive, and set to rack zone
    for (const tile of this.rackTiles) {
      const existingRuntime = this.tileMap.get(tile.tile_id!);

      if (existingRuntime) {
        // Hide close button if tile was in pass waiting
        const closeBtn = this.passCloseButtons.get(tile.tile_id!);
        if (closeBtn) {
          closeBtn.disableInteractive();
          closeBtn.setVisible(false);
        }

        // Restore zone to rack if it was in pass waiting or exposure
        if (existingRuntime.zone !== "rack" && !this.isTileInAnyExposure(tile.tile_id!)) {
          existingRuntime.zone = "rack";
          existingRuntime.selected = false;
          existingRuntime.isDragging = false;
          existingRuntime.image.clearTint();
          existingRuntime.image.setData("joker-swap-enabled", false);
          existingRuntime.image.setData("exposure-asset", undefined);
          existingRuntime.image.setData("joker-tile-id", undefined);
          existingRuntime.image.setData("joker-seat", undefined);
          existingRuntime.image.off("pointerup");
          existingRuntime.image.setDepth(30);
          this.applyTileTextureFilter(existingRuntime.image, true);
          existingRuntime.image.removeAllListeners();
          this.registerTileInput(existingRuntime);
        }

        // Stop any pass animation tweens and restore visibility and scale
        this.tweens.killTweensOf(existingRuntime.image);
        existingRuntime.image.setVisible(true);
        existingRuntime.image.setScale(1);
        existingRuntime.image.setInteractive();

        if (!this.isPickAnimating || existingRuntime !== this.pendingLocalPickRuntime) {
          existingRuntime.image.setAlpha(1);
        }
        if (!existingRuntime.image.getData("hasShadow")) {
          this.applyTileTextureFilter(existingRuntime.image, true);
        }
      }

      // Include new tile into rack order so it is displayed on the rack
      const isOptimisticPassing = this.tablePhase === GamePhaseEnum.PASSING && this.stateManager.optimisticPassTileIds.includes(tile.tile_id!);
      if (
        !this.rackOrder.includes(tile.tile_id!) &&
        !this.discardedTileIds.includes(tile.tile_id!) &&
        !isOptimisticPassing &&
        existingRuntime?.zone !== "exposure"
      ) {
        this.rackOrder.push(tile.tile_id!);
      }

      if (existingRuntime) continue;
    /* NEWCODE */
```

---

## Verification Steps
1. Run `npx tsc --noEmit` to verify TypeScript compile checks pass with zero errors.
2. In the game, start a Charleston round, stop at round 2, and proceed to Courtesy Pass (Across).
3. Stage 2 tiles in the pass waiting area and click Pass.
4. When the API response is received with 14 tiles (1 exchanged + 1 kept):
   - All 14 tiles display contiguously on the rack.
   - Slot 12 is fully visible with Tile 79.
   - Slot 13 is fully visible with Tile 110.
   - No gap or missing tile appears on the rack.
