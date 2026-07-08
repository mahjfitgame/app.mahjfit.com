export interface GameTableConfig {
  readonly colors: {
    readonly page: number;
    readonly exposure: number;
    readonly discard: number;
    readonly panel: number;
    readonly accent: number;
    readonly lime: string;
    readonly white: string;
  };
  readonly rack: {
    readonly tileAspect: number;
    readonly maxTileWidthDesktop: number;
    readonly maxTileWidthTablet: number;
    readonly maxTileWidthMobile: number;
    readonly minTileWidth: number;
    readonly gapRatio: number;
  };
  readonly animation: {
    readonly passDurationMs: number;
    readonly dragReturnMs: number;
  };
}

export const GAME_TABLE_CONFIG: GameTableConfig = {
  colors: {
    page: 0x2f4d99,
    exposure: 0x6675ac,
    discard: 0x324f9a,
    panel: 0x2f4592,
    accent: 0xcb2aa3,
    lime: "#e4f22c",
    white: "#ffffff",
  },
  rack: {
    tileAspect: 1.43,
    maxTileWidthDesktop: 76,
    maxTileWidthTablet: 58,
    maxTileWidthMobile: 34,
    minTileWidth: 22,
    gapRatio: 0.0045,
  },
  animation: {
    passDurationMs: 420,
    dragReturnMs: 180,
  },
};
/* export interface GameTableConfig {
  readonly colors: {
    readonly page: number;
    readonly tableOuter: number;
    readonly board: number;
    readonly panel: number;
    readonly accent: number;
    readonly lime: string;
    readonly white: string;
  };
  readonly rack: {
    readonly tileAspect: number;
    readonly maxTileWidthDesktop: number;
    readonly maxTileWidthTablet: number;
    readonly maxTileWidthMobile: number;
    readonly minTileWidth: number;
    readonly gapRatio: number;
    readonly bottomPaddingRatio: number;
  };
  readonly board: {
    readonly outerMarginRatio: number;
    readonly portraitMarginRatio: number;
    readonly instructionBarRatio: number;
    readonly minInstructionBar: number;
    readonly maxInstructionBar: number;
  };
  readonly animation: {
    readonly passDurationMs: number;
    readonly dragReturnMs: number;
  };
}

export const GAME_TABLE_CONFIG: GameTableConfig = {
  colors: {
    page: 0x2f4d99,
    tableOuter: 0x6675ac,
    board: 0x324f9a,
    panel: 0x2f4592,
    accent: 0xcb2aa3,
    lime: "#e4f22c",
    white: "#ffffff",
  },
  rack: {
    tileAspect: 1.43,
    maxTileWidthDesktop: 70,
    maxTileWidthTablet: 54,
    maxTileWidthMobile: 34,
    minTileWidth: 22,
    gapRatio: 0.008,
    bottomPaddingRatio: 0.045,
  },
  board: {
    outerMarginRatio: 0.035,
    portraitMarginRatio: 0.045,
    instructionBarRatio: 0.075,
    minInstructionBar: 44,
    maxInstructionBar: 78,
  },
  animation: {
    passDurationMs: 420,
    dragReturnMs: 180,
  },
}; */