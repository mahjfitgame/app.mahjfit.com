// file: src/app/module/shared/preboarding/signin/route.ts

import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModulePath } from '@libs/foundation/module/path';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { UrlService } from '@libs/url/service';
import { AreaGuard } from '@area/guard';
import { AuthAreaRoute } from '@area/auth/route';
import { SLUG_SIGNIN } from '@module/shared/preboarding/signin/slug';

@Service({ autoProvided: false })
export class SigninRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly registryKey = 'PREBOARDING_SIGNIN';
    public static readonly area = FoundationAreaEnum.AUTH;

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly url = inject(UrlService);
    public readonly router = inject(Router);

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** CODE OWNED. the guard moves here from the route literal */
    public static definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('@module/shared/preboarding/signin/component').then((c) => c.SigninComponent),
            canMatch: [AreaGuard.CanMatchUnauthenticated],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            breadcrumbAlias: 'signin',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: AuthAreaRoute.registryKey,
            url_slug: SLUG_SIGNIN,
            label: 'GL.MODULE.PREBOARDING.SIGNIN',
            icon: 'login',
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
