// ./src/app/module/business/game/route.ts

import { Router, Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_GAME, SLUG_GAME_KEYID, SLUG_GAME_PARAM_GKEYID } from './slug';
import { SLUG_OPEN_AREA } from 'src/app/area/open/slug';
import { inject, Service } from '@angular/core';
import { GameGuard } from './gaurd';
import { GameState } from './state/state';
import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationActionEnum } from '@libs/foundation/action/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { OpenAreaRoute } from 'src/app/area/open/route';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { FoundationModulePath } from '@libs/foundation/module/path';
import { AreaGuard } from 'src/app/area/guard';
import { FoundationModuleRoute } from '@libs/foundation/module/route';

@Service({ autoProvided: false })
export class GameRoute extends FoundationModuleRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** = mod_regisyry_index. ⚠ a db value, renaming it is a migration */
    public static override readonly registryKey = 'GAME';
    public static override readonly area = FoundationAreaEnum.OPEN;

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly url = inject(UrlService);
    public readonly router = inject(Router);

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * CODE OWNED. `actions` is authoritative (Rule 6): an api's list is
     * filtered against it, so a policy row can never expose a capability with
     * no implementation behind it
     *
     * ⚠ this list also drives the absolutePath*() helpers below — declare an
     * action here or its route was never generated
     */
    public static override definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('./component').then((c) => c.GameComponent),
            canMatch: [AreaGuard.CanMatchAuthenticatedOrRedirect],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            resolve: this.resolve(),
            breadcrumbAlias: 'game',
            actions: [
                FoundationActionEnum.CREATE,           // -> country/create
            ],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: OpenAreaRoute.registryKey,
            url_slug: SLUG_GAME,
            label: 'GL.MODULE.GAME',
            icon: 'globe',
            sort_order: 10,
            actions: [],
            nav_position: [FoundationNavPositionEnum.START],
        };
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ absolutePath() / absolutePathArr() are INHERITED from FoundationModuleRoute —
     * they read this.registryKey off this class, so the two identical copies that
     * used to sit here are gone.
     */

    // NAVIGATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

}

@Service({ autoProvided: false })
export class GameInstanceRoute extends FoundationModuleRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** = mod_regisyry_index. ⚠ a db value, renaming it is a migration */
    public static override readonly registryKey = 'GAME_INSTANCE';
    public static override readonly area = FoundationAreaEnum.OPEN;

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('./component').then((c) => c.GameComponent),
            canMatch: [AreaGuard.CanMatchAuthenticatedOrRedirect],
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: OpenAreaRoute.registryKey,
            url_slug: SLUG_GAME_KEYID,
            hidden: true,
            label: 'GL.MODULE.GAME',
            icon: 'globe',
            sort_order: 10,
            actions: [],
            nav_position: [FoundationNavPositionEnum.START],
        };
    }


    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override absolutePathArr(gkeyid = ''): string[] {
        return this.absolutePathArrWithParams({ 
            [`:${SLUG_GAME_PARAM_GKEYID}`]: gkeyid 
        });
    }
    public static override absolutePath(gkeyid = ''): string {
        return this.absolutePathWithParams({ 
            [`:${SLUG_GAME_PARAM_GKEYID}`]: gkeyid 
        });
    }
}

export class GameRouteOLD {
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