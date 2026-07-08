// ./src/app/area/private/route.ts

import { Routes } from '@angular/router';
import { SLUG_PRIVATE_AREA } from '@area/private/slug';
import { SLUG_DASHBOARD } from '@module/shared/onboarding/dashboard/slug';
import { dashboardRoutes } from '@module/shared/onboarding/dashboard/route';
import { myProfileRoutes } from '@module/shared/onboarding/my-profile/route';
import { geoRoutes } from '@module/shared/geo/route';

// need to merge with app routes [./src/app/app.routes.ts] 
export const privateAreaRoutes: Routes = [
    {
        path: SLUG_PRIVATE_AREA,
        canActivate: [], // protects all children at once
        loadComponent: () => import('@area/private/component').then((c) => c.PrivateAreaLayoutComponent),
        data: {
            breadcrumb: {
                info: { 
                    icon: 'home', 
                    iconOnly: true
                },
            },
        },
        children: [
            {
                path: "",
                redirectTo: SLUG_DASHBOARD,
                pathMatch: "full",
            },
            ...dashboardRoutes,
            ...myProfileRoutes,
            ...geoRoutes,
        ]
    },
];
