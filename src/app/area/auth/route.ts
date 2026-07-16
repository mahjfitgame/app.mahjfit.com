// ./src/app/area/auth/route.ts
import { Routes } from '@angular/router';
import { SLUG_AUTH_AREA } from '@area/auth/slug';
//import { signinRoutes } from '@module/shared/onboarding/signin/route';
//import { SLUG_SIGNIN } from '@module/shared/onboarding/signin/slug';

// need to merge with app routes [src/app/app.routes.ts] 
export const authAreaRoutes: Routes = [
    {
        path: SLUG_AUTH_AREA,
        loadComponent: () => import('@area/auth/component').then((c) => c.AuthAreaLayoutComponent),
        children: [
            /* {
                path: "",
                redirectTo: SLUG_SIGNIN,
                pathMatch: "full",
            }, */
            //...signinRoutes
        ]
    },
];
