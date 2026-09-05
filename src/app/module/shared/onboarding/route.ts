// file: src/app/module/shared/onboarding/route.ts

import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModulePath } from '@libs/foundation/module/path';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { PrivateAreaRoute } from '@area/private/route';

/**
 * @OnboardingRoute
 * a GROUP that owns no url
 *
 * it exists so my-profile and signout can be addressed as one subtree and sent
 * to a different menu. adding a fourth item to the avatar menu later is one
 * route.ts with parent_key: OnboardingRoute.registryKey — no nav code, no
 * template, no new constant
 *
 * ⚠ compare GeoRoute, the other kind of group: that one owns a url level
 * (/private/geo/...), this one owns none
 */
export class OnboardingRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly registryKey = 'ONBOARDING';
    public static readonly area = FoundationAreaEnum.PRIVATE;

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * no component AND no url_slug = a PASS THROUGH group: the builder emits no
     * route node at all and splices the children into the area's own children,
     * so /private/my-profile is byte identical to before this phase
     */
    public static definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            canMatch: [],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: PrivateAreaRoute.registryKey,
            url_slug: '',                                          // ⚠ no url level
            label: 'GL.MODULE.ONBOARDING.MY_ACCOUNT',
            icon: 'account_circle',
            sort_order: 100,
            hidden: true,                                          // ⚠ transparent, children rise
            nav_position: [FoundationNavPositionEnum.ONBOARDING],  // ⚠ ...into the avatar menu
        };
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static absolutePathArr(): string[] {
        return FoundationModulePath.arrOf(this.registryKey);
    }
    public static absolutePath(): string {
        return FoundationModulePath.of(this.registryKey);
    }
}
