import { Injectable, Service, computed, inject, signal } from '@angular/core';
import { ProgressBarService } from '@base/progress-bar/service';
import { GlobalProgressBarState } from '@base/global-progress-bar/state';

@Service()
export class GlobalProgressBarService {
    private readonly state = inject(GlobalProgressBarState);
    private readonly progressBarService = signal<ProgressBarService | null>(null);

    private readonly visible = computed(() => this.state.loading() !== false);

    constructor() {}

    public pbRegister(service: ProgressBarService): void {
        this.progressBarService.set(service);

        if (this.visible()) {
            service.start();
        }
    }

    public pbUnregister(service: ProgressBarService): void {
        if (this.progressBarService() === service) {
            this.progressBarService.set(null);
        }
    }

    public start(startedAt: number = Date.now()): number {
        if (this.visible()) {
            return this.state.loading() as number;
        }

        this.state.startLoading(startedAt);
        this.progressBarService()?.start();

        return startedAt;
    }

    public stop(stoppedAt: number = Date.now()): number {
        const duration = this.state.stopLoading(stoppedAt);
        this.progressBarService()?.stop();

        return duration;
    }

    public get stream(): number {
        return this.progressBarService()?.stream ?? 0;
    }

    public set stream(progress: number) {
        const pb = this.progressBarService();
        if(pb){
            pb.stream = progress;
        }
    }
    public get processing(): boolean {
        return this.visible();
    }
}
