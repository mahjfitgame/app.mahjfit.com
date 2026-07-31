// ./src/app/app.routes.ts
import { Routes } from '@angular/router';
import { OpenAreaRoute } from '@area/open/route';

export const routes: Routes = [
     ...OpenAreaRoute.routes(),
];