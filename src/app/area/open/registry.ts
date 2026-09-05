// file: src/app/area/open/registry.ts

import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationAreaBuilder } from '@libs/foundation/area/builder';
import { FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationAreaBuildType, FoundationAreaRegistryType } from '@libs/foundation/area/type';
import { OpenAreaRoute } from '@area/open/route';
import { HomeRoute } from '@module/business/home/route';
import { HttpStatusNotFoundRoute } from '@module/shared/http-status/not-found/route';
import { HttpStatusServiceUnavailableRoute } from '@module/shared/http-status/service-unavailable/route';
import { GameInstanceRoute, GameRoute } from 'src/app/module/business/game/route';

export class OpenAreaRegistry {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** = te_access_area */
    public static readonly key = FoundationAreaEnum.OPEN;

    /**
     * = te_authorisation_module, this area's slice
     *
     * ⚠ FLAT and COMPLETE. no nesting, no order, no meaning beyond "this key is
     * that class". hierarchy is row.parent_key and order is row.sort_order,
     * both data
     */
    public static readonly modules: FoundationAreaRegistryType = {
        // the area's own route is a node like any other, parent_key: null
        [OpenAreaRoute.registryKey]: OpenAreaRoute,

        // BUSINESS MODULES
        [HomeRoute.registryKey]: HomeRoute,
        [GameRoute.registryKey]: GameRoute,
        [GameInstanceRoute.registryKey]: GameInstanceRoute,

        // SHARED MODULES
        [HttpStatusServiceUnavailableRoute.registryKey]: HttpStatusServiceUnavailableRoute,
        [HttpStatusNotFoundRoute.registryKey]: HttpStatusNotFoundRoute,
    };

    // NAVS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ THE SWAP POINT — the only method that changes when the api lands:
     *
     *     public static async navs() { return await api.navRows(this.key); }
     */
    public static navs(): FoundationModuleRouteNavType[] {
        return Object.values(this.modules).map((module) => module.nav());
    }

    // BUILD ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** cached: AreaRoute asks at startup, a nav module asks again at mount */
    private static built: FoundationAreaBuildType | null = null;

    public static build(): FoundationAreaBuildType {
        return (this.built ??= FoundationAreaBuilder.build(this.key, this.modules, this.navs()));
    }
}
