import { computed, inject, Service } from "@angular/core";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { BotLevelModeEnum, Game, GameAllowJoinEnum, GameCreateInputDto, GameCreateOutputDto, GameEngine, GameModeEnum, GamePlayAction, GamePlayActionEnum, GameRackIDEnum, GameStateActionCharlestoneInputDto, GameStateOutputDto, GameStatePublicStartInputDto } from "@bfw/api-sdk/graphql/endpoints/business";
import { BfwApiSdkError, BfwApiSdkResponse } from "@bfw/api-sdk/core";
import { ContextProfileService } from "@libs/context-profile/service";
import { TileVmInput, TileSoundKey, TileSuit, TileVm, TileTextureRef } from "./type";
import { FoundationModuleServiceType } from "@libs/foundation-module/type/service";
import { CrudChildServiceType } from "src/app/base/crud/child/service";
import { CrudService } from "src/app/base/crud/service";
import { GameRoute } from "./route";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { I18nService } from "src/app/base/internationalization/service";
import { GameState } from "./state/state";
import { GAME_I18N_KEY, TILE_ATLAS_1X_KEY, TILE_ATLAS_2X_KEY } from "./const";
import { TileAtlasSelection } from "./type";

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
    public createTileVm(input: TileVmInput): TileVm {
        return {
            id: input.id,
            label: input.label,
            suit: input.suit,
            asset: input.asset,
            soundKey: this.resolveTileSoundKey(input),
        };
    }
    private resolveTileSoundKey(tile: {
        suit: TileSuit;
        rank?: number;
        name?: string;
        isJoker?: boolean;
        isFlower?: boolean;
    }): TileSoundKey {
        if (tile.isJoker) return "joker";
        if (tile.isFlower) return "flower";

        if (tile.name === "soap") return "soap";
        if (tile.name === "east") return "east";
        if (tile.name === "south") return "south";
        if (tile.name === "west") return "west";
        if (tile.name === "north") return "north";
        if (tile.name === "red") return "red";
        if (tile.name === "green") return "green";

        if (!tile.rank) {
            throw new Error(`Missing tile rank for sound key: ${JSON.stringify(tile)}`);
        }

        if (tile.suit === "bam") return `${tile.rank}-bam` as TileSoundKey;
        if (tile.suit === "char") return `${tile.rank}-char` as TileSoundKey;
        if (tile.suit === "dot") return `${tile.rank}-dot` as TileSoundKey;

        throw new Error(`Unsupported tile sound: ${JSON.stringify(tile)}`);
    }

    public resolve(tile: TileVm, tileDisplayWidth: number): TileTextureRef {
        const atlas = this.selectTileAtlas(tileDisplayWidth);

        return {
            atlasKey: atlas.atlasKey,
            frameKey: `${this.assetBaseName(tile.asset)}${atlas.suffix}.png`,
        };
    }
    private resolveOL(tile: TileVm): TileTextureRef {
        const atlas = this.selectTileAtlas();

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
    public async createGame(): Promise<GameCreateOutputDto | false> {
        try {
            const gameCreateInput: GameCreateInputDto = {
                allow_join: GameAllowJoinEnum.PUBLIC,
                botlvl_id: BotLevelModeEnum.FAST,
                grule_id: 5,
                mode: GameModeEnum.FOUR_PLAYERS,
                owner_u_id: 65,
                dealer_u_id: 65,
                current_turn_u_id: 65,
                tilest_id: 1,
            }

            const http: BfwApiSdkResponse<GameCreateOutputDto[]> = await this.api.sdk.graphql.game.create({
                selection: {
                    allow_join: true,
                    created: true,
                    current_turn_u_id: true,
                    dealer_u_id: true,
                    deleted: true,
                    id: true,
                    keyid: true,
                    hint: true,
                    mode: true,
                    owner_u_id: true,
                    suspended: true,
                    grule_id: true,
                    tilest_id: true,
                    botlvl_id: true,
                    jwt: true,
                },
                input: [
                    gameCreateInput
                ]
            });

            if (http.data.length > 0) {
                const arrResponse = http.data[0];
                this.state.setCreatedGame(arrResponse);
                return arrResponse;
            }
        } catch (e: any | BfwApiSdkError) {
            this.log.error('GAME CREATE ERROR', e);
        }
        return false;
    }
    public async startGame() {
        try {
            const gkeyid = this.state.gkeyid();

            const createdGame = this.state.createdGame();


            const gameStartInput: GameStatePublicStartInputDto = ({
                ...createdGame,
                // ensure required fields for GameStatePublicStartInputDto
                owner_u_id: createdGame?.owner_u_id ?? createdGame?.current_turn_u_id ?? 0,
            } as unknown) as GameStatePublicStartInputDto;

            const startResp: BfwApiSdkResponse<GameStateOutputDto> = await this.api.sdk.graphql.gameEngine.publicStart({
                selection: {
                    current_turn_rack_id: true,
                    current_turn_seat_id: true,
                    phase: true,
                    turn_stage: true,
                    wall_count: true,
                    pass: {
                        count: true,
                        direction: true,
                        round: true,
                        submissions: true,
                        second_votes: true,
                        stage: true,
                    },
                    claim: {
                        from_seat: true,
                        deadline_at: true,
                        intents: true,
                        tile: {
                            id: true,
                            tile_id: true,
                            gseat_id: true,
                            in_exposer_one: true,
                            in_rack_one: true,
                            sort_exposer_one: true,
                            sort_rack_one: true,
                            in_exposer_two: true,
                            in_rack_two: true,
                            sort_exposer_two: true,
                            sort_rack_two: true,
                            updated: true,
                        }
                    },
                    game: {
                        id: true,
                        allow_join: true,
                        mode: true,
                        botlvl_id: true,
                        current_turn_u_id: true,
                        grule_id: true,
                    },
                    seats: true,
                    all_tiles: true,
                    bot_profile: {
                        id: true,
                        botlvl_id: true,
                        title: true,
                        think_time_min_ms: true,
                        think_time_max_ms: true,
                        claim_aggression: true,
                        defense_weight: true,
                        hand_reading_weight: true,
                        discard_safety_weight: true,
                        joker_usage_weight: true,
                        exposure_preference: true,
                        error_rate: true,
                        randomness: true,
                        react_to_danger: true,
                        charleston_quality: true,
                        active: true,
                        deleted: true,
                    }
                },
                input: gameStartInput
            });

            if (startResp?.data) {
                this.state.setGame(startResp.data);
                return startResp;
            }
        } catch (error) {
            this.log.error('ERROR START GAME', error);
        }

    }

    public async afterGameStart(): Promise<void> {
        // connect to web socket to listen the game live events
        //await this.api.sdk.graphql.ws.connect();
    }


    public async startGameCharlestone() {
        try {

            // load api service
            this.api.sdk.graphql.use(Game);

            const clientInput: GameStateActionCharlestoneInputDto = {
                game_id: 24,
                from_gseat_id: 1045,
                gpaction_id: GamePlayActionEnum.CHARLESTONST1RIGHT,
                tile_ids: [
                    104,
                    112,
                    115
                ],
                rack_id: GameRackIDEnum.RACK_FIRST,
                u_id: 65
            }

            const http: BfwApiSdkResponse<GameStateOutputDto> = await this.api.sdk.graphql.gameEngine.actionCharlestone({
                selection: {
                    current_turn_rack_id: true,
                    current_turn_seat_id: true,
                    phase: true,
                    turn_stage: true,
                    wall_count: true,
                    pass: {
                        count: true,
                        direction: true,
                        round: true,
                        submissions: true,
                        second_votes: true,
                        stage: true,
                    },
                    claim: {
                        from_seat: true,
                        deadline_at: true,
                        intents: true,
                        tile: {
                            id: true,
                            tile_id: true,
                            gseat_id: true,
                            in_exposer_one: true,
                            in_rack_one: true,
                            sort_exposer_one: true,
                            sort_rack_one: true,
                            in_exposer_two: true,
                            in_rack_two: true,
                            sort_exposer_two: true,
                            sort_rack_two: true,
                            updated: true,
                        }
                    },
                    game: {
                        id: true,
                        allow_join: true,
                        mode: true,
                        botlvl_id: true,
                        current_turn_u_id: true,
                        grule_id: true,
                    },
                    seats: true,
                    all_tiles: true,
                    bot_profile: {
                        id: true,
                        botlvl_id: true,
                        title: true,
                        think_time_min_ms: true,
                        think_time_max_ms: true,
                        claim_aggression: true,
                        defense_weight: true,
                        hand_reading_weight: true,
                        discard_safety_weight: true,
                        joker_usage_weight: true,
                        exposure_preference: true,
                        error_rate: true,
                        randomness: true,
                        react_to_danger: true,
                        charleston_quality: true,
                        active: true,
                        deleted: true,
                    }
                },
                input: [
                    clientInput
                ]
            });
            //console.log('START', http);
        } catch (error) {
            console.log('ERROR', error);
        }

    }
}
/*

public async clientServerHandShake(): Promise<string | false> {
        // TODO: need to add or setup logic when user logged in or already logged in we might need to update token with logged in user id
        // need to find some way and work around for this
        try {
            // load api service
            this.api.sdk.graphql.use(UserAuthentication);

            // if token is not exist, get required data
            const hsi = await this.ps.handShakeInfo();

            // set input for new hand shake
            const clientInput: UserDeviceHandShakeInputDto = {
                dtoken: '0', // by default for new device there is no dtoken
                dpid: hsi.dpid ?? '0', // this is possible to get from native platform but in some case it might be missing 

                //u_id: 0,
                //user_defined_id: hsi.user_defined_id,
                //user_defined_name: hsi.user_defined_name,

                from_ip_address: hsi.from_ip_address,
                mac_address: hsi.mac_address,

                avatar: hsi.avatar,
                useragent: hsi.useragent,
                platform: hsi.platform,
                language: hsi.language,
                timezone: hsi.timezone,
                screen_width: Number(hsi.screen_width),
                screen_height: Number(hsi.screen_height),
                device_pixel_ratio: Number(hsi.device_pixel_ratio),
                hardware_concurrency:hsi.hardware_concurrency,
                max_touch_points: hsi.max_touch_points,
                device_memory: hsi.device_memory,
            };

            // if token is alreadu exist
            if(this.session.state.dtoken() && this.session.state.dtoken() !== null && this.session.state.dtoken() !== ''){
                this.log.info('[AppService] Client/Server Handshake Token Found.');
                // set input for found token hand shake
                clientInput.dtoken = this.session.state.dtoken() as string;
                clientInput.dpid = this.session.state.dpid() as string;
                clientInput.keyid = this.session.state.dkeyid() ?? undefined
            }
            
            // set api headers, as its sartup need to make sure the headers are set for initial api call
            this.session.state.configureBfwApiHeaders();

            // api handshake: check if existing or add new both in one request
            const resp: AppClientServerHandShakeOutputDto = await this.api.sdk.graphql.userAuthentication.appClientServerHandShake({
                selection: {
                    server: {
                        //id: true,
                        //u_id: true,
                        //device_id: true,
                        keyid: true,
                        dtoken: true,
                        dpid: true,
                    },
                    skeyid: true
                },
                input: {
                    client: clientInput,
                }
            });

            const server = resp.server;
            const skeyid = resp.skeyid;

            // set hand shake identity
            if (server && Object.keys(server).length > 0 && server.dtoken) {
                // set verified client info by server in state
                this.session.state.setDtoken(server.dtoken);
                this.session.state.setDpid(server.dpid ?? null);
                this.session.state.setDkeyid(server.keyid ?? null);

                // set user session info in state
                this.session.state.setSkeyid(skeyid ?? null);

                return server?.dtoken ?? null;
            }

            // handshake failed so do not allow app to run
            this.log.error('Client/Server hand shake failed.');
        } catch (e: any) {
            this.log.error(e);
        }
        return false;
    }
*/