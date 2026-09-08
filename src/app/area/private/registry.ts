// file: src/app/area/private/registry.ts

import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationAreaBuilder } from '@libs/foundation/area/builder';
import { FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationAreaBuildType, FoundationAreaRegistryType } from '@libs/foundation/area/type';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { PrivateAreaRoute } from '@area/private/route';
import { HomeRoute } from '@module/business/home/route';
import { DashboardRoute } from '@module/shared/dashboard/route';
import { GeoRoute } from '@module/shared/geo/route';
import { MyProfileRoute } from '@module/shared/onboarding/my-profile/route';
import { OnboardingRoute } from '@module/shared/onboarding/route';
import { SignoutRoute } from '@module/shared/onboarding/signout/route';

export class PrivateAreaRegistry {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly key = FoundationAreaEnum.PRIVATE;

    /**
     * ⚠ FLAT and COMPLETE, borrowed modules included. one map, one lookup,
     * nothing to forget. what stops a borrowed module generating a duplicate
     * route is its own `.area`, which the builder reads — nothing is flagged
     * by hand
     */
    public static readonly modules: FoundationAreaRegistryType = {
        [PrivateAreaRoute.registryKey]: PrivateAreaRoute,

        // BORROWED — another area owns the route, this area shows a menu entry
        [HomeRoute.registryKey]: HomeRoute,               // .area = OPEN
        [SignoutRoute.registryKey]: SignoutRoute,         // .area = AUTH

        // SHARED MODULES
        [DashboardRoute.registryKey]: DashboardRoute,
        [OnboardingRoute.registryKey]: OnboardingRoute,   // group: no url, onboarding position
        [MyProfileRoute.registryKey]: MyProfileRoute,
        [GeoRoute.registryKey]: GeoRoute,                 // group: owns /geo

        // BUSINESS MODULES
    };

    // NAVS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ THE SWAP POINT — the only method that changes when the api lands
     *
     * home lives in the open area and signout in auth, yet both belong in this
     * area's menus. in the database that is one extra te_access_area_navigation
     * record with a different acar_id, so it is one extra row here
     */
    public static navs(): FoundationModuleRouteNavType[] {
        return [
            ...Object.values(this.modules).map((module) => module.nav()),

            // BORROWED NAV OVERRIDES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
            {
                ...HomeRoute.nav(),
                area_key: this.key,
                parent_key: PrivateAreaRoute.registryKey,
                sort_order: 0,
                /** ⚠ TWO positions from ONE row: the sidebar list and the footer bar */
                nav_position: [
                    FoundationNavPositionEnum.START,
                    FoundationNavPositionEnum.BOTTOM,
                ],
            },
            {
                ...SignoutRoute.nav(),
                area_key: this.key,
                /** ⚠ under the group, so it lands in the avatar menu not the sidebar */
                parent_key: OnboardingRoute.registryKey,
                sort_order: 20,
                hidden: false,
                divider: true,
                css_class: 'tw:text-error!',
                nav_position: [FoundationNavPositionEnum.ONBOARDING],
            },
        ];
    }

    // BUILD ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private static built: FoundationAreaBuildType | null = null;

    public static build(): FoundationAreaBuildType {
        return (this.built ??= FoundationAreaBuilder.build(this.key, this.modules, this.navs()));
    }
}
