// file: src/app/app.state.ts
import { effect, inject, Service, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation/module/type";
import { APP_STATE_STORE_KEY } from "./app.const";

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

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _startupSucceeded = signal<boolean | null>(null);
    public readonly startupSucceeded = this._startupSucceeded.asReadonly();

    /**
     * ⚠ NOT ui state. this is the LATCH that makes a stateful-auth failure end the
     * session exactly ONCE. The error interceptor is registered on every graphql
     * and rest call, so when N requests are in flight they all 401 together —
     * without this the user gets N banners and N navigations racing each other.
     *
     * It is also read by the two places that would otherwise send a terminating
     * app to /503 and win, because both run AFTER the redirect is decided:
     * AppComponent.ngAfterViewInit() and HttpStatusServiceUnavailableRoute's
     * navigationErrorHandler.
     *
     * One way only. Nothing clears it — the document is on its way out, either
     * through a reload or through a navigation to signin.
     */
    private readonly _sessionTerminating = signal<boolean>(false);
    public readonly sessionTerminating = this._sessionTerminating.asReadonly();

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

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    public setStartupSucceeded(succeeded: boolean | null): void {
        this._startupSucceeded.set(succeeded);
    }

    /**
     * Set by AppService.terminateSession() only. Read it, do not race it — see the
     * signal declaration above.
     */
    public setSessionTerminating(terminating: boolean): void {
        this._sessionTerminating.set(terminating);
    }
}
