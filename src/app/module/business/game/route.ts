// ./src/app/module/business/game/route.ts

import { Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_GAME, SLUG_GAME_KEYID } from './slug';
import { SLUG_PRIVATE_AREA } from 'src/app/area/private/slug';
import { SLUG_OPEN_AREA } from 'src/app/area/open/slug';
import { AreaGuard } from 'src/app/area/guard';
import { Service } from '@angular/core';
import { GameGuard } from './gaurd';

@Service({ autoProvided: false })
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
                pathMatch: 'full',
                canMatch: [
                    GameGuard.CanMatchCreateNewAndRedirect
                ],
                //redirectTo: HttpStatusNotFoundRoute.absolutePath(),
            },
            {
                path: SLUG_GAME_KEYID,
                canMatch: [
                    GameGuard.CanMatchVerifyStartGame
                ],
                title: 'Mahjfit Online - Play with your Mah Jongg Card',
                loadComponent: () => import('./component').then((c) => c.GameComponent),
            }
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