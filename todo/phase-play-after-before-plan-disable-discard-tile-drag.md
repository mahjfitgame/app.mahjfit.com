# Before / After Plan: Disable Drag and Drop for Discarded Tiles

---

## 1. Problem Summary

### What is happening?
Tiles in the discard area could still receive drag events under certain conditions, allowing players to move discarded tiles or interfering with swipe-scrolling through the discard area.

### Goal:
Completely disable drag, pointer down, and drop interactions for any discarded tile so that:
1. Discarded tiles cannot be moved or dragged by the player.
2. Swiping/scrolling across the discard area works smoothly without accidentally grabbing a tile.

---

## 2. Solution

1. In `registerTileInput(runtime: TileRuntime)`:
   - Guard `onPointerDown`: Immediately return if `runtime.zone === "discard"`.
   - Guard `onPointerOver`: Immediately return if `runtime.zone === "discard"`.
   - Guard `onDragStart`: Immediately return if `runtime.zone === "discard"`.
   - Guard `onDrag`: Immediately return if `runtime.zone === "discard"`.
   - Guard `onDragEnd`: Immediately return if `runtime.zone === "discard"`.
   - Guard `onPointerUp`: Immediately return if `runtime.zone === "discard"`.
2. In `snapTileToDiscard(runtime: TileRuntime)`:
   - Call `this.input.setDraggable(runtime.image, false)`.
   - Call `runtime.image.disableInteractive()`.
3. In `layoutDiscardTiles()`:
   - Ensure every discarded tile has `runtime.image.disableInteractive()` and `this.input.setDraggable(runtime.image, false)`.
4. In opponent discard creation (`renderDiscardsSet` and `handleOpponentDiscard`):
   - Ensure `image.disableInteractive()` is explicitly set.

---

## 3. Before and After Code Snippets

### File: `src/app/module/business/game/phaser/scenes/scene.ts`

#### Snippet 1: Guard input handlers in `registerTileInput` (around lines 2660-2690)

**Before:**
```typescript
    this.tileInteractionManager.onPointerDown(runtime.image, (pointer: Phaser.Input.Pointer) => {
      if (runtime.zone === "pass") {
        pointer.event?.stopPropagation?.();
        this.playHaptic("tile-return");
        this.returnPassTileToRack(runtime.vm.tile_id!);
        return;
      }

      this.activeDragTile = runtime;
      this.suppressTapByTileId.delete(runtime.vm.tile_id!);

      this.tileInteractionManager.beginPointer(runtime.vm.tile_id!, pointer);

      runtime.isDragging = false;
      runtime.image.setDepth(100);

      this.showJokerWarning(runtime);
    });

    this.tileInteractionManager.onPointerOver(runtime.image, () => {
      this.showJokerWarning(runtime);
    });

    this.tileInteractionManager.onDragStart(runtime.image, () => {
      runtime.image.setDepth(100);
    });

    this.tileInteractionManager.onDrag(runtime.image, (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
```

**After:**
```typescript
    /* OLDCODE
    this.tileInteractionManager.onPointerDown(runtime.image, (pointer: Phaser.Input.Pointer) => {
      if (runtime.zone === "pass") {
        pointer.event?.stopPropagation?.();
        this.playHaptic("tile-return");
        this.returnPassTileToRack(runtime.vm.tile_id!);
        return;
      }

      this.activeDragTile = runtime;
      this.suppressTapByTileId.delete(runtime.vm.tile_id!);

      this.tileInteractionManager.beginPointer(runtime.vm.tile_id!, pointer);

      runtime.isDragging = false;
      runtime.image.setDepth(100);

      this.showJokerWarning(runtime);
    });

    this.tileInteractionManager.onPointerOver(runtime.image, () => {
      this.showJokerWarning(runtime);
    });

    this.tileInteractionManager.onDragStart(runtime.image, () => {
      runtime.image.setDepth(100);
    });

    this.tileInteractionManager.onDrag(runtime.image, (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
    OLDCODE */
    /* NEWCODE */
    this.tileInteractionManager.onPointerDown(runtime.image, (pointer: Phaser.Input.Pointer) => {
      // Discarded tiles cannot be clicked or dragged
      if (runtime.zone === "discard") return;

      if (runtime.zone === "pass") {
        pointer.event?.stopPropagation?.();
        this.playHaptic("tile-return");
        this.returnPassTileToRack(runtime.vm.tile_id!);
        return;
      }

      this.activeDragTile = runtime;
      this.suppressTapByTileId.delete(runtime.vm.tile_id!);

      this.tileInteractionManager.beginPointer(runtime.vm.tile_id!, pointer);

      runtime.isDragging = false;
      runtime.image.setDepth(100);

      this.showJokerWarning(runtime);
    });

    this.tileInteractionManager.onPointerOver(runtime.image, () => {
      if (runtime.zone === "discard") return;
      this.showJokerWarning(runtime);
    });

    this.tileInteractionManager.onDragStart(runtime.image, () => {
      // Discarded tiles cannot be dragged
      if (runtime.zone === "discard") return;
      runtime.image.setDepth(100);
    });

    this.tileInteractionManager.onDrag(runtime.image, (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      // Discarded tiles cannot be dragged
      if (runtime.zone === "discard") return;
    /* NEWCODE */
```

---

#### Snippet 2: Guard `onDragEnd` and `onPointerUp` (around lines 2850 & 2930)

**Before (`onDragEnd`):**
```typescript
    this.tileInteractionManager.onDragEnd(runtime.image, (pointer: Phaser.Input.Pointer) => {
      this.hideDragProxy();
      this.hideRackDragGhost();
      this.clearJokerMagneticProximity();
      // Restore canvas sprite visibility when drag ends
      runtime.image.setAlpha(1);
      this.tileInteractionManager.handleDrop(runtime, pointer, () => {
```

**After (`onDragEnd`):**
```typescript
    /* OLDCODE
    this.tileInteractionManager.onDragEnd(runtime.image, (pointer: Phaser.Input.Pointer) => {
      this.hideDragProxy();
      this.hideRackDragGhost();
      this.clearJokerMagneticProximity();
      // Restore canvas sprite visibility when drag ends
      runtime.image.setAlpha(1);
      this.tileInteractionManager.handleDrop(runtime, pointer, () => {
    OLDCODE */
    /* NEWCODE */
    this.tileInteractionManager.onDragEnd(runtime.image, (pointer: Phaser.Input.Pointer) => {
      if (runtime.zone === "discard") return;
      this.hideDragProxy();
      this.hideRackDragGhost();
      this.clearJokerMagneticProximity();
      // Restore canvas sprite visibility when drag ends
      runtime.image.setAlpha(1);
      this.tileInteractionManager.handleDrop(runtime, pointer, () => {
    /* NEWCODE */
```

**Before (`onPointerUp`):**
```typescript
    this.tileInteractionManager.onPointerUp(runtime.image, () => {
      this.hideDragProxy();
      this.hideRackDragGhost();
      this.clearJokerMagneticProximity();
      // Restore canvas sprite visibility if pointer released
      runtime.image.setAlpha(1);
      this.activeDragTile = undefined;
      const tileId = runtime.vm.tile_id ?? (runtime.vm as any).id;
```

**After (`onPointerUp`):**
```typescript
    /* OLDCODE
    this.tileInteractionManager.onPointerUp(runtime.image, () => {
      this.hideDragProxy();
      this.hideRackDragGhost();
      this.clearJokerMagneticProximity();
      // Restore canvas sprite visibility if pointer released
      runtime.image.setAlpha(1);
      this.activeDragTile = undefined;
    OLDCODE */
    /* NEWCODE */
    this.tileInteractionManager.onPointerUp(runtime.image, () => {
      if (runtime.zone === "discard") return;
      this.hideDragProxy();
      this.hideRackDragGhost();
      this.clearJokerMagneticProximity();
      // Restore canvas sprite visibility if pointer released
      runtime.image.setAlpha(1);
      this.activeDragTile = undefined;
    /* NEWCODE */
```

---

#### Snippet 3: Disable draggable and interactivity in `snapTileToDiscard` and `layoutDiscardTiles` (around lines 9520 & 9890)

**Before (`snapTileToDiscard`):**
```typescript
    runtime.image.clearTint();
    this.removeTileTextureFilter(runtime.image);
    runtime.image.disableInteractive();
    runtime.image.setData("discard-id", runtime.vm.tile_id!);
```

**After (`snapTileToDiscard`):**
```typescript
    /* OLDCODE
    runtime.image.clearTint();
    this.removeTileTextureFilter(runtime.image);
    runtime.image.disableInteractive();
    runtime.image.setData("discard-id", runtime.vm.tile_id!);
    OLDCODE */
    /* NEWCODE */
    runtime.image.clearTint();
    this.removeTileTextureFilter(runtime.image);
    // Explicitly disable input and dragging for discarded tile
    runtime.image.disableInteractive();
    this.input.setDraggable(runtime.image, false);
    runtime.image.setData("discard-id", runtime.vm.tile_id!);
    /* NEWCODE */
```

**Before (`layoutDiscardTiles`):**
```typescript
      runtime.image.setDisplaySize(grid.tileWidth, grid.tileHeight);
      // Ensure discarded tiles never retain shadow
      this.removeTileTextureFilter(runtime.image);
```

**After (`layoutDiscardTiles`):**
```typescript
      runtime.image.setDisplaySize(grid.tileWidth, grid.tileHeight);
      /* OLDCODE
      // Ensure discarded tiles never retain shadow
      this.removeTileTextureFilter(runtime.image);
      OLDCODE */
      /* NEWCODE */
      // Ensure discarded tiles never retain shadow and can never be dragged
      this.removeTileTextureFilter(runtime.image);
      runtime.image.disableInteractive();
      this.input.setDraggable(runtime.image, false);
      /* NEWCODE */
```

---

## 4. Verification

1. `npx tsc --noEmit` -> 0 errors.
2. In-game check:
   - Tap, click, or drag any tile in the discard area -> Tile does NOT move at all.
   - Swipe across discard area -> Scroll works smoothly without dragging any discarded tiles.
   - Tiles in the rack continue to drag and drop normally.

