# Phase Play: After / Before Plan - Joker Exchange Fixes (Own Seat & Opponent Exposures)

## 1. Problem Overview

During game testing, two critical bugs were discovered in the Joker exchange flow:

1. **Joker Exchange with Own Seat Exposure (`to_seat === "bottom"`)**:
   - When the player exchanges a Joker from their own exposure using a matching natural tile, the natural tile moves to the exposure tray, but the exchanged Joker never appears in the player's rack.
   - The rack is left with only 10 tiles instead of 11 (10 in rack + 3 in exposure = 13 tiles instead of 14).
   - **Root Cause**:
     - In `reconcileRackTiles()`, when the server confirms the Joker in `this.rackTiles`, the Joker's runtime in `this.tileMap` still has `zone === "exposure"`.
     - Line 1965 checks `if (isExposed || existingRuntime.zone === "exposure") continue;`. Because `existingRuntime.zone === "exposure"` is true, the Joker is completely skipped.
     - Line 1787 has `if (runtime.zone === "exposure") this.removeFromRackOrder(runtime.vm.tile_id!)`, which continuously removes the Joker from the rack order.
     - Line 2035 checks `existingRuntime?.zone !== "exposure"`, which prevents the Joker from ever being re-added to `this.rackOrder`.
     - As a result, the Joker is permanently excluded from `rackOrder`, skipped from `layoutRackTiles()`, and remains invisible in limbo.

2. **Tile Overlap in Rack & Wall Pick Confusion**:
   - In some exchanges, two Jokers at the end of the rack overlap each other instead of taking their proper slot.
   - **Root Cause**:
     - Strict equality `===` vs type mismatch between `number` and `string` (e.g. `100` vs `"100"` from GraphQL payloads) caused `this.rackOrder.indexOf()` to return `-1`.
     - When `indexOf` returned `-1`, `slotFor()` or `reconcileRackTiles()` pushed the tile again, creating duplicate or mismatched slot indices.
     - `removeFromRackOrder(tileId)` used `id !== tileId` which failed if one was a string and one was a number.

---

## 2. Before and After Code Snippets

### File: `src/app/module/business/game/phaser/scenes/scene.ts`

#### Snippet 1: Line 1786 in `reconcileRackTiles` (Do not remove returning tiles from rack order)

##### Before:
```typescript
    for (const runtime of this.tileMap.values()) {
      if (runtime.zone === "exposure") {
        this.removeFromRackOrder(runtime.vm.tile_id!);
      }
    }
```

##### After:
```typescript
    /* OLDCODE
    for (const runtime of this.tileMap.values()) {
      if (runtime.zone === "exposure") {
        this.removeFromRackOrder(runtime.vm.tile_id!);
      }
    }
    OLDCODE */
    /* NEWCODE */
    // Only remove from rack order if the tile is still in an active exposure on the server
    for (const runtime of this.tileMap.values()) {
      if (runtime.zone === "exposure" && this.isTileInAnyExposure(runtime.vm.tile_id!)) {
        this.removeFromRackOrder(runtime.vm.tile_id!);
      }
    }
    /* NEWCODE */
```

---

#### Snippet 2: Lines 1962–2010 in `reconcileRackTiles` (Declare `numTileId` at loop level and transition returned exposure tiles to rack zone)

##### Before:
```typescript
    for (const tile of this.rackTiles) {
      const existingRuntime = this.tileMap.get(tile.tile_id!);

      if (existingRuntime) {
        // Skip tiles that belong to an active exposure or are being built into an exposure
        const isExposed = this.isTileInAnyExposure(tile.tile_id!) || this.activeExposureBuildTileIds.includes(tile.tile_id!);
        if (isExposed || existingRuntime.zone === "exposure") {
          continue;
        }

        // Restore zone to rack if it was in pass waiting
        if (existingRuntime.zone === "pass") {
          existingRuntime.zone = "rack";
          existingRuntime.selected = false;
          existingRuntime.isDragging = false;
          existingRuntime.image.clearTint();
          existingRuntime.image.setDepth(30);
          this.applyTileTextureFilter(existingRuntime.image, true);
          existingRuntime.image.removeAllListeners();
          this.registerTileInput(existingRuntime);
        }
```

##### After:
```typescript
    for (const tile of this.rackTiles) {
      /* NEWCODE */
      const numTileId = Number(tile.tile_id!);
      /* NEWCODE */
      const existingRuntime = this.tileMap.get(tile.tile_id!) ?? this.tileMap.get(numTileId);

      if (existingRuntime) {
        /* OLDCODE
        // Skip tiles that belong to an active exposure or are being built into an exposure
        const isExposed = this.isTileInAnyExposure(tile.tile_id!) || this.activeExposureBuildTileIds.includes(tile.tile_id!);
        if (isExposed || existingRuntime.zone === "exposure") {
          continue;
        }

        // Restore zone to rack if it was in pass waiting
        if (existingRuntime.zone === "pass") {
          existingRuntime.zone = "rack";
          existingRuntime.selected = false;
          existingRuntime.isDragging = false;
          existingRuntime.image.clearTint();
          existingRuntime.image.setDepth(30);
          this.applyTileTextureFilter(existingRuntime.image, true);
          existingRuntime.image.removeAllListeners();
          this.registerTileInput(existingRuntime);
        }
        OLDCODE */
        /* NEWCODE */
        // Skip tiles that belong to an active exposure or are being built into an exposure
        const isExposed = this.isTileInAnyExposure(numTileId) || this.activeExposureBuildTileIds.includes(numTileId);
        if (isExposed) {
          continue;
        }

        // If the tile was in exposure or pass waiting, return it to the rack
        if (existingRuntime.zone === "exposure" || existingRuntime.zone === "pass") {
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
        /* NEWCODE */
```

---

#### Snippet 3: Lines 2031–2044 in `reconcileRackTiles` (Allow returning Joker to enter `rackOrder`)

##### Before:
```typescript
      if (
        !this.rackOrder.includes(tile.tile_id!) &&
        !this.discardedTileIds.includes(tile.tile_id!) &&
        !isOptimisticPassing &&
        existingRuntime?.zone !== "exposure"
      ) {
        if (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === tile.tile_id!) {
          const safeIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, this.rackOrder.length);
          this.rackOrder.splice(safeIdx, 0, tile.tile_id!);
        } else {
          this.rackOrder.push(tile.tile_id!);
        }
      }
```

##### After:
```typescript
      /* OLDCODE
      if (
        !this.rackOrder.includes(tile.tile_id!) &&
        !this.discardedTileIds.includes(tile.tile_id!) &&
        !isOptimisticPassing &&
        existingRuntime?.zone !== "exposure"
      ) {
        if (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === tile.tile_id!) {
          const safeIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, this.rackOrder.length);
          this.rackOrder.splice(safeIdx, 0, tile.tile_id!);
        } else {
          this.rackOrder.push(tile.tile_id!);
        }
      }
      OLDCODE */
      /* NEWCODE */
      const isExposedNow = this.isTileInAnyExposure(numTileId);
      if (
        !this.rackOrder.some(id => Number(id) === numTileId) &&
        !this.discardedTileIds.includes(numTileId) &&
        !isOptimisticPassing &&
        !isExposedNow
      ) {
        if (this.pendingLocalJokerSwap && Number(this.pendingLocalJokerSwap.jokerTileId) === numTileId) {
          const safeIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, this.rackOrder.length);
          this.rackOrder.splice(safeIdx, 0, numTileId);
        } else {
          this.rackOrder.push(numTileId);
        }
      }
      /* NEWCODE */
```

---

#### Snippet 4: Line 2384 in `removeFromRackOrder` (Safe numeric comparison)

##### Before:
```typescript
  private removeFromRackOrder(tileId: number): void {
    this.rackOrder = this.rackOrder.filter((id) => id !== tileId);
  }
```

##### After:
```typescript
  /* OLDCODE
  private removeFromRackOrder(tileId: number): void {
    this.rackOrder = this.rackOrder.filter((id) => id !== tileId);
  }
  OLDCODE */
  /* NEWCODE */
  private removeFromRackOrder(tileId: number): void {
    const numericId = Number(tileId);
    this.rackOrder = this.rackOrder.filter((id) => Number(id) !== numericId);
  }
  /* NEWCODE */
```

---

#### Snippet 5: Lines 7763, 7836–7848 in `handleJokerExchange` (Numeric ID normalization & robust bottom exposure Joker detection)

##### Before:
```typescript
    const { from_tile_id, joker_tile_id, from_seat, to_seat } = payload;
    ...
    } else if (to_seat === "bottom") {
      const bottomJokerImg = this.calledBottomExposureTiles.find(
        (img: Phaser.GameObjects.Image) => img.active && img.getData("joker-tile-id") === joker_tile_id
      );
      if (bottomJokerImg && bottomJokerImg.active) {
        oldJokerPos = { x: bottomJokerImg.x, y: bottomJokerImg.y, scale: bottomJokerImg.scaleX };
        jokerKey = (bottomJokerImg.texture as any)?.key || jokerKey;
        jokerFrame = bottomJokerImg.frame?.name || jokerFrame;
        bottomJokerImg.setAlpha(0);
        foundJokerInExposure = true;
      }
    }
```

##### After:
```typescript
    const numFromTileId = Number(payload.from_tile_id);
    const numJokerTileId = Number(payload.joker_tile_id);
    const { from_seat, to_seat } = payload;
    ...
    } else if (to_seat === "bottom") {
      let bottomJokerImg = this.calledBottomExposureTiles.find(
        (img: Phaser.GameObjects.Image) => img.active && (Number(img.getData("joker-tile-id")) === numJokerTileId)
      );
      if (!bottomJokerImg) {
        bottomJokerImg = this.calledBottomExposureTiles.find(
          (img: Phaser.GameObjects.Image) => img.active && img.getData("joker-swap-enabled")
        );
      }
      if (bottomJokerImg && bottomJokerImg.active) {
        oldJokerPos = { x: bottomJokerImg.x, y: bottomJokerImg.y, scale: bottomJokerImg.scaleX };
        jokerKey = (bottomJokerImg.texture as any)?.key || jokerKey;
        jokerFrame = bottomJokerImg.frame?.name || jokerFrame;
        bottomJokerImg.setAlpha(0);
        foundJokerInExposure = true;
      }
    }
```

---

## 3. Verification Plan

1. **Own Seat Joker Exchange Test**:
   - Create an exposure containing a Joker (e.g., `7-J-J Bam` Pung).
   - In `NEED_DISCARD` stage, exchange the Joker using matching natural tile (e.g., 7 Bam).
   - Verify natural tile stays in exposure (`7-7-J Bam`).
   - Verify exchanged Joker appears in the bottom rack at the expected slot.
   - Verify total count across rack and exposure is exactly 14 tiles (11 in rack + 3 in exposure).
   - Verify player can discard a tile and count remains 13 (10 in rack + 3 in exposure).

2. **Opponent Exposure Joker Exchange Test**:
   - Target an opponent exposure with a Joker.
   - Exchange via double-tap or drag-and-drop.
   - Verify Joker flies from opponent exposure tray to bottom rack (not from table center or wall).
   - Verify Joker sits cleanly in the rack without overlapping adjacent tiles.

3. **Compilation**:
   - Run `npx tsc --noEmit` to verify zero TypeScript errors.

