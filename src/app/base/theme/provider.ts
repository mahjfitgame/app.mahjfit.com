// file: src/app/base/theme/provider.ts
import { DOCUMENT } from '@angular/common';
import { inject, provideAppInitializer } from '@angular/core';
import { THEME_MODE_ATTRIBUTE } from '@base/theme/const';
import { ThemeService } from '@base/theme/service';

export function provideThemeModule() {
  return [
    provideAppInitializer(async () => {
      const document = inject(DOCUMENT);

      // injecting the service activates its state, without this the theme is applied only
      // once a component injecting ThemeService renders
      const service = inject(ThemeService);

      // persisted state loads async, waiting for it here keeps bootstrap on hold until the
      // selected mode is known, so the splash screen and layout render in the right theme
      await service.state.whenReady();

      document.body.setAttribute(THEME_MODE_ATTRIBUTE, service.state.themeMode());
    }),
  ];
}
