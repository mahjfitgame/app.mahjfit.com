// file: src/app/module/shared/onboarding/signout/state.ts
import { computed, effect, inject, Service, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api";
import { AppModuleStateType } from "@libs/utility/type";

@Service()
export class SignoutState extends SignalStateService implements AppModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    private readonly gpbs = inject(GlobalProgressBarService);
    private readonly ctxp = inject(ContextProfileService);
    private readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    // required for persisted state
    public override readonly storeKey = 'sout';

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████
    // n/a


    // ████ STATE DEBUGGER ██████████████████████████████████████████████

    // debug helper (template-friendly): shows the state info as set.
    public readonly debug: boolean = true;
    public readonly debugState = computed(() => ({

    }));

    constructor() {
        super();
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████

    public override onActivate(): void {
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
    }

    public override onDeactivate(): void {

    }


    // ████ SIGNAL METHODS ██████████████████████████████████████████████
    // n/a


    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a


    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a


    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a


    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a

}
