// file: src/app/area/private/route.ts

import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModuleRoute } from '@libs/foundation/module/route';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { SLUG_PRIVATE_AREA } from '@area/private/slug';
import { AreaGuard } from '../guard';

/**
 * @PrivateAreaRoute
 * the BACK OFFICE — master admin. url prefix /private, signed in only
 *
 * ⚠ its slug was 'account' until the protected area was added. 'account' now
 * belongs to ProtectedAreaRoute, the website user's own logged in area. the two
 * are different audiences behind the same authentication gate
 */
export class PrivateAreaRoute extends FoundationModuleRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static override readonly registryKey = 'AREA_PRIVATE';
    public static override readonly area = FoundationAreaEnum.PRIVATE;

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** CODE OWNED: the layout and the guard. never a user's business */
    public static override definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('@area/private/component').then((c) => c.PrivateAreaLayoutComponent),
            canMatch: [AreaGuard.CanMatchAuthenticatedOrRedirect],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            resolve: this.resolve(),
            breadcrumbAlias: 'private',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ default_child_key replaces the SLUG_DASHBOARD redirect constant.
     * parent_key cannot express this: every child of this area names it as
     * parent, so nothing in parent_key says which one /private should show
     */
    public static override nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: null,
            url_slug: SLUG_PRIVATE_AREA,
            label: 'GL.AREA.PRIVATE.TITLE',
            icon: 'admin_panel_settings',
            sort_order: 0,
            actions: [],
            hidden: true,
            default_child_key: 'DASHBOARD',
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
