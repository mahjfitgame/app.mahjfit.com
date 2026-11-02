# Phase Play - Pick Tile Animation Fix (Before & After Plan)

## Problem Summary
Sometimes when picking a tile from the wall, the tile directly appears in the player's rack without showing the flying animation from the wall to the rack. 

This happens for two reasons on the player's rack:
1. **Safety Timer Too Fast on Easy Speed**:
   - On Easy bot level, the tile animation speed is 1000ms.
   - But the safety timer was hardcoded to 800ms.
   - The safety timer finished before the animation completed, so it forced the tile visible on the rack early.
2. **Premature Flag Reset**:
   - When the user clicked "PICK", the app set `isWaitingForPickResponse = true`.
   - If the rack refreshed before the server delivered the new 14th tile, the code cleared `isWaitingForPickResponse = false`.
   - When the new tile arrived a moment later, the app didn't know it was a picked tile, so it showed it instantly with no animation.
3. **Missing Fallback Detection**:
   - If a new 14th tile enters the rack during the play phase, it is always a picked tile from the wall. Auto-detecting this ensures the animation runs even if a flag was cleared.

> **Note**: Opponent pick, claim, and discard are already working properly, so no changes are made to opponent methods.

---

## File Changes Overview
- **File**: `src/app/module/business/game/phaser/scenes/scene.ts`
- **Changes**:
  1. **Change 1 & 2 (`setRack`)**: Make safety timer match the bot animation speed (`animationDuration + 300ms`) instead of fixed 800ms.
  2. **Change 3 (`reconcileRackTiles` - Tile Addition)**: Automatically detect when a 14th tile is added during play so it animates from the wall.
  3. **Change 4 (`reconcileRackTiles` - Cleanup)**: Do not clear `isWaitingForPickResponse` until the new tile actually arrives and is prepared for animation.

---

## Before & After Code Snippets

### Change 1: Dynamic Safety Timer in `setRack` (First Occurrence)
**File**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 1515)

#### Before Code:
```typescript
      /* NEWCODE */
      if (this.pendingLocalPickRuntime) {
        const runtime = this.pendingLocalPickRuntime;
        this.pendingLocalPickRuntime = undefined;
        this.animatingPickTileId = runtime.vm.tile_id;

        const targetPoint = this.slotFor(runtime);
        const safetyTimer = this.time.delayedCall(800, () => {
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
        this.animateWallTileToSeat("bottom", runtime.vm, targetPoint, () => {
          safetyTimer.remove();
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
      }
      /* NEWCODE */
```

#### After Code:
```typescript
      /* OLDCODE
      if (this.pendingLocalPickRuntime) {
        const runtime = this.pendingLocalPickRuntime;
        this.pendingLocalPickRuntime = undefined;
        this.animatingPickTileId = runtime.vm.tile_id;

        const targetPoint = this.slotFor(runtime);
        const safetyTimer = this.time.delayedCall(800, () => {
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
        this.animateWallTileToSeat("bottom", runtime.vm, targetPoint, () => {
          safetyTimer.remove();
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
      }
      OLDCODE */
      /* NEWCODE */
      if (this.pendingLocalPickRuntime) {
        const runtime = this.pendingLocalPickRuntime;
        this.pendingLocalPickRuntime = undefined;
        this.animatingPickTileId = runtime.vm.tile_id;

        const targetPoint = this.slotFor(runtime);
        // Safety timer waits slightly longer than animation speed so animation never gets cut early
        const safetyTimerMs = this.animationDuration + 300;
        const safetyTimer = this.time.delayedCall(safetyTimerMs, () => {
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
        this.animateWallTileToSeat("bottom", runtime.vm, targetPoint, () => {
          safetyTimer.remove();
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
      }
      /* NEWCODE */
```

---

### Change 2: Dynamic Safety Timer in `setRack` (Second Occurrence)
**File**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 1625)

#### Before Code:
```typescript
      /* NEWCODE */
      if (this.pendingLocalPickRuntime) {
        const runtime = this.pendingLocalPickRuntime;
        this.pendingLocalPickRuntime = undefined;
        this.animatingPickTileId = runtime.vm.tile_id;

        const targetPoint = this.slotFor(runtime);
        const safetyTimer = this.time.delayedCall(800, () => {
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
        this.animateWallTileToSeat("bottom", runtime.vm, targetPoint, () => {
          safetyTimer.remove();
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
      }
      /* NEWCODE */
```

#### After Code:
```typescript
      /* OLDCODE
      if (this.pendingLocalPickRuntime) {
        const runtime = this.pendingLocalPickRuntime;
        this.pendingLocalPickRuntime = undefined;
        this.animatingPickTileId = runtime.vm.tile_id;

        const targetPoint = this.slotFor(runtime);
        const safetyTimer = this.time.delayedCall(800, () => {
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
        this.animateWallTileToSeat("bottom", runtime.vm, targetPoint, () => {
          safetyTimer.remove();
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
      }
      OLDCODE */
      /* NEWCODE */
      if (this.pendingLocalPickRuntime) {
        const runtime = this.pendingLocalPickRuntime;
        this.pendingLocalPickRuntime = undefined;
        this.animatingPickTileId = runtime.vm.tile_id;

        const targetPoint = this.slotFor(runtime);
        // Safety timer waits slightly longer than animation speed so animation never gets cut early
        const safetyTimerMs = this.animationDuration + 300;
        const safetyTimer = this.time.delayedCall(safetyTimerMs, () => {
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
        this.animateWallTileToSeat("bottom", runtime.vm, targetPoint, () => {
          safetyTimer.remove();
          this.animatingPickTileId = undefined;
          runtime.image.setAlpha(1);
          this.isPickAnimating = false;
          this.updatePassButtonState();
          this.updateInstructionText();
        });
      }
      /* NEWCODE */
```

---

### Change 3: Auto-Detect Picked 14th Tile in `reconcileRackTiles`
**File**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 1950)

#### Before Code:
```typescript
      /* NEWCODE */
      if (this.isWaitingForPickResponse) {
        this.isWaitingForPickResponse = false;
        runtime.image.setAlpha(0);
        this.pendingLocalPickRuntime = runtime;
        this.animatingPickTileId = tile.tile_id!;
      }
      /* NEWCODE */
```

#### After Code:
```typescript
      /* OLDCODE
      if (this.isWaitingForPickResponse) {
        this.isWaitingForPickResponse = false;
        runtime.image.setAlpha(0);
        this.pendingLocalPickRuntime = runtime;
        this.animatingPickTileId = tile.tile_id!;
      }
      OLDCODE */
      /* NEWCODE */
      // Check if this new tile was picked from wall (either flag is true, or rack reached 14 tiles in play phase)
      const isPickAction = this.isWaitingForPickResponse || 
        (this.tablePhase === GamePhaseEnum.PLAYING && this.rackTiles.length === 14);

      if (isPickAction) {
        this.isWaitingForPickResponse = false;
        // Keep tile invisible on the rack until the wall-to-rack flight finishes
        runtime.image.setAlpha(0);
        this.pendingLocalPickRuntime = runtime;
        this.animatingPickTileId = tile.tile_id!;
      }
      /* NEWCODE */
```

---

### Change 4: Prevent Early Cleanup in `reconcileRackTiles`
**File**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 1978)

#### Before Code:
```typescript
    /* NEWCODE */
    if (this.isWaitingForPickResponse) {
      this.isWaitingForPickResponse = false;
      this.isPickAnimating = false;
      this.pendingLocalPickRuntime = undefined;
      this.animatingPickTileId = undefined;
    }
    /* NEWCODE */
```

#### After Code:
```typescript
    /* OLDCODE
    if (this.isWaitingForPickResponse) {
      this.isWaitingForPickResponse = false;
      this.isPickAnimating = false;
      this.pendingLocalPickRuntime = undefined;
      this.animatingPickTileId = undefined;
    }
    OLDCODE */
    /* NEWCODE */
    // Only clear the pick flag if we actually found and prepared the picked tile
    if (this.pendingLocalPickRuntime) {
      this.isWaitingForPickResponse = false;
    }
    /* NEWCODE */
```
