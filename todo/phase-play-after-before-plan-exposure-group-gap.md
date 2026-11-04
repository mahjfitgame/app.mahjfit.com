# Before & After Plan: Remove Intra-Meld Gap & Add Inter-Meld Group Gap in Exposure Trays

## 1. Problem Description & Requirements

### Current Behavior:
- Currently, every single tile in the exposure tray is separated by a uniform small gap (`gap = Math.max(2, Math.round(tile.width * 0.05))`).
- Tiles within the same meld (e.g. within a Pung `444` or Kong `1111`) are spaced apart identically to tiles between different melds. There is no visual separation between distinct exposure combinations.

### Desired Behavior:
- **Intra-Meld Gap = 0**: Tiles belonging to the same exposure group (e.g. Sextet of Flowers `FFFFFF`, Kong of 1-Bam `1111`, Pung `444`) must touch each other flush with **zero gap**.
- **Inter-Meld Gap**: Between different exposure groups (e.g. between the Sextet of Flowers and the Kong of 1-Bam), there must be a clear space (gap) so players can immediately distinguish each meld group at a glance.
- Fully responsive across desktop, tablet, and mobile layouts.

---

## 2. Mathematical Logic & Implementation

For tile $i$ in the exposure tray with width $W = \text{tile.width}$:
- Each tile records its `meld-index` $M \in \{0, 1, 2, \dots\}$.
- Group gap $G = \text{groupGap} = \text{Math.max}(8, \text{Math.round}(W \times 0.20))$.
- Tile horizontal position:
  $$\text{Position}_i = \text{startX} + i \times W + M \times G$$

### Verification of Spacing:
1. **Tiles in the same meld** (e.g. tile $i$ and tile $i+1$ with same $M$):
   $$\text{Position}_{i+1} - \text{Position}_i = (i+1) W + M G - (i W + M G) = W$$
   Difference is exactly the tile width $W$ $\implies$ **Gap is 0**.
2. **Transition between melds** (tile $i$ in meld $M$ and tile $i+1$ in meld $M+1$):
   $$\text{Position}_{i+1} - \text{Position}_i = (i+1) W + (M+1) G - (i W + M G) = W + G$$
   Difference is tile width $W$ plus group gap $G$ $\implies$ **Separated by group gap $G$**.

---

## 3. Files to Modify

1. `src/app/module/business/game/phaser/scenes/scene.ts`
   - Assign `meld-index` to each exposure tile during `renderExposuresSet()`.
   - Update `calledBottomExposureTilePosition()`: use `gap = 0` between tiles in the same meld, plus `meldIndex * groupGap` between different melds.
   - Update `calledOpponentExposureTilePosition()`: apply the same group gap logic for top, left, and right exposure trays.
   - Update `maxBottomExposureScroll()` to compute scrollable width including group gaps.

---

## 4. Detailed Before & After Code Snippets

---

### Snippet 1: Set `meld-index` in `renderExposuresSet()`
**File**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 4021 & 4185)

#### BEFORE:
```typescript
    for (const meld of exposures.bottom) {
      if (!meld) continue;
      const tilesToProcess: any[] = [];
      if (meld.tiles) {
        if (Array.isArray(meld.tiles)) tilesToProcess.push(...meld.tiles);
        else if (typeof meld.tiles === 'object') tilesToProcess.push(...Object.values(meld.tiles));
      }
      if (tilesToProcess.length === 0 && meld.tile) tilesToProcess.push(meld.tile);
      if (tilesToProcess.length === 0) continue;
      ...
        runtime.image.setData("exposure-asset", meldAsset);
        runtime.image.disableInteractive();
```

#### AFTER:
```typescript
    /* OLDCODE
    for (const meld of exposures.bottom) {
      if (!meld) continue;
      const tilesToProcess: any[] = [];
      if (meld.tiles) {
        if (Array.isArray(meld.tiles)) tilesToProcess.push(...meld.tiles);
        else if (typeof meld.tiles === 'object') tilesToProcess.push(...Object.values(meld.tiles));
      }
      if (tilesToProcess.length === 0 && meld.tile) tilesToProcess.push(meld.tile);
      if (tilesToProcess.length === 0) continue;
      ...
        runtime.image.setData("exposure-asset", meldAsset);
        runtime.image.disableInteractive();
    OLDCODE */
    /* NEWCODE */
    let bottomMeldIndex = 0;
    for (const meld of exposures.bottom) {
      if (!meld) continue;
      const tilesToProcess: any[] = [];
      if (meld.tiles) {
        if (Array.isArray(meld.tiles)) tilesToProcess.push(...meld.tiles);
        else if (typeof meld.tiles === 'object') tilesToProcess.push(...Object.values(meld.tiles));
      }
      if (tilesToProcess.length === 0 && meld.tile) tilesToProcess.push(meld.tile);
      if (tilesToProcess.length === 0) continue;
      ...
        runtime.image.setData("exposure-asset", meldAsset);
        runtime.image.setData("meld-index", bottomMeldIndex);
        runtime.image.disableInteractive();
      }
      bottomMeldIndex++;
    }
    /* NEWCODE */
```

And similarly for opponent seats:
```typescript
    /* NEWCODE */
    for (const seat of ["top", "left", "right"] as const) {
      const melds = exposures[seat];
      ...
      let opponentMeldIndex = 0;
      for (const meld of melds) {
        ...
        for (const tile of tilesToProcess) {
          ...
          image.setData("exposure-asset", meldAsset || this.gameService.assetBaseName(fullTile as any));
          image.setData("meld-index", opponentMeldIndex);
          this.calledOpponentExposureTiles[seat].push(image);
        }
        opponentMeldIndex++;
      }
      this.layoutCalledOpponentExposureTiles(seat);
    }
    /* NEWCODE */
```

---

### Snippet 2: Position Tiles with Flush Intra-Meld & Spaced Inter-Meld
**File**: `src/app/module/business/game/phaser/scenes/scene.ts` (lines 4957–4977)

#### BEFORE:
```typescript
  private calledBottomExposureTilePosition(index: number): Point {
    const exposure = this.layout.bottomExposure;
    const tile = this.calledBottomExposureTileSize();
    const mode = this.exposurePanelMode();
    const topLipHeight = exposure.height * this.gameLayout.bottomExposureLipRatio(mode);
    const nameStripHeight = exposure.height * this.gameLayout.exposureNameStripRatio(mode);
    const contentHeight = exposure.height * (
      1 - this.gameLayout.bottomExposureLipRatio(mode) - this.gameLayout.exposureNameStripRatio(mode)
    );
    const gap = Math.max(2, Math.round(tile.width * 0.05));

    // NEWCODE
    const startX = exposure.x + Math.max(5, Math.round(tile.width * 0.18)) + tile.width / 2 - this.bottomExposureScrollX;
    // OLDCODE
    // const startX = exposure.x + Math.max(5, Math.round(tile.width * 0.18)) + tile.width / 2;

    return {
      x: startX + index * (tile.width + gap),
      y: exposure.y + nameStripHeight + 1 + contentHeight / 2,
    };
  }
```

#### AFTER:
```typescript
  /* OLDCODE
  private calledBottomExposureTilePosition(index: number): Point {
    const exposure = this.layout.bottomExposure;
    const tile = this.calledBottomExposureTileSize();
    const mode = this.exposurePanelMode();
    const topLipHeight = exposure.height * this.gameLayout.bottomExposureLipRatio(mode);
    const nameStripHeight = exposure.height * this.gameLayout.exposureNameStripRatio(mode);
    const contentHeight = exposure.height * (
      1 - this.gameLayout.bottomExposureLipRatio(mode) - this.gameLayout.exposureNameStripRatio(mode)
    );
    const gap = Math.max(2, Math.round(tile.width * 0.05));

    // NEWCODE
    const startX = exposure.x + Math.max(5, Math.round(tile.width * 0.18)) + tile.width / 2 - this.bottomExposureScrollX;
    // OLDCODE
    // const startX = exposure.x + Math.max(5, Math.round(tile.width * 0.18)) + tile.width / 2;

    return {
      x: startX + index * (tile.width + gap),
      y: exposure.y + nameStripHeight + 1 + contentHeight / 2,
    };
  }
  OLDCODE */
  /* NEWCODE */
  private calledBottomExposureTilePosition(index: number): Point {
    const exposure = this.layout.bottomExposure;
    const tile = this.calledBottomExposureTileSize();
    const mode = this.exposurePanelMode();
    const nameStripHeight = exposure.height * this.gameLayout.exposureNameStripRatio(mode);
    const contentHeight = exposure.height * (
      1 - this.gameLayout.bottomExposureLipRatio(mode) - this.gameLayout.exposureNameStripRatio(mode)
    );

    // Group gap between separate melds (e.g. between Sextet and Kong)
    const groupGap = Math.max(8, Math.round(tile.width * 0.22));
    const targetImage = this.calledBottomExposureTiles[index];
    const meldIndex = targetImage?.getData?.("meld-index") ?? 0;

    const startX = exposure.x + Math.max(5, Math.round(tile.width * 0.18)) + tile.width / 2 - this.bottomExposureScrollX;

    return {
      // 0 gap within the same meld, plus groupGap between separate melds
      x: Math.round(startX + index * tile.width + meldIndex * groupGap),
      y: Math.round(exposure.y + nameStripHeight + 1 + contentHeight / 2),
    };
  }
  /* NEWCODE */
```

---

### Snippet 3: Opponent Exposure Tile Position
**File**: `src/app/module/business/game/phaser/scenes/scene.ts` (lines 5065–5115)

#### BEFORE:
```typescript
  private calledOpponentExposureTilePosition(seat: "top" | "left" | "right", index: number): Point {
    let exposure: Rect;
    switch (seat) {
      case "top": exposure = this.layout.topExposure; break;
      case "left": exposure = this.layout.leftExposure; break;
      case "right": exposure = this.layout.rightExposure; break;
    }
    const tile = this.calledOpponentExposureTileSize(seat);
    const gap = Math.max(2, Math.round(tile.width * 0.05));
    ...
    if (seat === "top") {
      ...
      return {
        x: Math.round(startX + index * (tile.width + gap)),
        y: Math.round(centerY),
      };
    } else {
      ...
      return {
        x: Math.round(centerX),
        y: Math.round(startY + index * (tile.width + gap)),
      };
    }
  }
```

#### AFTER:
```typescript
  /* OLDCODE
  private calledOpponentExposureTilePosition(seat: "top" | "left" | "right", index: number): Point {
    let exposure: Rect;
    switch (seat) {
      case "top": exposure = this.layout.topExposure; break;
      case "left": exposure = this.layout.leftExposure; break;
      case "right": exposure = this.layout.rightExposure; break;
    }
    const tile = this.calledOpponentExposureTileSize(seat);
    const gap = Math.max(2, Math.round(tile.width * 0.05));
    ...
  OLDCODE */
  /* NEWCODE */
  private calledOpponentExposureTilePosition(seat: "top" | "left" | "right", index: number): Point {
    let exposure: Rect;
    switch (seat) {
      case "top": exposure = this.layout.topExposure; break;
      case "left": exposure = this.layout.leftExposure; break;
      case "right": exposure = this.layout.rightExposure; break;
    }
    const tile = this.calledOpponentExposureTileSize(seat);
    // Group gap between separate melds
    const groupGap = Math.max(6, Math.round(tile.width * 0.20));
    const targetImage = this.calledOpponentExposureTiles[seat]?.[index];
    const meldIndex = targetImage?.getData?.("meld-index") ?? 0;

    const mode = this.exposurePanelMode();
    const lipRatio = this.gameLayout.exposureLipRatio(mode);
    const stripRatio = this.gameLayout.exposureNameStripRatio(mode);
    const contentRatio = 1 - lipRatio - stripRatio;

    if (seat === "top") {
      const startX = exposure.x + Math.max(5, Math.round(tile.width * 0.18)) + tile.width / 2 - this.topExposureScrollX;
      const lipHeight = exposure.height * lipRatio;
      const contentHeight = exposure.height * contentRatio;
      const centerY = exposure.y + lipHeight + contentHeight / 2;
      return {
        // 0 gap within same meld, plus groupGap between separate melds
        x: Math.round(startX + index * tile.width + meldIndex * groupGap),
        y: Math.round(centerY),
      };
    } else {
      const scrollY = seat === "left" ? this.leftExposureScrollY : this.rightExposureScrollY;
      const startY = exposure.y + Math.max(5, Math.round(tile.width * 0.18)) + tile.width / 2 - scrollY;
      const lipWidth = exposure.width * lipRatio;
      const stripWidth = exposure.width * stripRatio;
      const contentWidth = exposure.width * contentRatio;

      let centerX = exposure.x;
      if (seat === "left") {
        centerX += lipWidth + contentWidth / 2;
      } else {
        centerX += stripWidth + contentWidth / 2;
      }

      return {
        // 0 gap within same meld, plus groupGap between separate melds
        x: Math.round(centerX),
        y: Math.round(startY + index * tile.width + meldIndex * groupGap),
      };
    }
  }
  /* NEWCODE */
```

