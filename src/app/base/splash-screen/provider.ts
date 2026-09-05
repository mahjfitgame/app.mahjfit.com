// file: src/app/base/splash-screen/provider.ts
import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  EnvironmentProviders,
  provideEnvironmentInitializer,
  createComponent,
  inject,
} from '@angular/core';
import { SplashScreenComponent } from '@base/splash-screen/component';
import { SplashScreenService } from '@base/splash-screen/service';

function provideSplashScreenComponent(): void {
    let splashScreenComponentRef: ComponentRef<SplashScreenComponent> | null = null;

    const splash = inject(SplashScreenService);
    const document = inject(DOCUMENT);
    const applicationRef = inject(ApplicationRef);
    const environmentInjector = inject(EnvironmentInjector);

    // show the splash screen on app start, this behavior is global
    splash.show();

    if (splashScreenComponentRef) {
        return;
    }

    const hostElement = document.createElement('app-splash-screen');
    hostElement.setAttribute('data-bfw-provider-host', 'true');
    document.body.prepend(hostElement);

    splashScreenComponentRef = createComponent(SplashScreenComponent, {
        environmentInjector,
        hostElement,
    });

    applicationRef.attachView(splashScreenComponentRef.hostView);
}

export function provideSplashScreenModule(): EnvironmentProviders {
  return provideEnvironmentInitializer(provideSplashScreenComponent);
}
