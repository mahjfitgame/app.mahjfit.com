// file: ./src/app/base/notify-banner/state.ts
import { effect, inject, Service, signal } from '@angular/core';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { SignalStateService } from '@libs/signal-state/service';
import { NotifyBannerAlertType } from '@base/notify-banner/type';
import { FoundationModuleStateType } from "@libs/foundation-module/type/state";
import { GlobalProgressBarService } from '../global-progress-bar/service';
import { BfwApiService } from '@libs/third-party-apis/bfw-api/service';
import { ContextProfileService } from '@libs/context-profile/service';

@Service()
export class NotifyBannerState extends SignalStateService implements FoundationModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = 'notifyb';

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _alert = signal<NotifyBannerAlertType[] | null>(null);
    public readonly alert = this._alert.asReadonly();

    // ████ STATE DEBUGGER ██████████████████████████████████████████████

    /* public readonly debugState = computed(() => ({
        
    })); */

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████

    public override onActivate(): void {
        /* const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy()); */
    }

    public override onDeactivate(): void {

    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    public setAlert(newAlerts: NotifyBannerAlertType[]): void {
        this._alert.set(newAlerts);
    }

    public pushAlert(newAlert: NotifyBannerAlertType): void {
        this._alert.update(currentAlerts => [
            ...(currentAlerts ?? []),
            newAlert
        ]);
    }

    public removeAlert(id: number): void {
        this._alert.update(currentAlert =>
            // if currentAlerts is null/undefined, fallback to an empty array, then filter
            (currentAlert ?? []).filter(alert => alert.id !== id)
        );
    }

    public clearAlert(): void {
        this._alert.set([]);
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
