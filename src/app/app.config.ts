// file: ./src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideLogModule } from '@libs/log/provider';
import { routes } from '@app/app.routes';
import { provideNotifyModule } from '@base/notify/provider';
import { provideI18nModule } from '@base/internationalization/provider';
import { i18nInterceptor } from '@base/internationalization/interceptor';
import { provideSqliteModule } from '@libs/sqlite/provider';
import { provideSplashScreenModule } from '@base/splash-screen/provider';
import { provideThemeModule } from '@base/theme/provider';
import { provideAppModule } from '@app/app.provider';
import { provideUrlModule } from '@libs/url/provider';

export const appConfig: ApplicationConfig = {
  providers: [
    // this waits for the persisted theme and applies the selected mode on <body>
    // it holds bootstrap so the splash screen and layout render in the correct theme
    provideThemeModule(),

    // this perform splash.show(); at app start
    // must be at the start so all process go after it and user experience stay consistent
    provideSplashScreenModule(),

    provideHttpClient(withXhr(), withInterceptors([i18nInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    // route state and URL sync, root scope — depends on Router above
    provideUrlModule(),

    provideSqliteModule(),
    provideLogModule(),
    provideNotifyModule(),
    provideI18nModule(),

    // keep this at the last as all defualt providers should load first so its become available for execution
    // this is main app initializer and include  all required process
    provideAppModule(),
  ],
};
