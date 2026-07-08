// file: ./src/app/module/shared/geo/country/route.ts

import { Routes } from '@angular/router';
import { SLUG_GEO_COUNTRY } from '@module/shared/geo/country/slug';
import { SLUG_CRUD_CREATE, SLUG_CRUD_UPDATE } from '@base/crud/slug';

// need to merge with app routes [src/app/app.routes.ts] 
export const geoCountryRoutes: Routes = [
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
