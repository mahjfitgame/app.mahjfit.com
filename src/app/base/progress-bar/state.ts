// file: src/app/base/progress-bar/state.ts
import { computed, effect, inject, Injectable, Service, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { ProgressBarStatusEnum } from "@base/progress-bar/enum";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation-module/type/state";
import { PROGRESS_BAR_STATE_STORE_KEY } from "./const";

@Service()
export class ProgressBarState extends SignalStateService implements FoundationModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = PROGRESS_BAR_STATE_STORE_KEY;

    // Keep the completed state visible long enough for the material bar animation to reach 100%. This is because animation takes time
    private readonly completeVisibleMs = 350;
    private stopFrame: number | null = null;
    private stopTimeout: ReturnType<typeof setTimeout> | null = null;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _processing = signal<false | number>(false);
    public readonly processing = this._processing.asReadonly();

    private readonly _status = signal<ProgressBarStatusEnum>(ProgressBarStatusEnum.IDLE);
    public readonly status = this._status.asReadonly();
    public readonly visible = computed(() => this.status() !== ProgressBarStatusEnum.IDLE);

    private readonly _stream = signal<number>(0);
    public readonly stream = this._stream.asReadonly();

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
        this.clearStopSchedule();
    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    public setProcessing(processing: false | number): void {
        this._processing.set(processing);
    }
    public setStatus(status: ProgressBarStatusEnum): void {
        this._status.set(status);
    }
    public setStream(stream: number): void {
        this._stream.set(Math.max(0, Math.min(100, stream)));
    }
    public start(): number {
        const wasCompleting = this.status() === ProgressBarStatusEnum.COMPLETING;
        this.clearStopSchedule();

        if (!wasCompleting && this.processing() !== false) {
            return this.processing() as number;
        }

        const now = Date.now();
        this.setProcessing(now);
        this.setStatus(ProgressBarStatusEnum.RUNNING);
        this.setStream(0);

        return now;
    }
    public stop(): [number, number, number] {
        const startedAt = this.processing();

        if (startedAt === false) {
            return [0, 0, 0];
        }

        this.clearStopSchedule();

        this.setStatus(ProgressBarStatusEnum.COMPLETING);
        this.setStream(100);

        const now = Date.now();
        const duration = now - startedAt;

        this.scheduleCompleteHide();

        return [duration, now, startedAt];
    }

    public get isProcessing(): boolean {
        return this.visible();
    }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████

    private scheduleCompleteHide(): void {
        const hide = () => {
            this.setProcessing(false);
            this.setStatus(ProgressBarStatusEnum.IDLE);
            this.setStream(0);

            this.stopFrame = null;
            this.stopTimeout = null;
        };

        const hideAfterDelay = () => {
            this.stopFrame = null;
            this.stopTimeout = setTimeout(hide, this.completeVisibleMs);
        };

        if (!globalThis.requestAnimationFrame) {
            this.stopTimeout = setTimeout(hide, this.completeVisibleMs);
            return;
        }

        this.stopFrame = globalThis.requestAnimationFrame(hideAfterDelay);
    }

    private clearStopSchedule(): void {
        if (this.stopFrame !== null) {
            globalThis.cancelAnimationFrame?.(this.stopFrame);
            this.stopFrame = null;
        }

        if (this.stopTimeout !== null) {
            clearTimeout(this.stopTimeout);
            this.stopTimeout = null;
        }
    }

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
