import type { TileSoundKey, TileSuit } from "./tile";

export interface TileSoundSource {
  readonly suit: TileSuit;
  readonly rank?: number;
  readonly label?: string;
  readonly code?: string;
}

export function resolveTileSoundKey(tile: TileSoundSource): TileSoundKey {
  if (tile.suit === "joker") {
    return "joker";
  }

  if (tile.suit === "flower") {
    return "flower";
  }

  if (tile.suit === "dot") {
    return numberedTileSoundKey(tile, "dot");
  }

  if (tile.suit === "bam") {
    return numberedTileSoundKey(tile, "bam");
  }

  if (tile.suit === "char") {
    return numberedTileSoundKey(tile, "crack");
  }

  const normalizedLabel = tile.label?.trim().toLowerCase();

  const fromCode = tile.code;

  if (normalizedLabel === "east") return "east";
  if (normalizedLabel === "south") return "south";
  if (normalizedLabel === "west") return "west";
  if (normalizedLabel === "north") return "north";
  if (fromCode === "DR") return "red";
  if (fromCode === "DG") return "green";
  if (fromCode === "DW") return "soap";

  throw new Error(`Unable to resolve tile sound key for ${JSON.stringify(tile)}`);
}

function numberedTileSoundKey(
  tile: TileSoundSource,
  suitSoundName: "dot" | "bam" | "crack",
): TileSoundKey {
  const rank = tile.rank ?? extractRankFromLabel(tile.label);

  if (!rank || rank < 1 || rank > 9) {
    throw new Error(`Invalid numbered tile rank for ${JSON.stringify(tile)}`);
  }

  return `${rank}-${suitSoundName}` as TileSoundKey;
}

function extractRankFromLabel(label: string | undefined): number | undefined {
  if (!label) {
    return undefined;
  }

  const match = label.match(/\d+/);
  if (!match) {
    return undefined;
  }

  return Number(match[0]);
}