// file: src/app/app.provider.ts
import { inject, provideAppInitializer } from '@angular/core';
import { AppService } from '@app/app.service';

export function provideAppModule() {
  return [
    provideAppInitializer(() => {
      const app = inject(AppService);
      return app.initialize();
    }),
  ];
}
