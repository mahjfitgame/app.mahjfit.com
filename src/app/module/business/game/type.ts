// file: src/app/module/business/game/type.ts

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

import { GamePhaseFirstRoundDirectionEnum, GamePhaseSecondRoundDirectionEnum } from "@bfw/api-sdk/graphql/endpoints/business";

export type PassDirection = GamePhaseFirstRoundDirectionEnum | GamePhaseSecondRoundDirectionEnum;



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