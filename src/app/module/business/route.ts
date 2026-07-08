// ./src/app/module/business/route.ts
import { Routes } from '@angular/router';
import { SLUG_BUSINESS_AREA } from './slug';
import { startGameRoutes } from './game/route';
import { SLUG_START_GAME } from './game/slug';

// need to merge with app routes [src/app/app.routes.ts] 
export const bussAreaRoutes: Routes = [
    {
        path: SLUG_BUSINESS_AREA,
        //loadComponent: () => import('./component').then((c) => c.AuthAreaLayoutComponent),
        children: [
            /* {
                path: "",
                redirectTo: SLUG_START_GAME,
                pathMatch: "full",
            }, */
            ...startGameRoutes
        ]
    },
];