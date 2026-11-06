# Before / After Plan: Fix Dragged Tile Layering & Eliminate Duplicate Tile on Mobile and Retina Displays

---

## 1. Problem Analysis & Clarification

### Question Asked:
> "If we removed the HTML then what about when drag image it going behind to the labels, instruction text and the buttons. Is this also resolved. First make sure this thing before moving to forward"

### The Verdict:
You are **100% correct**. If we were to simply remove the HTML proxy:
- The `<canvas>` is in the background, underneath all Angular HTML overlays.
- HTML elements like the **Instruction Panel** (`z-index: 25`), **PASS buttons**, and **Player labels** sit above the canvas.
- As a result, dragging a tile across the screen on the canvas alone would cause the tile to **slide behind** those HTML labels, instruction text, and buttons!

### Why Was the HTML Drag Proxy Buggy?
The HTML drag proxy (`#phaser-drag-tile-proxy`) was originally added to solve that exact layering problem (with `z-index: 1000`).
However, it had two critical bugs:
1. **Wrong position and size on high-DPI displays**:
   The coordinates and sizes were divided by `dpr`:
   ```typescript
   const screenX = Math.round(dragX / dpr);
   const screenY = Math.round(dragY / dpr);
   ```
   Because Phaser's coordinate system is already in 1:1 CSS screen pixels (`host.clientWidth`, `host.clientHeight`), dividing by `dpr` caused the HTML proxy to shrink to 1/2 size (Mac Retina) or 1/3 size (iPhone 16 Pro), and shifted it far toward the top-left corner `(0, 0)`.
2. **Both tiles were rendered simultaneously**:
   While the HTML proxy was visible, the Phaser canvas tile (`runtime.image`) was **also** kept 100% visible.
   This made it look like there were two separate tiles moving at once.

---

## 2. The Comprehensive Solution

To solve **BOTH** requirements:
1. **Keep the tile ON TOP of all labels, instruction text, and buttons**:
   - Keep the HTML drag proxy (`#phaser-drag-tile-proxy`) at `z-index: 1000`.
   - Remove the `/ dpr` division so `screenX`, `screenY`, `width`, and `height` match the exact 1:1 CSS pixel coordinates directly under the user's finger/cursor.
2. **Eliminate the duplicate tile**:
   - When drag starts (`runtime.isDragging = true`), set `runtime.image.setAlpha(0)` on the Phaser canvas sprite.
   - The user will see only **one single tile** — the HTML proxy at `z-index: 1000`, perfectly aligned under their finger.
   - When drag ends (drop, pass, discard, or cancel), restore `runtime.image.setAlpha(1)` and hide the HTML proxy (`hideDragProxy()`).

---

## 3. Before and After Code Snippets

### File: `src/app/module/business/game/phaser/scenes/scene.ts`

#### Snippet 1: Hide canvas sprite while dragging so only the top-layer HTML proxy is visible (around line 2710)

**Before:**
```typescript
      if (!runtime.isDragging) {
        runtime.isDragging = true;

        runtime.selected = false;
        this.selectedIds.delete(runtime.vm.tile_id!);
        runtime.image.clearTint();

        this.callbacks.onSelectionChanged([...this.selectedIds]);
        // Mode B: Set opacity of original tile slot in rack to 30% via ghost image
        this.showRackDragGhost(runtime);
      }

      runtime.image.setPosition(Math.round(dragX), Math.round(dragY));
      this.updateDragProxy(runtime, dragX, dragY);
      this.updateJokerMagneticProximity(runtime, pointer.worldX, pointer.worldY);
```

**After:**
```typescript
      /* OLDCODE
      if (!runtime.isDragging) {
        runtime.isDragging = true;

        runtime.selected = false;
        this.selectedIds.delete(runtime.vm.tile_id!);
        runtime.image.clearTint();

        this.callbacks.onSelectionChanged([...this.selectedIds]);
        // Mode B: Set opacity of original tile slot in rack to 30% via ghost image
        this.showRackDragGhost(runtime);
      }

      runtime.image.setPosition(Math.round(dragX), Math.round(dragY));
      this.updateDragProxy(runtime, dragX, dragY);
      this.updateJokerMagneticProximity(runtime, pointer.worldX, pointer.worldY);
      OLDCODE */
      /* NEWCODE */
      if (!runtime.isDragging) {
        runtime.isDragging = true;

        runtime.selected = false;
        this.selectedIds.delete(runtime.vm.tile_id!);
        runtime.image.clearTint();

        // Hide canvas sprite while dragging so only the topmost HTML proxy tile is visible
        runtime.image.setAlpha(0);

        this.callbacks.onSelectionChanged([...this.selectedIds]);
        // Show 30% ghost at original rack slot so player sees where tile came from
        this.showRackDragGhost(runtime);
      }

      runtime.image.setPosition(Math.round(dragX), Math.round(dragY));
      // Update topmost HTML proxy tile position (z-index: 1000 above labels and buttons)
      this.updateDragProxy(runtime, dragX, dragY);
      this.updateJokerMagneticProximity(runtime, pointer.worldX, pointer.worldY);
      /* NEWCODE */
```

---

#### Snippet 2: Restore canvas sprite visibility on drag end and pointer up (around lines 2830 & 2902)

**Before (`onDragEnd`):**
```typescript
    this.tileInteractionManager.onDragEnd(runtime.image, (pointer: Phaser.Input.Pointer) => {
      this.hideDragProxy();
      this.hideRackDragGhost();
      this.clearJokerMagneticProximity();
      this.tileInteractionManager.handleDrop(runtime, pointer, () => {
        const tileId = runtime.vm.tile_id ?? (runtime.vm as any).id;
        try {
          runtime.image.setDepth(30);
```

**After (`onDragEnd`):**
```typescript
    /* OLDCODE
    this.tileInteractionManager.onDragEnd(runtime.image, (pointer: Phaser.Input.Pointer) => {
      this.hideDragProxy();
      this.hideRackDragGhost();
      this.clearJokerMagneticProximity();
      this.tileInteractionManager.handleDrop(runtime, pointer, () => {
    OLDCODE */
    /* NEWCODE */
    this.tileInteractionManager.onDragEnd(runtime.image, (pointer: Phaser.Input.Pointer) => {
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
      this.activeDragTile = undefined;
```

**After (`onPointerUp`):**
```typescript
    /* OLDCODE
    this.tileInteractionManager.onPointerUp(runtime.image, () => {
      this.hideDragProxy();
      this.hideRackDragGhost();
      this.clearJokerMagneticProximity();
      this.activeDragTile = undefined;
    OLDCODE */
    /* NEWCODE */
    this.tileInteractionManager.onPointerUp(runtime.image, () => {
      this.hideDragProxy();
      this.hideRackDragGhost();
      this.clearJokerMagneticProximity();
      // Restore canvas sprite visibility if pointer released
      runtime.image.setAlpha(1);
      this.activeDragTile = undefined;
    /* NEWCODE */
```

---

#### Snippet 3: Fix 1:1 coordinates and sizing in `showDragProxy` and `updateDragProxy` (around line 4325)

**Before:**
```typescript
    /* NEWCODE */
    const dpr = this.renderDpr || (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    const width = Math.round(runtime.image.displayWidth / dpr);
    const height = Math.round(runtime.image.displayHeight / dpr);
    const screenX = Math.round(dragX / dpr);
    const screenY = Math.round(dragY / dpr);
    proxy.style.width = `${width}px`;
    proxy.style.height = `${height}px`;
    proxy.style.transform = `translate3d(${Math.round(screenX - width / 2)}px, ${Math.round(screenY - height / 2)}px, 0)`;
    proxy.style.display = "block";
    /* NEWCODE */
  }

  private updateDragProxy(runtime: TileRuntime, dragX: number, dragY: number): void {
    const proxy = this.getDragProxy();
    if (!proxy || proxy.style.display === "none") {
      this.showDragProxy(runtime, dragX, dragY);
      return;
    }
    /* OLDCODE
    const width = Math.round(runtime.image.displayWidth);
    const height = Math.round(runtime.image.displayHeight);
    proxy.style.transform = `translate3d(${Math.round(dragX - width / 2)}px, ${Math.round(dragY - height / 2)}px, 0)`;
    OLDCODE */
    /* NEWCODE */
    const dpr = this.renderDpr || (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    const width = Math.round(runtime.image.displayWidth / dpr);
    const height = Math.round(runtime.image.displayHeight / dpr);
    const screenX = Math.round(dragX / dpr);
    const screenY = Math.round(dragY / dpr);
    proxy.style.transform = `translate3d(${Math.round(screenX - width / 2)}px, ${Math.round(screenY - height / 2)}px, 0)`;
    /* NEWCODE */
  }
```

**After:**
```typescript
    /* OLDCODE
    const dpr = this.renderDpr || (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    const width = Math.round(runtime.image.displayWidth / dpr);
    const height = Math.round(runtime.image.displayHeight / dpr);
    const screenX = Math.round(dragX / dpr);
    const screenY = Math.round(dragY / dpr);
    proxy.style.width = `${width}px`;
    proxy.style.height = `${height}px`;
    proxy.style.transform = `translate3d(${Math.round(screenX - width / 2)}px, ${Math.round(screenY - height / 2)}px, 0)`;
    proxy.style.display = "block";
    OLDCODE */
    /* NEWCODE */
    // dragX, dragY, and displaySize are already in 1:1 CSS screen pixels.
    // Do not divide by DPR; use the exact tile size and center it under the pointer.
    const width = Math.round(runtime.image.displayWidth);
    const height = Math.round(runtime.image.displayHeight);
    proxy.style.width = `${width}px`;
    proxy.style.height = `${height}px`;
    proxy.style.transform = `translate3d(${Math.round(dragX - width / 2)}px, ${Math.round(dragY - height / 2)}px, 0)`;
    proxy.style.display = "block";
    /* NEWCODE */
  }

  private updateDragProxy(runtime: TileRuntime, dragX: number, dragY: number): void {
    const proxy = this.getDragProxy();
    if (!proxy || proxy.style.display === "none") {
      this.showDragProxy(runtime, dragX, dragY);
      return;
    }
    /* OLDCODE
    const dpr = this.renderDpr || (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    const width = Math.round(runtime.image.displayWidth / dpr);
    const height = Math.round(runtime.image.displayHeight / dpr);
    const screenX = Math.round(dragX / dpr);
    const screenY = Math.round(dragY / dpr);
    proxy.style.transform = `translate3d(${Math.round(screenX - width / 2)}px, ${Math.round(screenY - height / 2)}px, 0)`;
    OLDCODE */
    /* NEWCODE */
    // Keep HTML proxy directly under pointer at exact tile size across all devices
    const width = Math.round(runtime.image.displayWidth);
    const height = Math.round(runtime.image.displayHeight);
    proxy.style.width = `${width}px`;
    proxy.style.height = `${height}px`;
    proxy.style.transform = `translate3d(${Math.round(dragX - width / 2)}px, ${Math.round(dragY - height / 2)}px, 0)`;
    /* NEWCODE */
  }
```

---

## 4. Verification & Testing

1. Run TypeScript check: `npx tsc --noEmit` -> ensure 0 errors.
2. Drag a tile on iPhone 16 Pro and Mac Retina display:
   - **No Duplicate**: Only one single tile is visible under the finger/cursor. No phantom mini-tile at the top left.
   - **Always On Top**: Drag the tile over the center instruction box ("Select 3 tiles to pass", "PASS" button) and player labels. The tile smoothly glides **ON TOP** of the labels, box, and buttons.
   - **Correct Scale**: The dragged tile matches the exact scale of the rack tiles on all devices.
   - **Smooth Snap**: When dropped or cancelled, the tile returns cleanly to its slot, pass area, or discard area without flicker.
