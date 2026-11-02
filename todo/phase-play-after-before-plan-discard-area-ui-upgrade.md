# Before & After Plan: Discard Area UI Upgrade (Sizing, 10% Tile Reduction, Zero Gap)

## 1. Overview of Requirements

1. **Increase Discard Area Size**:
   - Expand the horizontal width and vertical height of the discard area across all responsive profiles (`desktop`, `tablet-portrait`, `tablet-landscape`, `mobile-landscape`, and `mobile-portrait`) by reducing outer insets to utilize maximum available table space without encroaching on exposure trays.
2. **Reduce Tile Size by 10%**:
   - Reduce the discard tile scale by 10% from the current rack size (`scale = 0.90` instead of `scale = 1.0`).
3. **Remove Gaps Between Tiles**:
   - Set `gapX = 0` and `gapY = 0` so discarded tiles sit seamlessly flush edge-to-edge, resembling a traditional Mahjong discard pond.
4. **Full Responsiveness**:
   - Both the grid calculations and the container bounds dynamically respond to all viewport dimensions, orientations, and aspect ratios.

---

## 2. Files to Modify

1. `src/app/module/business/game/phaser/scenes/scene.ts`
   - Set `scale = 0.90` (10% reduction).
   - Set `gapX = 0` and `gapY = 0` (zero gap between tiles).
2. `src/app/module/business/game/phaser/layout/game.ts`
   - Expand `discardArea` width and height across all 5 layout profiles:
     - `computeDesktopLayout()`
     - `computeTabletPortraitLayout()`
     - `computeTabletLandscapeLayout()`
     - `computeMobileLandscapeLayout()`
     - `computeMobilePortraitLayout()`

---

## 3. Detailed Before & After Code Snippets

---

### File 1: `src/app/module/business/game/phaser/scenes/scene.ts`
**Location**: `discardGrid()` (lines 7776–7784)

#### BEFORE:
```typescript
    const gapX = isPhonePortrait ? 2 : isPhoneLandscape ? 3 : isTablet ? 5 : 6;
    const gapY = isPhonePortrait ? 2 : isPhoneLandscape ? 3 : isTablet ? 5 : 6;

    const scale = 1;
    // NEWCODE
    const tileWidth = Math.round(rackTile.width * scale);
    const tileHeight = Math.round(rackTile.height * scale);
```

#### AFTER:
```typescript
    /* OLDCODE
    const gapX = isPhonePortrait ? 2 : isPhoneLandscape ? 3 : isTablet ? 5 : 6;
    const gapY = isPhonePortrait ? 2 : isPhoneLandscape ? 3 : isTablet ? 5 : 6;

    const scale = 1;
    // NEWCODE
    const tileWidth = Math.round(rackTile.width * scale);
    const tileHeight = Math.round(rackTile.height * scale);
    OLDCODE */
    /* NEWCODE */
    // 1. Remove gaps between tiles so they sit flush edge-to-edge
    const gapX = 0;
    const gapY = 0;

    // 2. Reduce tile size by 10% from current size (0.90)
    const scale = 0.90;
    const tileWidth = Math.round(rackTile.width * scale);
    const tileHeight = Math.round(rackTile.height * scale);
    /* NEWCODE */
```

---

### File 2: `src/app/module/business/game/phaser/layout/game.ts`

#### Change 2.1: Desktop Layout (`computeDesktopLayout`)
**Location**: lines 276–289

#### BEFORE:
```typescript
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + tableOuter.width * 0.055,
      y: topExposure.y + topExposure.height + discardPanelGap,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        tableOuter.width * 0.11,
      height:
        bottomExposure.y -
        (topExposure.y + topExposure.height) -
        discardPanelGap * 2,
    };
```

#### AFTER:
```typescript
    /* OLDCODE
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + tableOuter.width * 0.055,
      y: topExposure.y + topExposure.height + discardPanelGap,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        tableOuter.width * 0.11,
      height:
        bottomExposure.y -
        (topExposure.y + topExposure.height) -
        discardPanelGap * 2,
    };
    OLDCODE */
    /* NEWCODE */
    const discardPanelGap = this.discardPanelGap(tableOuter);
    // Expand discard area by reducing horizontal margin from 0.055 to 0.015
    const discardAreaInsetX = tableOuter.width * 0.015;
    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + discardAreaInsetX,
      y: topExposure.y + topExposure.height + discardPanelGap,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        discardAreaInsetX * 2,
      height:
        bottomExposure.y -
        (topExposure.y + topExposure.height) -
        discardPanelGap * 2,
    };
    /* NEWCODE */
```

---

#### Change 2.2: Tablet Portrait Layout (`computeTabletPortraitLayout`)
**Location**: lines 517–531

#### BEFORE:
```typescript
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap;

    const discardAreaBottom = bottomExposure.y - discardPanelGap;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + tableOuter.width * 0.055,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        tableOuter.width * 0.110,
      height: Math.max(130, discardAreaBottom - discardAreaTop),
    };
```

#### AFTER:
```typescript
    /* OLDCODE
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap;

    const discardAreaBottom = bottomExposure.y - discardPanelGap;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + tableOuter.width * 0.055,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        tableOuter.width * 0.110,
      height: Math.max(130, discardAreaBottom - discardAreaTop),
    };
    OLDCODE */
    /* NEWCODE */
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap;
    const discardAreaBottom = bottomExposure.y - discardPanelGap;
    const discardAreaInsetX = tableOuter.width * 0.015;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + discardAreaInsetX,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        discardAreaInsetX * 2,
      height: Math.max(130, discardAreaBottom - discardAreaTop),
    };
    /* NEWCODE */
```

---

#### Change 2.3: Tablet Landscape Layout (`computeTabletLandscapeLayout`)
**Location**: lines 814–828

#### BEFORE:
```typescript
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap + 35;

    const discardAreaBottom = bottomExposure.y - discardPanelGap;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + tableOuter.width * 0.055,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        tableOuter.width * 0.110,
      height: Math.max(120, discardAreaBottom - discardAreaTop),
    };
```

#### AFTER:
```typescript
    /* OLDCODE
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap + 35;

    const discardAreaBottom = bottomExposure.y - discardPanelGap;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + tableOuter.width * 0.055,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        tableOuter.width * 0.110,
      height: Math.max(120, discardAreaBottom - discardAreaTop),
    };
    OLDCODE */
    /* NEWCODE */
    const discardPanelGap = this.discardPanelGap(tableOuter);
    // Remove arbitrary +35 to allow full vertical discard height
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap;
    const discardAreaBottom = bottomExposure.y - discardPanelGap;
    const discardAreaInsetX = tableOuter.width * 0.015;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + discardAreaInsetX,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        discardAreaInsetX * 2,
      height: Math.max(135, discardAreaBottom - discardAreaTop),
    };
    /* NEWCODE */
```

---

#### Change 2.4: Mobile Landscape Layout (`computeMobileLandscapeLayout`)
**Location**: lines 1125–1139

#### BEFORE:
```typescript
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap;

    const discardAreaBottom = bottomExposure.y - discardPanelGap;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + tableOuter.width * 0.040,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        tableOuter.width * 0.080,
      height: Math.max(48, discardAreaBottom - discardAreaTop),
    };
```

#### AFTER:
```typescript
    /* OLDCODE
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap;

    const discardAreaBottom = bottomExposure.y - discardPanelGap;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + tableOuter.width * 0.040,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        tableOuter.width * 0.080,
      height: Math.max(48, discardAreaBottom - discardAreaTop),
    };
    OLDCODE */
    /* NEWCODE */
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap;
    const discardAreaBottom = bottomExposure.y - discardPanelGap;
    const discardAreaInsetX = tableOuter.width * 0.012;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + discardAreaInsetX,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        discardAreaInsetX * 2,
      height: Math.max(52, discardAreaBottom - discardAreaTop),
    };
    /* NEWCODE */
```

---

#### Change 2.5: Mobile Portrait Layout (`computeMobilePortraitLayout`)
**Location**: lines 1422–1436

#### BEFORE:
```typescript
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap;

    const discardAreaBottom = bottomExposure.y - discardPanelGap;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + tableOuter.width * 0.035,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        tableOuter.width * 0.070,
      height: Math.max(70, discardAreaBottom - discardAreaTop),
    };
```

#### AFTER:
```typescript
    /* OLDCODE
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap;

    const discardAreaBottom = bottomExposure.y - discardPanelGap;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + tableOuter.width * 0.035,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        tableOuter.width * 0.070,
      height: Math.max(70, discardAreaBottom - discardAreaTop),
    };
    OLDCODE */
    /* NEWCODE */
    const discardPanelGap = this.discardPanelGap(tableOuter);
    const discardAreaTop = topExposure.y + topExposure.height + discardPanelGap;
    const discardAreaBottom = bottomExposure.y - discardPanelGap;
    const discardAreaInsetX = tableOuter.width * 0.012;

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + discardAreaInsetX,
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        discardAreaInsetX * 2,
      height: Math.max(75, discardAreaBottom - discardAreaTop),
    };
    /* NEWCODE */
```

---

## 4. Verification Plan

1. **Compilation Check**: `npx tsc -p tsconfig.app.json --noEmit` — 0 errors.
2. **Visual & Responsive Verification**:
   - Discard area bounds expand comfortably across the felt without overlapping side exposure trays.
   - Discard tiles render at 90% size of the local player rack tiles.
   - Tiles align seamlessly with 0px horizontal and vertical gaps.
   - Automatic re-centering of tile rows within the expanded discard area.
   - Invariant: Zero code deletions, strictly using `OLDCODE` / `NEWCODE`.

