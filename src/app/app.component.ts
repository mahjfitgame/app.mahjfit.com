// ./src/app/app.component.ts
import {
  AfterViewInit,
  Component,
  DOCUMENT,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  
} from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterOutlet } from '@angular/router';
import { GlobalProgressBarComponent } from '@base/global-progress-bar/component';
import { MatIconModule } from '@angular/material/icon';
import { AppService } from '@app/app.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatProgressBarModule,
    GlobalProgressBarComponent,

    MatIconModule,
  ],
  providers: [],
  templateUrl: './app.template.html',
  styleUrl: './app.style.scss',
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  protected readonly service = inject(AppService);
  constructor() {}
  public async ngOnInit(): Promise<void> {
    // Splash screen starts from app config as early as possible.
    this.service.splash.stream = 10;
    // TODO: if you run in production or need offline support, you should register your service worker
    //this.registerServiceWorker();
    this.service.splash.stream = 20;
  }
  public async ngAfterViewInit(): Promise<void> {
    await this.onAppStartUp();
  }
  public async ngOnDestroy(): Promise<void> {}
  public async onAppStartUp() {
    let removeSplash: boolean = false;
    try {
      // initialize platform runtime state/listeners
      await this.service.ps.init();
      this.service.splash.stream = 40;

      // hand shake with api to wake it up and check if it's responsive, also can be used to fetch some critical data for app initialization
      const hs = await this.service.clientServerHandShake();
      this.service.splash.stream = 60;

      // decide to hide splash or not
      if (hs === false) {
        removeSplash = false;
      } else {
        await this.service.afterClientServerHandShake();
        removeSplash = true;
      }

      this.service.splash.stream = 70;
    } catch (error) {
      this.service.log.error('[AppComponent] onAppStartUp failed', error);
      this.service.splash.stream = 80;
    } finally {
      this.service.splash.stream = 90;

      // all process is done, close splash screen
      if (removeSplash === true) {
        this.service.splash.stream = 100;
        // in certain condition user will be blocked to use app
        this.service.splash.hide();
      } else {
        this.service.log.error('Access interrupted.');
        this.service.splash.stream = 70;
      }
    }
  }

  @HostListener('window:scroll')
  public onWindowScroll(): void {
    this.service.onWindowScroll();
  }

  public registerServiceWorker(): void {
    if ('serviceWorker' in navigator) { // && !isDevMode()
      const register = () => {
        navigator.serviceWorker.register('/service.worker.js')
          .then(registration => {
            console.log('[WSW] Workbox Service Worker registered successfully:', registration.scope);
          })
          .catch(error => {
            console.error('[WSW] Workbox Service Worker registration failed:', error);
          });
      };

      if (document.readyState === 'complete') {
        register();
      } else {
        window.addEventListener('load', register, { once: true });
      }
    }
  }
}