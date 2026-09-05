// file: src/app/module/shared/preboarding/recover-password/route.ts

import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModulePath } from '@libs/foundation/module/path';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { UrlService } from '@libs/url/service';
import { AreaGuard } from '@area/guard';
import { AuthAreaRoute } from '@area/auth/route';
import { SLUG_FOUNDATION_PARAM_PUBLICID } from '@libs/foundation/const';
import {
    SLUG_RECOVER_PASSWORD_PUBLICID,
    SLUG_RECOVER_PASSWORD_QUERYPARAM_PASS_RECOVER_TOKEN,
} from '@module/shared/preboarding/recover-password/slug';

@Service({ autoProvided: false })
export class RecoverPasswordRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly registryKey = 'PREBOARDING_RECOVER_PASSWORD';
    public static readonly area = FoundationAreaEnum.AUTH;

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly url = inject(UrlService);
    public readonly router = inject(Router);

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('./component').then((c) => c.RecoverPasswordComponent),
            canMatch: [
                AreaGuard.CanMatchUnauthenticated,
                AreaGuard.CanMatchPublicid,
            ],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            breadcrumbAlias: 'recoverPassword',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ url_slug carries :publicid, the pre existing session/entity key, NOT
     * the new :keyid which is a table row key. they are different concepts
     *
     * ⚠ the bare `recover-password` -> /404 redirect is gone. one row is one
     * route, and the bare path now falls through to AreaRoute's '**' which
     * lands on the same /404, one redirect hop later
     */
    public static nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: AuthAreaRoute.registryKey,
            url_slug: SLUG_RECOVER_PASSWORD_PUBLICID,
            label: 'GL.MODULE.PREBOARDING.RECOVER_PASSWORD',
            icon: 'key',
            sort_order: 40,
            hidden: true,
            nav_position: [FoundationNavPositionEnum.START],
        };
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ these take a token, unlike every other module
     *
     * this is exactly why FoundationModulePath.of() kept the `params` argument
     * that UrlService.getAbsolutePath() had: substitute what was supplied, then
     * drop any :placeholder left unfilled. called with no token it returns
     * /auth/recover-password, identical to before this phase
     *
     * ⚠ the token MUST be optional. FoundationModuleRouteType declares
     * absolutePath(): string, and the registry map is where that static shape
     * is type checked — a required argument fails to compile there
     */
    public static absolutePathArr(token = ''): string[] {
        return FoundationModulePath.arrOf(this.registryKey, {
            [`:${SLUG_FOUNDATION_PARAM_PUBLICID}`]: token,
        });
    }
    public static absolutePath(token = ''): string {
        return FoundationModulePath.of(this.registryKey, {
            [`:${SLUG_FOUNDATION_PARAM_PUBLICID}`]: token,
        });
    }

    // NAVIGATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** delegates to the app-wide standard param declared in UrlState */
    public readonly paramPublicid = this.url.state.routeParamPublicid;

    // QUERY PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly queryParamPassRecoverToken = this.url.state.getRouteQueryParam(
        SLUG_RECOVER_PASSWORD_QUERYPARAM_PASS_RECOVER_TOKEN,
    );
}
