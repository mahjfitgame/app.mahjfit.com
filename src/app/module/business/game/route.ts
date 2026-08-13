// ./src/app/module/business/game/route.ts

import { Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_GAME, SLUG_GAME_KEYID, SLUG_GAME_PARAM_GKEYID } from './slug';
import { SLUG_OPEN_AREA } from 'src/app/area/open/slug';
import { Service } from '@angular/core';
import { GameGuard } from './gaurd';
import { GameState } from './state/state';

@Service({ autoProvided: false })
export class GameRoute {
    public static readonly moduleLevel = [SLUG_OPEN_AREA, SLUG_GAME];
    public static readonly moduleLevelWithGame = [SLUG_OPEN_AREA, SLUG_GAME_KEYID];

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
                providers: [],
                canActivate: [
                    //GameGuard.CanMatchCreateNewAndRedirect
                ],
                // redirectTo: HttpStatusNotFoundRoute.absolutePath(),
                loadComponent: () => import('./component').then((c) => c.GameComponent),
            },
            {
                path: SLUG_GAME_KEYID,
                providers: [],
                canActivate: [
                    //GameGuard.CanMatchVerifyStartGame
                ],
                title: 'Mahjfit Online - Play with your Mah Jongg Card',
                loadComponent: () => import('./component').then((c) => c.GameComponent),
            }
        ];

        return routes;
    }

    // ABSOLUTE PATH ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static absolutePathArr(gkeyid?: string): string[] {
        let moduleLevel = this.moduleLevel;
        let params = {};
        if (gkeyid) {
            moduleLevel = this.moduleLevelWithGame;
            params = { [`:${SLUG_GAME_PARAM_GKEYID}`]: gkeyid };
        }

        return UrlService.getAbsolutePathArr(this.moduleLevel, params);
    }
    public static absolutePath(gkeyid?: string): string {
        let moduleLevel = this.moduleLevel;
        let params = {};
        if (gkeyid) {
            moduleLevel = this.moduleLevelWithGame;
            params = { [`:${SLUG_GAME_PARAM_GKEYID}`]: gkeyid };
        }

        return UrlService.getAbsolutePath(moduleLevel, params);
    }
}