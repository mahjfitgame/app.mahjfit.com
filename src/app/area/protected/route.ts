// file: src/app/area/protected/route.ts

import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModuleRoute } from '@libs/foundation/module/route';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { SLUG_PROTECTED_AREA } from '@area/protected/slug';
import { AreaGuard } from '@area/guard';

/**
 * @ProtectedAreaRoute
 * the WEBSITE USER's signed in space. url prefix /account, own layout
 *
 * ⚠ how it differs from the two areas it sits between:
 *
 *   OPEN      no gate, root urls          the public website
 *   PROTECTED gate on THIS node, /account the signed in customer  ← this file
 *   PRIVATE   gate on its own node, /private  the back office master admin
 *
 * ⚠ the gate lives on the AREA node, exactly as the private area's does, so
 * RESTRICTED IS THE DEFAULT here: guards are additive and angular checks a
 * parent's canMatch before descending, so no child can opt out. a page that
 * must stay public belongs in the open area — see docs/route-phase-4.md §5a
 *
 * ⚠ canMatch, never canActivate. every AreaGuard member is typed CanMatchFn,
 * and canMatch runs BEFORE loadComponent so a signed out visitor never
 * downloads the chunk (docs/route-phase-4.md §2)
 */
export class ProtectedAreaRoute extends FoundationModuleRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** = mod_regisyry_index. ⚠ a db value, renaming it is a migration */
    public static override readonly registryKey = 'AREA_PROTECTED';
    public static override readonly area = FoundationAreaEnum.PROTECTED;

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** CODE OWNED: the layout and the guard. never a user's business */
    public static override definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('@area/protected/component').then((c) => c.ProtectedAreaLayoutComponent),
            canMatch: [AreaGuard.CanMatchAuthenticatedOrRedirect],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            resolve: this.resolve(),
            breadcrumbAlias: 'account',
            actions: [],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * ⚠ default_child_key is COMMENTED OUT, not forgotten. this area owns no
     * module yet, and the builder only emits the `{ path: '', redirectTo }`
     * when the named key is a real child row — a wrong key would silently do
     * nothing. add the first module, then name it here:
     *
     *     default_child_key: MyAccountDashboardRoute.registryKey,
     *
     * until then /account renders this shell with an empty <router-outlet>
     */
    public static override nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: null,
            url_slug: SLUG_PROTECTED_AREA,
            label: 'GL.AREA.PROTECTED.TITLE',
            icon: 'account_circle',
            sort_order: 0,
            actions: [],
            /** ⚠ TRANSPARENT, not absent: children rise a level, they do not vanish */
            hidden: true,
            // default_child_key: 'PROTECTED_DASHBOARD',
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
