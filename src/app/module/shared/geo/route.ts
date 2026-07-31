// file: ./src/app/module/shared/geo/route.ts

import { Routes } from '@angular/router';
import { SLUG_GEO } from '@module/shared/geo/slug';
import { GeoCountryRoute } from '@module/shared/geo/country/route';
import { SLUG_PRIVATE_AREA } from 'src/app/area/private/slug';
import { UrlService } from '@libs/url/service';

export class GeoRoute {
    public static readonly moduleLevel = [SLUG_PRIVATE_AREA, SLUG_GEO];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/private/route.ts]
     */
    public static routes(): Routes {
        const routes: Routes = [
            {
                path: SLUG_GEO,
                data: {
                    breadcrumb: {
                        label: 'Geo',
                        alias: 'geo',
                        disable: true,
                        skip: false,
                        info: {
                            icon: 'planet',
                        },
                        routeInterceptor: (routeLink: any, breadcrumb: any)=> {
                            return null; // disable this breadcrumb and do not create a route for this item
                        }
                    },
                },
                children: [
                    ...GeoCountryRoute.routes(),
                ]
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