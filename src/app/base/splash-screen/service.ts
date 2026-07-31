import { Injectable, Service, computed, inject, signal } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { LogService } from '@libs/log/service';
import { PlatformService } from '@libs/platform/service';
import { ProgressBarService } from '@base/progress-bar/service';

@Service()
export class SplashScreenService {
    public readonly splashBrandLogo = '/assets/logo.png';

    private readonly log = inject(LogService);
    private readonly aps = inject(PlatformService);

    private readonly progressBarService = signal<ProgressBarService | null>(null);
    private readonly showState = signal<false | number>(false);
    private readonly hideRequestedState = signal(false);
    public readonly visible = computed(() => {
        if (this.showState() === false) {
            return false;
        }

        if (!this.hideRequestedState()) {
            return true;
        }

        return this.progressBarService()?.processing ?? false;
    });

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
    
    /**
     * Show capacitor splash screen programmatically.
     * Useful for native-only flows like reloading auth/bootstrap state.
     */
    public async capacitorSplashScreenShow(duration = 2000): Promise<void> {
        try {
        await SplashScreen.show({
            autoHide: true,
            showDuration: duration,
            fadeInDuration: 150,
            fadeOutDuration: 150,
        });
        
        } catch (error) {
        if (!this.aps.isNative) {
            return;
        }

        this.log.error('[SplashService] show failed', error);
        }
    }

    /**
     * Hide capacitor launched splash screen safely.
     * On web, silently skip if behavior is unsupported or unnecessary.
     */
    public async capacitorSplashScreenHide(): Promise<void> {
        try {
        await SplashScreen.hide({
            fadeOutDuration: 300,
        });

        } catch (error) {
        if (!this.aps.isNative) {
            return;
        }

        this.log.error('[SplashService] hide failed', error);
        }
    }

    public show(): void {
        if (this.visible() && !this.hideRequestedState()) {
            return;
        }

        this.hideRequestedState.set(false);
        this.showState.set(Date.now());

        this.progressBarService()?.start();
    }

    public hide(): number {
        const startedAt = this.showState();

        if (startedAt === false || !this.visible()) {
            return 0;
        }

        const duration = Date.now() - startedAt;
        const pb = this.progressBarService();

        this.hideRequestedState.set(true);

        if (!pb) {
            this.showState.set(false);
            this.hideRequestedState.set(false);
            return duration;
        }

        pb.stop();

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
}
