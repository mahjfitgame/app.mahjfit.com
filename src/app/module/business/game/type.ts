// file: src/app/module/business/game/type.ts

// ████ TILES █████████████████████████████████████████████████████
export interface TileVmInput {
    readonly id: string;
    readonly code: string;
    readonly label: string;
    readonly suit: TileSuit;
    readonly rank?: number;
    readonly asset: string;
}

export interface TileSoundSource {
    readonly suit: TileSuit;
    readonly rank?: number;
    readonly label?: string;
    readonly code?: string;
}


export interface TileTextureRef {
    readonly atlasKey: string;
    readonly frameKey: string;
}

export interface TileAtlasSelection {
    readonly atlasKey: string;
    readonly suffix: "" | "@2x";
}

export type TileSuit =
    | "dot"
    | "bam"
    | "char"
    | "flower"
    | "joker"
    | "wind"
    | "dragon";


export type TileSoundKey =
    | "1-bam"
    | "2-bam"
    | "3-bam"
    | "4-bam"
    | "5-bam"
    | "6-bam"
    | "7-bam"
    | "8-bam"
    | "9-bam"
    | "1-crack"
    | "2-crack"
    | "3-crack"
    | "4-crack"
    | "5-crack"
    | "6-crack"
    | "7-crack"
    | "8-crack"
    | "9-crack"
    | "1-dot"
    | "2-dot"
    | "3-dot"
    | "4-dot"
    | "5-dot"
    | "6-dot"
    | "7-dot"
    | "8-dot"
    | "9-dot"
    | "east"
    | "south"
    | "west"
    | "north"
    | "red"
    | "green"
    | "soap"
    | "joker"
    | "flower";

export interface TileVm {
    readonly id: string;
    readonly label: string;
    readonly suit: TileSuit;
    readonly asset: string;

    /**
     * Audio asset key for spoken discard sound.
     * Example: "1-bam", "2-char", "soap", "joker", "flower"
     */
    readonly soundKey: TileSoundKey;
}

export type PassDirection = "left" | "right" | "across";



// ████ HEPTIC ████████████████████████████████████████████████

export type GameHapticType =
    | "tile-tap"
    | "tile-discard"
    | "tile-pass"
    | "tile-return"
    | "pick"
    | "pass-submit";





// ████ DEPENDENCIES ████████████████████████████████████████████████






// ████ DEPENDENCIES ████████████████████████████████████████████████