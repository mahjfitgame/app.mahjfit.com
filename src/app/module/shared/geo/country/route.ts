// file: ./src/app/module/shared/geo/country/route.ts

import { inject, Service } from '@angular/core';
import { ActivatedRoute, Router, Routes } from '@angular/router';
import { FoundationModuleRouteType } from '@libs/foundation-module/type/route';
import { SLUG_GEO_COUNTRY } from '@module/shared/geo/country/slug';
import { SLUG_CRUD_CREATE, SLUG_CRUD_UPDATE } from '@base/crud/slug';
import { SLUG_GEO } from '../slug';
import { UrlService } from '@libs/url/service';
import { SLUG_PRIVATE_AREA } from 'src/app/area/private/slug';

@Service({ autoProvided: false })
export class GeoCountryRoute implements FoundationModuleRouteType {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly moduleLevel = [SLUG_PRIVATE_AREA, SLUG_GEO, SLUG_GEO_COUNTRY];

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
                path: SLUG_GEO_COUNTRY,
                title: 'Geo Country',
                loadComponent: () => import('@module/shared/geo/country/component').then((c) => c.GeoCountryComponent),
                data: {
                    breadcrumb: {
                        label: 'Country',
                        alias: 'geoCountry',
                        info: {
                            icon: 'globe',
                        },
                        routeInterceptor: (routeLink: any, breadcrumb: any) => {
                            return routeLink;
                        },
                    },
                },
                children: [
                    {
                        path: SLUG_CRUD_CREATE,
                        data: {
                            breadcrumb: {
                                label: 'Create',
                                alias: 'geoCountryCreate',
                            },
                        },
                        children: [], // the componentless child routes required empty children to satisfying Angular’s route validation requirement for at least one of component, loadComponent, redirectTo, children, or loadChildren
                    },
                    {
                        path: SLUG_CRUD_UPDATE,
                        data: {
                            breadcrumb: {
                                label: 'Update',
                                alias: 'geoCountryUpdate',
                            },
                        },
                        children: [],
                    },
                ],
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
