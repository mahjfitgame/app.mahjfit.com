// file: src/app/module/business/home/state.ts
import { computed, effect, inject, Service, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation-module/type/state";
import { HOME_STATE_STORE_KEY } from "./const";

@Service({ autoProvided: false })
export class HomeState extends SignalStateService implements FoundationModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    // required for persisted state
    public override readonly storeKey = HOME_STATE_STORE_KEY;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _error = signal<string | null>(null);
    public readonly error = this._error.asReadonly();

    // the sqlite db version shown on the page, resolved by the service on init
    private readonly _dbVersion = signal<string>('N/A');
    public readonly dbVersion = this._dbVersion.asReadonly();

    // ████ STATE DEBUGGER ██████████████████████████████████████████████

    // debug helper (template-friendly): shows the state info as set.
    public readonly debugState = computed(() => ({
        error: this.error(),
        dbVersion: this.dbVersion(),
    }));

    constructor() {
        super();
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████

    public override onActivate(): void {
        /*
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
        */
    }
    public override onDeactivate(): void {

    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    public setError(error: string | null): void {
        this._error.set(error);
    }
    public setDbVersion(version: string): void {
        this._dbVersion.set(version);
    }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a


    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a


    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a


    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a

}
