// file: src/app/module/shared/onboarding/signin/route.ts

import { inject, Service } from '@angular/core';
import { ActivatedRoute, Router, Routes } from '@angular/router';
import { FoundationModuleRouteType } from '@libs/foundation-module/type/route';
import { UrlService } from '@libs/url/service';
import { SLUG_SIGNIN } from '@module/shared/onboarding/signin/slug';
import { SLUG_AUTH_AREA } from 'src/app/area/auth/slug';
import { AreaGuard } from 'src/app/area/guard';

@Service({ autoProvided: false })
export class SigninRoute implements FoundationModuleRouteType {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly moduleLevel = [SLUG_AUTH_AREA, SLUG_SIGNIN];

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly activeRoute = inject(ActivatedRoute);
    public readonly router = inject(Router);

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/auth/route.ts]
     */
    public static routes(): Routes {

        const routes: Routes = [
            {
                path: SLUG_SIGNIN,
                canMatch: [AreaGuard.CanMatchUnauthenticated],
                title: 'Sign In',
                loadComponent: () => import('@module/shared/onboarding/signin/component').then((c) => c.SigninComponent),
            },
        ];

        return routes;
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
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
