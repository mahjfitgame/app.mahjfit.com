// file: src/app/module/business/game/state.ts

import { computed, effect, inject, Service } from "@angular/core";
import { BotLevelModeEnum, Game, GameAllowJoinEnum, GameCreateInputDto, GameCreateOutputDto, GameEngine, GameModeEnum, GameService, GameStateOutputDto, GameStatePublicStartInputDto } from "@bfw/api-sdk/graphql/endpoints/business";
import { ConfService } from "@libs/conf/service";
import { FoundationModuleStateType } from "@libs/foundation-module/type/state";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { GlobalProgressBarService } from "src/app/base/global-progress-bar/service";
import { GAME_STATE_STORE_KEY } from "../const";
import { ContextProfileService } from "@libs/context-profile/service";
import { GameStateFieldEnum } from "../enum";
import { GameStateCreated } from "./type";
import { BfwApiSdkError, BfwApiSdkResponse } from "@bfw/api-sdk/core";

@Service({ autoProvided: false })
export class GameState extends SignalStateService implements FoundationModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);


    // ████ CLASS PROPERTIES ████████████████████████████████████████████
    public override readonly storeKey = GAME_STATE_STORE_KEY;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a


    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████
    private readonly _gkeyid = this.cookiePersistSignal<string | null>(
        GameStateFieldEnum.GAME_KEYID,
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateGkeyid,
            deleteOnNull: true,
            source: {
                path: '/',
            }
        }
    );
    public readonly gkeyid = this._gkeyid.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _createdGame = this.cookiePersistSignal<GameStateCreated | null>(
        GameStateFieldEnum.CREATED_GAME,
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateCreatedGame,
            deleteOnNull: true,
            source: {
                path: '/',
            }
        }
    );
    public readonly createdGame = this._createdGame.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _game = this.cookiePersistSignal<GameStateOutputDto | null>(
        GameStateFieldEnum.GAME,
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateGame,
            deleteOnNull: true,
            source: {
                path: '/',
            }
        }
    );
    public readonly game = this._game.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬


    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    public readonly debugState = computed(() => ({

    }));

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();

        // load api service
        this.api.sdk.graphql.use(Game);
        this.api.sdk.graphql.use(GameEngine);
    }

    // ████ LISTENERS ███████████████████████████████████████████████████
    public override onActivate(): void {
        // later on update bfw api headers as signal state change
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }


        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());

        // the context authenticated resource resyncs itself, its params track ready() and authenticated()
    }
    public override onDeactivate(): void {

    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    public setGkeyid(value: string | null | undefined): void {
        if (value) {
            this._gkeyid.set(value);
            return;
        }
        this.clearGkeyid();
    }

    public clearGkeyid(): void {
        this._gkeyid.set(null);
    }



    public setCreatedGame(value: GameStateCreated | null | undefined): void {
        if (value) {
            this._createdGame.set(value);
            return;
        }
        this.clearCreatedGame();
    }

    public clearCreatedGame(): void {
        this._createdGame.set(null);
    }

    public setGame(value: GameStateOutputDto | null | undefined): void {
        if (value) {
            this._game.set(value);
            return;
        }
        this.clearGame();
    }

    public clearGame(): void {
        this._game.set(null);
    }

    // ████ HELPER METHODS ██████████████████████████████████████
    // n/a


    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    private validateGkeyid(value: unknown): value is string | null {
        return typeof value === 'string' || value === null;
    }

    private validateCreatedGame(value: unknown): value is GameStateCreated | null {
        return (typeof value === 'object' && (value as any)?.keyid) || value === null;
    }

    private validateGame(value: unknown): value is GameStateOutputDto | null {
        return (typeof value === 'object' && (value as any)?.keyid) || value === null;
    }
    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a


    // ████ API CALLS ███████████████████████████████████████████████████
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
                },
                input: [
                    gameCreateInput
                ]
            });

            if (http.data.length > 0) {
                const arrResponse = http.data[0];
                this.setCreatedGame(arrResponse);
                return arrResponse;
            }
        } catch (e: any | BfwApiSdkError) {
            this.log.error('GAME CREATE ERROR', e);
        }
        return false;
    }
    public async startGame() {
        try {
            const gkeyid = this.gkeyid();

            const createdGame = this.createdGame();


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
                this.setGame(startResp.data);
                return startResp;
            }
        } catch (error) {
            this.log.error('ERROR START GAME', error);
            return false;
        }
        return false;

    }

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
