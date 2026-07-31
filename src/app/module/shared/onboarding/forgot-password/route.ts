// ./src/app/module/shared/onboarding/forgot-password/route.ts

import { Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_FORGOT_PASSWORD } from '@module/shared/onboarding/forgot-password/slug';
import { SLUG_AUTH_AREA } from 'src/app/area/auth/slug';

export class ForgotPasswordRoute {
    public static readonly moduleLevel = [SLUG_AUTH_AREA, SLUG_FORGOT_PASSWORD];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/auth/route.ts]
     */
    public static routes(): Routes {
        
        const routes: Routes = [
            {
                path: SLUG_FORGOT_PASSWORD,
                title: 'Forgot Password',
                loadComponent: () => import('@module/shared/onboarding/forgot-password/component').then((c) => c.ForgotPasswordComponent),
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