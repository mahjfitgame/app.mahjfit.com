# Phase Play - Tile Shadow Fix (Before & After Plan)

## Problem Summary
1. **Discarded tiles still have shadow**: When the bottom player discards a tile, the shadow remains on the tile during flight and while resting in the discard area. Discarded tiles should NOT have shadow.
2. **Exposure tiles lost their shadow**: Tiles in the rack and exposure should have shadow. However, when tiles moved to exposure, `removeTileTextureFilter` was stripping their shadow.

---

## Root Cause
1. **In `removeTileTextureFilter`**:
   - The method called non-existent functions like `disableFilters()` and `removeShadow()`.
   - In Phaser 4's filter architecture, disabling filters requires setting:
     ```typescript
     (image as any).renderFilters = false;
     ```
   - Because `renderFilters = false` was never set, Phaser continued to render the shadow shader even after the tile was moved to discard.
2. **In `applyTileTextureFilter`**:
   - When enabling shadow on rack/exposure tiles, `renderFilters = true` must be set so Phaser knows to render filters for that image.
3. **In Exposure Handlers**:
   - When tiles were added to bottom exposures (e.g. lines 4645, 5132, 6824), `removeTileTextureFilter` was called, incorrectly removing the shadow from exposure tiles.

---

## File Changes Overview
- **File**: `src/app/module/business/game/phaser/scenes/scene.ts`
- **Changes**:
  1. **Change 1 (`applyTileTextureFilter`)**: Ensure `(image as any).renderFilters = true;` when applying shadow.
  2. **Change 2 (`removeTileTextureFilter`)**: Properly disable shadow using `(image as any).renderFilters = false;` and `filters.external.clear()`.
  3. **Change 3 (`bottom exposure creation`)**: Preserve/apply shadow on exposure tiles instead of removing it.

---

## Before & After Code Snippets

### Change 1 & 2: Fix `applyTileTextureFilter` and `removeTileTextureFilter`
**File**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 7805)

#### Before Code:
```typescript
  private applyTileTextureFilter(image: Phaser.GameObjects.Image, isBottomRack: boolean = false): void {
    image.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    if (isBottomRack) {
      if ((image as any).enableFilters && !image.getData("hasShadow")) {
        image.setData("hasShadow", true);
        (image as any).enableFilters();
        if ((image as any).filters && (image as any).filters.external) {
          // x, y, decay, power, color, samples, intensity
          // samples=2 because i=0 is at (0,0) [hidden]. i=1 is the offset shadow.
          // x is negative to shift right, y is negative to shift down.
          (image as any).filters.external.addShadow(-0.3, -0.4, 0.05, 1, 0x000000, 2, 0.65);
        }
      }
    }
  }

  private removeTileTextureFilter(image: Phaser.GameObjects.Image): void {
    if (image.getData("hasShadow")) {
      image.setData("hasShadow", false);

      // Try multiple ways to remove the shadow depending on the plugin/implementation
      if (typeof (image as any).disableFilters === 'function') {
        (image as any).disableFilters();
      }
      if ((image as any).filters && (image as any).filters.external) {
        if (typeof (image as any).filters.external.clear === 'function') {
          (image as any).filters.external.clear();
        }
        if (typeof (image as any).filters.external.removeShadow === 'function') {
          (image as any).filters.external.removeShadow();
        }
      }
      if (typeof (image as any).resetPostPipeline === 'function') {
        (image as any).resetPostPipeline(true);
      }
      if (typeof (image as any).resetPipeline === 'function') {
        (image as any).resetPipeline();
      }
    }
  }
```

#### After Code:
```typescript
  /* OLDCODE
  private applyTileTextureFilter(image: Phaser.GameObjects.Image, isBottomRack: boolean = false): void {
    image.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    if (isBottomRack) {
      if ((image as any).enableFilters && !image.getData("hasShadow")) {
        image.setData("hasShadow", true);
        (image as any).enableFilters();
        if ((image as any).filters && (image as any).filters.external) {
          // x, y, decay, power, color, samples, intensity
          // samples=2 because i=0 is at (0,0) [hidden]. i=1 is the offset shadow.
          // x is negative to shift right, y is negative to shift down.
          (image as any).filters.external.addShadow(-0.3, -0.4, 0.05, 1, 0x000000, 2, 0.65);
        }
      }
    }
  }

  private removeTileTextureFilter(image: Phaser.GameObjects.Image): void {
    if (image.getData("hasShadow")) {
      image.setData("hasShadow", false);

      // Try multiple ways to remove the shadow depending on the plugin/implementation
      if (typeof (image as any).disableFilters === 'function') {
        (image as any).disableFilters();
      }
      if ((image as any).filters && (image as any).filters.external) {
        if (typeof (image as any).filters.external.clear === 'function') {
          (image as any).filters.external.clear();
        }
        if (typeof (image as any).filters.external.removeShadow === 'function') {
          (image as any).filters.external.removeShadow();
        }
      }
      if (typeof (image as any).resetPostPipeline === 'function') {
        (image as any).resetPostPipeline(true);
      }
      if (typeof (image as any).resetPipeline === 'function') {
        (image as any).resetPipeline();
      }
    }
  }
  OLDCODE */
  /* NEWCODE */
  private applyTileTextureFilter(image: Phaser.GameObjects.Image, isBottomRackOrExposure: boolean = false): void {
    image.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    if (isBottomRackOrExposure) {
      // Re-enable filters rendering in Phaser 4
      (image as any).renderFilters = true;

      if ((image as any).enableFilters) {
        (image as any).enableFilters();
        if (!image.getData("hasShadow")) {
          image.setData("hasShadow", true);
          if ((image as any).filters && (image as any).filters.external) {
            // Add tile shadow: -0.3 right offset, -0.4 down offset, 0.65 intensity
            (image as any).filters.external.addShadow(-0.3, -0.4, 0.05, 1, 0x000000, 2, 0.65);
          }
        }
      }
    }
  }

  private removeTileTextureFilter(image: Phaser.GameObjects.Image): void {
    image.setData("hasShadow", false);

    // Turn off filters in Phaser 4 so no shadow is rendered
    (image as any).renderFilters = false;

    // Clear active external filters list
    if ((image as any).filters && (image as any).filters.external) {
      if (typeof (image as any).filters.external.clear === 'function') {
        (image as any).filters.external.clear();
      }
    }
  }
  /* NEWCODE */
```

---

### Change 3: Keep Shadow on Bottom Exposure Tiles
**File**: `src/app/module/business/game/phaser/scenes/scene.ts` (around lines 4645 and 5132)

#### At Line 4645 (Claimed tile moving to exposure):
**Before:**
```typescript
    this.calledBottomExposureTiles.push(image);
    this.removeTileTextureFilter(image);
```
**After:**
```typescript
    /* OLDCODE
    this.calledBottomExposureTiles.push(image);
    this.removeTileTextureFilter(image);
    OLDCODE */
    /* NEWCODE */
    this.calledBottomExposureTiles.push(image);
    // Keep shadow on exposure tiles
    this.applyTileTextureFilter(image, true);
    /* NEWCODE */
```

#### At Line 5132 (Rack tile moving to exposure):
**Before:**
```typescript
    runtime.image.clearTint().disableInteractive();
    this.removeTileTextureFilter(runtime.image);
```
**After:**
```typescript
    /* OLDCODE
    runtime.image.clearTint().disableInteractive();
    this.removeTileTextureFilter(runtime.image);
    OLDCODE */
    /* NEWCODE */
    runtime.image.clearTint().disableInteractive();
    // Keep shadow on exposure tiles
    this.applyTileTextureFilter(runtime.image, true);
    /* NEWCODE */
```

