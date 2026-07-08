// ./src/app/module/shared/onboarding/signin/route.ts

import { Routes } from '@angular/router';
import { SLUG_SIGNIN } from '@module/shared/onboarding/signin/slug';

// need to merge with app routes [src/app/app.routes.ts] 
export const signinRoutes: Routes = [
     {
        path: SLUG_SIGNIN,
        title: 'Sign In',
        loadComponent: () => import('@module/shared/onboarding/signin/component').then((c) => c.SigninComponent),
    },
];
