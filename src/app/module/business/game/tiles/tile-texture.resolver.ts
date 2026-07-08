// file: src/app/module/business/game/tiles/tile-texture.resolver.ts
import { TileVm } from "../model/tile";
import { selectTileAtlas } from "./tile-atlas.config";

export interface TileTextureRef {
  readonly atlasKey: string;
  readonly frameKey: string;
}

export class TileTextureResolver {
  resolve(tile: TileVm, tileDisplayWidth: number): TileTextureRef {
    const atlas = selectTileAtlas(tileDisplayWidth);

    return {
      atlasKey: atlas.atlasKey,
      frameKey: `${this.assetBaseName(tile.asset)}${atlas.suffix}.png`,
    };
  }
  resolveOL(tile: TileVm): TileTextureRef {
    const atlas = selectTileAtlas();

    return {
      atlasKey: atlas.atlasKey,
      frameKey: `${this.assetBaseName(tile.asset)}${atlas.suffix}.png`,
    };
  }

  private assetBaseName(assetPath: string): string {
    const fileName = assetPath.split("/").pop();

    if (!fileName) {
      throw new Error(`Invalid tile asset path: ${assetPath}`);
    }

    return fileName.replace(/\.(svg|png|webp|jpg|jpeg)$/i, "");
  }
}
/* import { TileVm } from "../model/tile";
import { selectTileAtlas } from "./tile-atlas.config";

export interface TileTextureRef {
  readonly atlasKey: string;
  readonly frameKey: string;
}

export class TileTextureResolver {
  resolve(tile: TileVm): TileTextureRef {
    const atlas = selectTileAtlas();

    return {
      atlasKey: atlas.atlasKey,
      frameKey: `${this.baseFrameName(tile)}${atlas.suffix}.png`,
    };
  }

  private baseFrameName(tile: TileVm): string {
    switch (tile.suit) {
      case "bam":
        return `bam_${tile.rank}`;

      case "char":
        return `char_${tile.rank}`;

      case "dot":
        return `dot_${tile.rank}`;

      case "dragon":
        return `dragon_${tile.rank}`;

      case "wind":
        return `wind_${tile.rank}`;

      case "flower":
        return `flower_${tile.rank}`;

      case "joker":
        return `joker_${tile.rank}`;

      default:
        throw new Error(`Unsupported tile suit: ${tile.suit}`);
    }
  }
} */