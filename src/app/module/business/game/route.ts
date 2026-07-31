// ./src/app/module/business/game/route.ts

import { Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_GAME } from './slug';
import { SLUG_PRIVATE_AREA } from 'src/app/area/private/slug';
import { SLUG_OPEN_AREA } from 'src/app/area/open/slug';


export class GameRoute {
    public static readonly moduleLevel = [SLUG_OPEN_AREA, SLUG_GAME];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/private/route.ts]
     */
    public static routes(): Routes {
        
        const routes: Routes = [
            {
                path: SLUG_GAME,
                title: 'Game',
                loadComponent: () => import('./game-shell/component').then((c) => c.GameShellComponent),
            },
        ];

        return routes;
    }

    // ABSOLUTE PATH ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static absolutePathArr(): string[] {
        const moduleLevel = this.moduleLevel;
        const params = {};

        return UrlService.getAbsolutePathArr(this.moduleLevel, params);
    }
    public static absolutePath(): string {
        const moduleLevel = this.moduleLevel;
        const params = {};
        return UrlService.getAbsolutePath(moduleLevel, params);
    }
}