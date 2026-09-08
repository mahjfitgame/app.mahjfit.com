// file: src/app/area/open/route.ts

import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModuleRoute } from '@libs/foundation/module/route';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { SLUG_OPEN_AREA } from '@area/open/slug';

/**
 * @OpenAreaRoute
 * the open area is a registered module like any other
 *
 * ⚠ its row is the one with parent_key: null, which is what leaves the builder
 * with no special case for "the area"
 */
export class OpenAreaRoute extends FoundationModuleRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override readonly registryKey = 'AREA_OPEN';
    public static override readonly area = FoundationAreaEnum.OPEN;

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('@area/open/component').then((c) => c.OpenAreaLayoutComponent),
            canMatch: [],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            resolve: this.resolve(),
            breadcrumbAlias: 'open',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ url_slug is '' AND this node has children, so the builder must NOT emit
     * pathMatch:'full' for it — that only goes on a leaf
     *
     * ⚠ default_child_key is the ONLY thing routing '/'. omit it and the app
     * lands on /404, which is precisely the 2026-08-16 symptom
     */
    public static override nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: null,
            url_slug: SLUG_OPEN_AREA,
            label: 'GL.MODULE.HOME',
            icon: 'public',
            sort_order: 0,
            actions: [],
            hidden: true,
            default_child_key: 'HOME',
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
