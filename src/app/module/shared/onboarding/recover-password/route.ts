// file: src/app/module/shared/onboarding/recover-password/route.ts

import { ActivatedRoute, Router, Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_AUTH_AREA } from 'src/app/area/auth/slug';
import { AreaGuard } from 'src/app/area/guard';
import { HttpStatusNotFoundRoute } from '@module/shared/http-status/not-found/route';
import { SLUG_RECOVER_PASSWORD, SLUG_RECOVER_PASSWORD_PUBLICID, SLUG_RECOVER_PASSWORD_QUERYPARAM_PASS_RECOVER_TOKEN } from './slug';
import { inject, Service } from '@angular/core';
import { FoundationModuleRouteType } from '@libs/foundation-module/type/route';
import { SLUG_FOUNDATION_MODULE_PARAM_PUBLICID } from '@libs/foundation-module/const';

@Service({ autoProvided: false })
export class RecoverPasswordRoute implements FoundationModuleRouteType {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly moduleLevel = [SLUG_AUTH_AREA, SLUG_RECOVER_PASSWORD_PUBLICID];

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly activeRoute = inject(ActivatedRoute);
    public readonly router = inject(Router);

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static routes(): Routes {
        const routes: Routes = [
            {
                path: SLUG_RECOVER_PASSWORD,
                pathMatch: 'full',
                redirectTo: HttpStatusNotFoundRoute.absolutePath(),
            },
            {
                path: SLUG_RECOVER_PASSWORD_PUBLICID,
                canMatch: [
                    AreaGuard.CanMatchUnauthenticated,
                    AreaGuard.CanMatchPublicid,
                ],
                title: 'Recover Password',
                loadComponent: () => import('./component').then((c) => c.RecoverPasswordComponent),
            },
        ];

        return routes;
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static absolutePathArr(token: string): string[] {
        const moduleLevel = this.moduleLevel;
        const params = { [`:${SLUG_FOUNDATION_MODULE_PARAM_PUBLICID}`]: token };

        return UrlService.getAbsolutePathArr(moduleLevel, params);
    }

    public static absolutePath(token: string): string {
        const moduleLevel = this.moduleLevel;
        const params = { [`:${SLUG_FOUNDATION_MODULE_PARAM_PUBLICID}`]: token };

        return UrlService.getAbsolutePath(moduleLevel, params);
    }

    // NAVIGATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    public getParamPublicid(): string | undefined {
        const publicid = this.activeRoute.snapshot.paramMap.get(SLUG_FOUNDATION_MODULE_PARAM_PUBLICID)?.trim();
        return publicid;
    }

    // QUERY PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public getQueryParamPassRecoverToken(): string | undefined {
        const prt = this.activeRoute.snapshot.queryParamMap
            .get(SLUG_RECOVER_PASSWORD_QUERYPARAM_PASS_RECOVER_TOKEN)?.trim();
        return prt;
    }
}
