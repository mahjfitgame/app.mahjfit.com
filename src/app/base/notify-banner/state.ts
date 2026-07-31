// file: ./src/app/base/notify-banner/state.ts
import { effect, inject, Service, signal } from '@angular/core';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { SignalStateService } from '@libs/signal-state/service';
import { NotifyBannerAlertType } from '@base/notify-banner/type';
import { AppModuleStateType } from '@libs/utility/type';

@Service()
export class NotifyBannerState extends SignalStateService implements AppModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    private readonly conf = inject(ConfService)
    private readonly log = inject(LogService)

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = 'notifyb';

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _alert = signal<NotifyBannerAlertType[] | null>(null);
    public readonly alert = this._alert.asReadonly();

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    // n/a

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
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
