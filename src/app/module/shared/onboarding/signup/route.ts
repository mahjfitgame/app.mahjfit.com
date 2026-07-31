// ./src/app/module/shared/onboarding/signup/route.ts

import { Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_SIGNUP } from '@module/shared/onboarding/signup/slug';
import { SLUG_AUTH_AREA } from 'src/app/area/auth/slug';

export class SignupRoute {
    public static readonly moduleLevel = [SLUG_AUTH_AREA, SLUG_SIGNUP];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/auth/route.ts]
     */
    public static routes(): Routes {
        
        const routes: Routes = [
            {
                path: SLUG_SIGNUP,
                title: 'Sign Up',
                loadComponent: () => import('@module/shared/onboarding/signup/component').then((c) => c.SignupComponent),
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