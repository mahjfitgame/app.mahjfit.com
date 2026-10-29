# Charleston Courtesy Pass Rack Tile Sync - Before & After Plan

## Problem Summary
When completing the Charleston Courtesy Pass (Optional Across) with 2 tiles:
1. The user passes 2 tiles across; 2 tiles are received from across.
2. The API responds with all 14 tiles in `personal.seats[seatId].racks[1].hand` and `hand_order`.
3. However, the Phaser rack only displays 12 tiles; the 2 newly received tiles are not shown on the rack.

## Root Causes
1. **Server Order Gating in `rack:order`**: In `scene.ts`, incoming server orders are blocked by `shouldApply` (`(isInitial && this.rackOrder.length > 0) || isExplicitSort`). After initial load, `shouldApply` is `false`, so server orders after Charleston pass are ignored.
2. **Missing New Tiles in `rackOrder` Reconciliation**: The previous filtering logic only checked `if (this.rackOrder.includes(id))`. Because newly received tiles were not yet in `this.rackOrder`, they were dropped.
3. **Courtesy Pass Redirection**: In `commitBotPassVisualTilesToRacks`, `bottomTilesToRedirect = 3 - this.passWaitingTileIds.length` redirected 1 incoming tile to across because Courtesy pass passes 2 tiles instead of 3.

---

## File Changes: Before & After Code Snippets

### File 1: `src/app/module/business/game/phaser/scenes/scene.ts`

#### Snippet 1: Listen to `rack:order` and apply server order
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 523)

##### Before:
```typescript
    /* NEWCODE */
    this.game.events.on("rack:order", (order: number[]) => {
      const orderStr = order.join(',');
      const isInitial = !this.hasAppliedInitialRackOrder;
      const isExplicitSort = this.isExplicitSortRequested;
      const shouldApply = (isInitial && this.rackOrder.length > 0) || isExplicitSort;

      if (shouldApply || this.lastServerOrder !== orderStr) {
        this.lastServerOrder = orderStr;

        if (shouldApply && this.rackOrder.length > 0) {
          this.isExplicitSortRequested = false;
          this.hasAppliedInitialRackOrder = true;

          // We apply the order, but only for tiles currently in rackOrder
          // The new order might contain tiles that are in exposures, etc.
          const newRackOrder = [];
          for (const id of order) {
            if (this.rackOrder.includes(id)) {
              newRackOrder.push(id);
            }
          }
          // Add any tiles that were in rackOrder but missing from the server order
          for (const id of this.rackOrder) {
            if (!newRackOrder.includes(id)) {
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

##### After:
```typescript
    /* OLDCODE
    this.game.events.on("rack:order", (order: number[]) => {
      const orderStr = order.join(',');
      const isInitial = !this.hasAppliedInitialRackOrder;
      const isExplicitSort = this.isExplicitSortRequested;
      const shouldApply = (isInitial && this.rackOrder.length > 0) || isExplicitSort;

      if (shouldApply || this.lastServerOrder !== orderStr) {
        this.lastServerOrder = orderStr;

        if (shouldApply && this.rackOrder.length > 0) {
          this.isExplicitSortRequested = false;
          this.hasAppliedInitialRackOrder = true;

          // We apply the order, but only for tiles currently in rackOrder
          // The new order might contain tiles that are in exposures, etc.
          const newRackOrder = [];
          for (const id of order) {
            if (this.rackOrder.includes(id)) {
              newRackOrder.push(id);
            }
          }
          // Add any tiles that were in rackOrder but missing from the server order
          for (const id of this.rackOrder) {
            if (!newRackOrder.includes(id)) {
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

---

#### Snippet 2: Sync rack order and incoming tiles in `reconcileRackTiles`
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 1540)

##### Before:
```typescript
      // Add to rackOrder if not present and not in exposures/discards
      const isOptimisticPassing = this.tablePhase === GamePhaseEnum.PASSING && this.stateManager.optimisticPassTileIds.includes(tile.tile_id!);
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
      // Add to rackOrder if not present and not in exposures/discards
      const isOptimisticPassing = this.tablePhase === GamePhaseEnum.PASSING && this.stateManager.optimisticPassTileIds.includes(tile.tile_id!);
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
```

---

#### Snippet 3: Sync `rackOrder` with API order in `reconcileRackTiles`
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 1622)

##### Before:
```typescript
    this.reindexRackRuntimeSlots();
/* NEWCODE */
    /* NEWCODE */
    if (!this.hasAppliedInitialRackOrder && this.rackOrder.length > 0) {
      this.hasAppliedInitialRackOrder = true;
    }
    /* NEWCODE */
    this.selectedIds.clear();
    this.callbacks.onSelectionChanged([]);
    this.resize(this.scale.width, this.scale.height, animate);
```

##### After:
```typescript
    /* OLDCODE
    this.reindexRackRuntimeSlots();
    if (!this.hasAppliedInitialRackOrder && this.rackOrder.length > 0) {
      this.hasAppliedInitialRackOrder = true;
    }
    this.selectedIds.clear();
    this.callbacks.onSelectionChanged([]);
    this.resize(this.scale.width, this.scale.height, animate);
    OLDCODE */
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

---

#### Snippet 4: Courtesy pass tile count and redirection fix
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 8057 and line 8135)

##### Before (line 8057):
```typescript
  private animateBotTransferToWaitingArea(
    from: TableSeat,
    to: TableSeat,
    onFinished: () => void,
  ): void {
    const count = 3;
    const sourceTargets = this.passAreaTargets(from, count);
    const targetPoints = this.passAreaTargets(to, count);
```

##### After (line 8057):
```typescript
  /* OLDCODE
  private animateBotTransferToWaitingArea(
    from: TableSeat,
    to: TableSeat,
    onFinished: () => void,
  ): void {
    const count = 3;
    const sourceTargets = this.passAreaTargets(from, count);
    const targetPoints = this.passAreaTargets(to, count);
  OLDCODE */
  /* NEWCODE */
  // Use pass count matching courtesy pass tiles (e.g. 2 tiles)
  private animateBotTransferToWaitingArea(
    from: TableSeat,
    to: TableSeat,
    onFinished: () => void,
  ): void {
    const isCourtesy = this.charlestonState?.stage === GameCharlestoneStageEnum.COURTESY;
    const count = isCourtesy ? this.passWaitingTileIds.length : 3;
    const sourceTargets = this.passAreaTargets(from, count);
    const targetPoints = this.passAreaTargets(to, count);
  /* NEWCODE */
```

##### Before (line 8135):
```typescript
    const isCourtesy = this.charlestonState?.stage === GameCharlestoneStageEnum.COURTESY;
    let bottomTilesToRedirect = 3 - this.passWaitingTileIds.length;
    bottomTilesToRedirect = Math.max(0, Math.min(3, bottomTilesToRedirect));
```

##### After (line 8135):
```typescript
    /* OLDCODE
    const isCourtesy = this.charlestonState?.stage === GameCharlestoneStageEnum.COURTESY;
    let bottomTilesToRedirect = 3 - this.passWaitingTileIds.length;
    bottomTilesToRedirect = Math.max(0, Math.min(3, bottomTilesToRedirect));
    OLDCODE */
    /* NEWCODE */
    // Courtesy pass does not steal or redirect tiles to other players
    const isCourtesy = this.charlestonState?.stage === GameCharlestoneStageEnum.COURTESY;
    let bottomTilesToRedirect = isCourtesy ? 0 : 3 - this.passWaitingTileIds.length;
    bottomTilesToRedirect = Math.max(0, Math.min(3, bottomTilesToRedirect));
    /* NEWCODE */
```

---

## Verification Plan
1. Start Charleston round and proceed to Courtesy Pass (Optional Across).
2. Put 2 tiles into pass waiting area and click Pass.
3. Verify server API response sends 14 tiles with updated `hand_order`.
4. Verify all 14 tiles are displayed on the Phaser rack in the exact order received from the API response.
5. Verify no tile back visual clones are left floating or misdirected.
