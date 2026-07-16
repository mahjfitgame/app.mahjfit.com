// src/app/game/phaser/game-layout.engine.ts
import { GameTableConfig } from "./game-table.config";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface TileLayout {
  readonly width: number;
  readonly height: number;
  readonly gap: number;
  readonly slots: readonly Point[];
}

export interface ResponsiveMetrics {
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isPortrait: boolean;
  readonly uiScale: number;

  readonly playerLabelFont: number;
  readonly usernameFont: number;
  readonly hudFont: number;
  readonly hudCounterFont: number;
  readonly hudIconFont: number;
  readonly instructionFont: number;
  readonly passFont: number;

  readonly exposureThickness: number;
  readonly innerGap: number;
  readonly tableRackGap: number;
  readonly rackHeight: number;
  readonly hudHeight: number;
  readonly instructionHeight: number;
  readonly passButtonWidth: number;
  readonly passButtonHeight: number;

  readonly topExposureHeight: number;
  readonly bottomExposureHeight: number;
  readonly passGap: number;
}

export interface TableLayout {
  readonly canvas: Rect;
  readonly tableOuter: Rect;
  readonly discardArea: Rect;
  readonly topExposure: Rect;
  readonly rightExposure: Rect;
  readonly bottomExposure: Rect;
  readonly leftExposure: Rect;
  readonly hud: Rect;
  readonly instructionBar: Rect;
  readonly passButton: Rect;
  readonly bottomRack: Rect;
  readonly topLabel: Point;
  readonly leftLabel: Point;
  readonly rightLabel: Point;
  readonly username: Point;
  readonly bottomTileLayout: TileLayout;
  readonly isMobile: boolean;
  readonly metrics: ResponsiveMetrics;
}

export interface SafeAreaInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

const ZERO_SAFE_AREA: SafeAreaInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export class GameLayoutEngine {

  compute(
    width: number,
    height: number,
    tileCount: number,
    config: GameTableConfig,
    safeArea: SafeAreaInsets = ZERO_SAFE_AREA,
  ): TableLayout {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error(`Invalid canvas size ${width}x${height}`);
    }

    const safeTop = Math.max(0, safeArea.top);
    const safeRight = Math.max(0, safeArea.right);
    const safeBottom = Math.max(0, safeArea.bottom);
    const safeLeft = Math.max(0, safeArea.left);

    const safeWidth = Math.max(1, width - safeLeft - safeRight);
    const safeHeight = Math.max(1, height - safeTop - safeBottom);
    const safeCenterX = safeLeft + safeWidth / 2;

    const count = Math.max(tileCount, 14);
    const metrics = this.computeResponsiveMetrics(safeWidth, safeHeight);
    const shortest = Math.min(safeWidth, safeHeight);

    /**
     * PSD baseline: 1920 x 1080 landscape.
     * This scales the PSD structure proportionally while still respecting
     * the actual CSS-pixel canvas size and safe area.
     */
    const sx = safeWidth / 1920;
    const sy = safeHeight / 1080;
    const s = Math.min(sx, sy);

    const headerHeight = this.clamp(76 * s, metrics.isMobile ? 44 : 58, metrics.isMobile ? 58 : 86);

    const outerMarginX = this.clamp(26 * s, metrics.isMobile ? 8 : 18, metrics.isMobile ? 14 : 32);
    const outerMarginBottom = this.clamp(18 * s, metrics.isMobile ? 6 : 12, metrics.isMobile ? 12 : 24);

    const tableOuter: Rect = {
      x: safeLeft + outerMarginX,
      y: safeTop + headerHeight,
      width: safeWidth - outerMarginX * 2,
      height: safeHeight - headerHeight - outerMarginBottom,
    };

    const sideExposureWidth = this.clamp(
      tableOuter.width * 0.047,
      metrics.isMobile ? 34 : 58,
      metrics.isMobile ? 52 : 88,
    );

    const sideExposureHeight = this.clamp(
      tableOuter.height * 0.67,
      metrics.isMobile ? 260 : 520,
      Math.max(280, tableOuter.height * 0.76),
    );

    const sideExposureY = tableOuter.y + tableOuter.height * 0.14;

    const leftExposure: Rect = {
      x: tableOuter.x + tableOuter.width * 0.035,
      y: sideExposureY,
      width: sideExposureWidth,
      height: sideExposureHeight,
    };

    const rightExposure: Rect = {
      x: tableOuter.x + tableOuter.width - tableOuter.width * 0.035 - sideExposureWidth,
      y: sideExposureY,
      width: sideExposureWidth,
      height: sideExposureHeight,
    };

    const topExposureWidth = this.clamp(
      tableOuter.width * 0.30,
      metrics.isMobile ? 230 : 420,
      tableOuter.width * 0.42,
    );

    const topExposureHeight = this.clamp(
      tableOuter.height * 0.066,
      metrics.isMobile ? 34 : 54,
      metrics.isMobile ? 48 : 78,
    );

    const topExposure: Rect = {
      x: safeCenterX - topExposureWidth / 2,
      y: tableOuter.y + tableOuter.height * 0.065,
      width: topExposureWidth,
      height: topExposureHeight,
    };

    const bottomExposureWidth = this.clamp(
      tableOuter.width * 0.32,
      metrics.isMobile ? 260 : 450,
      tableOuter.width * 0.46,
    );

    const bottomExposureHeight = this.clamp(
      tableOuter.height * 0.072,
      metrics.isMobile ? 36 : 56,
      metrics.isMobile ? 50 : 82,
    );

    const rackHeight = metrics.rackHeight;
    const tableRackGap = this.clamp(tableOuter.height * 0.014, 6, 18);

    const bottomRack: Rect = {
      x: tableOuter.x + tableOuter.width * 0.09,
      y: tableOuter.y + tableOuter.height - rackHeight - this.clamp(12 * s, 4, 18),
      width: tableOuter.width * 0.82,
      height: rackHeight,
    };

    const bottomExposure: Rect = {
      x: safeCenterX - bottomExposureWidth / 2,
      y: bottomRack.y - bottomExposureHeight - tableRackGap,
      width: bottomExposureWidth,
      height: bottomExposureHeight,
    };

    const hud: Rect = {
      x: safeLeft,
      y: safeTop,
      width: safeWidth,
      height: headerHeight,
    };

    /**
     * Center white action card from PSD.
     * instructionBar is now the card.
     */
    const instructionWidth = this.clamp(
      tableOuter.width * 0.25,
      metrics.isMobile ? 260 : 360,
      metrics.isMobile ? 340 : 500,
    );

    const instructionHeight = this.clamp(
      tableOuter.height * 0.19,
      metrics.isMobile ? 110 : 145,
      metrics.isMobile ? 145 : 210,
    );

    const instructionBar: Rect = {
      x: safeCenterX - instructionWidth / 2,
      y: tableOuter.y + tableOuter.height * 0.37,
      width: instructionWidth,
      height: instructionHeight,
    };

    const passButtonWidth = this.clamp(
      instructionWidth * 0.38,
      metrics.isMobile ? 84 : 116,
      metrics.isMobile ? 112 : 158,
    );

    const passButtonHeight = this.clamp(
      instructionHeight * 0.24,
      metrics.isMobile ? 32 : 38,
      metrics.isMobile ? 42 : 56,
    );

    const passButton: Rect = {
      x: instructionBar.x + instructionBar.width / 2 - passButtonWidth / 2,
      y: instructionBar.y + instructionBar.height - passButtonHeight - instructionHeight * 0.16,
      width: passButtonWidth,
      height: passButtonHeight,
    };

    const discardAreaTop = topExposure.y + topExposure.height + this.clamp(34 * s, 12, 42);
    const discardAreaBottom = bottomExposure.y - this.clamp(32 * s, 10, 42);

    const discardArea: Rect = {
      x: leftExposure.x + leftExposure.width + this.clamp(58 * s, 16, 78),
      y: discardAreaTop,
      width:
        rightExposure.x -
        (leftExposure.x + leftExposure.width) -
        this.clamp(116 * s, 34, 156),
      height: Math.max(80, discardAreaBottom - discardAreaTop),
    };

    const bottomTileLayout = this.computeTileLayout(bottomRack, count, width, config);

    return {
      canvas: { x: 0, y: 0, width, height },
      tableOuter,
      discardArea,
      topExposure,
      rightExposure,
      bottomExposure,
      leftExposure,
      hud,
      instructionBar,
      passButton,
      bottomRack,
      bottomTileLayout,
      topLabel: {
        x: topExposure.x + topExposure.width / 2,
        y: topExposure.y - this.clamp(18 * s, 8, 22),
      },
      leftLabel: {
        x: leftExposure.x + leftExposure.width / 2,
        y: leftExposure.y - this.clamp(18 * s, 8, 22),
      },
      rightLabel: {
        x: rightExposure.x + rightExposure.width / 2,
        y: rightExposure.y - this.clamp(18 * s, 8, 22),
      },
      username: {
        x: bottomExposure.x + bottomExposure.width / 2,
        y: bottomExposure.y + bottomExposure.height / 2,
      },
      isMobile: metrics.isMobile,
      metrics,
    };
  }
  computeOLDW(width: number, height: number, tileCount: number, config: GameTableConfig, 
  safeArea: SafeAreaInsets = ZERO_SAFE_AREA): TableLayout {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error(`Invalid canvas size ${width}x${height}`);
    }

    console.log("width", width);
    console.log("height", height);
    /* const count = Math.max(tileCount, 14);
    const metrics = this.computeResponsiveMetrics(width, height);
    const shortest = Math.min(width, height);

    const pageMargin = this.clamp(shortest * 0.018, 7, 26);
    const sideLabelGutter = this.clamp(shortest * (metrics.isMobile ? 0.04 : 0.02), 14, 30);
    const topLabelBand = this.clamp(shortest * 0.028, 10, 22);
    const usernameHeight = this.clamp(height * 0.022, 10, 24); */

    const safeTop = Math.max(0, safeArea.top);
    const safeRight = Math.max(0, safeArea.right);
    const safeBottom = Math.max(0, safeArea.bottom);
    const safeLeft = Math.max(0, safeArea.left);

    const safeWidth = Math.max(1, width - safeLeft - safeRight);
    const safeHeight = Math.max(1, height - safeTop - safeBottom);
    const safeCenterX = safeLeft + safeWidth / 2;

    const count = Math.max(tileCount, 14);
    const metrics = this.computeResponsiveMetrics(safeWidth, safeHeight);
    const shortest = Math.min(safeWidth, safeHeight);

    const pageMargin = this.clamp(shortest * 0.018, 7, 26);
    const sideLabelGutter = this.clamp(shortest * (metrics.isMobile ? 0.04 : 0.02), 14, 30);
    const topLabelBand = this.clamp(shortest * 0.028, 10, 22);
    const usernameHeight = this.clamp(safeHeight * 0.022, 10, 24);

    const tableRackGap = metrics.tableRackGap;

// x: width / 2, y: height - usernameHeight * 0.45
    /* const tableOuter: Rect = {
      x: pageMargin + sideLabelGutter,
      y: pageMargin + topLabelBand,
      width: width - (pageMargin + sideLabelGutter) * 2,
      height:
        height -
        pageMargin -
        topLabelBand -
        metrics.rackHeight -
        usernameHeight -
        tableRackGap,
    }; */

    const tableOuter: Rect = {
      x: safeLeft + pageMargin + sideLabelGutter,
      y: safeTop + pageMargin + topLabelBand,
      width: safeWidth - (pageMargin + sideLabelGutter) * 2,
      height:
        safeHeight -
        pageMargin -
        topLabelBand -
        metrics.rackHeight -
        usernameHeight -
        tableRackGap,
    };

    const sideExposureWidth = metrics.exposureThickness;
    const innerGap = metrics.innerGap;

    const leftExposure: Rect = {
      x: tableOuter.x,
      y: tableOuter.y,
      width: sideExposureWidth,
      height: tableOuter.height,
    };

    const rightExposure: Rect = {
      x: tableOuter.x + tableOuter.width - sideExposureWidth,
      y: tableOuter.y,
      width: sideExposureWidth,
      height: tableOuter.height,
    };

    const centerX = leftExposure.x + leftExposure.width + innerGap;
    const centerWidth = tableOuter.width - sideExposureWidth * 2 - innerGap * 2;

    const topExposureHeight = metrics.topExposureHeight;
    const bottomExposureHeight = metrics.bottomExposureHeight;
    const hudHeight = metrics.hudHeight;
    const instructionHeight = metrics.instructionHeight;
    const passHeight = metrics.passButtonHeight;
    const passGap = metrics.passGap;

    const topExposure: Rect = {
      x: centerX,
      y: tableOuter.y,
      width: centerWidth,
      height: topExposureHeight,
    };

    const bottomExposure: Rect = {
      x: centerX,
      y: tableOuter.y + tableOuter.height - bottomExposureHeight,
      width: centerWidth,
      height: bottomExposureHeight,
    };

    const hud: Rect = {
      x: centerX,
      y: topExposure.y + topExposure.height + innerGap,
      width: centerWidth,
      height: hudHeight,
    };

    const instructionBar: Rect = {
      x: centerX,
      y: bottomExposure.y - innerGap - instructionHeight,
      width: centerWidth,
      height: instructionHeight,
    };

    const passButton: Rect = {
      x: centerX + centerWidth / 2 - metrics.passButtonWidth / 2,
      y: instructionBar.y - passGap - passHeight,
      width: metrics.passButtonWidth,
      height: passHeight,
    };

    const discardArea: Rect = {
      x: centerX,
      y: hud.y + hud.height,
      width: centerWidth,
      height: Math.max(40, passButton.y - (hud.y + hud.height)),
    };

    const bottomRack: Rect = {
      x: tableOuter.x,
      y: tableOuter.y + tableOuter.height + tableRackGap,
      width: tableOuter.width,
      height: metrics.rackHeight,
    };

    const bottomTileLayout = this.computeTileLayout(bottomRack, count, width, config);

    return {
      canvas: { x: 0, y: 0, width, height },
      tableOuter,
      discardArea,
      topExposure,
      rightExposure,
      bottomExposure,
      leftExposure,
      hud,
      instructionBar,
      passButton,
      bottomRack,
      bottomTileLayout,
      /* topLabel: { x: width / 2, y: pageMargin + topLabelBand * 0.42 },
      leftLabel: {
        x: pageMargin + sideLabelGutter * 0.45,
        y: tableOuter.y + tableOuter.height / 2,
      },
      rightLabel: {
        x: width - pageMargin - sideLabelGutter * 0.45,
        y: tableOuter.y + tableOuter.height / 2,
      },
      username: { x: width / 2, y: height - usernameHeight * 0.45 }, */
      topLabel: {
        x: safeCenterX,
        y: safeTop + pageMargin + topLabelBand * 0.42,
      },
      leftLabel: {
        x: safeLeft + pageMargin + sideLabelGutter * 0.45,
        y: tableOuter.y + tableOuter.height / 2,
      },
      rightLabel: {
        x: width - safeRight - pageMargin - sideLabelGutter * 0.45,
        y: tableOuter.y + tableOuter.height / 2,
      },
      username: {
        x: safeCenterX,
        y: height - safeBottom - usernameHeight * 0.45,
      },
      isMobile: metrics.isMobile,
      metrics,
    };
  }

  private computeResponsiveMetrics(width: number, height: number): ResponsiveMetrics {
    const shortest = Math.min(width, height);
    const isPortrait = height > width;
    const isMobile = shortest < 430 || width < 640;
    const isTablet = !isMobile && width < 1024;

    const uiScale = this.clamp(
      shortest / 768,
      isMobile ? 0.58 : isTablet ? 0.78 : 0.92,
      isMobile ? 0.82 : isTablet ? 0.96 : 1.12,
    );

    return {
      isMobile,
      isTablet,
      isPortrait,
      uiScale,

      playerLabelFont: Math.round(13 * uiScale),
      usernameFont: Math.round(13 * uiScale),
      hudFont: Math.round(20 * uiScale),
      hudCounterFont: Math.round(22 * uiScale),
      hudIconFont: Math.round(28 * uiScale),
      instructionFont: Math.round(20 * uiScale),
      passFont: Math.round(17 * uiScale),

      topExposureHeight: this.clamp(
        shortest * (isMobile ? 0.075 : 0.065),
        isMobile ? 28 : 48,
        isMobile ? 46 : 88,
      ),

      bottomExposureHeight: this.clamp(
        shortest * (isMobile ? 0.07 : 0.06),
        isMobile ? 26 : 44,
        isMobile ? 44 : 82,
      ),

      exposureThickness: this.clamp(
        shortest * (isMobile ? (isPortrait ? 0.078 : 0.095) : 0.062),
        isMobile ? 30 : 50,
        isMobile ? 48 : 92,
      ),

      hudHeight: this.clamp(
        shortest * (isMobile ? 0.052 : 0.055),
        isMobile ? 26 : 42,
        isMobile ? 36 : 64,
      ),

      instructionHeight: this.clamp(
        shortest * (isMobile ? 0.052 : 0.052),
        isMobile ? 26 : 40,
        isMobile ? 36 : 60,
      ),

      passButtonWidth: this.clamp(
        shortest * 0.12,
        isMobile ? 56 : 88,
        isMobile ? 82 : 122,
      ),

      passButtonHeight: this.clamp(
        shortest * 0.046,
        isMobile ? 26 : 36,
        isMobile ? 34 : 52,
      ),

      passGap: this.clamp(
        shortest * 0.018,
        isMobile ? 6 : 12,
        isMobile ? 14 : 28,
      ),

      /* rackHeight: this.clamp(
        height * (isMobile ? (isPortrait ? 0.13 : 0.15) : isTablet ? 0.16 : 0.18),
        isMobile ? 62 : 78,
        isMobile ? 104 : 170,
      ), */

      /* rackHeight: this.clamp(
        height * (isMobile ? (isPortrait ? 0.02 : 0.20) : isTablet ? 0.02 : 0.20),
        isMobile ? 62 : 92,
        isMobile ? 138 : 190,
      ), */
      rackHeight: this.clamp(
        height *
          (
            isMobile
              ? isPortrait
                ? 0.095
                : 0.20
              : isTablet
                ? 0.02
                : 0.20
          ),
        isMobile
          ? isPortrait
            ? 82
            : 62
          : 92,
        isMobile
          ? isPortrait
            ? 112
            : 138
          : 190,
      ),

      /* tableRackGap: this.clamp(
        height * (isMobile ? 0.01 : 0.012),
        isMobile ? 5 : 8,
        isMobile ? 12 : 20,
      ), */
      tableRackGap: this.clamp(
        height *
          (
            isMobile
              ? isPortrait
                ? 0.004
                : 0.01
              : 0.012
          ),
        isMobile
          ? isPortrait
            ? 2
            : 5
          : 8,
        isMobile
          ? isPortrait
            ? 6
            : 12
          : 20,
      ),
      innerGap: this.clamp(shortest * 0.008, 4, 12),
    };
  }

  // This is work with the curent code but we use below of this old one 
  // The different is just gap adjustment beetween the tile of the rack
  // This also work fine with desktop and tablet, in mobile need to change as tiles have no gap.
  
  private computeTileLayoutN(
  rack: Rect,
  count: number,
  canvasWidth: number,
  config: GameTableConfig,
): TileLayout {
  const isMobile = canvasWidth < 640;
  const isTablet = canvasWidth >= 640 && canvasWidth < 1024;

  const maxTileWidth = isMobile
    ? config.rack.maxTileWidthMobile * 2.75
    : isTablet
      ? config.rack.maxTileWidthTablet * 1.9
      : config.rack.maxTileWidthDesktop * 1.6;

  const overlapRatio = isMobile ? 0.22 : 0;
  const positiveGap = isMobile ? 0 : isTablet ? 2 : 4;

  const rackTopPadding = this.clamp(rack.height * 0.015, 1, 4);
  const rackBottomPadding = this.clamp(rack.height * 0.035, 2, 8);

  const effectiveCountWidth = isMobile
    ? count - overlapRatio * (count - 1)
    : count;

  const fitByWidth = isMobile
    ? rack.width / effectiveCountWidth
    : (rack.width - positiveGap * (count - 1)) / count;

  const fitByHeight =
    (rack.height - rackTopPadding - rackBottomPadding) / config.rack.tileAspect;

  const tileWidth = this.clamp(
    Math.min(fitByWidth, fitByHeight, maxTileWidth),
    config.rack.minTileWidth,
    maxTileWidth,
  );

  const tileHeight = tileWidth * config.rack.tileAspect;

  const gap = isMobile
    ? -tileWidth * overlapRatio
    : positiveGap;

  const totalWidth = count * tileWidth + gap * (count - 1);
  const startX = rack.x + rack.width / 2 - totalWidth / 2 + tileWidth / 2;

  return {
    width: tileWidth,
    height: tileHeight,
    gap,
    slots: Array.from({ length: count }, (_, index) => ({
      x: startX + index * (tileWidth + gap),
      y: rack.y + rackTopPadding + tileHeight / 2,
    })),
  };
}
private computeTileLayout(
  rack: Rect,
  count: number,
  canvasWidth: number,
  config: GameTableConfig,
): TileLayout {
  const isMobile = canvasWidth < 640;
  const isTablet = canvasWidth >= 640 && canvasWidth < 1024;

  /**
   * Mobile portrait needs the largest readable tile possible.
   * We use small negative overlap on mobile only.
   */
  const overlapRatio = isMobile ? 0.14 : 0;

  const gap = isMobile
    ? -0.75 // 0
    : isTablet
      ? this.clamp(canvasWidth * 0.003, 2, 4)
      : this.clamp(canvasWidth * 0.0045, 3, 7);

  const maxTileWidth = isMobile
    ? config.rack.maxTileWidthMobile * 2.35
    : isTablet
      ? config.rack.maxTileWidthTablet * 1.7
      : config.rack.maxTileWidthDesktop * 1.55;

  const rackTopPadding = this.clamp(rack.height * 0.025, 1, 6);
  const rackBottomPadding = this.clamp(rack.height * 0.025, 1, 8);

  const effectiveCountWidth = isMobile
    ? count - overlapRatio * (count - 1)
    : count;

  const fitByWidth = isMobile
    ? rack.width / effectiveCountWidth
    : (rack.width - gap * (count - 1)) / count;

  const fitByHeight =
    (rack.height - rackTopPadding - rackBottomPadding) /
    config.rack.tileAspect;

  const tileWidth = Math.round(
    this.clamp(
      Math.min(fitByWidth, fitByHeight, maxTileWidth),
      config.rack.minTileWidth,
      maxTileWidth,
    ),
  );

  const tileHeight = Math.round(tileWidth * config.rack.tileAspect);

  const finalGap = isMobile
    ? Math.round(-tileWidth * overlapRatio)
    : Math.round(gap);

  const totalWidth = count * tileWidth + finalGap * (count - 1);
  const startX = rack.x + rack.width / 2 - totalWidth / 2 + tileWidth / 2;
  const y = rack.y + rackTopPadding + tileHeight / 2;

  return {
    width: tileWidth,
    height: tileHeight,
    gap: finalGap,
    slots: Array.from({ length: count }, (_, index) => ({
      x: Math.round(startX + index * (tileWidth + finalGap)),
      y: Math.round(y),
    })),
  };
}
  private computeTileLayoutOLD(
    rack: Rect,
    count: number,
    canvasWidth: number,
    config: GameTableConfig,
  ): TileLayout {
    const isMobile = canvasWidth < 640;
    const isTablet = canvasWidth >= 640 && canvasWidth < 1024;

    const maxTileWidth = isMobile
      ? config.rack.maxTileWidthMobile * 1.9
      : isTablet
        ? config.rack.maxTileWidthTablet * 1.7
        : config.rack.maxTileWidthDesktop * 1.55;

   /*  const gap = this.clamp(
      canvasWidth * config.rack.gapRatio * 0.18,
      1,
      isMobile ? 3 : 5,
    ); */
    const gap = isMobile
    ? this.clamp(canvasWidth * 0.001, 0.1, 0.5)
    : isTablet
      ? this.clamp(canvasWidth * 0.003, 2, 4)
      : this.clamp(canvasWidth * 0.0045, 3, 7);

    const rackTopPadding = this.clamp(rack.height * 0.04, 2, 8);

    const fitByWidth = (rack.width - gap * (count - 1)) / count;
    const fitByHeight = (rack.height - rackTopPadding) / config.rack.tileAspect;

    const tileWidth = this.clamp(
      Math.min(fitByWidth, fitByHeight, maxTileWidth),
      config.rack.minTileWidth,
      maxTileWidth,
    );

    const tileHeight = tileWidth * config.rack.tileAspect;
    const totalWidth = count * tileWidth + gap * (count - 1);
    const startX = rack.x + rack.width / 2 - totalWidth / 2 + tileWidth / 2;

    return {
      width: tileWidth,
      height: tileHeight,
      gap,
      slots: Array.from({ length: count }, (_, index) => ({
        x: startX + index * (tileWidth + gap),
        y: rack.y + rackTopPadding + tileHeight / 2,
      })),
    };
  }
  private computeTileLayoutOLDW(
    rack: Rect,
    count: number,
    canvasWidth: number,
    config: GameTableConfig,
  ): TileLayout {
    const isMobile = canvasWidth < 640;
    const isTablet = canvasWidth >= 640 && canvasWidth < 1024;

    const maxTileWidth = isMobile
      ? config.rack.maxTileWidthMobile * 1.75
      : isTablet
        ? config.rack.maxTileWidthTablet * 1.65
        : config.rack.maxTileWidthDesktop * 1.55;

    //const gap = this.clamp(canvasWidth * config.rack.gapRatio, 4, 10);
    const gap = this.clamp(canvasWidth * config.rack.gapRatio * 0.25, 1, 3);

    const fitByWidth = (rack.width - gap * (count - 1)) / count;
    const fitByHeight = rack.height / config.rack.tileAspect;

    const tileWidth = this.clamp(
      Math.min(fitByWidth, fitByHeight, maxTileWidth),
      config.rack.minTileWidth,
      maxTileWidth,
    );

    const tileHeight = tileWidth * config.rack.tileAspect;
    const totalWidth = count * tileWidth + gap * (count - 1);
    const startX = rack.x + rack.width / 2 - totalWidth / 2 + tileWidth / 2;

    return {
      width: tileWidth,
      height: tileHeight,
      gap,
      slots: Array.from({ length: count }, (_, index) => ({
        x: startX + index * (tileWidth + gap),
        y: rack.y + rack.height / 2,
      })),
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
/* import { GameTableConfig } from "./game-table.config";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface TileLayout {
  readonly width: number;
  readonly height: number;
  readonly gap: number;
  readonly slots: readonly Point[];
}

export interface TableLayout {
  readonly canvas: Rect;
  readonly tableOuter: Rect;
  readonly discardArea: Rect;
  readonly topExposure: Rect;
  readonly rightExposure: Rect;
  readonly bottomExposure: Rect;
  readonly leftExposure: Rect;
  readonly hud: Rect;
  readonly instructionBar: Rect;
  readonly passButton: Rect;
  readonly bottomRack: Rect;
  readonly topLabel: Point;
  readonly leftLabel: Point;
  readonly rightLabel: Point;
  readonly username: Point;
  readonly bottomTileLayout: TileLayout;
  readonly isMobile: boolean;
}

export interface UiScale {
    tiny: number;
    small: number;
    normal: number;
    large: number;
    icon: number;
    tile: number;
}

export interface ResponsiveMetrics {
  readonly uiScale: number;

  readonly playerLabelFont: number;
  readonly usernameFont: number;

  readonly hudFont: number;
  readonly hudCounterFont: number;
  readonly hudIconFont: number;

  readonly instructionFont: number;
  readonly passFont: number;

  readonly hudHeight: number;
  readonly instructionHeight: number;
  readonly passButtonWidth: number;
  readonly passButtonHeight: number;

  readonly exposureThickness: number;
  readonly innerGap: number;
  readonly tableRackGap: number;
}

export class GameLayoutEngine {
  compute(width: number, height: number, tileCount: number, config: GameTableConfig): TableLayout {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error(`Invalid canvas size ${width}x${height}`);
    }

    const count = Math.max(tileCount, 14);
    const isPortrait = height > width;
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const shortest = Math.min(width, height);

    const metrics = this.computeResponsiveMetrics(width, height);

    const outerMargin = this.clamp(shortest * (isMobile ? 0.018 : 0.024), 7, 30);
    const sideLabelGutter = this.clamp(shortest * (isMobile ? 0.05 : 0.022), isMobile ? 18 : 14, isMobile ? 28 : 34);
    const topLabelHeight = this.clamp(shortest * 0.035, 12, 24);
    const usernameHeight = this.clamp(height * 0.028, 14, 28);
    //const tableRackGap = this.clamp(height * (isMobile ? 0.008 : 0.012), 5, 16);
    const tableRackGap = metrics.tableRackGap;

    const rackHeight = this.clamp(
      height * (isMobile ? (isPortrait ? 0.115 : 0.13) : isTablet ? 0.13 : 0.155),
      isMobile ? 48 : 58,
      isMobile ? 74 : 142,
    );

    const tableOuter: Rect = {
      x: outerMargin + sideLabelGutter,
      y: outerMargin + topLabelHeight,
      width: width - (outerMargin + sideLabelGutter) * 2,
      height: height - outerMargin - topLabelHeight - rackHeight - usernameHeight - tableRackGap,
    };

    const exposureThickness = metrics.exposureThickness;
    const innerGap = metrics.innerGap;

    const leftExposure: Rect = {
      x: tableOuter.x,
      y: tableOuter.y,
      width: exposureThickness,
      height: tableOuter.height,
    };

    const rightExposure: Rect = {
      x: tableOuter.x + tableOuter.width - exposureThickness,
      y: tableOuter.y,
      width: exposureThickness,
      height: tableOuter.height,
    };

    const centerX = tableOuter.x + exposureThickness + innerGap;
    const centerWidth = tableOuter.width - exposureThickness * 2 - innerGap * 2;

    const topExposure: Rect = {
      x: centerX,
      y: tableOuter.y,
      width: centerWidth,
      height: exposureThickness,
    };

    const bottomExposure: Rect = {
      x: centerX,
      y: tableOuter.y + tableOuter.height - exposureThickness,
      width: centerWidth,
      height: exposureThickness,
    };

    const discardArea: Rect = {
      x: centerX,
      y: topExposure.y + topExposure.height + innerGap,
      width: centerWidth,
      height: tableOuter.height - exposureThickness * 2 - innerGap * 2,
    };

    const hudHeight = this.clamp(
      discardArea.height * (isMobile ? 0.085 : 0.095),
      isMobile ? 30 : 52,
      isMobile ? 44 : 72,
    );

    const hud: Rect = {
      x: centerX,
      y: discardArea.y,
      width: centerWidth,
      //height: hudHeight,
      height: metrics.hudHeight
    };

    const instructionHeight = this.clamp(
      discardArea.height * (isMobile ? 0.085 : 0.095),
      isMobile ? 30 : 48,
      isMobile ? 44 : 70,
    );

    const instructionBar: Rect = {
      x: centerX,
      y: bottomExposure.y - innerGap - instructionHeight,
      width: centerWidth,
      //height: instructionHeight,
      height: metrics.instructionHeight
    };

    const passButtonWidth = this.clamp(shortest * (isMobile ? 0.12 : 0.14), isMobile ? 60 : 96, isMobile ? 86 : 136);
    const passButtonHeight = this.clamp(shortest * (isMobile ? 0.046 : 0.06), isMobile ? 28 : 42, isMobile ? 38 : 60);
    const passGap = this.clamp(shortest * (isMobile ? 0.025 : 0.035), isMobile ? 8 : 22, isMobile ? 20 : 44);

    const passButton: Rect = {
      x: discardArea.x + discardArea.width / 2 - passButtonWidth / 2,
      y: instructionBar.y - passGap - passButtonHeight,
      //width: passButtonWidth,
      width: metrics.passButtonWidth,
      height: metrics.passButtonHeight
      //height: passButtonHeight,
    };

    const bottomRack: Rect = {
      x: outerMargin,
      y: tableOuter.y + tableOuter.height + tableRackGap,
      width: width - outerMargin * 2,
      height: rackHeight,
    };

    const bottomTileLayout = this.computeTileLayout(bottomRack, count, width, config);

    return {
      canvas: { x: 0, y: 0, width, height },
      tableOuter,
      discardArea,
      topExposure,
      rightExposure,
      bottomExposure,
      leftExposure,
      hud,
      instructionBar,
      passButton,
      bottomRack,
      bottomTileLayout,
      topLabel: { x: width / 2, y: outerMargin + topLabelHeight * 0.42 },
      leftLabel: { x: outerMargin + sideLabelGutter * 0.5, y: tableOuter.y + tableOuter.height / 2 },
      rightLabel: { x: width - outerMargin - sideLabelGutter * 0.5, y: tableOuter.y + tableOuter.height / 2 },
      username: { x: width / 2, y: height - usernameHeight * 0.45 },
      isMobile,
    };
  }
  computeOLD(width: number, height: number, tileCount: number, config: GameTableConfig): TableLayout {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error(`Invalid canvas size ${width}x${height}`);
    }

    const count = Math.max(tileCount, 14);
    const isPortrait = height > width;
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const shortest = Math.min(width, height);

    const pageMargin = this.clamp(shortest * (isPortrait ? 0.018 : 0.025), 8, 30);
    const rackHeight = this.clamp(
      isMobile ? height * 0.12 : isTablet ? height * 0.13 : height * 0.155,
      58,
      142,
    );
    const usernameHeight = this.clamp(height * 0.035, 18, 34);
    const tableRackGap = this.clamp(height * 0.014, 8, 18);

    const tableOuter: Rect = {
      x: pageMargin,
      y: pageMargin * 1.22,
      width: width - pageMargin * 2,
      height: height - pageMargin * 1.9 - rackHeight - usernameHeight - tableRackGap,
    };

    const exposureThickness = this.clamp(
      shortest * (isMobile ? 0.058 : isPortrait ? 0.072 : 0.07),
      isMobile ? 26 : isPortrait ? 34 : 58,
      isMobile ? 54 : isPortrait ? 76 : 110,
    );

    //const innerGap = this.clamp(shortest * 0.012, 6, 18);
    const innerGap = this.clamp(
      shortest * (isMobile ? 0.018 : 0.012),
      isMobile ? 8 : 6,
      isMobile ? 22 : 18,
    );

    const discardArea: Rect = {
      x: tableOuter.x + exposureThickness + innerGap,
      y: tableOuter.y + exposureThickness + innerGap,
      width: tableOuter.width - exposureThickness * 2 - innerGap * 2,
      height: tableOuter.height - exposureThickness * 2 - innerGap * 2,
    };

    //const exposurePaddingX = this.clamp(discardArea.width * 0.012, 8, 22);
    const exposurePaddingX = this.clamp(
      discardArea.width * (isMobile ? 0.028 : 0.012),
      isMobile ? 14 : 8,
      isMobile ? 34 : 22,
    );
    const topExposure: Rect = {
      x: discardArea.x + exposurePaddingX,
      y: tableOuter.y + innerGap,
      width: discardArea.width - exposurePaddingX * 2,
      height: exposureThickness - innerGap,
    };

    const bottomExposure: Rect = {
      x: discardArea.x + exposurePaddingX,
      y: discardArea.y + discardArea.height + innerGap,
      width: discardArea.width - exposurePaddingX * 2,
      height: exposureThickness - innerGap,
    };

    const leftExposure: Rect = {
      x: tableOuter.x + innerGap,
      y: discardArea.y,
      width: exposureThickness - innerGap,
      height: discardArea.height,
    };

    const rightExposure: Rect = {
      x: discardArea.x + discardArea.width + innerGap,
      y: discardArea.y,
      width: exposureThickness - innerGap,
      height: discardArea.height,
    };

    const hudPaddingX = this.clamp(discardArea.width * 0.012, 8, 22);
    const hudPaddingTop = this.clamp(discardArea.height * 0.016, 6, 16);
    const hudHeight = this.clamp(
      discardArea.height * (isMobile ? 0.082 : 0.09),
      isMobile ? 38 : 52,
      isMobile ? 52 : 72,
    );

    const hud: Rect = {
      x: discardArea.x + hudPaddingX,
      y: discardArea.y + hudPaddingTop,
      width: discardArea.width - hudPaddingX * 2,
      height: hudHeight,
    };

    const instructionPaddingX = this.clamp(discardArea.width * 0.012, 8, 22);
    const instructionPaddingBottom = this.clamp(discardArea.height * 0.014, 6, 16);
    const instructionHeight = this.clamp(
      discardArea.height * (isMobile ? 0.078 : 0.095),
      isMobile ? 40 : 54,
      isMobile ? 56 : 78,
    );

    const instructionBar: Rect = {
      x: discardArea.x + instructionPaddingX,
      y: discardArea.y + discardArea.height - instructionHeight - instructionPaddingBottom,
      width: discardArea.width - instructionPaddingX * 2,
      height: instructionHeight,
    };

    const passButtonWidth = this.clamp(shortest * 0.14, 88, 136);
    const passButtonHeight = this.clamp(shortest * 0.062, 42, 60);

    const passButton: Rect = {
      x: discardArea.x + discardArea.width / 2 - passButtonWidth / 2,
      y: instructionBar.y - this.clamp(discardArea.height * 0.16, 88, 170),
      width: passButtonWidth,
      height: passButtonHeight,
    };

    const bottomRack: Rect = {
      x: pageMargin,
      y: tableOuter.y + tableOuter.height + tableRackGap,
      width: width - pageMargin * 2,
      height: rackHeight,
    };

    const bottomTileLayout = this.computeTileLayout(bottomRack, count, width, config);

    return {
      canvas: { x: 0, y: 0, width, height },
      tableOuter,
      discardArea,
      topExposure,
      rightExposure,
      bottomExposure,
      leftExposure,
      hud,
      instructionBar,
      passButton,
      bottomRack,
      bottomTileLayout,
      topLabel: { x: width / 2, y: Math.max(10, tableOuter.y * 0.55) },
      leftLabel: {
        x: Math.max(8, tableOuter.x - pageMargin * 0.55),
        y: leftExposure.y + leftExposure.height / 2,
      },
      rightLabel: {
        x: Math.min(width - 8, tableOuter.x + tableOuter.width + pageMargin * 0.55),
        y: rightExposure.y + rightExposure.height / 2,
      },
      username: { x: width / 2, y: height - usernameHeight * 0.45 },
      isMobile,
    };
  }

  private computeResponsiveMetrics(width: number, height: number): ResponsiveMetrics {
    const shortest = Math.min(width, height);
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;

    const uiScale = this.clamp(
      shortest / 768,
      isMobile ? 0.62 : isTablet ? 0.78 : 0.92,
      isMobile ? 0.82 : isTablet ? 0.96 : 1.15,
    );

    return {
      uiScale,

      playerLabelFont: Math.round(14 * uiScale),
      usernameFont: Math.round(14 * uiScale),

      hudFont: Math.round(20 * uiScale),
      hudCounterFont: Math.round(22 * uiScale),
      hudIconFont: Math.round(30 * uiScale),

      instructionFont: Math.round(22 * uiScale),
      passFont: Math.round(18 * uiScale),

      hudHeight: this.clamp(shortest * 0.07, isMobile ? 34 : 52, isMobile ? 46 : 72),
      instructionHeight: this.clamp(shortest * 0.065, isMobile ? 34 : 48, isMobile ? 46 : 66),

      passButtonWidth: this.clamp(shortest * 0.135, isMobile ? 64 : 100, isMobile ? 92 : 128),
      passButtonHeight: this.clamp(shortest * 0.058, isMobile ? 30 : 44, isMobile ? 40 : 56),

      exposureThickness: this.clamp(shortest * 0.075, isMobile ? 36 : 58, isMobile ? 56 : 96),
      innerGap: this.clamp(shortest * 0.008, 4, 10),
      tableRackGap: this.clamp(height * 0.008, 4, 12),
    };
  }
  private computeTileLayout(rack: Rect, count: number, canvasWidth: number, config: GameTableConfig): TileLayout {
    const isMobile = canvasWidth < 640;
    const isTablet = canvasWidth >= 640 && canvasWidth < 1024;

    const maxTileWidth = isMobile
      ? config.rack.maxTileWidthMobile
      : isTablet
        ? config.rack.maxTileWidthTablet
        : config.rack.maxTileWidthDesktop;

    const gap = this.clamp(canvasWidth * config.rack.gapRatio, 3, 8);
    const fitByWidth = (rack.width - gap * (count - 1)) / count;
    const fitByHeight = rack.height / config.rack.tileAspect;

    const tileWidth = this.clamp(
      Math.min(fitByWidth, fitByHeight, maxTileWidth),
      config.rack.minTileWidth,
      maxTileWidth,
    );

    const tileHeight = tileWidth * config.rack.tileAspect;
    const totalWidth = count * tileWidth + gap * (count - 1);
    const startX = rack.x + rack.width / 2 - totalWidth / 2 + tileWidth / 2;

    return {
      width: tileWidth,
      height: tileHeight,
      gap,
      slots: Array.from({ length: count }, (_, i) => ({
        x: startX + i * (tileWidth + gap),
        y: rack.y + rack.height / 2,
      })),
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
} */
/* import { GameTableConfig } from "./game-table.config";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface TileLayout {
  readonly width: number;
  readonly height: number;
  readonly gap: number;
  readonly slots: readonly Point[];
}

export interface TableLayout {
  readonly canvas: Rect;
  readonly tableOuter: Rect;
  readonly discardArea: Rect;
  readonly topExposure: Rect;
  readonly rightExposure: Rect;
  readonly bottomExposure: Rect;
  readonly leftExposure: Rect;
  readonly hud: Rect;
  readonly instructionBar: Rect;
  readonly passButton: Rect;
  readonly bottomRack: Rect;
  readonly topLabel: Point;
  readonly leftLabel: Point;
  readonly rightLabel: Point;
  readonly username: Point;
  readonly bottomTileLayout: TileLayout;
}

export class GameLayoutEngine {
  compute(width: number, height: number, tileCount: number, config: GameTableConfig): TableLayout {
    if (width <= 0 || height <= 0) throw new Error(`Invalid canvas size ${width}x${height}`);

    const count = Math.max(tileCount, 14);
    const isPortrait = height > width;
    const shortest = Math.min(width, height);

    const pageMargin = this.clamp(shortest * 0.025, 8, 30);
    const rackHeight = this.clamp(isPortrait ? height * 0.105 : height * 0.145, 62, 132);
    const usernameHeight = this.clamp(height * 0.035, 18, 34);
    const tableBottomGap = this.clamp(height * 0.012, 6, 14);

    const tableOuter: Rect = {
      x: pageMargin,
      y: pageMargin * 1.2,
      width: width - pageMargin * 2,
      height: height - pageMargin * 1.8 - rackHeight - usernameHeight - tableBottomGap,
    };

    const exposureThickness = this.clamp(
      shortest * (isPortrait ? 0.075 : 0.07),
      isPortrait ? 36 : 58,
      isPortrait ? 76 : 108,
    );

    const discardArea: Rect = {
      x: tableOuter.x + exposureThickness,
      y: tableOuter.y + exposureThickness,
      width: tableOuter.width - exposureThickness * 2,
      height: tableOuter.height - exposureThickness * 2,
    };

    const topExposure: Rect = {
      x: discardArea.x,
      y: tableOuter.y,
      width: discardArea.width,
      height: exposureThickness,
    };

    const leftExposure: Rect = {
      x: tableOuter.x,
      y: discardArea.y,
      width: exposureThickness,
      height: discardArea.height,
    };

    const rightExposure: Rect = {
      x: discardArea.x + discardArea.width,
      y: discardArea.y,
      width: exposureThickness,
      height: discardArea.height,
    };

    const bottomExposure: Rect = {
      x: discardArea.x,
      y: discardArea.y + discardArea.height,
      width: discardArea.width,
      height: exposureThickness,
    };

    const hudHeight = this.clamp(discardArea.height * 0.085, isPortrait ? 38 : 52, isPortrait ? 56 : 68);

    const hud: Rect = {
      x: discardArea.x,
      y: discardArea.y,
      width: discardArea.width,
      height: hudHeight,
    };

    const instructionHeight = this.clamp(discardArea.height * 0.095, isPortrait ? 42 : 54, isPortrait ? 62 : 78);

    const instructionBar: Rect = {
      x: discardArea.x,
      y: discardArea.y + discardArea.height - instructionHeight,
      width: discardArea.width,
      height: instructionHeight,
    };

    const passButtonWidth = this.clamp(shortest * 0.14, 88, 132);
    const passButtonHeight = this.clamp(shortest * 0.062, 42, 58);

    const passButton: Rect = {
      x: discardArea.x + discardArea.width / 2 - passButtonWidth / 2,
      y: instructionBar.y - this.clamp(discardArea.height * 0.17, 90, 180),
      width: passButtonWidth,
      height: passButtonHeight,
    };

    const bottomRack: Rect = {
      x: pageMargin,
      y: tableOuter.y + tableOuter.height + tableBottomGap,
      width: width - pageMargin * 2,
      height: rackHeight,
    };

    const bottomTileLayout = this.computeTileLayout(bottomRack, count, width, config);

    return {
      canvas: { x: 0, y: 0, width, height },
      tableOuter,
      discardArea,
      topExposure,
      rightExposure,
      bottomExposure,
      leftExposure,
      hud,
      instructionBar,
      passButton,
      bottomRack,
      bottomTileLayout,
      topLabel: { x: width / 2, y: Math.max(10, tableOuter.y * 0.55) },
      /* leftLabel: {
        x: leftExposure.x + leftExposure.width / 2,
        y: leftExposure.y + leftExposure.height / 2,
      },
      rightLabel: {
        x: rightExposure.x + rightExposure.width / 2,
        y: rightExposure.y + rightExposure.height / 2,
      }, */
        /* leftLabel: {
            x: tableOuter.x - pageMargin * 0.45,
            y: leftExposure.y + leftExposure.height / 2,
        },
        rightLabel: {
            x: tableOuter.x + tableOuter.width + pageMargin * 0.45,
            y: rightExposure.y + rightExposure.height / 2,
        }, */
        /*leftLabel: {
            x: Math.max(8, tableOuter.x - pageMargin * 0.45),
            y: leftExposure.y + leftExposure.height / 2,
        },
        rightLabel: {
            x: Math.min(width - 8, tableOuter.x + tableOuter.width + pageMargin * 0.45),
            y: rightExposure.y + rightExposure.height / 2,
        },
        username: { x: width / 2, y: height - usernameHeight * 0.45 },
    };
  }

  private computeTileLayout(rack: Rect, count: number, canvasWidth: number, config: GameTableConfig): TileLayout {
    const isMobile = canvasWidth < 520;
    const isTablet = canvasWidth >= 520 && canvasWidth < 1024;

    const maxTileWidth = isMobile
      ? config.rack.maxTileWidthMobile
      : isTablet
        ? config.rack.maxTileWidthTablet
        : config.rack.maxTileWidthDesktop;

    const gap = this.clamp(canvasWidth * config.rack.gapRatio, 3, 10);
    const fitByWidth = (rack.width - gap * (count - 1)) / count;
    const fitByHeight = rack.height / config.rack.tileAspect;

    const tileWidth = this.clamp(
      Math.min(fitByWidth, fitByHeight, maxTileWidth),
      config.rack.minTileWidth,
      maxTileWidth,
    );

    const tileHeight = tileWidth * config.rack.tileAspect;
    const totalWidth = count * tileWidth + gap * (count - 1);
    const startX = rack.x + rack.width / 2 - totalWidth / 2 + tileWidth / 2;

    return {
      width: tileWidth,
      height: tileHeight,
      gap,
      slots: Array.from({ length: count }, (_, i) => ({
        x: startX + i * (tileWidth + gap),
        y: rack.y + rack.height / 2,
      })),
    };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
} */
/*
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface TileLayout {
  readonly width: number;
  readonly height: number;
  readonly gap: number;
  readonly slots: readonly Point[];
}

export interface TableLayout {
  readonly canvas: Rect;
  readonly tableOuter: Rect;
  readonly board: Rect;
  readonly instructionBar: Rect;
  readonly hud: Rect;
  readonly passButton: Rect;
  readonly bottomRack: Rect;
  readonly topLabel: Point;
  readonly leftLabel: Point;
  readonly rightLabel: Point;
  readonly username: Point;
  readonly bottomTileLayout: TileLayout;
}

export class GameLayoutEngine {
    compute(width: number, height: number, tileCount: number, config: GameTableConfig): TableLayout {
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            throw new Error(`Invalid layout size: ${width}x${height}`);
        }

        const count = Math.max(tileCount, 14);
        const isPortrait = height > width;
        const shortest = Math.min(width, height);

        const pageMargin = this.clamp(shortest * 0.035, 10, 42);
        const exposureHeight = this.clamp(
                                            height * (isPortrait ? 0.125 : 0.14),
                                            isPortrait ? 64 : 88,
                                            isPortrait ? 128 : 170,
                                        );

        //const exposureHeight = this.clamp(height * 0.105, 56, 104);
        const rackHeight = this.clamp(isPortrait ? height * 0.095 : height * 0.115, 54, 118);
        const usernameHeight = this.clamp(height * 0.035, 18, 34);
        const gap = this.clamp(height * 0.012, 6, 16);

        const tableOuter: Rect = {
            x: pageMargin,
            y: pageMargin * 1.15,
            width: width - pageMargin * 2,
            height: height - pageMargin * 1.7 - rackHeight - usernameHeight - gap,
        };

        //const boardPadding = this.clamp(shortest * 0.032, 12, 42);

            const boardPadding = this.clamp(
                shortest * (isPortrait ? 0.038 : 0.04),
                14,
                54,
            );

        const board: Rect = {
            x: tableOuter.x + boardPadding,
            y: tableOuter.y + exposureHeight,
            width: tableOuter.width - boardPadding * 2,
            height: tableOuter.height - exposureHeight - boardPadding,
        };

        const instructionHeight = this.clamp(
            height * config.board.instructionBarRatio,
            config.board.minInstructionBar,
            config.board.maxInstructionBar,
        );

        const instructionBar: Rect = {
            x: board.x,
            y: board.y + board.height - instructionHeight,
            width: board.width,
            height: instructionHeight,
        };

        const hudWidth = this.clamp(
            board.width * (isPortrait ? 0.94 : 0.66),
            Math.min(300, board.width * 0.9),
            board.width * 0.94,
        );

        const hudHeight = this.clamp(
            exposureHeight * 0.42,
            isPortrait ? 38 : 48,
            isPortrait ? 52 : 68,
        );

        const hud: Rect = {
            x: board.x + board.width / 2 - hudWidth / 2,
            y: tableOuter.y + exposureHeight / 2 - hudHeight / 2,
            width: hudWidth,
            height: hudHeight,
        };

        const passButtonWidth = this.clamp(shortest * 0.16, 78, 118);
        const passButtonHeight = this.clamp(shortest * 0.07, 40, 54);

        const passButton: Rect = {
            x: board.x + board.width / 2 - passButtonWidth / 2,
            y: instructionBar.y - this.clamp(height * 0.16, 95, 190),
            width: passButtonWidth,
            height: passButtonHeight,
        };

        const bottomRack: Rect = {
            x: pageMargin,
            y: tableOuter.y + tableOuter.height + gap,
            width: width - pageMargin * 2,
            height: rackHeight,
        };

        const tileLayout = this.computeTileLayout(bottomRack, count, width, config);

        return {
            canvas: { x: 0, y: 0, width, height },
            tableOuter,
            board,
            instructionBar,
            hud,
            passButton,
            bottomRack,
            bottomTileLayout: tileLayout,
            topLabel: { x: width / 2, y: Math.max(10, tableOuter.y * 0.55) },
            leftLabel: { x: tableOuter.x * 0.55, y: board.y + board.height / 2 },
            rightLabel: { x: tableOuter.x + tableOuter.width + tableOuter.x * 0.45, y: board.y + board.height / 2 },
            username: { x: width / 2, y: height - usernameHeight * 0.45 },
        };
        }
  computeOLD(width: number, height: number, tileCount: number, config: GameTableConfig): TableLayout {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error(`Invalid layout size: ${width}x${height}`);
    }

    const count = Math.max(tileCount, 14);
    const isPortrait = height > width;
    const shortest = Math.min(width, height);

    const margin = this.clamp(
      shortest * (isPortrait ? config.board.portraitMarginRatio : config.board.outerMarginRatio),
      10,
      48,
    );

    const tableOuter: Rect = {
      x: margin,
      y: margin * 1.15,
      width: width - margin * 2,
      height: height - margin * 1.75,
    };

    const rackHeight = this.clamp(isPortrait ? height * 0.105 : height * 0.13, 58, 134);
    const boardPadding = this.clamp(shortest * 0.035, 12, 44);

    const board: Rect = {
      x: tableOuter.x + boardPadding,
      y: tableOuter.y + boardPadding * 1.55,
      width: tableOuter.width - boardPadding * 2,
      height: tableOuter.height - rackHeight - boardPadding * 2.4,
    };

    const instructionHeight = this.clamp(
      height * config.board.instructionBarRatio,
      config.board.minInstructionBar,
      config.board.maxInstructionBar,
    );

    const instructionBar: Rect = {
      x: board.x,
      y: board.y + board.height - instructionHeight,
      width: board.width,
      height: instructionHeight,
    };

    const hudWidth = this.clamp(board.width * (isPortrait ? 1.03 : 0.55), 280, 820);
    const hudHeight = this.clamp(height * 0.058, 46, 58);

    const hud: Rect = {
      x: board.x + board.width / 2 - hudWidth / 2,
      y: board.y + this.clamp(board.height * 0.07, 16, 56),
      width: hudWidth,
      height: hudHeight,
    };

    const passButtonWidth = this.clamp(shortest * 0.16, 78, 118);
    const passButtonHeight = this.clamp(shortest * 0.07, 42, 56);

    const passButton: Rect = {
      x: board.x + board.width / 2 - passButtonWidth / 2,
      y: board.y + board.height * 0.56 - passButtonHeight / 2,
      width: passButtonWidth,
      height: passButtonHeight,
    };

    const bottomRack: Rect = {
      x: tableOuter.x + boardPadding,
      y: board.y + board.height + this.clamp(height * 0.018, 8, 22),
      width: tableOuter.width - boardPadding * 2,
      height: rackHeight * 0.78,
    };

    const tileLayout = this.computeTileLayout(bottomRack, count, width, config);

    return {
      canvas: { x: 0, y: 0, width, height },
      tableOuter,
      board,
      instructionBar,
      hud,
      passButton,
      bottomRack,
      bottomTileLayout: tileLayout,
      topLabel: { x: width / 2, y: Math.max(10, tableOuter.y * 0.55) },
      leftLabel: { x: Math.max(16, tableOuter.x * 0.55), y: board.y + board.height / 2 },
      rightLabel: { x: Math.min(width - 16, tableOuter.x + tableOuter.width + tableOuter.x * 0.45), y: board.y + board.height / 2 },
      username: { x: width / 2, y: height - Math.max(12, margin * 0.65) },
    };
  }

  private computeTileLayout(rack: Rect, count: number, canvasWidth: number, config: GameTableConfig): TileLayout {
    const isMobile = canvasWidth < 520;
    const isTablet = canvasWidth >= 520 && canvasWidth < 1024;

    const maxTileWidth = isMobile
        ? config.rack.maxTileWidthMobile
        : isTablet
        ? config.rack.maxTileWidthTablet
        : config.rack.maxTileWidthDesktop;

    const gap = this.clamp(canvasWidth * config.rack.gapRatio, 3, 10);
    const availableHeightWidth = rack.height / config.rack.tileAspect;
    const availableWidthFit = (rack.width - gap * (count - 1)) / count;

    const tileWidth = this.clamp(
        Math.min(availableWidthFit, availableHeightWidth, maxTileWidth),
        config.rack.minTileWidth,
        maxTileWidth,
    );

    const tileHeight = tileWidth * config.rack.tileAspect;
    const totalWidth = count * tileWidth + (count - 1) * gap;
    const startX = rack.x + rack.width / 2 - totalWidth / 2 + tileWidth / 2;

    const slots = Array.from({ length: count }, (_, index) => ({
        x: startX + index * (tileWidth + gap),
        y: rack.y + rack.height / 2,
    }));

    return { width: tileWidth, height: tileHeight, gap, slots };
    }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
} */