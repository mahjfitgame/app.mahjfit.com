// file: ./src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideLogModule } from '@libs/log/provider';
import { routes } from '@app/app.routes';
import { provideNotify } from '@base/notify/provider';
import { provideI18n } from '@base/internationalization/provider';
import { i18nInterceptor } from '@base/internationalization/interceptor';
import { provideSqlite } from '@libs/sqlite/provider';
import { provideSplashScreen } from '@base/splash-screen/provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSplashScreen(),
    provideHttpClient(withXhr(), withInterceptors([i18nInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideSqlite(),
    provideLogModule(),
    provideNotify(),
    provideI18n(),
  ],
};
