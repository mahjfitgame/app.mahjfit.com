// file: src/app/area/open/route.ts
import { Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_OPEN_AREA } from './slug';
import { AuthAreaRoute } from '../auth/route';
import { PrivateAreaRoute } from '../private/route';
import { HttpStatusServiceUnavailableRoute } from '../../module/shared/http-status/service-unavailable/route';
import { HttpStatusNotFoundRoute } from 'src/app/module/shared/http-status/not-found/route';
import { GameRoute } from 'src/app/module/business/game/route';
import { AreaGuard } from '../guard';

export class OpenAreaRoute {
    public static readonly moduleLevel = [SLUG_OPEN_AREA];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/open/route.ts]
     */
    public static routes(): Routes {

        const routes: Routes = [
            {
                path: SLUG_OPEN_AREA, // this can be like "admin" or "" (empty) as per project base but will be fixed for each project
                children: [
                    ...AuthAreaRoute.routes(), // has its own layout to match auth screens
                    ...PrivateAreaRoute.routes(), // has its own layout to match logged in account
                    {
                        path: '', // has its own layout to match general pages
                        loadComponent: () => import('@area/open/layout.component').then((c) => c.OpenAreaLayoutComponent),
                        children: [
                            // not restricted open area no signin required
                            {
                                path: '',
                                pathMatch: 'full',
                                loadComponent: () => import('@module/business/home/component').then((c) => c.HomeComponent),
                            },
                            // restricted open area required signin
                            {
                                path: '',
                                canMatch: [AreaGuard.CanMatchAuthenticatedOrRedirect],
                                canActivate: [],
                                canActivateChild: [],
                                canDeactivate: [],
                                children: [
                                    ...GameRoute.routes(),
                                ]
                            },

                            // http state componenets
                            ...HttpStatusServiceUnavailableRoute.routes(),
                            ...HttpStatusNotFoundRoute.routes(),
                        ],
                    },
                ],
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
