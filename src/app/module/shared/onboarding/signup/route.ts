// ./src/app/module/shared/onboarding/signup/route.ts

import { Routes } from '@angular/router';
import { SLUG_SIGNUP } from '@module/shared/onboarding/signup/slug';

// need to merge with app routes [src/app/app.routes.ts] 
export const signinRoutes: Routes = [
     {
        path: SLUG_SIGNUP,
        title: 'Sign Up',
        loadComponent: () => import('@module/shared/onboarding/signup/component').then((c) => c.SignupComponent),
    },
];
