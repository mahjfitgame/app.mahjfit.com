// ./src/app/module/business/game/route.ts

import { Routes } from '@angular/router';
import { SLUG_START_GAME } from './slug';


// need to merge with app routes [src/app/app.routes.ts] 
export const startGameRoutes: Routes = [
     {
        path: SLUG_START_GAME,
        title: 'New Game',
        loadComponent: () => import('./game-shell/component').then((c) => c.GameShellComponent),
    },
];
