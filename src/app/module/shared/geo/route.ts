// file: ./src/app/module/shared/geo/route.ts

import { Routes } from '@angular/router';
import { SLUG_GEO } from '@module/shared/geo/slug';
//import { geoCountryRoutes } from '@module/shared/geo/country/route';

// need to merge with app routes [src/app/app.routes.ts] 
export const geoRoutes: Routes = [
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
            //...geoCountryRoutes
        ]
    },
];
