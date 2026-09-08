// file: src/app/module/business/game/state.ts

import { computed, effect, inject, Service, signal } from "@angular/core";
import { BotLevelModeEnum, Game, GameAllowJoinEnum, GameBoatProfileEntityGSDto, GameCharlestoneStageEnum, GameCharlestoneStageEnumAddon, GameCreateInputDto, GameCreateOutputDto, GameEngine, GameEngineWs, GameEngineWsToken, GameModeEnum, GamePersonalClaimOutputGSDto, GamePersonalPassOutputGSDto, GamePersonalSeatEntityGSDto, GamePhaseEnum, GamePhaseFirstRoundDirectionEnum, GamePhaseFirstRoundDirectionEnumAddon, GamePhaseSecondRoundDirectionEnum, GamePlayAction, GamePlayActionEnum, GamePlayActionEnumAddon, GameRackDeadInfoGSOutputDto, GameRackExposuresMeldEntityGSDto, GameRackIDEnum, GameRackIDEnumAddon, GameService, GameStateGameOutputDto, GameStateOutputDto, GameStatePersonalOutputDto, GameStatePlayOutputDto, GameStatePublicStartInputDto, GameTileEntityGSDto, GameTurnStageEnum, TileEntity, TileEntityGSDto, TileStyleFindInputWhereDto, TileStyleFindOutputDto } from "@bfw/api-sdk/graphql/endpoints/business";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { GlobalProgressBarService } from "src/app/base/global-progress-bar/service";
import { GAME_STATE_STORE_KEY } from "../const";
import { ContextProfileService } from "@libs/context-profile/service";
import { GameStateFieldEnum } from "../enum";
import { GameStateCreated } from "./type";
import { BfwApiSdkError, BfwApiSdkResponse } from "@bfw/api-sdk/core";
import { FoundationModuleStateType } from "@libs/foundation/module/type";

@Service({ autoProvided: false })
export class GameState extends SignalStateService implements FoundationModuleStateType {

    private initializationPromise: Promise<boolean> | null = null;

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


    // ████ _urlGkeyid SIGNAL ███████████████████████████████████████████
    private readonly _urlGkeyid = this.cookiePersistSignal<string | null>(
        GameStateFieldEnum.GAME_KEYID,
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateUrlGkeyid,
            deleteOnNull: true,
            source: {
                path: '/',
            }
        }
    );

    private unsubscribePlay: unknown = null;
    private unsubscribePersonal: unknown = null;

    private validateUrlGkeyid(value: unknown): value is string | null {
        return typeof value === 'string' || value === null;
    }

    public setUrlGkeyid(value: string | null | undefined): void {
        if (value) {
            this._urlGkeyid.set(value);
            return;
        }
        this.clearUrlGkeyid();
    }

    public clearUrlGkeyid(): void {
        this._urlGkeyid.set(null);
    }

    // ████ _createdGame SIGNAL ███████████████████████████████████████████
    public readonly createdGame = this.cookiePersistSignal<GameStateCreated | null>(
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
        },
    );

    private validateCreatedGame(value: unknown): value is GameStateCreated | null {
        return (typeof value === 'object' && (value as any)?.keyid) || value === null;
    }

    public setCreatedGame(value: GameStateCreated | null | undefined): void {
        if (value) {
            this.createdGame.set(value);
            return;
        }
        this.clearCreatedGame();
    }

    public clearCreatedGame(): void {
        this.createdGame.set(null);
    }

    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬
    // ████ [1] _game SIGNAL ███████████████████████████████████████████
    private readonly _game = signal<GameStateGameOutputDto>({} as GameStateGameOutputDto);
    private readonly game = this._game.asReadonly();

    public setGame(value: GameStateGameOutputDto): void {
        this._game.set(value);
    }

    // ████ [2] _play SIGNAL ███████████████████████████████████████████
    private readonly _play = signal<any>({} as any); // change any with respected type
    private readonly play = this._play.asReadonly();

    public setPlay(value: GameStatePlayOutputDto): void {
        this._play.set(value);
    }

    // ████ [3] _personal SIGNAL ███████████████████████████████████████████
    private readonly _personal = signal<any>({} as any); // change any with respected type
    private readonly personal = this._personal.asReadonly();

    public setPersonal(value: GameStatePersonalOutputDto): void {
        this._personal.set(value);
    }

    // ████ [4] _tileStyle SIGNAL ███████████████████████████████████████████
    public readonly tileStyle = signal<any>({} as any);

    // ████ _defaultTileStyleKeyid SIGNAL ███████████████████████████████████████████
    public readonly defaultTileStyleKeyid = signal<string>('');

    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬

    // ████ game_id SIGNAL ███████████████████████████████████████████
    public readonly game_id = computed<number>(() => {
        return this.game().id as number;
    });

    // ████ game_keyid SIGNAL ███████████████████████████████████████████
    public readonly game_keyid = computed<string>(() => {
        return this.game().keyid as string; // make sure in  we have keyid availabe
    });

    // ████ game_all_tiles SIGNAL ███████████████████████████████████████████
    public readonly game_all_tiles = computed<Record<number, TileEntityGSDto>>((): Record<number, TileEntityGSDto> => { // need to add TileEntityGSDto in bfw and use
        const tiles = this.game().all_tiles;
        return tiles ? tiles : ({} as Record<number, TileEntityGSDto>);
    });
    // ████ game_mode SIGNAL ███████████████████████████████████████████
    public readonly game_mode = computed<GameModeEnum>(() => {
        return this.game().mode;
    });

    // ████ game_botlvl_id SIGNAL ███████████████████████████████████████████
    public readonly game_botlvl_id = computed<BotLevelModeEnum>(() => {
        return this.game().botlvl_id;
    });

    // ████ bot_profile SIGNAL ███████████████████████████████████████████
    public readonly game_bot_profile = computed<GameBoatProfileEntityGSDto>(() => {
        return this.game().bot_profile as GameBoatProfileEntityGSDto;
    });




    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬

    // ████ play_current_turn_rack_id SIGNAL ███████████████████████████████████████████
    /* public readonly play_current_turn_rack_id = computed<GameRackIDEnum>(() => {
        const key = this.play().current_turn_rack_id as keyof typeof GameRackIDEnumAddon;

        // Typecast the resolved value to your target enum
        return GameRackIDEnumAddon[key] as unknown as GameRackIDEnum;
        //return GameRackIDEnumAddon[this.play().current_turn_rack_id];
    }); */

    public readonly play_current_turn_rack_id = computed<GameRackIDEnum>(() => {
        const rack_id = this.play()?.current_turn_rack_id as any;
        if (typeof rack_id === 'number') {
            return rack_id as unknown as GameRackIDEnum; // Keep it as a number
        } else {
            // Map string back to number
            return GameRackIDEnumAddon[rack_id as keyof typeof GameRackIDEnumAddon] as unknown as GameRackIDEnum;
        }
    });


    // ████ _play_current_turn_seat_id SIGNAL ███████████████████████████████████████████
    public readonly play_current_turn_seat_id = computed<number>(() => {
        return this.play().current_turn_seat_id;
    });

    // ████ _play_current_turn_u_id SIGNAL ███████████████████████████████████████████
    // delete this below comment once you done
    // this is not edfined at this moment you need to add in _play
    // before it was in _game but as its changing now its in _play
    private readonly _play_current_turn_u_id = computed<number>(() => {
        return this.play().current_turn_u_id;
    });


    // ████ play_phase SIGNAL ███████████████████████████████████████████
    public readonly play_phase = computed<GamePhaseEnum | undefined>(() => {
        const phase = this.play()?.phase as any;
        if (typeof phase === 'number') {
            if (phase === 1) return GamePhaseEnum.LOBBY;
            if (phase === 2) return GamePhaseEnum.PASSING;
            if (phase === 3) return GamePhaseEnum.PLAYING;
            if (phase === 4) return GamePhaseEnum.CLAIM;
            if (phase === 5) return GamePhaseEnum.FINISHED;
        }
        return phase;
    });
    // add public for all computed

    // ████ play_turn_stage SIGNAL ███████████████████████████████████████████
    public readonly play_turn_stage = computed<GameTurnStageEnum | undefined>(() => {
        const stage = this.play()?.turn_stage as any;
        if (typeof stage === 'number') {
            if (stage === 1) return GameTurnStageEnum.NEED_PICK;
            if (stage === 2) return GameTurnStageEnum.NEED_DISCARD;
        }
        return stage;
    });

    // ████ canDiscard SIGNAL ███████████████████████████████████████████
    public readonly canDiscard = computed(() => {
        const isMyTurn = this.play_current_turn_seat_id() === this.personal_seat_id();
        const needsDiscard = this.play_turn_stage() === GameTurnStageEnum.NEED_DISCARD;
        const isPlayingPhase = this.play_phase() === GamePhaseEnum.PLAYING;

        return isMyTurn && needsDiscard && isPlayingPhase;
    });

    // ████ canPickTile SIGNAL ███████████████████████████████████████████
    public readonly canPickTile = computed(() => {
        const isMyTurn = this.play_current_turn_seat_id() === this.personal_seat_id();
        const needsPick = this.play_turn_stage() === GameTurnStageEnum.NEED_PICK;
        const isPlayingPhase = this.play_phase() === GamePhaseEnum.PLAYING;

        return isMyTurn && needsPick && isPlayingPhase;
    });

    // ████ _play_wall_count SIGNAL ███████████████████████████████████████████
    public readonly play_round_count = signal<number>(1);
    public readonly play_action_error = signal<{ event: string, message: string } | null>(null);
    public readonly play_wall_count = computed<number>(() => {
        return this.play().wall_count;
    });

    // ████ play_discards_tiles SIGNAL ███████████████████████████████████████████
    public readonly play_discards_tiles = computed<GameTileEntityGSDto[]>(() => {
        return this.play()?.discards_tiles || [];
    });

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    // ████ play_pass_count SIGNAL ███████████████████████████████████████████
    private readonly play_pass_count = computed<number | undefined>(() => {
        return this.play()?.pass?.count;
    });

    public readonly play_pass_direction = computed<GamePhaseSecondRoundDirectionEnum | GamePhaseFirstRoundDirectionEnum | undefined>(() => {
        const direction = this.play()?.pass?.direction as any;
        if (typeof direction === 'number') {
            const stage = this.play_pass_stage();
            console.log('play_pass_direction', stage)
            if (stage === GameCharlestoneStageEnum.SECOND_DECISION) {
                return undefined;
            } /* else if (stage === GameCharlestoneStageEnum.COURTESY) {
                return GamePhaseFirstRoundDirectionEnum.ACROSS;
            } else if (stage === GameCharlestoneStageEnum.SECOND) {
                if (direction === 0) return GamePhaseSecondRoundDirectionEnum.LEFT;
                if (direction === 1) return GamePhaseSecondRoundDirectionEnum.ACROSS;
                if (direction === 2) return GamePhaseSecondRoundDirectionEnum.RIGHT;
            } */ else {
                if (direction === 0) return GamePhaseFirstRoundDirectionEnum.RIGHT;
                if (direction === 1) return GamePhaseFirstRoundDirectionEnum.ACROSS;
                if (direction === 2) return GamePhaseFirstRoundDirectionEnum.LEFT;
            }
        }
        return direction;
    });
    // ████ play_pass_round SIGNAL ███████████████████████████████████████████
    public readonly play_pass_round = computed<number | undefined>(() => {
        return this.play()?.pass?.round;
    });

    // ████ play_pass_stage SIGNAL ███████████████████████████████████████████
    public readonly play_pass_stage = computed<GameCharlestoneStageEnum | undefined>(() => {
        const stage = this.play()?.pass?.stage as any;
        if (typeof stage === 'number') {
            if (stage === 0) return GameCharlestoneStageEnum.FIRST;
            if (stage === 1) return GameCharlestoneStageEnum.SECOND_DECISION;
            if (stage === 2) return GameCharlestoneStageEnum.SECOND;
            if (stage === 3) return GameCharlestoneStageEnum.COURTESY;
        }
        return stage;
    });

    // ████ charlestonState SIGNAL ███████████████████████████████████████████
    public readonly charlestonState = computed(() => {
        console.log("charlestonState", {
            round: this.play_pass_round(),
            stage: this.play_pass_stage(),
            direction: this.play_pass_direction(),
            count: this.play_pass_count() // Usually used to check blind pass logic
        });

        const phase = this.play_phase();
        if (phase !== GamePhaseEnum.PASSING) {
            return null; // Not in Charleston
        }

        return {
            round: this.play_pass_round(),
            stage: this.play_pass_stage(),
            direction: this.play_pass_direction(),
            count: this.play_pass_count() // Usually used to check blind pass logic
        };
    });

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // ████ _play_claim_from_seat SIGNAL ███████████████████████████████████████████
    public readonly play_claim_from_seat = computed<number | undefined | null>(() => {
        return this.play()?.claim?.from_seat;
    });

    // ████ _play_claim_tile SIGNAL ███████████████████████████████████████████
    public readonly play_claim_tile = computed<GameTileEntityGSDto | undefined | null>(() => {
        return this.play()?.claim?.tile;
    });

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // ████ submit_claim SIGNAL ███████████████████████████████████████████
    public readonly active_claim = computed(() => {
        const claimObj = this.play()?.claim;
        if (claimObj && claimObj.u_id === this.personal_seat_u_id()) {
            return claimObj;
        }
        return null;
    });
    // ████ active_table_position SIGNAL ███████████████████████████████████████████
    public readonly active_table_position = computed<'bottom' | 'right' | 'top' | 'left' | null>(() => {
        const currentSeatId = this.play_current_turn_seat_id();
        if (!currentSeatId) return null;

        const seats = this.ordered_seats();
        const activeIndex = seats.findIndex(seat => seat.id === currentSeatId);
        if (activeIndex === -1) return null;

        const mapping = this.seat_mapping();
        for (const [position, index] of Object.entries(mapping)) {
            if (index === activeIndex) {
                return position as 'bottom' | 'right' | 'top' | 'left';
            }
        }

        return null;
    });

    // ████ seat_position_by_gseat_id SIGNAL ███████████████████████████████████████████
    public readonly seat_position_by_gseat_id = computed<(seatId: number) => 'bottom' | 'right' | 'top' | 'left' | null>(() => {
        const seats = this.ordered_seats();
        const mapping = this.seat_mapping();
        return (seatId: number) => {
            const index = seats.findIndex(seat => seat.id === seatId);
            if (index === -1) return null;
            for (const [position, mappedIndex] of Object.entries(mapping)) {
                if (mappedIndex === index) {
                    return position as 'bottom' | 'right' | 'top' | 'left';
                }
            }
            return null;
        };
    });

    // ████ all_seat_exposures SIGNAL ███████████████████████████████████████████
    public readonly all_seat_exposures = computed(() => {
        const seats = this.ordered_seats();
        const mapping = this.seat_mapping();

        const result = { bottom: [], right: [], top: [], left: [] } as any;

        const getExposures = (seat: any) => {
            return seat?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.exposures_meld || [];
        };

        if (seats[mapping.bottom]) result.bottom = getExposures(seats[mapping.bottom]);
        if (seats[mapping.right]) result.right = getExposures(seats[mapping.right]);
        if (seats[mapping.top]) result.top = getExposures(seats[mapping.top]);
        if (seats[mapping.left]) result.left = getExposures(seats[mapping.left]);

        return result;
    });

    // ████ all_seat_dead_states SIGNAL ███████████████████████████████████████████
    public readonly all_seat_dead_states = computed(() => {
        const seats = this.ordered_seats();
        const mapping = this.seat_mapping();

        const result = { bottom: false, right: false, top: false, left: false };

        const getIsDead = (seat: any) => {
            return seat?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.is_dead ?? false;
        };

        if (seats[mapping.bottom]) result.bottom = getIsDead(seats[mapping.bottom]);
        if (seats[mapping.right]) result.right = getIsDead(seats[mapping.right]);
        if (seats[mapping.top]) result.top = getIsDead(seats[mapping.top]);
        if (seats[mapping.left]) result.left = getIsDead(seats[mapping.left]);

        return result;
    });

    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬


    // ████ play_seats SIGNAL ███████████████████████████████████████████
    public readonly play_seats = computed<Record<number, any>>(() => { // need to replace any with GameSeatEntityGSDto - as GameSeatEntityGSDto is not found in bfw add new
        return this.play().seats;
    });

    public get_play_seat(id: number): any {
        return this.play_seats()[id];
    }

    // ████ ordered_seats SIGNAL ███████████████████████████████████████████
    public readonly ordered_seats = computed<any[]>(() => {
        const seatsObj = this.play_seats();
        if (!seatsObj) return [];
        return Object.values(seatsObj).sort((a: any, b: any) => {
            return (a.gseattype_id || 0) - (b.gseattype_id || 0);
        });
    });

    // ████ personal_seat_index SIGNAL ███████████████████████████████████████████
    public readonly personal_seat_index = computed<number>(() => {
        const myUid = this.personal_seat_u_id();
        const seats = this.ordered_seats();
        return seats.findIndex(seat => seat.u_id === myUid);
    });

    // ████ seat_mapping SIGNAL ███████████████████████████████████████████
    public readonly seat_mapping = computed<{ bottom: number; right: number; top: number; left: number }>(() => {
        const pIndex = this.personal_seat_index();
        const seats = this.ordered_seats();
        const total = seats.length; // Usually 4

        // If local player isn't seated (e.g. spectator), default to 0,1,2,3
        if (pIndex === -1 || total === 0) {
            return { bottom: 0, right: 1, top: 2, left: 3 };
        }

        return {
            bottom: pIndex,
            right: (pIndex + 1) % total,
            top: (pIndex + 2) % total,
            left: (pIndex + 3) % total,
        };
    });



    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬

    // ████ personal_pass SIGNAL ███████████████████████████████████████████
    public readonly personal_pass = computed<GamePersonalPassOutputGSDto | undefined>(() => { // need to replace any with GameSeatEntityGSDto - as GameSeatEntityGSDto is not found in bfw add new
        return this.personal()?.pass as GamePersonalPassOutputGSDto | undefined;
    });

    // ████ personal_pass.submissions SIGNAL ███████████████████████████████████████████
    public readonly personal_pass_submissions = computed<Record<number, number[]>>(() => {
        // need to replace any with GameSeatEntityGSDto - as GameSeatEntityGSDto is not found in bfw add new
        return (this.personal_pass()?.submissions as Record<number, number[]>) || {};
    });


    public get_personal_pass_submissions_seat(id: number): number[] | undefined { // replace any with GameSeatEntityGSDto after adding in bfw
        return this.personal_pass_submissions()[id];
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // ████ personal_pass.second_votes SIGNAL ███████████████████████████████████████████
    public readonly personal_pass_second_votes = computed<Record<string, boolean>>(() => { // need to replace any with GameSeatEntityGSDto - as GameSeatEntityGSDto is not found in bfw add new
        return (this.personal_pass()?.second_votes as Record<string, boolean>) || {};
    });


    public get_personal_pass_second_votes(seat_id: number): boolean | undefined { // replace any with GameSeatEntityGSDto after adding in bfw
        return this.personal_pass_second_votes()[seat_id];
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    public readonly personal_claim = computed<GamePersonalClaimOutputGSDto | undefined>(() => {
        return this.personal()?.claim;
    });

    // ████ personal_claim.target_seat SIGNAL ███████████████████████████████████████████
    public readonly personal_claim_target_seat = computed<number[] | undefined>(() => {
        return this.personal_claim()?.target_seat;
    });


    public get_personal_claim_target_seat(): number[] | undefined {
        return this.personal_claim_target_seat();
    }

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // ████ personal_claim.submission SIGNAL ███████████████████████████████████████████
    public readonly personal_claim_submission = computed<Record<number, boolean>>(() => {
        return this.personal_claim()?.submissions || {};
    });


    public get_personal_claim_submission_seat(seat_id: number): boolean | undefined {
        return this.personal_claim_submission()[seat_id];
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // ████ personal_seat_id SIGNAL ███████████████████████████████████████████
    public readonly personal_seat_id = computed<number>(() => {
        const seats = this.personal()?.seats;
        if (seats === undefined) return 0;
        const keys = Object.keys(seats);
        // this is new planning so need to add these keys in object
        return Number(keys[0]);
    });

    // ████ personal_seats SIGNAL ███████████████████████████████████████████
    public readonly personal_seat = computed<GamePersonalSeatEntityGSDto | undefined>(() => {
        // this is new planning so need to add these keys in object
        return this.personal()?.seats?.[this.personal_seat_id()];
    });


    // ████ personal_seat_u_id SIGNAL ███████████████████████████████████████████
    public readonly personal_seat_u_id = computed<number>(() => {
        // this is new planning so need to add these keys in object
        return this.personal_seat()?.u_id ?? 0;
    });

    // ████ personal_seat_racks SIGNAL ███████████████████████████████████████████
    // first: is_mahjong
    private _personal_seat_rack_first_is_mahjong = computed<boolean>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.is_mahjong ?? false;
    });



    // first: is_locked
    private _personal_seat_rack_first_is_locked = computed<boolean>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.is_locked ?? false;
    });



    // first: is_dead
    private _personal_seat_rack_first_is_dead = computed<boolean>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.is_dead ?? false;
    });



    // first: dead_info
    private _personal_seat_rack_first_dead_info = computed<GameRackDeadInfoGSOutputDto | undefined | null>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.dead_info || null;
    });



    // first: hand
    public readonly personal_seat_rack_first_hand = computed<Record<number, GameTileEntityGSDto>>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.hand ?? {};
    });





    // first: hand_order
    public readonly personal_seat_rack_first_hand_order = computed<number[]>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.hand_order ?? [];
    });



    // first: exposures_meld
    public readonly personal_seat_rack_first_exposures_meld = computed<GameRackExposuresMeldEntityGSDto[]>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_FIRST]?.exposures_meld ?? [];
    });





    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬
    // ████ second Rack SIGNAL ███████████████████████████████████████████
    // second: second_is_mahjong
    private _personal_seat_rack_second_is_mahjong = computed<boolean>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_SECOND]?.is_mahjong ?? false;
    });



    // second: is_locked
    private _personal_seat_rack_second_is_locked = computed<boolean>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_SECOND]?.is_locked ?? false;
    });



    // second: is_dead
    private _personal_seat_rack_second_is_dead = computed<boolean>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_SECOND]?.is_dead ?? false;
    });



    // second: dead_info
    private _personal_seat_rack_second_dead_info = computed<GameRackDeadInfoGSOutputDto | undefined | null>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_SECOND]?.dead_info || null;
    });



    // second: hand
    public readonly personal_seat_rack_second_hand = computed<Record<number, GameTileEntityGSDto>>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_SECOND]?.hand ?? {};
    });





    // second: hand_order
    // TODO: I think we have to remove this because that can be handle from the specific seat tile there is already field for order.
    public readonly personal_seat_rack_second_hand_order = computed<number[]>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_SECOND]?.hand_order ?? [];
    });



    // second: exposures_meld
    public readonly personal_seat_rack_second_exposures_meld = computed<GameRackExposuresMeldEntityGSDto[]>(() => {
        return this.personal_seat()?.racks?.[GameRackIDEnumAddon.RACK_SECOND]?.exposures_meld ?? [];
    });










    // ████ need to defice name  SIGNAL ███████████████████████████████████████████
    public readonly userTileStyleKeyid = signal<string>(this.defaultTileStyleKeyid());

    public setUserTileStyleKeyid(keyid: string): void {
        this.userTileStyleKeyid.set(keyid);
    }

    // ████ userTileStyle SIGNAL ███████████████████████████████████████████
    private readonly userTileStyle = computed<any>(() => { // change any with its type
        return this.getUserTileStyle();
    });

    public getUserTileStyle(): any { // change any with its type
        const style = this.tileStyle();

        if (!style[this.userTileStyleKeyid()])
            this.userTileStyleKeyid.set(this.defaultTileStyleKeyid());

        return style[this.userTileStyleKeyid()];
    }



    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    /* public readonly debugState = computed(() => ({

    })); */
    private commonSelectionFields = {};
    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();

        //this.initialize();

        // load api service
        this.api.sdk.graphql.initialize(Game);
        this.api.sdk.graphql.initialize(GameEngine);


        this.api.sdk.graphql.ws.initialize(GameEngineWsToken);

        this.subscribePlay();
        this.subscribePersonal();
        this.commonSelectionFields = {
            play: {
                phase: true,
                seats: true,
                turn_stage: true,
                current_turn_seat_id: true,
                current_turn_rack_id: true,
                last_client_seq_by_player: true,
                finished_reason: true,
                wall_count: true,
                pass: {
                    stage: true,
                    round: true,
                    direction: true,
                    count: true
                },
                discards_tiles: {
                    id: true,
                    in_exposer_one: true,
                    in_exposer_two: true,
                    in_rack_one: true,
                    in_rack_two: true,
                    keyid: true,
                    tile_id: true,
                    gseat_id: true
                },
                claim: {
                    tile: {
                        id: true,
                        gseat_id: true,
                        in_exposer_one: true,
                        in_exposer_two: true,
                        in_rack_one: true,
                        in_rack_two: true,
                        keyid: true,
                        tile_id: true
                    },
                    from_seat: true,
                    deadline_at: true,
                    intents: true
                }
            },
            personal: {
                pass: {
                    submissions: true,
                    second_votes: true
                },
                claim: true,
                seats: true
            },
            game: {
                id: true,
                keyid: true,
                owner_u_id: true,
                grule_id: true,
                botlvl_id: true,
                allow_join: true,
                mode: true,
                ended: true,
                suspended: true,
                current_turn_u_id: true,
                deleted: true,
                bot_profile: {
                    id: true,
                    keyid: true,
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
                },
                all_tiles: true
            }
        }
    }

    public initialize(): Promise<boolean> {
        this.initializationPromise ??= this.initializeOnce();
        return this.initializationPromise;
    }

    private async initializeOnce(): Promise<boolean> {
        try {
            await this.afterGameStart();
            return true;
        } catch (error) {
            this.log.error('[GameState] initialization failed', error);

            return false;
        } finally {
        }
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



    // ████ HELPER METHODS ██████████████████████████████████████
    // n/a


    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a


    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a

    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬
    // ████ API CALLS ███████████████████████████████████████████████████
    public async afterGameStart(): Promise<void> {
        // connect to web socket to listen the game live events
        await this.api.sdk.graphql.ws.connect();


        this.api.sdk.graphql.ws.subscribeError({
            response: (err) => {
                console.log(err.event, err.message);
                this.play_action_error.set({ event: err.event, message: err.message });
            }
        });

        // Game room start 
        await this.api.sdk.graphql.ws.gameEngine.joinGroup(this.game_keyid());

        // When game end or restart
        //await this.api.sdk.graphql.ws.gameEngine.leaveGroup(this.game_keyid());

        // Join game subject - personal room
        await this.api.sdk.graphql.ws.gameEngine.joinSubject(this.personal_seat_u_id());

        // When user exist or lost connection
        //await this.api.sdk.graphql.ws.gameEngine.leaveSubject(this.personal_seat_u_id());
    }

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
            const createdGame = this.createdGame();

            if (!createdGame) {
                //this.log.warn('[GAME STATE] create game is null');
                return;
            }

            const gameStartInput: GameStatePublicStartInputDto = ({
                keyid: createdGame?.keyid,
            } as unknown) as GameStatePublicStartInputDto;

            const startResp: BfwApiSdkResponse<GameStateOutputDto> = await this.api.sdk.graphql.gameEngine.publicStart({
                selection: this.commonSelectionFields,
                input: gameStartInput
            });

            if (startResp?.data) {
                this.setGame(startResp.data.game as GameStateGameOutputDto);
                this.setPlay(startResp.data.play as GameStatePlayOutputDto);
                this.setPersonal(startResp.data.personal as GameStatePersonalOutputDto);
                await this.afterGameStart();
                return startResp;
            }
        } catch (error) {
            this.log.error('ERROR START GAME', error);
            return false;
        }
        return false;

    }
    /* public async getAllTileStyle(): Promise<TileStyleFindOutputDto | false> {
        try {
            const gameCreateInput: TileStyleFindInputWhereDto = {
                active: { eq: true }
            }

            const http: BfwApiSdkResponse<TileStyleFindOutputDto[]> = await this.api.sdk.graphql.tileStyle.find({
                selection: {
                    id: true
                    keyid: true,
                    title: true,
                    default_width: true,
                    default_height: true,
                    file: true,
                    file_url: true,
                    active: true
                },
                input: [
                    gameCreateInput
                ]
            });

            if (http.data.length > 0) {
                const arrResponse = http.data[0];
                //this.setCreatedGame(arrResponse);
                return arrResponse;
            }
        } catch (e: any | BfwApiSdkError) {
            this.log.error('GAME CREATE ERROR', e);
        }
        return false;
    } */

    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬
    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    private registerAsyncCleanup(cleanup: () => Promise<void>, name: string): void {
        this.registerDeactivationCleanup(() => {
            void cleanup().catch((error) => {
                console.warn(`[gameState] ${name} cleanup failed`, error);
            });
        });
    }

    // ████ WEB SOCKET CALL SUBSCRIBE PLAY ████████████████████████████████████████████
    private async subscribePlay(): Promise<void> {
        try {
            this.unsubscribePlay = await this.api.sdk.graphql.ws.gameEngine?.subscribePlay({
                response: (payload: any) => {
                    const data = payload.data;

                    console.log('[subscribePlay] data: ', data);

                    this.setPlay(data)
                },
            });


            const remove = async () => this.subscribePlayCleanup();
            this.registerAsyncCleanup(remove, 'subscribe play listener');

        } catch (error) {
            console.error('[subscribe play error]', error);
        }
    }
    private async subscribePlayCleanup(): Promise<void> {
        if (!this.unsubscribePlay) {
            return;
        }

        if (typeof this.unsubscribePlay === 'function') {
            this.unsubscribePlay();
            this.unsubscribePlay = null;
            return;
        }

        if (
            typeof this.unsubscribePlay === 'object' &&
            'unsubscribe' in this.unsubscribePlay &&
            typeof this.unsubscribePlay.unsubscribe === 'function'
        ) {
            this.unsubscribePlay.unsubscribe();
            this.unsubscribePlay = null;
        }
    }

    // ████ WEB SOCKET CALL SUBSCRIBE PERSONAL ████████████████████████████████████████████
    private async subscribePersonal(): Promise<void> {
        try {
            this.unsubscribePersonal = await this.api.sdk.graphql.ws.gameEngine?.subscribePersonal({
                response: (payload: any) => {
                    const data = payload.data;

                    console.log('[subscribePersonal] data: ', data);
                    // This updates UI whenever server sends data.
                    this.setPersonal(data)
                },
            });


            const remove = async () => this.subscribePersonalCleanup();
            this.registerAsyncCleanup(remove, 'subscribe personal listener');

        } catch (error) {
            console.error('[subscribe personal error]', error);
        }
    }
    private async subscribePersonalCleanup(): Promise<void> {
        if (!this.unsubscribePersonal) {
            return;
        }

        if (typeof this.unsubscribePersonal === 'function') {
            this.unsubscribePersonal();
            this.unsubscribePersonal = null;
            return;
        }

        if (
            typeof this.unsubscribePersonal === 'object' &&
            'unsubscribe' in this.unsubscribePersonal &&
            typeof this.unsubscribePersonal.unsubscribe === 'function'
        ) {
            this.unsubscribePersonal.unsubscribe();
            this.unsubscribePersonal = null;
        }
    }

    // ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬
    // ████ WEB SOCKET CALL PUBLISH JOIN ████████████████████████████████████████████
    public async publishJoin(): Promise<void> {
        const game_keyid = this.game_keyid();
        if (!game_keyid) {
            this.log.error('GAME_KEYID IS NULL');
            return;
        }

        await this.api.sdk.graphql.ws.gameEngine?.publishJoin({
            input: {
                keyid: game_keyid,
                u_id: this.personal_seat_u_id(),
            },
            selections: this.commonSelectionFields
        });
    }

    // ████ WEB SOCKET CALL PUBLISH CHARLESTONE ████████████████████████████████████████████
    public async publishCharlestone(tileIds: readonly number[]): Promise<void> {
        const game_keyid = this.game_keyid();
        if (!game_keyid) {
            this.log.error('GAME_KEYID IS NULL');
            return;
        }

        let gameAction = GamePlayActionEnumAddon.CHARLESTONST1RIGHT as unknown as GamePlayActionEnum;
        if (this.play_pass_stage() == GameCharlestoneStageEnum.FIRST) {
            switch (this.play_pass_direction()) {
                case GamePhaseFirstRoundDirectionEnum.RIGHT:
                    gameAction = GamePlayActionEnumAddon.CHARLESTONST1RIGHT as unknown as GamePlayActionEnum;
                    break;
                case GamePhaseFirstRoundDirectionEnum.LEFT:
                    gameAction = GamePlayActionEnumAddon.CHARLESTONST1LEFT as unknown as GamePlayActionEnum;
                    break;
                case GamePhaseFirstRoundDirectionEnum.ACROSS:
                    gameAction = GamePlayActionEnumAddon.CHARLESTONST1ACROSS as unknown as GamePlayActionEnum;
                    break;
            }
        } else if (this.play_pass_stage() == GameCharlestoneStageEnum.SECOND) {
            switch (this.play_pass_direction()) {
                case GamePhaseSecondRoundDirectionEnum.RIGHT:
                    gameAction = GamePlayActionEnumAddon.CHARLESTONST2RIGHT as unknown as GamePlayActionEnum;
                    break;
                case GamePhaseSecondRoundDirectionEnum.LEFT:
                    gameAction = GamePlayActionEnumAddon.CHARLESTONST2LEFT as unknown as GamePlayActionEnum;
                    break;
                case GamePhaseSecondRoundDirectionEnum.ACROSS:
                    gameAction = GamePlayActionEnumAddon.CHARLESTONST2ACROSS as unknown as GamePlayActionEnum;
                    break;
            }
        }
        else if (this.play_pass_stage() == GameCharlestoneStageEnum.COURTESY) {
            switch (this.play_pass_direction()) {
                case GamePhaseFirstRoundDirectionEnum.ACROSS:
                    gameAction = GamePlayActionEnumAddon.COURTESYPASS as unknown as GamePlayActionEnum;
                    break;
            }
        }
        console.log('Publishing input', {
            keyid: game_keyid,
            gpaction_id: gameAction,
            tile_ids: [...tileIds],
            from_gseat_id: this.personal_seat_id(),//this.play().gseat_id,
            game_id: this.game_id(),
            u_id: this.personal_seat_u_id(),
            rack_id: this.play_current_turn_rack_id()
        });


        await this.api.sdk.graphql.ws.gameEngine?.publishActionCharlestone({
            input: {
                keyid: game_keyid,
                gpaction_id: gameAction,
                tile_ids: [...tileIds],
                from_gseat_id: this.personal_seat_id(),//this.play().gseat_id,
                game_id: this.game_id(),
                u_id: this.personal_seat_u_id(),
                rack_id: this.play_current_turn_rack_id()
            },
            selections: this.commonSelectionFields,
        });
    }


    // ████ WEB SOCKET CALL PUBLISH CHARLESTONE SECOND ROUND VOTE ████████████████████████████████████████████
    public async publishCharlestoneSecondRoundVote(vote: boolean): Promise<void> {
        const game_keyid = this.game_keyid();
        if (!game_keyid) {
            this.log.error('GAME_KEYID IS NULL');
            return;
        }

        let gameAction = GamePlayActionEnumAddon.SECOND_CHARLESTONE_SUBMIT_VOTES as unknown as GamePlayActionEnum;
        if (this.play_pass_stage() == GameCharlestoneStageEnum.SECOND_DECISION) {
            await this.api.sdk.graphql.ws.gameEngine?.publishActionCharlestoneSecondVotes({
                input: {
                    keyid: game_keyid,
                    gpaction_id: gameAction,
                    second_votes: vote,
                    id: this.personal_seat_id(),
                    game_id: this.game_id(),
                    u_id: this.personal_seat_u_id(),
                },
                selections: this.commonSelectionFields,
            });
        }


    }

    // ████ WEB SOCKET CALL PUBLISH PICK TILE ████████████████████████████████████████████
    public async publishPickTile(): Promise<void> {
        const game_keyid = this.game_keyid();
        if (!game_keyid) {
            this.log.error('GAME_KEYID IS NULL');
            return;
        }

        await this.api.sdk.graphql.ws.gameEngine?.publishActionPickTile({
            input: {
                keyid: game_keyid,
                gpaction_id: GamePlayActionEnum.PICKFROMWALL,
                game_id: this.game_id(),
                u_id: this.personal_seat_u_id(),
                seat_id: this.play_current_turn_seat_id(),

            },
            selections: this.commonSelectionFields,
        });
    }

    // ████ WEB SOCKET CALL PUBLISH DISCARD TILE ████████████████████████████████████████████
    public async publishDiscardTile(tile_id: number): Promise<void> {
        const game_keyid = this.game_keyid();
        if (!game_keyid) {
            this.log.error('GAME_KEYID IS NULL');
            return;
        }

        /* const seatId = this.play_current_turn_seat_id();
        let discardRackId = this.play_current_turn_rack_id();

        const personalState = this.personal();
        if (personalState?.seats && personalState.seats[seatId]?.racks) {
            const racks = personalState.seats[seatId].racks;
            for (const rackIdStr of Object.keys(racks)) {
                const rackId = Number(rackIdStr);
                const rack = racks[rackId];
                if (rack?.hand && rack.hand[tile_id]) {
                    discardRackId = rackId;
                    break;
                }
            }
        } */

        await this.api.sdk.graphql.ws.gameEngine?.publishActionDiscardTile({
            input: {
                keyid: game_keyid,
                gpaction_id: GamePlayActionEnum.DISCARD,
                game_id: this.game_id(),
                u_id: this.personal_seat_u_id(),
                seat_id: this.play_current_turn_seat_id(),
                rack_id: this.play_current_turn_rack_id(),
                //seat_id: seatId,
                //rack_id: discardRackId,
                tile_id: tile_id
            },
            selections: this.commonSelectionFields,
        });
    }

    // ████ WEB SOCKET CALL PUBLISH CLAIM ████████████████████████████████████████████
    public async publishClaimAction(action: GamePlayActionEnum, tile_id: number): Promise<void> {
        const game_keyid = this.game_keyid();
        if (!game_keyid) {
            this.log.error('GAME_KEYID IS NULL');
            return;
        }

        await this.api.sdk.graphql.ws.gameEngine?.publishActionClaimTile({
            input: {
                keyid: game_keyid,
                gpaction_id: action,
                game_id: this.game_id(),
                u_id: this.personal_seat_u_id(),
                seat_id: this.play_current_turn_seat_id(),
                rack_id: this.personal().rack_id,
                tile_id: tile_id
            },
            selections: this.commonSelectionFields,
        });
    }

    // ████ WEB SOCKET CALL PUBLISH MAHJONG ██████████████████████████████████████████
    public async publishMahjongDeclare(): Promise<void> {
        const game_keyid = this.game_keyid();
        if (!game_keyid) return;

        // TODO: Wait for API SDK support for MAHJONG or use a generic action
        // await this.api.sdk.graphql.ws.gameEngine?.publishAction...
    }

    // ████ WEB SOCKET CALL PUBLISH DEAD ████████████████████████████████████████████
    public async publishDeclareDead(targetSeatId: number): Promise<void> {
        const game_keyid = this.game_keyid();
        if (!game_keyid) return;

        // TODO: Wait for API SDK support for DECLAIRDEAD or use a generic action
        // await this.api.sdk.graphql.ws.gameEngine?.publishAction...
    }

}
