// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AreaRoute } from '@area/route';

export const routes: Routes = [
     ...AreaRoute.routes(),
];