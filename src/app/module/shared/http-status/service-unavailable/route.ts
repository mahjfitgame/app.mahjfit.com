// file: src/app/module/shared/http-status/service-unavailable/route.ts

import { inject, Service } from '@angular/core';
import { NavigationError, RedirectCommand, Router } from '@angular/router';
import { LogService } from '@libs/log/service';
import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModulePath } from '@libs/foundation/module/path';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { UrlService } from '@libs/url/service';
import { SLUG_HTTP_STATUS_SERVICE_UNAVAILABLE } from '@module/shared/http-status/service-unavailable/slug';
import { OpenAreaRoute } from '@area/open/route';

@Service({ autoProvided: false })
export class HttpStatusServiceUnavailableRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly registryKey = 'HTTP_503';
    public static readonly area = FoundationAreaEnum.OPEN;

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly url = inject(UrlService);
    public readonly router = inject(Router);

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('./component').then((c) => c.HttpStatusServiceUnavailableComponent),
            canMatch: [],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            breadcrumbAlias: 'httpStatusServiceUnavailable',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: OpenAreaRoute.registryKey,
            url_slug: SLUG_HTTP_STATUS_SERVICE_UNAVAILABLE,
            label: 'GL.MODULE.HTTP_STATUS.SERVICE_UNAVAILABLE',
            icon: 'cloud_off',
            sort_order: 10,
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
    /**
     * @navigationErrorHandler
     * wired in app.config.ts via withNavigationErrorHandler()
     *
     * lives on the route class that owns /503, static arrow property matching
     * AreaGuard's convention. runs inside runInInjectionContext, so inject()
     * is legal here
     */
    public static readonly navigationErrorHandler = (error: NavigationError): unknown | RedirectCommand => {
        const router = inject(Router);
        const log = inject(LogService);

        /** ⚠ NOT decoration. this swallows every navigation failure, lazy chunk 404s included */
        log.error('[ROUTER] navigation failed', error);

        const target = HttpStatusServiceUnavailableRoute.absolutePath();

        /** ⚠ loop guard: if the 503 chunk is what failed, redirecting here fails identically, forever */
        if (router.url === target) {
            return undefined;
        }

        /** replaceUrl keeps the failed url out of history, so back does not re-trigger it */
        return new RedirectCommand(router.parseUrl(target), { replaceUrl: true });
    };

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
}
