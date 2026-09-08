import { computed, inject, Service } from "@angular/core";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { BotLevelModeEnum, Game, GameAllowJoinEnum, GameCreateInputDto, GameCreateOutputDto, GameEngine, GameModeEnum, GamePlayAction, GamePlayActionEnum, GameRackIDEnum, GameStateActionCharlestoneInputDto, GameStateOutputDto, GameStatePublicStartInputDto, TileCategoryEnum, TileCategoryEnumAddon, TileEntityGSDto, TileRankEnum, TileTypeEnum, TileTypeEnumAddon } from "@bfw/api-sdk/graphql/endpoints/business";
import { BfwApiSdkError, BfwApiSdkResponse } from "@bfw/api-sdk/core";
import { ContextProfileService } from "@libs/context-profile/service";
import { TileSoundKey, TileSuit, TileTextureRef } from "./type";
import { GameRoute } from "./route";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { I18nService } from "src/app/base/internationalization/service";
import { GameState } from "./state/state";
import { GAME_I18N_KEY, TILE_ATLAS_1X_KEY, TILE_ATLAS_2X_KEY } from "./const";
import { TileAtlasSelection } from "./type";
import { FoundationModuleServiceType } from "@libs/foundation/module/type";

@Service({ autoProvided: false })
export class GameService implements FoundationModuleServiceType {
    public readonly api = inject(BfwApiService);
    public readonly ctxp = inject(ContextProfileService);


    public readonly route = inject(GameRoute);
    public readonly state = inject(GameState);

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);
    // state

    constructor() {

    }

    /*
    // Component code    
    public async ngAfterViewInit(): Promise<void> {
        await this.startGame();
    }
    */

    public initI18n(): void {
        this.i18n.useModule(GAME_I18N_KEY);
    }
    public setModuleInfo(): void {

    }
    public alterBreadcrumb(): void {

    }

    public resolveTileSoundKey(tile: TileEntityGSDto): TileSoundKey {
        // category 1 = Suit, 2 = Wind, 3 = Dragon, 4 = Flower, 5 = Joker
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.BAM) return `${tile.rank}-bam` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.CHAR) return `${tile.rank}-crack` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.DOT) return `${tile.rank}-dot` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.JOKER) return `joker` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.FLOWER_SPRING) return `flower` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.FLOWER_SUMMER) return `flower` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.FLOWER_AUTUMN) return `flower` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.FLOWER_WINTER) return `flower` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.WIND_EAST) return `east` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.WIND_SOUTH) return `south` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.WIND_WEST) return `west` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.WIND_NORTH) return `north` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.DRAGON_RED) return `red` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.DRAGON_GREEN) return `green` as TileSoundKey;
        if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.DRAGON_WHITE) return `soap` as TileSoundKey;


        // Add more specific sounds for winds, dragons if needed. 
        // For now, fallback to generic or throw if the old logic was strict
        // Since old logic threw error for anything not a suit:
        throw new Error(`Unsupported tile sound: ${JSON.stringify(tile)}`);
    }

    public resolve(tile: TileEntityGSDto, tileDisplayWidth: number): TileTextureRef {
        const atlas = this.selectTileAtlas(tileDisplayWidth);

        return {
            atlasKey: atlas.atlasKey,
            frameKey: `${this.assetBaseName(tile)}${atlas.suffix}.png`,
        };
    }

    private resolveOL(tile: TileEntityGSDto): TileTextureRef {
        const atlas = this.selectTileAtlas();


        return {
            atlasKey: atlas.atlasKey,
            frameKey: `${this.assetBaseName(tile)}${atlas.suffix}.png`,
        };
    }

    public assetBaseName(tile: TileEntityGSDto): string {
        switch (tile.category as any as TileCategoryEnumAddon) {
            case TileCategoryEnumAddon.SUITED: // Suits
                if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.BAM) return `bam_${tile.rank}`;
                if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.CHAR) return `char_${tile.rank}`;
                if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.DOT) return `dot_${tile.rank}`;
                break;
            case TileCategoryEnumAddon.WIND: // Winds
                if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.WIND_EAST) return "wind_e";
                if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.WIND_SOUTH) return "wind_s";
                if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.WIND_WEST) return "wind_w";
                if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.WIND_NORTH) return "wind_n";
                break;
            case TileCategoryEnumAddon.DRAGON: // Dragons
                if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.DRAGON_RED) return "dragon_red";
                if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.DRAGON_GREEN) return "dragon_green";
                if (tile.type as any as TileTypeEnumAddon === TileTypeEnumAddon.DRAGON_WHITE) return "dragon_white";
                break;
            case TileCategoryEnumAddon.FLOWER: // Flowers
                return `flower_${tile.rank}`;
            case TileCategoryEnumAddon.JOKER: // Jokers
                // There are 8 joker images (joker_1.png to joker_8.png), mapping by rank or just 1
                return `joker_${tile.rank || 1}`;
        }

        throw new Error(`Invalid tile asset data: ${JSON.stringify(tile)}`);
    }

    private isMobilePortraitOnly(): boolean {
        const width = window.innerWidth;
        const height = window.innerHeight;

        return width < 640 && height > width;
    }

    public selectTileAtlas(tileDisplayWidth = 0): TileAtlasSelection {
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
        /* if (this.isMobilePortraitOnly()) {
            return { atlasKey: TILE_ATLAS_1X_KEY, suffix: "" };
        }

        const dpr = window.devicePixelRatio || 1;

        if (tileDisplayWidth >= 48 || dpr >= 2) {
            return { atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" };
        }

        return { atlasKey: TILE_ATLAS_1X_KEY, suffix: "" }; */
    }

    private selectTileAtlasOLD(tileDisplayWidth = 0): TileAtlasSelection {
        if (tileDisplayWidth >= 48 || window.devicePixelRatio >= 2) {
            return { atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" };
        }

        return { atlasKey: TILE_ATLAS_1X_KEY, suffix: "" };
    }

    private selectTileAtlasW(devicePixelRatio = window.devicePixelRatio): TileAtlasSelection {
        //return  { atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" }
        return devicePixelRatio >= 1.25
            ? { atlasKey: TILE_ATLAS_2X_KEY, suffix: "@2x" }
            : { atlasKey: TILE_ATLAS_1X_KEY, suffix: "" };
    }



    // ████ GUARDS ██████████████████████████████████████████████



    // ████ API CALLS ██████████████████████████████████████████████
}