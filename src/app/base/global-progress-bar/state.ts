// file: src/app/base/global-progress-bar/state.ts
import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";

@Injectable({providedIn: 'root'})
export class GlobalProgressBarState extends SignalStateService {
    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);

    // required for persisted state
    protected override readonly storeKey = 'gpbs';

    private readonly _loading = signal<false | number>(false);
    public readonly loading = this._loading.asReadonly();

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();
    }

    public setLoading(loading: false | number): void {
        this._loading.set(loading);
    }
    public startLoading(startedAt: number = Date.now()): number {
        this.setLoading(startedAt);
        return startedAt;
    }
    public stopLoading(stoppedAt: number = Date.now()): number {
        const startedAt = this.loading();
        const duration = startedAt === false ? 0 : Math.max(0, stoppedAt - startedAt);

        this.setLoading(false);

        return duration;
    }
}