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