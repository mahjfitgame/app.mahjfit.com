// file: src/app/module/shared/http-status/not-found/route.ts

import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModulePath } from '@libs/foundation/module/path';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { UrlService } from '@libs/url/service';
import { SLUG_HTTP_STATUS_NOT_FOUND } from '@module/shared/http-status/not-found/slug';
import { OpenAreaRoute } from '@area/open/route';

@Service({ autoProvided: false })
export class HttpStatusNotFoundRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly registryKey = 'HTTP_404';
    public static readonly area = FoundationAreaEnum.OPEN;

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly url = inject(UrlService);
    public readonly router = inject(Router);

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('./component').then((c) => c.HttpStatusNotFoundComponent),
            canMatch: [],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            breadcrumbAlias: 'httpStatusNotFound',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ this module no longer owns the '**' wildcard. AreaRoute appends it once,
     * after every area, which is what makes the 2026-08-16 /503 bug (a module
     * contributing '**' mid array) structurally impossible
     */
    public static nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: OpenAreaRoute.registryKey,
            url_slug: SLUG_HTTP_STATUS_NOT_FOUND,
            label: 'GL.MODULE.HTTP_STATUS.NOT_FOUND',
            icon: 'bug_report',
            sort_order: 20,
            hidden: true,
            nav_position: [FoundationNavPositionEnum.START],
        };
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static absolutePathArr(): string[] {
        return FoundationModulePath.arrOf(this.registryKey);
    }
    public static absolutePath(): string {
        return FoundationModulePath.of(this.registryKey);
    }

    // NAVIGATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
}
