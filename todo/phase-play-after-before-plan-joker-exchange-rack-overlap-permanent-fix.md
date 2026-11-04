# Phase Play: After / Before Plan - Joker Exchange Rack Overlap Permanent Fix

## 1. Problem Analysis & Root Cause

### Symptoms:
When exchanging a Joker with an opponent's exposure (e.g. Left exposure with Green Dragon):
1. The Joker arrived at the very end of the player's rack instead of replacing the Green Dragon in its slot.
2. The newly arrived Joker overlapped the last tile in the rack (Red Dragon) by ~50% of the tile width.

### Root Cause:
1. **Mid-Loop Rack Order Mutation in `slotFor()`**:
   - `layoutRackTiles()` was looping over `this.tileMap.values()`.
   - For each tile, it called `this.slotFor(runtime)`.
   - Inside `slotFor()`, if a tile was not found in `this.rackOrder`, it did `this.rackOrder.push(tileId)`!
   - This caused `this.rackOrder.length` to increase from **13 to 14 in the middle of the loop**!
   - Tiles 0 to 12 (including Red Dragon) had their positions calculated for a **13-tile centered rack**.
   - Tile 13 (the Joker) had its position calculated for a **14-tile centered rack**!
   - Because a 14-tile rack shifts left by half a tile (`(tileWidth + gap) / 2`) compared to a 13-tile rack, the Joker's X coordinate ended up only **half a tile away from Red Dragon**, covering half of Red Dragon.
2. **Type Coercion & Joker Placement**:
   - In `reconcileRackTiles()`, `this.pendingLocalJokerSwap.jokerTileId === id` used strict equality `===`. When IDs from GraphQL payloads arrived as strings, this check failed, falling back to pushing the Joker to the end of the rack (`preservedOrder.push(id)`) instead of restoring it to the vacated slot (`rackIndex`).

---

## 2. Solution Summary

1. **Pre-Sanitize `rackOrder` and Iterate by Slot Index in `layoutRackTiles()`**:
   - At the beginning of `layoutRackTiles()`, sanitize `this.rackOrder` to ensure all active rack tiles are present and duplicates are removed.
   - Iterate over `this.rackOrder` by index (`forEach((tileId, index) => ...)`).
   - Each tile receives its layout position using `this.slotForIndex(index)`.
   - `this.rackOrder.length` remains fixed and constant throughout the entire layout pass, making tile overlap mathematically impossible.
2. **Pure `slotFor()` Function**:
   - Remove `push()` and array mutations from `slotFor()`. It now acts purely as a read-only position calculator.
3. **Numeric Type Normalization in `reconcileRackTiles()`**:
   - Ensure all comparisons in `reconcileRackTiles()` use `Number(id)` so `pendingLocalJokerSwap.rackIndex` is always honored and the Joker returns to the exact slot of the swapped natural tile.

---

## 3. Before and After Code Snippets

### File: `src/app/module/business/game/phaser/scenes/scene.ts`

---

#### Snippet 1: Lines 3011–3025 in `scene.ts` (`slotFor` Read-Only Fix)

Make `slotFor` a read-only getter so it never mutates `this.rackOrder` in the middle of a layout pass.

##### Before:
```typescript
  private slotFor(runtime: TileRuntime): Point {
    let index = this.rackOrder.indexOf(runtime.vm.tile_id!);
    if (index === -1 && runtime.zone === "rack") {
      this.rackOrder.push(runtime.vm.tile_id!);
      this.reindexRackRuntimeSlots();
      index = this.rackOrder.length - 1;
    }
    return this.slotForIndex(index);
  }
```

##### After:
```typescript
  /* OLDCODE
  private slotFor(runtime: TileRuntime): Point {
    let index = this.rackOrder.indexOf(runtime.vm.tile_id!);
    if (index === -1 && runtime.zone === "rack") {
      this.rackOrder.push(runtime.vm.tile_id!);
      this.reindexRackRuntimeSlots();
      index = this.rackOrder.length - 1;
    }
    return this.slotForIndex(index);
  }
  OLDCODE */
  /* NEWCODE */
  // Get slot position for a tile without modifying rackOrder
  private slotFor(runtime: TileRuntime): Point {
    const tileId = Number(runtime.vm.tile_id!);
    let index = this.rackOrder.findIndex((id) => Number(id) === tileId);
    if (index === -1) {
      index = Math.max(0, runtime.slotIndex ?? 0);
    }
    return this.slotForIndex(index);
  }
  /* NEWCODE */
```

---

#### Snippet 2: Lines 9425–9470 in `scene.ts` (`layoutRackTiles` Slot-Index Layout)

Iterate over `this.rackOrder` by slot index instead of `this.tileMap.values()`. Every tile receives its slot using a fixed `rackOrder.length`.

##### Before:
```typescript
  private layoutRackTiles(animate: boolean): void {
    this.reindexRackRuntimeSlots();

    const tileWidth = Math.round(this.layout.bottomTileLayout.width);
    const tileHeight = Math.round(this.layout.bottomTileLayout.height);

    for (const runtime of this.tileMap.values()) {
      // Exposure tiles are no longer rack members; never let rack relayout
      // pull them back to the rack centre after a double-tap or resize.
      if (
        runtime.zone === "discard" ||
        runtime.zone === "pass" ||
        runtime.zone === "exposure"
      ) continue;

      const slot = this.slotFor(runtime);
      const selectedOffset = runtime.selected ? -tileHeight * 0.18 : 0;

      const targetX = Math.round(slot.x);
      const targetY = Math.round(slot.y + selectedOffset);

      if (runtime.isDragging) {
        runtime.slotIndex = this.rackOrder.indexOf(runtime.vm.tile_id!);
        runtime.image.setDepth(100);
        // NEWCODE
        runtime.image.setVisible(true);
        continue;
      }

      this.animationManager.layoutRackTile(
        runtime.image,
        tileWidth,
        tileHeight,
        targetX,
        targetY,
        animate,
      );
      ...
```

##### After:
```typescript
  /* OLDCODE
  private layoutRackTiles(animate: boolean): void {
    this.reindexRackRuntimeSlots();

    const tileWidth = Math.round(this.layout.bottomTileLayout.width);
    const tileHeight = Math.round(this.layout.bottomTileLayout.height);

    for (const runtime of this.tileMap.values()) {
      if (
        runtime.zone === "discard" ||
        runtime.zone === "pass" ||
        runtime.zone === "exposure"
      ) continue;

      const slot = this.slotFor(runtime);
      const selectedOffset = runtime.selected ? -tileHeight * 0.18 : 0;

      const targetX = Math.round(slot.x);
      const targetY = Math.round(slot.y + selectedOffset);

      if (runtime.isDragging) {
        runtime.slotIndex = this.rackOrder.indexOf(runtime.vm.tile_id!);
        runtime.image.setDepth(100);
        runtime.image.setVisible(true);
        continue;
      }

      this.animationManager.layoutRackTile(
        runtime.image,
        tileWidth,
        tileHeight,
        targetX,
        targetY,
        animate,
      );
      ...
  }
  OLDCODE */
  /* NEWCODE */
  private layoutRackTiles(animate: boolean): void {
    // 1. Synchronize rackOrder with active rack tiles in tileMap
    const activeRackIds = new Set<number>();
    for (const [id, runtime] of this.tileMap.entries()) {
      if (runtime.zone === "rack") {
        activeRackIds.add(Number(id));
      }
    }

    // Keep only active rack tiles and remove duplicates
    let cleanRackOrder = this.rackOrder
      .map((id) => Number(id))
      .filter((id) => activeRackIds.has(id));
    cleanRackOrder = Array.from(new Set(cleanRackOrder));

    // Append any active rack tiles missing from rackOrder
    for (const id of activeRackIds) {
      if (!cleanRackOrder.includes(id)) {
        cleanRackOrder.push(id);
      }
    }

    this.rackOrder = cleanRackOrder;
    this.reindexRackRuntimeSlots();

    const tileWidth = Math.round(this.layout.bottomTileLayout.width);
    const tileHeight = Math.round(this.layout.bottomTileLayout.height);

    // 2. Position each rack tile strictly according to its index in rackOrder
    this.rackOrder.forEach((tileId, index) => {
      const runtime = this.tileMap.get(tileId) ?? this.tileMap.get(Number(tileId));
      if (!runtime || runtime.zone !== "rack") return;

      const slot = this.slotForIndex(index);
      const selectedOffset = runtime.selected ? -tileHeight * 0.18 : 0;

      const targetX = Math.round(slot.x);
      const targetY = Math.round(slot.y + selectedOffset);

      if (runtime.isDragging) {
        runtime.slotIndex = index;
        runtime.image.setDepth(100);
        runtime.image.setVisible(true);
        return;
      }

      this.animationManager.layoutRackTile(
        runtime.image,
        tileWidth,
        tileHeight,
        targetX,
        targetY,
        animate,
      );

      const bounds = this.getRackBounds();
      const halfW = tileWidth / 2;
      runtime.image.setVisible(
        targetX + halfW >= bounds.x && targetX - halfW <= bounds.x + bounds.width
      );

      const isPickFlightTile = this.isPickAnimating &&
        (runtime.vm.tile_id === this.animatingPickTileId || runtime === this.pendingLocalPickRuntime);
      if (!isPickFlightTile) {
        if (runtime.image.alpha < 1) {
          runtime.image.setAlpha(1);
        }
      }
    });
  }
  /* NEWCODE */
```

---

#### Snippet 3: Lines 2269–2353 in `scene.ts` (`reconcileRackTiles` Numeric Coercion & Slot Preservation)

Ensure returning Joker is inserted into its original slot (`pendingLocalJokerSwap.rackIndex`) using numeric comparison so it never falls back to the end of the rack.

##### Before:
```typescript
    if (this.hasUserManualRackOrder) {
      const activeTileIdSet = new Set(
        this.rackTiles
          .map((t) => t.tile_id!)
          .filter((id) => !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id))
      );

      const preservedOrder = this.rackOrder.filter((id) => activeTileIdSet.has(id));

      for (const tile of this.rackTiles) {
        const id = tile.tile_id!;
        if (activeTileIdSet.has(id) && !preservedOrder.includes(id)) {
          if (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === id) {
            const targetIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, preservedOrder.length);
            preservedOrder.splice(targetIdx, 0, id);
          } else {
            preservedOrder.push(id);
          }
        }
      }
      this.rackOrder = preservedOrder;
    } else {
      const apiOrderIds = this.rackTiles
        .map((t) => t.tile_id!)
        .filter((id) => !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id));

      if (apiOrderIds.length > 0) {
        const preservedOrder = this.rackOrder.filter((id) => apiOrderIds.includes(id));
        for (const id of apiOrderIds) {
          if (!preservedOrder.includes(id)) {
            if (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === id) {
              const targetIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, preservedOrder.length);
              preservedOrder.splice(targetIdx, 0, id);
            } else {
              preservedOrder.push(id);
            }
          }
        }
        this.rackOrder = preservedOrder;
      }
    }
```

##### After:
```typescript
    /* OLDCODE
    if (this.hasUserManualRackOrder) {
      const activeTileIdSet = new Set(
        this.rackTiles
          .map((t) => t.tile_id!)
          .filter((id) => !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id))
      );

      const preservedOrder = this.rackOrder.filter((id) => activeTileIdSet.has(id));

      for (const tile of this.rackTiles) {
        const id = tile.tile_id!;
        if (activeTileIdSet.has(id) && !preservedOrder.includes(id)) {
          if (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === id) {
            const targetIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, preservedOrder.length);
            preservedOrder.splice(targetIdx, 0, id);
          } else {
            preservedOrder.push(id);
          }
        }
      }
      this.rackOrder = preservedOrder;
    } else {
      const apiOrderIds = this.rackTiles
        .map((t) => t.tile_id!)
        .filter((id) => !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id));

      if (apiOrderIds.length > 0) {
        const preservedOrder = this.rackOrder.filter((id) => apiOrderIds.includes(id));
        for (const id of apiOrderIds) {
          if (!preservedOrder.includes(id)) {
            if (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === id) {
              const targetIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, preservedOrder.length);
              preservedOrder.splice(targetIdx, 0, id);
            } else {
              preservedOrder.push(id);
            }
          }
        }
        this.rackOrder = preservedOrder;
      }
    }
    OLDCODE */
    /* NEWCODE */
    // Sync rackOrder using numeric tile IDs to avoid string/number mismatch
    const activeTileIdSet = new Set(
      this.rackTiles
        .map((t) => Number(t.tile_id!))
        .filter((id) => !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id))
    );

    // Keep existing tiles in current relative positions
    const preservedOrder = this.rackOrder
      .map((id) => Number(id))
      .filter((id) => activeTileIdSet.has(id));

    // Insert newly acquired tiles (restoring Joker to its original slot)
    for (const tile of this.rackTiles) {
      const id = Number(tile.tile_id!);
      if (activeTileIdSet.has(id) && !preservedOrder.includes(id)) {
        if (this.pendingLocalJokerSwap && Number(this.pendingLocalJokerSwap.jokerTileId) === id) {
          const targetIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, preservedOrder.length);
          preservedOrder.splice(targetIdx, 0, id);
        } else {
          preservedOrder.push(id);
        }
      }
    }
    this.rackOrder = preservedOrder;
    /* NEWCODE */
```

---

## 4. Why This Completely Eliminates Overlap

1. **No Mid-Loop Size Changes**: Because `layoutRackTiles()` cleans and fixes `this.rackOrder` before positioning tiles, every tile calculates its position against the exact same total rack count.
2. **Fixed Distance**: Tile `i` is at `baseStartX + i * step`. Tile `i+1` is at `baseStartX + (i+1) * step`. The distance between any two adjacent tiles is always exactly `step = tileWidth + gap`.
3. **Correct Slot Allocation**: The exchanged Joker takes the slot index of the swapped natural tile rather than being pushed to the end.

