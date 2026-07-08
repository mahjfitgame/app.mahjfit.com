import { bootstrapApplication } from '@angular/platform-browser';
import { defineCustomElements as defineJeepSqliteCustomElements } from 'jeep-sqlite/loader';
import { appConfig } from '@app/app.config';
import { AppComponent } from '@app/app.component';

if (typeof window !== 'undefined') {
  defineJeepSqliteCustomElements(window);
}

bootstrapApplication(AppComponent, appConfig)
  .then(() => {})
  .catch((err: any) => {
    console.error(err);
  });
