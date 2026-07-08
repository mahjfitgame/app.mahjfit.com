// file: src/app/module/business/game/tiles/tile-atlas.config.ts
export const TILE_ATLAS_1X_KEY = "mahjong-tiles-1x";
export const TILE_ATLAS_2X_KEY = "mahjong-tiles-2x";

export interface TileAtlasSelection {
  readonly atlasKey: string;
  readonly suffix: "" | "@2x";
}

function isMobilePortraitOnly(): boolean {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return width < 640 && height > width;
}

export function selectTileAtlas(tileDisplayWidth = 0): TileAtlasSelection {
  /**
   * Mobile portrait only:
   * use current trimmed 1x atlas because uploaded 2x atlas is not truly 2x.
   *
   * This must NOT affect:
   * - mobile landscape
   * - tablets / iPad
   * - desktop
   */
  return { atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" };
  if (isMobilePortraitOnly()) {
    return { atlasKey: TILE_ATLAS_1X_KEY, suffix: "" };
  }

  const dpr = window.devicePixelRatio || 1;

  if (tileDisplayWidth >= 48 || dpr >= 2) {
    return { atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" };
  }

  return { atlasKey: TILE_ATLAS_1X_KEY, suffix: "" };
}

export function selectTileAtlasOLD(tileDisplayWidth = 0): TileAtlasSelection {
  if (tileDisplayWidth >= 48 || window.devicePixelRatio >= 2) {
    return { atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" };
  }

  return { atlasKey: TILE_ATLAS_1X_KEY, suffix: "" };
}

export function selectTileAtlasW(devicePixelRatio = window.devicePixelRatio): TileAtlasSelection {
  //return  { atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" }
  return devicePixelRatio >= 1.25
    ? { atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" }
    : { atlasKey: TILE_ATLAS_1X_KEY, suffix: "" };
}