// ./src/app/module/shared/onboarding/signout/route.ts

import { Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_SIGNOUT } from '@module/shared/onboarding/signout/slug';
import { SLUG_AUTH_AREA } from 'src/app/area/auth/slug';

export class SignoutRoute {
    public static readonly moduleLevel = [SLUG_AUTH_AREA, SLUG_SIGNOUT];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/open/route.ts]
     */
    public static routes(): Routes {
        const routes: Routes = [
            {
                path: SLUG_SIGNOUT,
                title: 'Sign Out',
                loadComponent: () => import('@module/shared/onboarding/signout/component').then((c) => c.SignoutComponent),
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