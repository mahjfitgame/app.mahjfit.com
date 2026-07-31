// ./src/app/module/shared/onboarding/signin/route.ts

import { Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_SIGNIN } from '@module/shared/onboarding/signin/slug';
import { SLUG_AUTH_AREA } from 'src/app/area/auth/slug';

export class SigninRoute {
    public static readonly moduleLevel = [SLUG_AUTH_AREA, SLUG_SIGNIN];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/auth/route.ts]
     */
    public static routes(): Routes {
        
        const routes: Routes = [
            {
                path: SLUG_SIGNIN,
                title: 'Sign In',
                loadComponent: () => import('@module/shared/onboarding/signin/component').then((c) => c.SigninComponent),
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