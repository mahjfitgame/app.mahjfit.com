# Phase Play: Before & After Plan - Reduce Discard Tile Size by 30% on Desktop

## 1. Overview of Task

The goal is to decrease the tile size in the discard area by **30% on Desktop devices only**.

* **Target Device**: Desktop (screens with width 1024px and above).
* **Other Devices**: Tablets and mobile phones remain unchanged.
* **Goal**: Discarded tiles on desktop will take 30% less space, allowing more discarded tiles to fit cleanly inside the discard area.

---

## 2. Size Comparison

| Device | Current Discard Tile Size | New Discard Tile Size (After 30% Reduction) | Note |
| :--- | :--- | :--- | :--- |
| **Desktop** | **`57 × 81 px`** (scale `0.81`) | **`40 × 57 px`** (scale `0.81 × 0.70 = 0.567`) | **Reduced by 30%** |
| **Tablet** | `39 × 56 px` (scale `0.81`) | `39 × 56 px` (scale `0.81`) | Unchanged |
| **Mobile Landscape** | `29 × 41 px` (scale `0.81`) | `29 × 41 px` (scale `0.81`) | Unchanged |
| **Mobile Portrait** | `21 × 30 px` (scale `0.81`) | `21 × 30 px` (scale `0.81`) | Unchanged |

---

## 3. Files to Modify

* **File**: `src/app/module/business/game/phaser/scenes/scene.ts`
* **Method**: `discardGrid()` (around line 9010)

---

## 4. Before and After Code Snippets

### File: `src/app/module/business/game/phaser/scenes/scene.ts`
**Location**: inside `discardGrid()` (lines ~9005–9025)

#### BEFORE:
```typescript
    // 1. Remove gaps between tiles so they sit flush edge-to-edge
    const gapX = 0;
    const gapY = 0;

    /* OLDCODE
    // 2. Reduce tile size by 10% from current size (0.90)
    const scale = 0.90;
    const tileWidth = Math.round(rackTile.width * scale);
    const tileHeight = Math.round(rackTile.height * scale);
    OLDCODE */
    /* NEWCODE */
    // 2. Reduce tile size by a further 10% from current size (0.90 * 0.90 = 0.81)
    const scale = 0.81;
    const tileWidth = Math.round(rackTile.width * scale);
    const tileHeight = Math.round(rackTile.height * scale);
    /* NEWCODE */
```

---

#### AFTER:
```typescript
    // 1. Remove gaps between tiles so they sit flush edge-to-edge
    const gapX = 0;
    const gapY = 0;

    /* OLDCODE
    // 2. Reduce tile size by a further 10% from current size (0.90 * 0.90 = 0.81)
    const scale = 0.81;
    const tileWidth = Math.round(rackTile.width * scale);
    const tileHeight = Math.round(rackTile.height * scale);
    OLDCODE */
    /* NEWCODE */
    // Check if user is playing on a desktop device
    const isDesktop = this.layout.metrics.isDesktop || (!isPhonePortrait && !isPhoneLandscape && !isTablet);

    // On desktop: reduce tile size by 30% from current size (0.81 * 0.70 = 0.567)
    // On tablet and mobile: keep current size (0.81)
    const scale = isDesktop ? (0.81 * 0.70) : 0.81;

    const tileWidth = Math.round(rackTile.width * scale);
    const tileHeight = Math.round(rackTile.height * scale);
    /* NEWCODE */
```

---

## 5. How It Works (Simple Explanation)

1. `this.layout.metrics.isDesktop` checks if the device is a desktop screen.
2. If it is desktop, `scale` is calculated as `0.81 * 0.70 = 0.567` (which is exactly 30% smaller than current).
3. If it is tablet or mobile, `scale` stays `0.81` as before.
4. All discard grid calculations (`columns`, `rows`, slot positions, and drop animations) automatically use `grid.tileWidth` and `grid.tileHeight`, so the discard area updates smoothly with zero extra changes needed.

