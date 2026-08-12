// ./src/app/module/shared/onboarding/signout/route.ts

import { inject, Service } from '@angular/core';
import { ActivatedRoute, Router, Routes } from '@angular/router';
import { FoundationModuleRouteType } from '@libs/foundation-module/type/route';
import { UrlService } from '@libs/url/service';
import { SLUG_SIGNOUT } from '@module/shared/onboarding/signout/slug';
import { SLUG_AUTH_AREA } from 'src/app/area/auth/slug';
import { AreaGuard } from 'src/app/area/guard';

@Service({ autoProvided: false })
export class SignoutRoute implements FoundationModuleRouteType {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly moduleLevel = [SLUG_AUTH_AREA, SLUG_SIGNOUT];

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly activeRoute = inject(ActivatedRoute);
    public readonly router = inject(Router);

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/open/route.ts]
     */
    public static routes(): Routes {
        const routes: Routes = [
            {
                path: SLUG_SIGNOUT,
                canMatch: [AreaGuard.CanMatchAuthenticatedOrRedirect],
                title: 'Sign Out',
                loadComponent: () => import('@module/shared/onboarding/signout/component').then((c) => c.SignoutComponent),
            },
        ];

        return routes;
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static getRelativePathArr(): string[] {
        const moduleLevel = this.moduleLevel;
        const params = {};

        return UrlService.getRelativePathArr(moduleLevel, params);
    }
    public static getRelativePath(): string {
        const moduleLevel = this.moduleLevel;
        const params = {};

        return UrlService.getRelativePath(moduleLevel, params);
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

    // NAVIGATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
}
