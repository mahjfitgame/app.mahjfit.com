# Before & After Plan: Manual Rack Tile Drag & Drop Order Persistence

## 1. Overview & Objective
Currently, when a player manually arranges their rack tiles using drag-and-drop, the tiles stay in position temporarily. However, whenever any game action occurs (such as picking a tile, discarding, opponent discard, or server state sync), `reconcileRackTiles()` and `rack:order` unconditionally reset `this.rackOrder` to the server API's `hand_order`.

### Expected Behavior
1. **Manual Drag & Drop**: When the user drags and drops a tile to rearrange their bottom rack, this custom arrangement is saved in a local state (`hasUserManualRackOrder = true`) and preserved during subsequent game actions (draws, discards, exposures).
2. **Newly Picked Tiles (14th tile)**: During manual mode, any newly drawn tile is appended to the end of the rack without disturbing the user's customized tile positions.
3. **Explicit Sort ("Order by Suit" / "Order by Rank")**: When the user clicks either sort button in the HUD, `hasUserManualRackOrder` resets to `false`, and the rack rearranges according to the server's `hand_order`.
4. **Page Reload / Refresh**: Automatically starts with `hasUserManualRackOrder = false`, respecting the server's `hand_order`.

---

## 2. File to Modify
- `src/app/module/business/game/phaser/scenes/scene.ts`

---

## 3. Detailed Before & After Code Snippets

### Change 1: Add `hasUserManualRackOrder` State Flag
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 132)

#### BEFORE:
```typescript
  private lastServerOrder: string = "";
  // NEWCODE
  private isExplicitSortRequested: boolean = false;
  private hasAppliedInitialRackOrder: boolean = false;
  private pendingLocalJokerSwap?: { fromTileId: number; jokerTileId: number; rackIndex: number };
```

#### AFTER:
```typescript
  private lastServerOrder: string = "";
  // NEWCODE
  private isExplicitSortRequested: boolean = false;
  private hasAppliedInitialRackOrder: boolean = false;
  /* NEWCODE */
  // Tracks if the user has manually arranged tiles in their rack via drag-and-drop
  private hasUserManualRackOrder: boolean = false;
  /* NEWCODE */
  private pendingLocalJokerSwap?: { fromTileId: number; jokerTileId: number; rackIndex: number };
```

---

### Change 2: Reset Flag on Explicit Sort ("Order by Suit" / "Order by Rank")
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 330)

#### BEFORE:
```typescript
      /* NEWCODE */
      onSortRequested: (mode) => {
        this.isExplicitSortRequested = true;
        setTimeout(() => { this.isExplicitSortRequested = false; }, 5000);
        this.callbacks.onSortRequested?.(mode);
      },
      /* NEWCODE */
```

#### AFTER:
```typescript
      /* OLDCODE
      onSortRequested: (mode) => {
        this.isExplicitSortRequested = true;
        setTimeout(() => { this.isExplicitSortRequested = false; }, 5000);
        this.callbacks.onSortRequested?.(mode);
      },
      OLDCODE */
      /* NEWCODE */
      onSortRequested: (mode) => {
        // Reset manual ordering so rack adopts the server sorted hand_order
        this.hasUserManualRackOrder = false;
        this.isExplicitSortRequested = true;
        setTimeout(() => { this.isExplicitSortRequested = false; }, 5000);
        this.callbacks.onSortRequested?.(mode);
      },
      /* NEWCODE */
```

---

### Change 3: Guard `rack:order` Event Listener
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 600)

#### BEFORE:
```typescript
    /* NEWCODE */
    // Apply rack order sent from the server API response
    this.game.events.on("rack:order", (order: number[]) => {
      const orderStr = order.join(',');
      const isInitial = !this.hasAppliedInitialRackOrder;
      const isExplicitSort = this.isExplicitSortRequested;
      const isServerOrderChanged = this.lastServerOrder !== orderStr;

      if (isServerOrderChanged || isExplicitSort || isInitial) {
        this.lastServerOrder = orderStr;
        this.isExplicitSortRequested = false;
        this.hasAppliedInitialRackOrder = true;

        if (order && order.length > 0) {
          // Follow the exact rack tile order received from API response
          const newRackOrder: number[] = [];
          for (const id of order) {
            if (!this.isTileInAnyExposure(id) && !this.discardedTileIds.includes(id)) {
              newRackOrder.push(id);
            }
          }
          // Append any remaining active rack tiles not listed in server order
          for (const id of this.rackOrder) {
            if (!newRackOrder.includes(id) && !this.isTileInAnyExposure(id) && !this.discardedTileIds.includes(id)) {
              newRackOrder.push(id);
            }
          }
          this.rackOrder = newRackOrder;
          this.reindexRackRuntimeSlots();
          this.layoutRackTiles(true);
        }
      }
    }, this);
    /* NEWCODE */
```

#### AFTER:
```typescript
    /* OLDCODE
    // Apply rack order sent from the server API response
    this.game.events.on("rack:order", (order: number[]) => {
      const orderStr = order.join(',');
      const isInitial = !this.hasAppliedInitialRackOrder;
      const isExplicitSort = this.isExplicitSortRequested;
      const isServerOrderChanged = this.lastServerOrder !== orderStr;

      if (isServerOrderChanged || isExplicitSort || isInitial) {
        this.lastServerOrder = orderStr;
        this.isExplicitSortRequested = false;
        this.hasAppliedInitialRackOrder = true;

        if (order && order.length > 0) {
          // Follow the exact rack tile order received from API response
          const newRackOrder: number[] = [];
          for (const id of order) {
            if (!this.isTileInAnyExposure(id) && !this.discardedTileIds.includes(id)) {
              newRackOrder.push(id);
            }
          }
          // Append any remaining active rack tiles not listed in server order
          for (const id of this.rackOrder) {
            if (!newRackOrder.includes(id) && !this.isTileInAnyExposure(id) && !this.discardedTileIds.includes(id)) {
              newRackOrder.push(id);
            }
          }
          this.rackOrder = newRackOrder;
          this.reindexRackRuntimeSlots();
          this.layoutRackTiles(true);
        }
      }
    }, this);
    OLDCODE */
    /* NEWCODE */
    // Apply rack order sent from the server API response
    this.game.events.on("rack:order", (order: number[]) => {
      const orderStr = order.join(',');
      const isInitial = !this.hasAppliedInitialRackOrder;
      const isExplicitSort = this.isExplicitSortRequested;
      const isServerOrderChanged = this.lastServerOrder !== orderStr;

      // Only apply server order if user has not manually arranged tiles, or if explicit sort was requested, or initial load
      const shouldApply = !this.hasUserManualRackOrder || isExplicitSort || isInitial;

      if (shouldApply && (isServerOrderChanged || isExplicitSort || isInitial)) {
        this.lastServerOrder = orderStr;
        this.isExplicitSortRequested = false;
        this.hasAppliedInitialRackOrder = true;
        if (isExplicitSort) {
          this.hasUserManualRackOrder = false;
        }

        if (order && order.length > 0) {
          // Follow the exact rack tile order received from API response
          const newRackOrder: number[] = [];
          for (const id of order) {
            if (!this.isTileInAnyExposure(id) && !this.discardedTileIds.includes(id)) {
              newRackOrder.push(id);
            }
          }
          // Append any remaining active rack tiles not listed in server order
          for (const id of this.rackOrder) {
            if (!newRackOrder.includes(id) && !this.isTileInAnyExposure(id) && !this.discardedTileIds.includes(id)) {
              newRackOrder.push(id);
            }
          }
          this.rackOrder = newRackOrder;
          this.reindexRackRuntimeSlots();
          this.layoutRackTiles(true);
        }
      }
    }, this);
    /* NEWCODE */
```

---

### Change 4: Preserve Manual Order in `reconcileRackTiles()`
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 2067)

#### BEFORE:
```typescript
    /* NEWCODE */
    // Sync rackOrder to follow the API tiles order received from server
    const apiOrderIds = this.rackTiles
      .map((t) => t.tile_id!)
      .filter((id) => !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id));

    if (apiOrderIds.length > 0) {
      const syncedOrder: number[] = [];
      for (const id of apiOrderIds) {
        if (!syncedOrder.includes(id)) {
          syncedOrder.push(id);
        }
      }
      // Keep any remaining rack tiles
      for (const id of this.rackOrder) {
        if (!syncedOrder.includes(id) && !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id)) {
          syncedOrder.push(id);
        }
      }
      this.rackOrder = syncedOrder;
    }

    this.reindexRackRuntimeSlots();
    if (!this.hasAppliedInitialRackOrder && this.rackOrder.length > 0) {
      this.hasAppliedInitialRackOrder = true;
    }
    this.selectedIds.clear();
    this.callbacks.onSelectionChanged([]);
    this.resize(this.scale.width, this.scale.height, animate);
    /* NEWCODE */
```

#### AFTER:
```typescript
    /* OLDCODE
    // Sync rackOrder to follow the API tiles order received from server
    const apiOrderIds = this.rackTiles
      .map((t) => t.tile_id!)
      .filter((id) => !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id));

    if (apiOrderIds.length > 0) {
      const syncedOrder: number[] = [];
      for (const id of apiOrderIds) {
        if (!syncedOrder.includes(id)) {
          syncedOrder.push(id);
        }
      }
      // Keep any remaining rack tiles
      for (const id of this.rackOrder) {
        if (!syncedOrder.includes(id) && !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id)) {
          syncedOrder.push(id);
        }
      }
      this.rackOrder = syncedOrder;
    }
    OLDCODE */
    /* NEWCODE */
    if (this.hasUserManualRackOrder) {
      // User has manually arranged tiles: preserve existing relative order
      const activeTileIdSet = new Set(
        this.rackTiles
          .map((t) => t.tile_id!)
          .filter((id) => !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id))
      );

      // Keep existing tiles in current manual positions, removing discarded/exposed tiles
      const preservedOrder = this.rackOrder.filter((id) => activeTileIdSet.has(id));

      // Append any newly drawn/picked tiles to the end of the rack
      for (const tile of this.rackTiles) {
        const id = tile.tile_id!;
        if (activeTileIdSet.has(id) && !preservedOrder.includes(id)) {
          preservedOrder.push(id);
        }
      }
      this.rackOrder = preservedOrder;
    } else {
      // Sync rackOrder to follow the API tiles order received from server
      const apiOrderIds = this.rackTiles
        .map((t) => t.tile_id!)
        .filter((id) => !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id));

      if (apiOrderIds.length > 0) {
        const syncedOrder: number[] = [];
        for (const id of apiOrderIds) {
          if (!syncedOrder.includes(id)) {
            syncedOrder.push(id);
          }
        }
        // Keep any remaining rack tiles
        for (const id of this.rackOrder) {
          if (!syncedOrder.includes(id) && !this.discardedTileIds.includes(id) && !this.isTileInAnyExposure(id)) {
            syncedOrder.push(id);
          }
        }
        this.rackOrder = syncedOrder;
      }
    }

    this.reindexRackRuntimeSlots();
    if (!this.hasAppliedInitialRackOrder && this.rackOrder.length > 0) {
      this.hasAppliedInitialRackOrder = true;
    }
    this.selectedIds.clear();
    this.callbacks.onSelectionChanged([]);
    this.resize(this.scale.width, this.scale.height, animate);
    /* NEWCODE */
```

---

### Change 5: Activate Manual Mode on Tile Drag & Drop (`moveRackTileToIndex`)
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 2287)

#### BEFORE:
```typescript
  private moveRackTileToIndex(tileId: number, targetIndex: number): void {
    this.removeFromRackOrder(tileId);

    const safeIndex = Phaser.Math.Clamp(targetIndex, 0, this.rackOrder.length);
    this.rackOrder.splice(safeIndex, 0, tileId);

    this.reindexRackRuntimeSlots();
  }
```

#### AFTER:
```typescript
  /* OLDCODE
  private moveRackTileToIndex(tileId: number, targetIndex: number): void {
    this.removeFromRackOrder(tileId);

    const safeIndex = Phaser.Math.Clamp(targetIndex, 0, this.rackOrder.length);
    this.rackOrder.splice(safeIndex, 0, tileId);

    this.reindexRackRuntimeSlots();
  }
  OLDCODE */
  /* NEWCODE */
  private moveRackTileToIndex(tileId: number, targetIndex: number): void {
    // Flag that player has manually customized their rack layout
    this.hasUserManualRackOrder = true;

    this.removeFromRackOrder(tileId);

    const safeIndex = Phaser.Math.Clamp(targetIndex, 0, this.rackOrder.length);
    this.rackOrder.splice(safeIndex, 0, tileId);

    this.reindexRackRuntimeSlots();
  }
  /* NEWCODE */
```

---

## 4. Verification & Testing Strategy
1. **Compilation Check**: Run `npx tsc -p tsconfig.app.json --noEmit` to verify 0 TypeScript compilation errors.
2. **Behavioral Invariant Check**:
   - Verify that drag-and-drop sets `this.hasUserManualRackOrder = true`.
   - Verify that subsequent server play updates do not reset `this.rackOrder`.
   - Verify that clicking "Order by Suit" or "Order by Rank" resets `this.hasUserManualRackOrder = false` and applies server order.
   - Verify that existing code is commented out with `/* OLDCODE ... */` and new code is tagged with `/* NEWCODE */`.

