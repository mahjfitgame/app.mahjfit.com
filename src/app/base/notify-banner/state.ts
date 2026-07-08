// file: ./src/app/base/notify-banner/state.ts
import { inject, Service, signal } from '@angular/core';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { SignalStateService } from '@libs/signal-state/service';
import { NotifyBannerAlertType } from '@base/notify-banner/type';

@Service()
export class NotifyBannerState extends SignalStateService {
    private readonly conf = inject(ConfService)
    private readonly log = inject(LogService)

    // required for persisted state
    protected override readonly storeKey = 'notifyb';

    private readonly _alert = signal<NotifyBannerAlertType[] | null>(null);
    public readonly alert = this._alert.asReadonly();

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();
    }

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
}