// ./src/app/module/shared/onboarding/signin/route.ts

import { Routes } from '@angular/router';
import { SLUG_FORGOT_PASSWORD } from '@module/shared/onboarding/forgot-password/slug';

// need to merge with app routes [src/app/app.routes.ts] 
export const signinRoutes: Routes = [
     {
        path: SLUG_FORGOT_PASSWORD,
        title: 'Forgot Password',
        loadComponent: () => import('@module/shared/onboarding/forgot-password/component').then((c) => c.ForgotPasswordComponent),
    },
];
