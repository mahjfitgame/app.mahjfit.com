// file: src/app/base/global-progress-bar/state.ts
import { DestroyRef, effect, inject, Service, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { GLOBAL_PROGRESS_BAR_STATE_STORE_KEY } from "./const";

@Service()
export class GlobalProgressBarState extends SignalStateService {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = GLOBAL_PROGRESS_BAR_STATE_STORE_KEY;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _loading = signal<false | number>(false);
    public readonly loading = this._loading.asReadonly();

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

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
