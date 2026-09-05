// file: src/app/app.component.ts
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
import { Router, RouterOutlet } from '@angular/router';
import { GlobalProgressBarComponent } from '@base/global-progress-bar/component';
import { MatIconModule } from '@angular/material/icon';
import { AppService } from '@app/app.service';
import { HttpStatusServiceUnavailableRoute } from 'src/app/module/shared/http-status/service-unavailable/route';

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
  private readonly router = inject(Router);
  protected readonly service = inject(AppService);
  constructor() {}
  public async ngOnInit(): Promise<void> {
    // TODO: if you run in production or need offline support, you should register your service worker
    //this.registerServiceWorker();
  }
  public async ngAfterViewInit(): Promise<void> {
    if (this.service.state.startupSucceeded() !== true) {
      this.service.log.error('Access interrupted. Redirecting to maintenance page.');
      await this.router.navigateByUrl(HttpStatusServiceUnavailableRoute.absolutePath(), {
        replaceUrl: true,
      });
    }
    
    this.service.splash.stream = 100;
    this.service.splash.hide(); // splash start form provideSplashScreenModule()
  }
  public async ngOnDestroy(): Promise<void> {}

  @HostListener('window:scroll')
  public onWindowScroll(): void {
    this.service.onWindowScroll();
  }

  @HostListener('window:beforeunload', ['$event'])
  public beforeTabUnload(event: BeforeUnloadEvent): void {
    this.service.log.warn(`Tab is closed`);
    // make sure this is not whole browser window close its only browser tab close
    /*
    const url = 'https://yourdomain.com';
    const payload = JSON.stringify({ userId: '12345', timestamp: Date.now() });

    // Convert your data into a Blob payload
    const blob = new Blob([payload], { type: 'application/json' });

    // The browser executes this request in the background after the tab closes
    navigator.sendBeacon(url, blob);
    */
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