// file: src/app/app.state.ts
import { inject, Service, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation/module/type";
import { APP_STATE_FIELD_APP_VERSION, APP_STATE_STORE_KEY } from "./app.const";

@Service()
export class AppState extends SignalStateService implements FoundationModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = APP_STATE_STORE_KEY;

    constructor() {
        super();
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████

    public override onActivate(): void {
        /*const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
        */
    }

    public override onDeactivate(): void {

    }

    // ██████████████████████████████████████████████████████████████████
    // ████ _appVersion █████████████████████████████████████████████████  
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * The build this browser last booted successfully, compared against
     * ConfService.appVersion by AppService.reconcileAppVersion().
     *
     * ⚠ NO crossTab, deliberately. The value is read ONCE per document load, before
     * bootstrap finishes, and written once after a clean startup. A notification
     * can therefore only arrive for a read that has already happened — and it would
     * leave a tab still running the OLD build reporting the NEW version, which is
     * the one answer that makes the comparison lie.
     */
    private readonly _appVersion = this.localStoragePersistSignal<string | null>(
        APP_STATE_FIELD_APP_VERSION,
        null,
        {
            debounceMs: 0,
            crossTab: false,
            deleteOnNull: true,
            validate: this.validateAppVersion,
        },
    );
    public readonly appVersion = this._appVersion.asReadonly();

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public validateAppVersion(value: unknown): value is string | null {
        return value === null || (typeof value === 'string' && value.trim().length > 0);
    }
    public setAppVersion(version: string | null): void {
        this._appVersion.set(version);
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ _startupSucceeded ███████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _startupSucceeded = signal<boolean | null>(null);
    public readonly startupSucceeded = this._startupSucceeded.asReadonly();

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setStartupSucceeded(succeeded: boolean | null): void {
        this._startupSucceeded.set(succeeded);
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ _sessionTerminating █████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _sessionTerminating = signal<boolean>(false);
    public readonly sessionTerminating = this._sessionTerminating.asReadonly();

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * Set by AppService.terminateSession() only. Read it, do not race it — see the
     * signal declaration above.
     */
    public setSessionTerminating(terminating: boolean): void {
        this._sessionTerminating.set(terminating);
    }
}
