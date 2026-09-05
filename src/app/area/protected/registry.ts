// file: src/app/area/protected/registry.ts

import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationAreaBuilder } from '@libs/foundation/area/builder';
import { FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationAreaBuildType, FoundationAreaRegistryType } from '@libs/foundation/area/type';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { ProtectedAreaRoute } from '@area/protected/route';
import { HomeRoute } from '@module/business/home/route';
import { SignoutRoute } from '@module/shared/onboarding/signout/route';

/**
 * @ProtectedAreaRegistry
 * the website user's signed in area, /account
 *
 * ⚠ FLAT and COMPLETE, borrowed modules included. one map, one lookup. a row
 * whose key is missing from here is DROPPED by the builder with a dev-mode
 * error — that is the dead link guarantee, not an inconvenience
 *
 * ⚠ NEW AREA, so it owns no module of its own yet. the two entries below are
 * both BORROWED, which is what gives the shell a live footer bar and a working
 * avatar menu on day one. add real modules as they are written
 */
export class ProtectedAreaRegistry {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** = te_access_area */
    public static readonly key = FoundationAreaEnum.PROTECTED;

    public static readonly modules: FoundationAreaRegistryType = {
        // the area's own route is a node like any other, parent_key: null
        [ProtectedAreaRoute.registryKey]: ProtectedAreaRoute,

        /**
         * BORROWED — another area owns the route, this area shows a menu entry
         * ⚠ DERIVED from module.area, never declared. HomeRoute.area is OPEN and
         * SignoutRoute.area is AUTH, so the builder emits nav and NO route for
         * them: there is no /account/home and no /account/signout
         */
        [HomeRoute.registryKey]: HomeRoute,               // .area = OPEN
        [SignoutRoute.registryKey]: SignoutRoute,         // .area = AUTH

        // SHARED MODULES
        // ⚠ a module belongs here with .area = PROTECTED and
        //   parent_key: ProtectedAreaRoute.registryKey to get /account/<slug>

        // BUSINESS MODULES
    };

    // NAVS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ THE SWAP POINT — the only method that changes when the api lands:
     *
     *     public static async navs() { return await api.navRows(this.key); }
     */
    public static navs(): FoundationModuleRouteNavType[] {
        return [
            ...Object.values(this.modules).map((module) => module.nav()),

            // BORROWED NAV OVERRIDES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
            /**
             * ⚠ hidden: false is LOAD BEARING on the signout row — SignoutRoute's
             * own row is hidden:true (it is routed, never listed, in the auth
             * area) and the builder skips a borrowed row that is hidden, so
             * without the override the avatar menu would come out empty.
             * HomeRoute's row is already visible; it is spelled out there for
             * symmetry, so neither entry has to be read against its source
             */
            {
                ...HomeRoute.nav(),
                area_key: this.key,
                parent_key: ProtectedAreaRoute.registryKey,
                sort_order: 0,
                hidden: false,
                /** ⚠ TWO positions from ONE row: the top bar and the footer bar */
                nav_position: [
                    FoundationNavPositionEnum.TOP,
                    FoundationNavPositionEnum.BOTTOM,
                ],
            },
            {
                ...SignoutRoute.nav(),
                area_key: this.key,
                parent_key: ProtectedAreaRoute.registryKey,
                sort_order: 90,
                hidden: false,
                divider: true,
                css_class: 'tw:text-error!',
                /** ⚠ the avatar menu, not the top bar */
                nav_position: [FoundationNavPositionEnum.ONBOARDING],
            },
        ];
    }

    // BUILD ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** cached: AreaRoute asks at startup, a nav module asks again at mount */
    private static built: FoundationAreaBuildType | null = null;

    public static build(): FoundationAreaBuildType {
        return (this.built ??= FoundationAreaBuilder.build(this.key, this.modules, this.navs()));
    }
}
