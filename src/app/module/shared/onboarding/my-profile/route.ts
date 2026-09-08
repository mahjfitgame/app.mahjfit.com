// file: src/app/module/shared/onboarding/my-profile/route.ts

import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModuleRoute } from '@libs/foundation/module/route';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { UrlService } from '@libs/url/service';
import { SLUG_MY_PROFILE } from '@module/shared/onboarding/my-profile/slug';
import { OnboardingRoute } from '@module/shared/onboarding/route';

@Service({ autoProvided: false })
export class MyProfileRoute extends FoundationModuleRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override readonly registryKey = 'ONBOARDING_MY_PROFILE';
    public static override readonly area = FoundationAreaEnum.PRIVATE;

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly url = inject(UrlService);
    public readonly router = inject(Router);

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('@module/shared/onboarding/my-profile/component').then((c) => c.MyProfileComponent),
            canMatch: [],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            resolve: this.resolve(),
            breadcrumbAlias: 'myProfile',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ parent is the ONBOARDING group, not the area. that is the only reason
     * this renders in the avatar menu instead of the sidebar — and because the
     * group is a pass through, the url is still /private/my-profile
     */
    public static override nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: OnboardingRoute.registryKey,
            url_slug: SLUG_MY_PROFILE,
            label: 'GL.MODULE.ONBOARDING.MY_PROFILE',
            icon: 'person',
            sort_order: 10,
            actions: [],
            nav_position: [FoundationNavPositionEnum.ONBOARDING],
        };
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ absolutePath() / absolutePathArr() are INHERITED from FoundationModuleRoute —
     * they read this.registryKey off this class, so the two identical copies that
     * used to sit here are gone.
     */

    // NAVIGATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
}
