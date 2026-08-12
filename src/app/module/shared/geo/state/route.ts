// file: src/app/module/shared/geo/state/route.ts

import { inject, Service } from '@angular/core';
import { ActivatedRoute, Router, Routes } from '@angular/router';
import { FoundationModuleRouteType } from '@libs/foundation-module/type/route';
import { SLUG_GEO_STATE } from '@module/shared/geo/state/slug';
import { SLUG_GEO } from '../slug';
import { UrlService } from '@libs/url/service';
import { SLUG_PRIVATE_AREA } from 'src/app/area/private/slug';

@Service({ autoProvided: false })
export class GeoStateRoute implements FoundationModuleRouteType {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly moduleLevel = [SLUG_PRIVATE_AREA, SLUG_GEO, SLUG_GEO_STATE];

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly activeRoute = inject(ActivatedRoute);
    public readonly router = inject(Router);

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/module/shared/geo/route.ts]
     */
    public static routes(): Routes {
        const routes: Routes = [
            {
                path: SLUG_GEO_STATE,
                title: 'Geo State',
                loadComponent: () => import('@module/shared/geo/state/component').then((c) => c.GeoStateComponent),
                data: {
                    breadcrumb: {
                        label: 'State',
                        alias: 'geoState',
                        info: {
                            icon: 'globe',
                        },
                        routeInterceptor: (routeLink: any, breadcrumb: any) => {
                            return routeLink;
                        },
                    },
                },
            },
        ];

        return routes;
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
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

    // NAVIGATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
}
