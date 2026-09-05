// file: src/app/module/shared/geo/route.ts

import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModulePath } from '@libs/foundation/module/path';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { SLUG_GEO } from '@module/shared/geo/slug';
import { PrivateAreaRoute } from '@area/private/route';

/**
 * @GeoRoute
 * a GROUP that owns a url level
 *
 * ⚠ compare OnboardingRoute, the other kind: that one owns no url at all
 */
export class GeoRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly registryKey = 'GEO';
    public static readonly area = FoundationAreaEnum.PRIVATE;

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * no component, so the builder emits a componentless route and a menu panel
     * rather than a link, AND derives breadcrumb.disable from it
     *
     * ⚠ that derivation replaces the hand written `disable: true` plus
     * `routeInterceptor: () => null` this route used to carry. without it the
     * geo crumb links to /private/geo, which matches nothing and lands on /404
     */
    public static definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            canMatch: [],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            breadcrumbAlias: 'geo',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: PrivateAreaRoute.registryKey,
            url_slug: SLUG_GEO,
            label: 'GL.MODULE.GEO.TITLE',
            icon: 'planet',
            sort_order: 30,
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
}
