// src/app/game/phaser/game-layout.engine.ts
import { GameTableConfig } from "./game-table.config";
import {
  exposureLipRatio,
  exposureNameStripRatio,
  horizontalLabelCenterRatio,
  leftLabelCenterRatio,
  rightLabelCenterRatio,
} from "./exposure-panel.tokens";
import { Rect, ResponsiveMetrics, SafeAreaInsets, TableLayout, TileLayout } from "./type";

import {
  resolveDeviceLayout,
  DeviceLayoutState,
} from "./device-layout.service";

// Keep the layout engine as the public entry point for its related layout types.
/* export type {
  Point,
  Rect,
  ResponsiveMetrics,
  SafeAreaInsets,
  TableLayout,
  TileLayout,
} from "./type"; */



const ZERO_SAFE_AREA: SafeAreaInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export class GameLayoutEngine {
  compute(
    viewportOrWidth: DeviceLayoutState | number,
    heightOrTileCount: number,
    tileCountOrConfig: number | GameTableConfig,
    configOrSafeArea: GameTableConfig | SafeAreaInsets = ZERO_SAFE_AREA,
    legacySafeArea: SafeAreaInsets = ZERO_SAFE_AREA,
  ): TableLayout {
    const viewport: DeviceLayoutState =
      typeof viewportOrWidth === "number"
        ? {
            width: viewportOrWidth,
            height: heightOrTileCount,
            orientation:
              heightOrTileCount >= viewportOrWidth ? "portrait" : "landscape",
            layout: resolveDeviceLayout(viewportOrWidth, heightOrTileCount),
          }
        : viewportOrWidth;
    const tileCount =
      typeof viewportOrWidth === "number"
        ? (tileCountOrConfig as number)
        : heightOrTileCount;
    const config =
      typeof viewportOrWidth === "number"
        ? (configOrSafeArea as GameTableConfig)
        : (tileCountOrConfig as GameTableConfig);
    const safeArea =
      typeof viewportOrWidth === "number"
        ? legacySafeArea
        : (configOrSafeArea as SafeAreaInsets);

    switch (viewport.layout) {
      case "phone-portrait":
        return this.computeMobilePortrait(
          viewport.width,
          viewport.height,
          tileCount,
          config,
          viewport,
          safeArea,
        );

      case "phone-landscape":
        return this.computeMobileLandscape(
          viewport.width,
          viewport.height,
          tileCount,
          config,
          viewport,
          safeArea,
      );

      case "tablet-portrait":
        return this.computeTabletPortrait(
          viewport.width,
          viewport.height,
          tileCount,
          config,
          viewport,
          safeArea,
        );

      case "tablet-landscape":
        return this.computeTabletLandscape(
          viewport.width,
          viewport.height,
          tileCount,
          config,
          viewport,
          safeArea,
        );

      default:
        return this.computeDesktopLandscape(
          viewport.width,
          viewport.height,
          tileCount,
          config,
          viewport,
          safeArea,
        );
    }
  }
  computeDesktopLandscape(
    width: number,
    height: number,
    tileCount: number,
    config: GameTableConfig,
    viewport: DeviceLayoutState,
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
    const metrics = this.computeResponsiveMetrics(safeWidth, safeHeight, viewport);

    /**
     * PSD reference is landscape 1920x1080.
     * Use proportional layout for desktop/tablet landscape.
     */
    const s = Math.min(safeWidth / 1920, safeHeight / 1080);

    const hudHeight = this.clamp(safeHeight * 0.075, 58, 86);

    const tableOuterInset = safeHeight * 0.012;
    const tableOuter: Rect = {
      x: safeLeft + tableOuterInset,
      y: safeTop + hudHeight,
      width: safeWidth - tableOuterInset * 2,
      height: safeHeight - hudHeight - tableOuterInset,
    };

    /*
    
    const tableOuter: Rect = {
      x: safeLeft + tableOuterInset,
      y: safeTop + hudHeight,
      width: safeWidth - tableOuterInset * 2, //safeWidth * 0.976,
      height: safeHeight - hudHeight - tableOuterInset, // safeHeight * 0.012
    };
    */

    /**
     * PSD player exposure/rack panels.
     *
     * The side panels in the PSD are tall rails that run almost the full
     * playable board height. The top/bottom panels are wide rack trays
     * with a dark tile area and a name strip.
     * Now, want to set the side exposure depth insteaf of blue border
     */

    const tableEdgeInset = this.tableEdgeInset(tableOuter);
    const innerLeft = tableOuter.x + tableEdgeInset;
    const innerTop = tableOuter.y + tableEdgeInset;
    const innerRight = tableOuter.x + tableOuter.width - tableEdgeInset;
    const innerBottom = tableOuter.y + tableOuter.height - tableEdgeInset;

    const sideExposureWidth = this.clamp(
      tableOuter.width * 0.074,
      116,
      154,
    );

    const sideExposureHeight = tableOuter.height * 0.930;

    const sideExposureY = innerTop;

    const leftExposure: Rect = {
      x: innerLeft,
      y: sideExposureY,
      width: sideExposureWidth,
      height: sideExposureHeight,
    };

    const rightExposure: Rect = {
      x: innerRight - sideExposureWidth,
      y: sideExposureY,
      width: sideExposureWidth,
      height: sideExposureHeight,
    };

    /**
     * Top player tray from PSD:
     * wide centered panel, with enough height for the tile tray and label strip.
     */
    const topExposureWidth = this.clamp(
      tableOuter.width * 0.465,
      720,
      900,
    );

    const topExposureHeight = this.clamp(
      tableOuter.height * 0.135,
      108,
      145,
    );

    const topExposure: Rect = {
      x: safeCenterX - topExposureWidth / 2,
      y: innerTop,
      width: topExposureWidth,
      height: topExposureHeight,
    };

    /**
     * Bottom username/exposure tray from PSD.
     */
    const bottomExposureWidth = topExposureWidth;

    const bottomExposureHeight = this.clamp(
      tableOuter.height * 0.135,
      108,
      145,
    );

    const rackHeight = this.clamp(
      safeHeight * 0.135,
      metrics.isTablet ? 104 : 118,
      metrics.isTablet ? 140 : 158,
    );

    /**
     * Bottom rack tiles sit below the username tray, centered,
     * with side panels still visible outside.
     */
    const bottomRack: Rect = {
      x: tableOuter.x + tableOuter.width * 0.13,
      y: innerBottom - rackHeight,
      width: tableOuter.width * 0.74,
      height: rackHeight,
    };

    const bottomExposure: Rect = {
      x: safeCenterX - bottomExposureWidth / 2,
      y: bottomRack.y - bottomExposureHeight - tableEdgeInset,
      width: bottomExposureWidth,
      height: bottomExposureHeight,
    };

    /**
     * Center white action card from PSD.
     */
    
    /* const instructionWidth = this.clamp(tableOuter.width * 0.205, 360, 460);
    const instructionHeight = this.clamp(tableOuter.height * 0.175, 150, 205); */

    /* const instructionWidth = this.clamp(tableOuter.width * 0.215, 370, 480);
    const instructionHeight = this.clamp(tableOuter.height * 0.205, 175, 230); */

    const instructionWidth = this.clamp(tableOuter.width * 0.205, 360, 460);
    const instructionHeight = this.clamp(tableOuter.height * 0.175, 175, 230);

    /* const instructionBar: Rect = {
      x: safeCenterX - instructionWidth / 2,
      y: tableOuter.y + tableOuter.height * 0.31,
      width: instructionWidth,
      height: instructionHeight,
    }; */
    
   const instructionBar: Rect = {
      x: Math.round(safeCenterX - instructionWidth / 2),
      y: Math.round(
        tableOuter.y +
          tableOuter.height / 2 -
          instructionHeight / 2,
      ),
      width: instructionWidth,
      height: instructionHeight,
    };

    /* const passButtonWidth = this.clamp(instructionWidth * 0.44, 126, 168);
    const passButtonHeight = this.clamp(instructionHeight * 0.31, 38, 54); */
    const passButtonWidth = this.clamp(instructionWidth * 0.42, 128, 170);
    const passButtonHeight = this.clamp(instructionHeight * 0.27, 40, 56);

    /* const passButton: Rect = {
      x: instructionBar.x + instructionBar.width / 2 - passButtonWidth / 2,
      y: instructionBar.y + instructionBar.height - passButtonHeight - instructionHeight * 0.15,
      width: passButtonWidth,
      height: passButtonHeight,
    }; */
    const passButton: Rect = {
      x: instructionBar.x + instructionBar.width / 2 - passButtonWidth / 2,
      y: instructionBar.y + instructionBar.height - passButtonHeight - instructionHeight * 0.105,
      width: passButtonWidth,
      height: passButtonHeight,
    };

    /**
     * Discard area should be mostly invisible felt space.
     */
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

    const hud: Rect = {
      x: safeLeft,
      y: safeTop,
      width: safeWidth,
      height: hudHeight,
    };

    const bottomTileLayout = this.computeTileLayout(bottomRack, count, width, config);

    const labelY = horizontalLabelCenterRatio("desktop");
    const leftLabelX = leftLabelCenterRatio("desktop");
    const rightLabelX = rightLabelCenterRatio("desktop");

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

      /**
       * Labels are placed like the PSD.
       */
      topLabel: {
        x: topExposure.x + topExposure.width / 2,
        y: topExposure.y + topExposure.height * labelY,
      },

      leftLabel: {
        x: leftExposure.x + leftExposure.width * leftLabelX,
        y: leftExposure.y + leftExposure.height / 2,
      },

      rightLabel: {
        x: rightExposure.x + rightExposure.width * rightLabelX,
        y: rightExposure.y + rightExposure.height / 2,
      },

      username: {
        x: bottomExposure.x + bottomExposure.width / 2,
        y: bottomExposure.y + bottomExposure.height * labelY,
      },

      isMobile: metrics.isMobile,
      metrics,
    };
  }
  private computeTabletPortrait(
    width: number,
    height: number,
    tileCount: number,
    config: GameTableConfig,
    viewport: DeviceLayoutState,
    safeArea: SafeAreaInsets = ZERO_SAFE_AREA,
  ): TableLayout {
    const safeTop = Math.max(0, safeArea.top);
    const safeRight = Math.max(0, safeArea.right);
    const safeBottom = Math.max(0, safeArea.bottom);
    const safeLeft = Math.max(0, safeArea.left);

    const safeWidth = Math.max(1, width - safeLeft - safeRight);
    const safeHeight = Math.max(1, height - safeTop - safeBottom);
    const safeCenterX = safeLeft + safeWidth / 2;

    const count = Math.max(tileCount, 14);
    const metrics = this.computeResponsiveMetrics(safeWidth, safeHeight, viewport);

    /**
     * Tablet portrait:
     * Do not scale desktop directly.
     * Keep PSD style, but reduce side panels/top/bottom exposure and give rack/discard clean space.
     */
    const hudHeight = this.clamp(safeHeight * 0.062, 54, 68);

    const tableOuterInset = safeHeight * 0.018;
    const tableOuter: Rect = {
      x: safeLeft + tableOuterInset,
      y: safeTop + hudHeight,
      width: safeWidth - tableOuterInset * 2,
      height: safeHeight - hudHeight - tableOuterInset,
    };
    /*
    const tableOuter: Rect = {
      x: safeLeft + safeWidth * 0.028, // safeWidth * 0.028
      y: safeTop + hudHeight + safeHeight * 0.008,
      width: safeWidth * 0.944,
      height: safeHeight - hudHeight - safeBottom - safeHeight * 0.018,
    };
    */

    const tablePadX = this.tableEdgeInset(tableOuter);
    const tablePadTop = tablePadX;
    const tablePadBottom = tablePadX;

    const rackHeight = this.clamp(safeHeight * 0.105, 86, 118);
    const bottomRackBottomInset = tablePadX;
    const bottomRack: Rect = {
      x: tableOuter.x + tableOuter.width * 0.055,
      y: tableOuter.y + tableOuter.height - rackHeight - bottomRackBottomInset,
      width: tableOuter.width * 0.890,
      height: rackHeight,
    };
    const bottomTileLayout = this.computeTileLayout(bottomRack, count, width, config);
    const panelRatios =
      exposureLipRatio("tablet") + exposureNameStripRatio("tablet");
    const exposureThickness = Math.ceil(
      (bottomTileLayout.height + 2) / (1 - panelRatios),
    );

    /**
     * Top exposure:
     * Smaller than desktop, centered, with enough inner area.
     */
    const topExposureWidth = this.clamp(
      tableOuter.width * 0.560,
      360,
      500,
    );

    const topExposureHeight = exposureThickness;

    const topExposure: Rect = {
      x: safeCenterX - topExposureWidth / 2,
      y: tableOuter.y + tablePadTop,
      width: topExposureWidth,
      height: topExposureHeight,
    };

    /**
     * Bottom username exposure:
     * Above rack, smaller than desktop, active strip still works.
     */
    const bottomExposureWidth = topExposureWidth;

    const bottomExposureHeight = exposureThickness;

    const bottomExposure: Rect = {
      x: safeCenterX - bottomExposureWidth / 2,
      y: bottomRack.y - bottomExposureHeight - tablePadX,
      width: bottomExposureWidth,
      height: bottomExposureHeight,
    };

    /**
     * Side exposures:
     * Tablet portrait needs visible exposure area, but not huge desktop rails.
     * Fit between top and bottom panels.
     */
    const sideExposureWidth = exposureThickness;

    const sideExposureY =
      topExposure.y + topExposure.height + tableOuter.height * 0.050;

    const sideExposureBottom =
      bottomExposure.y - tableOuter.height * 0.045;

    const sideExposureHeight = Math.max(
      260,
      sideExposureBottom - sideExposureY,
    );

    const leftExposure: Rect = {
      x: tableOuter.x + tablePadX,
      y: sideExposureY,
      width: sideExposureWidth,
      height: sideExposureHeight,
    };

    const rightExposure: Rect = {
      x: tableOuter.x + tableOuter.width - tablePadX - sideExposureWidth,
      y: sideExposureY,
      width: sideExposureWidth,
      height: sideExposureHeight,
    };

    /**
     * Instruction popup:
     * Tablet portrait can use a comfortable mid-size card.
     */
    const instructionWidth = this.clamp(
      tableOuter.width * 0.430,
      280,
      360,
    );

    const instructionHeight = this.clamp(
      tableOuter.height * 0.125,
      110,
      145,
    );

    /* const instructionBar: Rect = {
      x: safeCenterX - instructionWidth / 2,
      y: tableOuter.y + tableOuter.height * 0.335,
      width: instructionWidth,
      height: instructionHeight,
    }; */
    const instructionBar: Rect = {
      x: Math.round(safeCenterX - instructionWidth / 2),
      y: Math.round(
        tableOuter.y +
          tableOuter.height / 2 -
          instructionHeight / 2,
      ),
      width: instructionWidth,
      height: instructionHeight,
    };

    const passButtonWidth = this.clamp(
      instructionWidth * 0.400,
      104,
      140,
    );

    const passButtonHeight = this.clamp(
      instructionHeight * 0.265,
      32,
      44,
    );

    const passButton: Rect = {
      x: instructionBar.x + instructionBar.width / 2 - passButtonWidth / 2,
      y:
        instructionBar.y +
        instructionBar.height -
        passButtonHeight -
        instructionHeight * 0.105,
      width: passButtonWidth,
      height: passButtonHeight,
    };

    /**
     * Discard/play area:
     * Use remaining center space, never overlap the card/rack panels.
     */
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

    const hud: Rect = {
      x: safeLeft,
      y: safeTop,
      width: safeWidth,
      height: hudHeight,
    };

    /**
     * Tablet strip ratio comes from exposure-panel.tokens.ts.
     * Centers label exactly inside each name strip.
     */
    const labelY = horizontalLabelCenterRatio("tablet");
    const leftLabelX = leftLabelCenterRatio("tablet");
    const rightLabelX = rightLabelCenterRatio("tablet");

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
        y: topExposure.y + topExposure.height * labelY,
      },

      leftLabel: {
        x: leftExposure.x + leftExposure.width * leftLabelX,
        y: leftExposure.y + leftExposure.height / 2,
      },

      rightLabel: {
        x: rightExposure.x + rightExposure.width * rightLabelX,
        y: rightExposure.y + rightExposure.height / 2,
      },

      username: {
        x: bottomExposure.x + bottomExposure.width / 2,
        y: bottomExposure.y + bottomExposure.height * labelY,
      },

      isMobile: false,
      metrics,
    };
  }
  private computeTabletLandscape(
    width: number,
    height: number,
    tileCount: number,
    config: GameTableConfig,
    viewport: DeviceLayoutState,
    safeArea: SafeAreaInsets = ZERO_SAFE_AREA,
  ): TableLayout {
    const safeTop = Math.max(0, safeArea.top);
    const safeRight = Math.max(0, safeArea.right);
    const safeBottom = Math.max(0, safeArea.bottom);
    const safeLeft = Math.max(0, safeArea.left);

    const safeWidth = Math.max(1, width - safeLeft - safeRight);
    const safeHeight = Math.max(1, height - safeTop - safeBottom);
    const safeCenterX = safeLeft + safeWidth / 2;

    const count = Math.max(tileCount, 14);
    const metrics = this.computeResponsiveMetrics(safeWidth, safeHeight, viewport);

    /**
     * Tablet landscape:
     * Keep desktop PSD style, but reduce panel dominance and prevent overlap.
     */
    const hudHeight = this.clamp(safeHeight * 0.070, 52, 66);

    const tableOuterInset = safeHeight * 0.025;
    const tableOuter: Rect = {
      x: safeLeft + tableOuterInset,
      y: safeTop + hudHeight,
      width: safeWidth - tableOuterInset * 2,
      height: safeHeight - hudHeight - tableOuterInset,
    };
/*
const tableOuter: Rect = {
      x: safeLeft + safeWidth * 0.025,
      y: safeTop + hudHeight + safeHeight * 0.010,
      width: safeWidth * 0.950,
      height: safeHeight - hudHeight - safeBottom - safeHeight * 0.025,
    };

*/

    const tablePadX = this.tableEdgeInset(tableOuter);
    const tablePadTop = tablePadX;
    const tablePadBottom = tablePadX;

    const rackHeight = this.clamp(safeHeight * 0.120, 86, 112);
    const provisionalBottomRack: Rect = {
      x: tableOuter.x + tableOuter.width * 0.105,
      y: tableOuter.y + tableOuter.height - rackHeight - tablePadBottom,
      width: tableOuter.width * 0.790,
      height: rackHeight,
    };
    const provisionalTileLayout = this.computeTileLayout(
      provisionalBottomRack,
      count,
      width,
      config,
    );
    const panelRatios =
      exposureLipRatio("tablet") + exposureNameStripRatio("tablet");
    const provisionalExposureThickness = Math.ceil(
      (provisionalTileLayout.height + 2) / (1 - panelRatios),
    );
    const rackSideGutter = this.clamp(tableOuter.width * 0.014, 10, 18);
    const bottomRack: Rect = {
      x: tableOuter.x + tablePadX + provisionalExposureThickness + rackSideGutter,
      y: provisionalBottomRack.y,
      width: Math.max(
        1,
        tableOuter.width -
          2 * (tablePadX + provisionalExposureThickness + rackSideGutter),
      ),
      height: rackHeight,
    };
    const bottomTileLayout = this.computeTileLayout(bottomRack, count, width, config);
    const exposureThickness = Math.ceil(
      (bottomTileLayout.height + 2) / (1 - panelRatios),
    );

    /**
     * Top exposure:
     * Wider than phone landscape, smaller than desktop.
     */
    const topExposureWidth = this.clamp(
      // Leave a dedicated wall-indicator lane before the full-height right rail.
      tableOuter.width * 0.460,
      390,
      620,
    );

    const topExposureHeight = exposureThickness;

    const topExposure: Rect = {
      x: safeCenterX - topExposureWidth / 2,
      y: tableOuter.y + tablePadTop,
      width: topExposureWidth,
      height: topExposureHeight,
    };

    /**
     * Bottom exposure:
     * Smaller than desktop and directly above bottom rack.
     */
    const bottomExposureWidth = topExposureWidth;

    const bottomExposureHeight = exposureThickness;

    const bottomExposure: Rect = {
      x: safeCenterX - bottomExposureWidth / 2,
      y: bottomRack.y - bottomExposureHeight - tablePadX,
      width: bottomExposureWidth,
      height: bottomExposureHeight,
    };

    /**
     * Side exposures:
     * Fit between top and bottom exposure panels.
     * Do not use full desktop-height rails on tablet landscape.
     */
    const sideExposureWidth = exposureThickness;

    /* const sideExposureY =
      topExposure.y + topExposure.height + tableOuter.height * 0.045;

    const sideExposureBottom =
      bottomExposure.y - tableOuter.height * 0.045;

    const sideExposureHeight = Math.max(
      220,
      sideExposureBottom - sideExposureY,
    ); */

    /**
     * Full-height side rails for tablet landscape.
     * They now use almost the full table height instead of only the
     * space between topExposure and bottomExposure.
     */
    const sideExposureY = tableOuter.y + tablePadX;

    const sideExposureBottom =
      tableOuter.y + tableOuter.height - tablePadX;

    const sideExposureHeight = Math.max(
      220,
      sideExposureBottom - sideExposureY,
    );

    const leftExposure: Rect = {
      x: tableOuter.x + tablePadX,
      y: sideExposureY,
      width: sideExposureWidth,
      height: sideExposureHeight,
    };

    const rightExposure: Rect = {
      x: tableOuter.x + tableOuter.width - tablePadX - sideExposureWidth,
      y: sideExposureY,
      width: sideExposureWidth,
      height: sideExposureHeight,
    };

    /**
     * Instruction card:
     * Comfortable tablet size; positioned in center without overlap.
     */
    const instructionWidth = this.clamp(
      tableOuter.width * 0.330,
      300,
      390,
    );

    const instructionHeight = this.clamp(
      tableOuter.height * 0.155,
      110,
      145,
    );

    /* const instructionBar: Rect = {
      x: safeCenterX - instructionWidth / 2,
      y: tableOuter.y + tableOuter.height * 0.320,
      width: instructionWidth,
      height: instructionHeight,
    }; */

    const instructionBar: Rect = {
      x: Math.round(safeCenterX - instructionWidth / 2),
      y: Math.round(
        tableOuter.y +
          tableOuter.height / 2 -
          instructionHeight / 2,
      ),
      width: instructionWidth,
      height: instructionHeight,
    };

    const passButtonWidth = this.clamp(
      instructionWidth * 0.400,
      112,
      150,
    );

    const passButtonHeight = this.clamp(
      instructionHeight * 0.265,
      34,
      46,
    );

    const passButton: Rect = {
      x: instructionBar.x + instructionBar.width / 2 - passButtonWidth / 2,
      y:
        instructionBar.y +
        instructionBar.height -
        passButtonHeight -
        instructionHeight * 0.105,
      width: passButtonWidth,
      height: passButtonHeight,
    };

    /**
     * Discard/play area:
     * Remaining center area, protected from panels.
     */
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
      height: Math.max(120, discardAreaBottom - discardAreaTop),
    };

    const hud: Rect = {
      x: safeLeft,
      y: safeTop,
      width: safeWidth,
      height: hudHeight,
    };

    /**
     * Tablet uses the shared tablet exposure strip ratio.
     */
    const labelY = horizontalLabelCenterRatio("tablet");
    const leftLabelX = leftLabelCenterRatio("tablet");
    const rightLabelX = rightLabelCenterRatio("tablet");

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
        y: topExposure.y + topExposure.height * labelY,
      },

      leftLabel: {
        x: leftExposure.x + leftExposure.width * leftLabelX,
        y: leftExposure.y + leftExposure.height / 2,
      },

      rightLabel: {
        x: rightExposure.x + rightExposure.width * rightLabelX,
        y: rightExposure.y + rightExposure.height / 2,
      },

      username: {
        x: bottomExposure.x + bottomExposure.width / 2,
        y: bottomExposure.y + bottomExposure.height * labelY,
      },

      isMobile: false,
      metrics,
    };
  }
  private computeMobileLandscape(
    width: number,
    height: number,
    tileCount: number,
    config: GameTableConfig,
    viewport: DeviceLayoutState,
    safeArea: SafeAreaInsets = ZERO_SAFE_AREA,
  ): TableLayout {
    const safeTop = Math.max(0, safeArea.top);
    const safeRight = Math.max(0, safeArea.right);
    const safeBottom = Math.max(0, safeArea.bottom);
    const safeLeft = Math.max(0, safeArea.left);

    const safeWidth = Math.max(1, width - safeLeft - safeRight);
    const safeHeight = Math.max(1, height - safeTop - safeBottom);
    const safeCenterX = safeLeft + safeWidth / 2;

    const count = Math.max(tileCount, 14);
    const metrics = this.computeResponsiveMetrics(safeWidth, safeHeight, viewport);

    // TEMP: remove after verifying
  //console.log("USING MOBILE LANDSCAPE LAYOUT", width, height);

    /**
    * Mobile landscape is very height-constrained.
    * Do not scale the desktop PSD directly.
    */
    const hudHeight = this.clamp(safeHeight * 0.105, 40, 48);



    // Match the mobile page-blue gutter to the table's black edge thickness.
    // Use the shorter viewport side so portrait and landscape stay consistent.
    const tableOuterInset = this.clamp(Math.min(safeWidth, safeHeight) * 0.018, 8, 18);
    const tableOuter: Rect = {
      x: safeLeft + tableOuterInset,
      // The mobile header overlays the table; it never reserves table height.
      y: safeTop,
      width: safeWidth - tableOuterInset * 2,
      height: safeHeight - tableOuterInset,
    };
    /*
    const tableOuter: Rect = {
      x: safeLeft + safeWidth * 0.020,
      y: safeTop + hudHeight + safeHeight * 0.010,
      width: safeWidth * 0.960,
      height: safeHeight - hudHeight - safeBottom - safeHeight * 0.030,
    };
    */

    const tablePadX = this.tableEdgeInset(tableOuter);
    const tablePadTop = tablePadX;
    const tablePadBottom = tablePadX;
    const mobileRackBottomInset = Math.max(4, tablePadBottom - 4);

    const rackHeight = this.clamp(safeHeight * 0.135, 44, 58);
    const bottomRack: Rect = {
      x: tableOuter.x + tableOuter.width * 0.180,
      y: tableOuter.y + tableOuter.height - rackHeight - mobileRackBottomInset,
      width: tableOuter.width * 0.640,
      height: rackHeight,
    };
    const bottomTileLayout = this.computeTileLayout(bottomRack, count, width, config);
    const panelRatios =
      exposureLipRatio("mobile-landscape") +
      exposureNameStripRatio("mobile-landscape");
    // The rendered inner horizontal tray is exactly one rack-tile high.
    const exposureThickness = Math.ceil(
      (bottomTileLayout.height + 2) / (1 - panelRatios),
    );

    /**
    * Top exposure:
    * Smaller and lower than before, with clear gap from table border.
    */
    const topExposureWidth = this.clamp(
      tableOuter.width * 0.360,
      250,
      360,
    );

    const topExposureHeight = exposureThickness;

    const topExposure: Rect = {
      x: safeCenterX - topExposureWidth / 2,
      y: tableOuter.y + tablePadTop,
      width: topExposureWidth,
      height: topExposureHeight,
    };

    /**
    * Bottom exposure / username panel:
    * Above rack, smaller than desktop, no overlap with instruction.
    */
    const bottomExposureWidth = this.clamp(
      tableOuter.width * 0.360,
      250,
      360,
    );

    // Keep the bottom tray the same thickness as the top/side exposures.
    const bottomExposureHeight = exposureThickness;

    const bottomExposure: Rect = {
      x: safeCenterX - bottomExposureWidth / 2,
      y: bottomRack.y - bottomExposureHeight - tablePadX,
      width: bottomExposureWidth,
      height: bottomExposureHeight,
    };

    /**
    * Side exposures:
    * Dynamically fit between top exposure and bottom exposure.
    * This prevents the huge overlap seen in the screenshot.
    */
    /* const sideExposureWidth = this.clamp(
      tableOuter.width * 0.060,
      44,
      62,
    ); */
    /* const sideExposureWidth = this.clamp(
      //tableOuter.width * 0.078,
      tableOuter.width * 0.078,
      58,
      78,
    ); */
    /* const sideExposureWidth = this.clamp(
      tableOuter.width * 0.078,
      34,
      42,
    );


    const sideExposureY =
      topExposure.y + topExposure.height + tableOuter.height * 0.050;

    const sideExposureBottom =
      bottomExposure.y - tableOuter.height * 0.040;

    const sideExposureHeight = Math.max(
      this.clamp(tableOuter.height * 0.320, 92, 130),
      sideExposureBottom - sideExposureY,
    );
    

    const finalSideExposureHeight = Math.min(
      sideExposureHeight,
      Math.max(80, sideExposureBottom - sideExposureY),
    );

    const leftExposure: Rect = {
      x: tableOuter.x + tablePadX,
      y: sideExposureY,
      width: sideExposureWidth,
      height: finalSideExposureHeight,
    };

    const rightExposure: Rect = {
      x: tableOuter.x + tableOuter.width - tablePadX - sideExposureWidth,
      y: sideExposureY,
      width: sideExposureWidth,
      height: finalSideExposureHeight,
    }; */

    const sideExposureWidth = exposureThickness;

const sideExposureY = tableOuter.y + tablePadX;

const sideExposureBottom =
  tableOuter.y + tableOuter.height - tablePadX;

const finalSideExposureHeight = Math.max(
  80,
  sideExposureBottom - sideExposureY,
);

const leftExposure: Rect = {
  x: tableOuter.x + tablePadX,
  y: sideExposureY,
  width: sideExposureWidth,
  height: finalSideExposureHeight,
};

const rightExposure: Rect = {
  x: tableOuter.x + tableOuter.width - tablePadX - sideExposureWidth,
  y: sideExposureY,
  width: sideExposureWidth,
  height: finalSideExposureHeight,
};

    /**
    * Instruction card:
    * Smaller and placed in the free center area.
    */
    const instructionWidth = this.clamp(
      tableOuter.width * 0.255,
      180,
      240,
    );

    const instructionHeight = this.clamp(
      tableOuter.height * 0.190,
      60,
      78,
    );

   

    /* const instructionBar: Rect = {
      x: safeCenterX - instructionWidth / 2,
      y: tableOuter.y + tableOuter.height * 0.330,
      width: instructionWidth,
      height: instructionHeight,
    }; */
    const instructionBar: Rect = {
      x: Math.round(safeCenterX - instructionWidth / 2),
      y: Math.round(
        tableOuter.y +
          tableOuter.height / 2 -
          instructionHeight / 2,
      ),
      width: instructionWidth,
      height: instructionHeight,
    };

    const passButtonWidth = this.clamp(
      instructionWidth * 0.360,
      62,
      86,
    );

    const passButtonHeight = this.clamp(
      instructionHeight * 0.260,
      20,
      28,
    );

    const passButton: Rect = {
      x: instructionBar.x + instructionBar.width / 2 - passButtonWidth / 2,
      y:
        instructionBar.y +
        instructionBar.height -
        passButtonHeight -
        instructionHeight * 0.120,
      width: passButtonWidth,
      height: passButtonHeight,
    };

    /**
    * Discard area:
    * Centered available space, not allowed to overlap panels.
    */
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

    const hud: Rect = {
      x: safeLeft,
      y: safeTop,
      width: safeWidth,
      height: hudHeight,
    };

    const labelY = horizontalLabelCenterRatio("mobile-landscape");
    const leftLabelX = leftLabelCenterRatio("mobile-landscape");
    const rightLabelX = rightLabelCenterRatio("mobile-landscape");

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

      /* topLabel: {
        x: topExposure.x + topExposure.width / 2,
        y: topExposure.y + topExposure.height * 0.925,
      }, */

      /* leftLabel: {
        x: leftExposure.x + leftExposure.width * 0.875,
        y: leftExposure.y + leftExposure.height * 0.5,
      },

      rightLabel: {
        x: rightExposure.x + rightExposure.width * 0.125,
        y: rightExposure.y + rightExposure.height * 0.5,
      }, */
      /* leftLabel: {
        x: leftExposure.x + leftExposure.width * 0.975,
        y: leftExposure.y + leftExposure.height * 0.5,
      },

      rightLabel: {
        x: rightExposure.x + rightExposure.width * 0.025,
        y: rightExposure.y + rightExposure.height * 0.5,
      },
      username: {
        x: bottomExposure.x + bottomExposure.width / 2,
        y: bottomExposure.y + bottomExposure.height * 0.925,
      }, */

      topLabel: {
        x: topExposure.x + topExposure.width / 2,
        y: topExposure.y + topExposure.height * labelY,
      },

      leftLabel: {
        x: leftExposure.x + leftExposure.width * leftLabelX,
        y: leftExposure.y + leftExposure.height / 2,
      },

      rightLabel: {
        x: rightExposure.x + rightExposure.width * rightLabelX,
        y: rightExposure.y + rightExposure.height / 2,
      },

      username: {
        x: bottomExposure.x + bottomExposure.width / 2,
        y: bottomExposure.y + bottomExposure.height * labelY,
      },

      isMobile: metrics.isMobile,
      metrics,
    };
  }
  private computeMobilePortrait(
    width: number,
    height: number,
    tileCount: number,
    config: GameTableConfig,
    viewport: DeviceLayoutState,
    safeArea: SafeAreaInsets,
  ): TableLayout {
    const safeTop = Math.max(0, safeArea.top);
    const safeRight = Math.max(0, safeArea.right);
    const safeBottom = Math.max(0, safeArea.bottom);
    const safeLeft = Math.max(0, safeArea.left);

    const safeWidth = Math.max(1, width - safeLeft - safeRight);
    const safeHeight = Math.max(1, height - safeTop - safeBottom);
    const safeCenterX = safeLeft + safeWidth / 2;

    const count = Math.max(tileCount, 14);
    const metrics = this.computeResponsiveMetrics(safeWidth, safeHeight, viewport);

    /**
     * Mobile portrait is not a scaled desktop PSD.
     * It is gameplay-first:
     * - compact HUD
     * - narrow side exposures
     * - smaller instruction card
     * - bottom rack gets priority
     */

    const hudHeight = this.clamp(safeHeight * 0.062, 42, 54);

    // Keep the outer blue gutter no larger than the visible black table edge.
    const tableOuterInset = this.clamp(Math.min(safeWidth, safeHeight) * 0.018, 8, 18);
    const tableOuter: Rect = {
      x: safeLeft + tableOuterInset,
      //y: safeTop + tableOuterInset, // For top boarder 
      //height: safeHeight - tableOuterInset * 2,  // For top boarder 
      // The mobile header overlays the table; it never reserves table height.
      y: safeTop,
      width: safeWidth - tableOuterInset * 2,
      height: safeHeight - tableOuterInset,
    };

    /*
    
    const tableOuter: Rect = {
      x: safeLeft + safeWidth * 0.018,
      y: safeTop + hudHeight + safeHeight * 0.006,
      width: safeWidth * 0.964,
      height: safeHeight - hudHeight - safeBottom - safeHeight * 0.018,
    };
    */

    const tablePaddingX = tableOuter.width * 0.025;
    const tablePaddingTop = this.tableEdgeInset(tableOuter);
    const tablePaddingBottom = tablePaddingTop;

    const rackHeight = this.clamp(safeHeight * 0.086, 54, 70);
    const bottomRackBottomInset = Math.max(
      4,
      this.tableEdgeInset(tableOuter) - 4,
    );
    const bottomRack: Rect = {
      x: tableOuter.x + tableOuter.width * 0.055,
      y: tableOuter.y + tableOuter.height - rackHeight - bottomRackBottomInset,
      width: tableOuter.width * 0.890,
      height: rackHeight,
    };
    const bottomTileLayout = this.computeTileLayout(
      bottomRack,
      count,
      width,
      config,
      true,
    );
    const panelRatios =
      exposureLipRatio("mobile-portrait") +
      exposureNameStripRatio("mobile-portrait");
    // The rendered inner horizontal tray is exactly one rack-tile high.
    const exposureThickness = Math.ceil(
      (bottomTileLayout.height + 2) / (1 - panelRatios),
    );

    /** Side exposures use the same outer thickness as top and bottom. */
    const sideExposureWidth = exposureThickness;

    const sideExposureHeight = tableOuter.height * 0.47;

    const sideExposureY =
      tableOuter.y + tableOuter.height * 0.235;

    /**
     * Keep side panels inside the pink table border,
     * but give them enough width for exposed tiles.
     */
    const sideInsetX = this.tableEdgeInset(tableOuter);


    const leftExposure: Rect = {
      x: tableOuter.x + sideInsetX,
      y: sideExposureY,
      width: sideExposureWidth,
      height: sideExposureHeight,
    };

    const rightExposure: Rect = {
      x: tableOuter.x + tableOuter.width - sideInsetX - sideExposureWidth,
      y: sideExposureY,
      width: sideExposureWidth,
      height: sideExposureHeight,
    };


    /**
     * Top exposure:
     * Keep it visible but compact.
     */

    const topExposureWidth = this.clamp(
      tableOuter.width * 0.55,
      176,
      232,
    );

    const topExposureHeight = exposureThickness;

    const topExposure: Rect = {
      x: safeCenterX - topExposureWidth / 2,
      y: tableOuter.y + tablePaddingTop,
      width: topExposureWidth,
      height: topExposureHeight,
    };

    /**
     * Bottom username/exposure panel:
     * Compact and close to the rack.
     */
    
    const bottomExposureWidth = this.clamp(
      tableOuter.width * 0.58,
      190,
      250,
    );

    const bottomExposureHeight = sideExposureWidth;

    const bottomExposure: Rect = {
      x: safeCenterX - bottomExposureWidth / 2,
      y: bottomRack.y - bottomExposureHeight - tablePaddingTop,
      width: bottomExposureWidth,
      height: bottomExposureHeight,
    };

    /**
     * Instruction card:
     * Smaller and higher than desktop card.
     * Must not cover the rack or pass selector.
     */

    const instructionWidth = this.clamp(
      tableOuter.width * 0.60,
      180,
      220,
    );

    const instructionHeight = this.clamp(
      tableOuter.height * 0.078,
      120,
      180,
    );

    //const instructionWidth = this.clamp(tableOuter.width * 0.72, 250, 340);
    //const instructionHeight = this.clamp(tableOuter.height * 0.22, 150, 190);

    /* const instructionBar: Rect = {
      x: safeCenterX - instructionWidth / 2,
      y: tableOuter.y + tableOuter.height * 0.325,
      width: instructionWidth,
      height: instructionHeight,
    }; */

    const instructionBar: Rect = {
      x: Math.round(safeCenterX - instructionWidth / 2),
      y: Math.round(
        tableOuter.y +
          tableOuter.height / 2 -
          instructionHeight / 2,
      ),
      width: instructionWidth,
      height: instructionHeight,
    };

    const passButtonWidth = this.clamp(
      instructionWidth * 0.34,
      62,
      86,
    );

    const passButtonHeight = this.clamp(
      instructionHeight * 0.25,
      20,
      28,
    );

    const passButton: Rect = {
      x: instructionBar.x + instructionBar.width / 2 - passButtonWidth / 2,
      y:
        instructionBar.y +
        instructionBar.height -
        passButtonHeight -
        instructionHeight * 0.12,
      width: passButtonWidth,
      height: passButtonHeight,
    };

    /**
     * Discard area:
     * Give the center most of the remaining vertical space.
     */

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

    const hud: Rect = {
      x: safeLeft,
      y: safeTop,
      width: safeWidth,
      height: hudHeight,
    };

 
    const labelY = horizontalLabelCenterRatio("mobile-portrait");
    const leftLabelX = leftLabelCenterRatio("mobile-portrait");
    const rightLabelX = rightLabelCenterRatio("mobile-portrait");
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
      /* topLabel: {
        x: topExposure.x + topExposure.width / 2,
        y: topExposure.y + topExposure.height * 0.855,
      },

      leftLabel: {
        x: leftExposure.x + leftExposure.width * 0.915,
        y: leftExposure.y + leftExposure.height * 0.5,
      },

      rightLabel: {
        x: rightExposure.x + rightExposure.width * 0.085,
        y: rightExposure.y + rightExposure.height * 0.5,
      },

      username: {
        x: bottomExposure.x + bottomExposure.width / 2,
        y: bottomExposure.y + bottomExposure.height * 0.855,
      },
 */
      topLabel: {
        x: topExposure.x + topExposure.width / 2,
        y: topExposure.y + topExposure.height * labelY,
      },

      leftLabel: {
        x: leftExposure.x + leftExposure.width * leftLabelX,
        y: leftExposure.y + leftExposure.height / 2,
      },

      rightLabel: {
        x: rightExposure.x + rightExposure.width * rightLabelX,
        y: rightExposure.y + rightExposure.height / 2,
      },

      username: {
        x: bottomExposure.x + bottomExposure.width / 2,
        y: bottomExposure.y + bottomExposure.height * labelY,
      },
      isMobile: metrics.isMobile,
      metrics,
    };
  }
  private computeResponsiveMetrics(
    width: number,
    height: number,
    viewport: DeviceLayoutState,
  ): ResponsiveMetrics {
    const shortest = Math.min(width, height);
    const isPortrait = viewport.orientation === "portrait";
    const isMobile =
      viewport.layout === "phone-portrait" ||
      viewport.layout === "phone-landscape";
    const isTablet =
      viewport.layout === "tablet-portrait" ||
      viewport.layout === "tablet-landscape";

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
  
  private computeTileLayout(
    rack: Rect,
    count: number,
    canvasWidth: number,
    config: GameTableConfig,
    mobilePortrait = false,
  ): TileLayout {
    const isMobile = canvasWidth < 640;
    const isTablet = canvasWidth >= 640 && canvasWidth < 1024;

    /**
     * Mobile portrait needs the largest readable tile possible.
     * We use small negative overlap on mobile only.
     */
    // Portrait keeps a modest overlap: larger than the original tile size,
    // while leaving a clearer gap between adjacent rack tiles.
    const overlapRatio = isMobile ? (mobilePortrait ? 0.15 : 0.14) : 0;

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
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /** Small, consistent blue-table gutter around exposure panels and racks. */
  private tableEdgeInset(table: Rect): number {
    return this.clamp(Math.min(table.width, table.height) * 0.018, 8, 18);
  }

  /** Keeps a small clearance between the exposure panels and the discard area. */
  private discardPanelGap(table: Rect): number {
    return this.clamp(Math.min(table.width, table.height) * 0.012, 5, 12);
  }
}
