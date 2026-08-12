// file: ./src/app/module/shared/http-status/not-found/route.ts

import { ActivatedRoute, Router, Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_HTTP_STATUS_NOT_FOUND } from './slug';
import { inject, Service } from '@angular/core';
import { FoundationModuleRouteType } from '@libs/foundation-module/type/route';

@Service({ autoProvided: false })
export class HttpStatusNotFoundRoute implements FoundationModuleRouteType {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly moduleLevel = [SLUG_HTTP_STATUS_NOT_FOUND];

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly activeRoute = inject(ActivatedRoute);
    public readonly router = inject(Router);

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * Must be merged after every other app route because it owns the wildcard.
     */
    public static routes(): Routes {
        const routes: Routes = [
            {
                path: SLUG_HTTP_STATUS_NOT_FOUND,
                title: 'Page Not Found',
                loadComponent: () => import('./component').then((c) => c.HttpStatusNotFoundComponent),
            },
            {
                path: '**',
                redirectTo: SLUG_HTTP_STATUS_NOT_FOUND,
                pathMatch: 'full',
            },
        ];

        return routes;
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static absolutePathArr(): string[] {
        const moduleLevel = this.moduleLevel;
        const params = {};

        return UrlService.getAbsolutePathArr(moduleLevel, params);
    }

    public static absolutePath(): string {
        const moduleLevel = this.moduleLevel;
        const params = {};

        return UrlService.getAbsolutePath(moduleLevel, params);
    }

    // NAVIGATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
}
