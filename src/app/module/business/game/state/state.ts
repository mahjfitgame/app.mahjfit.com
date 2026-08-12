// file: src/app/module/business/game/state.ts

import { computed, effect, inject, Service } from "@angular/core";
import { Game, GameEngine, GameService, GameStateOutputDto } from "@bfw/api-sdk/graphql/endpoints/business";
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

@Service({ autoProvided: true })
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
        GameStateFieldEnum.GAME_KEYID,
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
        GameStateFieldEnum.GAME_KEYID,
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
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
