// ./src/app/module/shared/onboarding/my-profile/route.ts

import { Routes } from '@angular/router';
import { SLUG_MY_PROFILE } from '@module/shared/onboarding/my-profile/slug';

// need to merge with app routes [src/app/app.routes.ts] 
export const myProfileRoutes: Routes = [
     {
        path: SLUG_MY_PROFILE,
        title: 'My Profile',
        loadComponent: () => import('@module/shared/onboarding/my-profile/component').then((c) => c.MyProfileComponent),
        data: {
            breadcrumb: {
                label: 'My Profile',
                alias: 'myProfile',
                info: '',
                routeInterceptor: (routeLink: any, breadcrumb: any)=> {
                    return routeLink;
                }
            },
        },
    },
];
