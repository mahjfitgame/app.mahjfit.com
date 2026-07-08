// file: src/app/base/progress-bar/state.ts
import { computed, inject, Injectable, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { ProgressBarStatusEnum } from "@base/progress-bar/enum";

@Injectable({providedIn: 'root'})
export class ProgressBarState extends SignalStateService {
    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);

    // required for persisted state
    protected override readonly storeKey = 'pbs';
    
    // Keep the completed state visible long enough for the material bar animation to reach 100%. This is because animation takes time
    private readonly completeVisibleMs = 350;
    private stopFrame: number | null = null;
    private stopTimeout: ReturnType<typeof setTimeout> | null = null;
    
    private readonly _processing = signal<false | number>(false);
    public readonly processing = this._processing.asReadonly();

    private readonly _status = signal<ProgressBarStatusEnum>(ProgressBarStatusEnum.IDLE);
    public readonly status = this._status.asReadonly();
    public readonly visible = computed(() => this.status() !== ProgressBarStatusEnum.IDLE);

    private readonly _stream = signal<number>(0);
    public readonly stream = this._stream.asReadonly();

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();
    }

    protected override onDeactivate(): void {
        this.clearStopSchedule();
    }

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
}
