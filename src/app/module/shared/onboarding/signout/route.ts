// file: src/app/module/shared/onboarding/signout/route.ts

import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModulePath } from '@libs/foundation/module/path';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { UrlService } from '@libs/url/service';
import { AreaGuard } from '@area/guard';
import { AuthAreaRoute } from '@area/auth/route';
import { SLUG_SIGNOUT } from '@module/shared/onboarding/signout/slug';

@Service({ autoProvided: false })
export class SignoutRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly registryKey = 'ONBOARDING_SIGNOUT';
    public static readonly area = FoundationAreaEnum.AUTH;

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly url = inject(UrlService);
    public readonly router = inject(Router);

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** CODE OWNED. the guard moves here from the route literal */
    public static definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('@module/shared/onboarding/signout/component').then((c) => c.SignoutComponent),
            canMatch: [AreaGuard.CanMatchRemnantAuthenticated],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            breadcrumbAlias: 'signout',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: AuthAreaRoute.registryKey,
            url_slug: SLUG_SIGNOUT,
            label: 'GL.MODULE.ONBOARDING.SIGNOUT',
            icon: 'logout',
            sort_order: 90,
            hidden: true,
            nav_position: [FoundationNavPositionEnum.START],
        };
    }

    // RELATIVE PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ KEPT DELIBERATELY. signout/template.html:67 binds these to [href], not
     * [routerLink], to force a full page reload after a session is torn down.
     * only the body changed, the public names are what the template calls
     */
    public static getRelativePathArr(): string[] {
        return FoundationModulePath.relativeArrOf(this.registryKey);
    }
    public static getRelativePath(): string {
        return FoundationModulePath.relativeOf(this.registryKey);
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
