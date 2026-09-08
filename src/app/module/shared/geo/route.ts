// file: src/app/module/shared/geo/route.ts

import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModuleRoute } from '@libs/foundation/module/route';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { SLUG_GEO } from '@module/shared/geo/slug';
import { PrivateAreaRoute } from '@area/private/route';

/**
 * @GeoRoute
 * a GROUP that owns a url level
 *
 * ⚠ compare OnboardingRoute, the other kind: that one owns no url at all
 */
export class GeoRoute extends FoundationModuleRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override readonly registryKey = 'GEO';
    public static override readonly area = FoundationAreaEnum.PRIVATE;

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * no component, so the builder emits a componentless route and a menu panel
     * rather than a link, AND derives breadcrumb.disable from it
     *
     * ⚠ that derivation replaces the hand written `disable: true` plus
     * `routeInterceptor: () => null` this route used to carry. without it the
     * geo crumb links to /private/geo, which matches nothing and lands on /404
     */
    public static override definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            canMatch: [],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            resolve: this.resolve(),
            breadcrumbAlias: 'geo',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: PrivateAreaRoute.registryKey,
            url_slug: SLUG_GEO,
            label: 'GL.MODULE.GEO.TITLE',
            icon: 'planet',
            sort_order: 30,
            actions: [],
            nav_position: [FoundationNavPositionEnum.START],
        };
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ absolutePath() / absolutePathArr() are INHERITED from FoundationModuleRoute —
     * they read this.registryKey off this class, so the two identical copies that
     * used to sit here are gone.
     */
}
