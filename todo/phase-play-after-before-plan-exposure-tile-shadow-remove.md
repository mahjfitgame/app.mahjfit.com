# Phase Play - Remove Shadow from Exposure Tiles (Before & After Plan)

## Problem Summary
The user requested:
- Remove tile shadow when a tile moves to exposure (just like the discard area).
- Around-tile shadow should ONLY show when a tile is in the rack (`zone === "rack"`).

---

## File Changes Overview
- **File**: `src/app/module/business/game/phaser/scenes/scene.ts`
  1. **Exposure Handlers**: Call `this.removeTileTextureFilter(image)` when a tile enters the exposure area (lines 3973, 4657, 5151, 6866).
  2. **Exposure Layout Safeguard**: Add `this.removeTileTextureFilter(image)` inside `layoutCalledBottomExposureTiles()` so exposure tiles never retain shadow.
  3. **Texture Filter Method**: Update `applyTileTextureFilter` to only apply shadow when `isBottomRack === true`.

---

## Before & After Code Snippets

---

### Snippet 1: Exposure Handlers (`renderExposuresSet`)
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 3971)

#### Before:
```typescript
        /* OLDCODE
        this.removeTileTextureFilter(runtime.image);
        OLDCODE */
        /* NEWCODE */
        // Keep shadow on exposure tiles
        this.applyTileTextureFilter(runtime.image, true);
        /* NEWCODE */
```

#### After:
```typescript
        /* OLDCODE
        this.removeTileTextureFilter(runtime.image);
        OLDCODE */
        /* OLDCODE
        // Keep shadow on exposure tiles
        this.applyTileTextureFilter(runtime.image, true);
        OLDCODE */
        /* NEWCODE */
        // Remove shadow when tile moves to exposure (shadow only shown in rack)
        this.removeTileTextureFilter(runtime.image);
        /* NEWCODE */
```

---

### Snippet 2: Exposure Handlers (`animateCalledDiscardToBottomExposure`)
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 4654)

#### Before:
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

#### After:
```typescript
    /* OLDCODE
    this.calledBottomExposureTiles.push(image);
    this.removeTileTextureFilter(image);
    OLDCODE */
    /* OLDCODE
    this.calledBottomExposureTiles.push(image);
    // Keep shadow on exposure tiles
    this.applyTileTextureFilter(image, true);
    OLDCODE */
    /* NEWCODE */
    this.calledBottomExposureTiles.push(image);
    // Remove shadow when tile moves to exposure (shadow only shown in rack)
    this.removeTileTextureFilter(image);
    /* NEWCODE */
```

---

### Snippet 3: Exposure Handlers (`moveRackTileToBottomExposure`)
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 5148)

#### Before:
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

#### After:
```typescript
    /* OLDCODE
    runtime.image.clearTint().disableInteractive();
    this.removeTileTextureFilter(runtime.image);
    OLDCODE */
    /* OLDCODE
    runtime.image.clearTint().disableInteractive();
    // Keep shadow on exposure tiles
    this.applyTileTextureFilter(runtime.image, true);
    OLDCODE */
    /* NEWCODE */
    runtime.image.clearTint().disableInteractive();
    // Remove shadow when tile moves to exposure (shadow only shown in rack)
    this.removeTileTextureFilter(runtime.image);
    /* NEWCODE */
```

---

### Snippet 4: Joker Swap (`handleJokerExchange`)
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 6864)

#### Before:
```typescript
        /* OLDCODE
        this.removeTileTextureFilter(naturalTile.image);
        OLDCODE */
        /* NEWCODE */
        // Keep shadow on exposure tiles
        this.applyTileTextureFilter(naturalTile.image, true);
        /* NEWCODE */
```

#### After:
```typescript
        /* OLDCODE
        this.removeTileTextureFilter(naturalTile.image);
        OLDCODE */
        /* OLDCODE
        // Keep shadow on exposure tiles
        this.applyTileTextureFilter(naturalTile.image, true);
        OLDCODE */
        /* NEWCODE */
        // Remove shadow when tile moves to exposure (shadow only shown in rack)
        this.removeTileTextureFilter(naturalTile.image);
        /* NEWCODE */
```

---

### Snippet 5: Exposure Layout Safeguard (`layoutCalledBottomExposureTiles`)
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 4833)

#### Before:
```typescript
      image.setDisplaySize(tile.width, tile.height).setPosition(target.x, target.y);
      image.setVisible(target.x >= this.layout.bottomExposure.x && target.x <= this.layout.bottomExposure.x + this.layout.bottomExposure.width);
```

#### After:
```typescript
      image.setDisplaySize(tile.width, tile.height).setPosition(target.x, target.y);
      /* NEWCODE */
      // Ensure exposure tiles do not retain shadow
      this.removeTileTextureFilter(image);
      /* NEWCODE */
      image.setVisible(target.x >= this.layout.bottomExposure.x && target.x <= this.layout.bottomExposure.x + this.layout.bottomExposure.width);
```

---

### Snippet 6: Texture Filter Method (`applyTileTextureFilter`)
**Location**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 7896)

#### Before:
```typescript
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
```

#### After:
```typescript
  /* OLDCODE
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
  OLDCODE */
  /* NEWCODE */
  // Apply drop-shadow filter only when tile is in the player rack
  private applyTileTextureFilter(image: Phaser.GameObjects.Image, isBottomRack: boolean = false): void {
    image.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    if (isBottomRack) {
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
  /* NEWCODE */
```

