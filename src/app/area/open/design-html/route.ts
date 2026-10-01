// file: src/app/area/open/design-html/route.ts

import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModuleRoute } from '@libs/foundation/module/route';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { OpenAreaRoute } from '@area/open/route';

/**
 * @DesignHtmlRoute
 *
 * ⚠ TEMPORARY — a throwaway canvas for iterating on HTML/CSS with no CRUD/state
 * behind it. Delete this whole folder, drop it from OpenAreaRegistry.modules,
 * and put OpenAreaRoute.nav().default_child_key back to 'HOME' once the design
 * work is done.
 *
 * ⚠ hidden: true below keeps it out of every menu, which is also why its label
 * is a plain literal instead of a GL.* key — nothing ever renders it, so there
 * is nothing to translate.
 *
 * ⚠ url_slug '' (not a real slug) is deliberate: it renders directly at '/'
 * with NO redirectTo, unlike a normal default_child_key handoff (see
 * OpenAreaRoute.nav() for why that one had to come out to make room for this).
 * It is a LEAF though (no children of its own), so the builder still emits
 * pathMatch:'full' for it — see FoundationAreaBuilder.walk() around line 256.
 */
export class DesignHtmlRoute extends FoundationModuleRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override readonly registryKey = 'DESIGN_HTML';
    public static override readonly area = FoundationAreaEnum.OPEN;

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('@area/open/design-html/component').then((c) => c.DesignHtmlComponent),
            canMatch: [],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            resolve: this.resolve(),
            breadcrumbAlias: 'design-html',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: OpenAreaRoute.registryKey,
            url_slug: '',// design-html
            label: 'Design Html (temp)',
            icon: 'palette',
            sort_order: 0,
            actions: [],
            hidden: true,
            nav_position: [FoundationNavPositionEnum.START],
        };
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // ⚠ absolutePath() / absolutePathArr() are INHERITED from FoundationModuleRoute.
}
