// file: src/app/area/auth/nav/state.ts
import { inject, Service } from '@angular/core';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { FoundationNavService } from '@libs/foundation/nav/service';
import { FoundationNavItemType } from '@libs/foundation/nav/type';
import { AuthAreaRegistry } from '@area/auth/registry';

/**
 * @AuthNavState
 * the auth area's menus, resolved once at mount
 *
 * ⚠ provided on AuthAreaLayoutComponent, not on AuthNavComponent, so every
 * position reads ONE instance and ONE build
 *
 * ⚠ the auth area has no tree to render — its only menu markup is a flat
 * footer bar, so AuthNavComponent carries no recursive level template
 */
@Service({ autoProvided: false })
export class AuthNavState {
    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly nav = inject(FoundationNavService);

    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * FIVE positions, ONE build. plain fields, NOT computeds — rows have no
     * reactive input, all navigation reactivity rides on each item's selected()
     *
     * ⚠ `nav` MUST be declared above these, field initialisers run top to bottom
     * ⚠ never call items() from a template getter, that runs the lookup on
     *   every change detection pass
     */

    /** the footer bar, nav/template.html — BOTTOM branch. holds Home today */
    public readonly bottomNav: FoundationNavItemType[] =
        this.nav.items(AuthAreaRegistry, FoundationNavPositionEnum.BOTTOM);

    /**
     * declared, empty today — Rule 3. every auth row is hidden, and the auth
     * layout is two panes and a portal, it has no sidebar to fill
     */
    public readonly startNav: FoundationNavItemType[] =
        this.nav.items(AuthAreaRegistry, FoundationNavPositionEnum.START);

    public readonly topNav: FoundationNavItemType[] =
        this.nav.items(AuthAreaRegistry, FoundationNavPositionEnum.TOP);

    public readonly endNav: FoundationNavItemType[] =
        this.nav.items(AuthAreaRegistry, FoundationNavPositionEnum.END);

    /** no avatar menu in this area — you are not signed in yet */
    public readonly onboardingNav: FoundationNavItemType[] =
        this.nav.items(AuthAreaRegistry, FoundationNavPositionEnum.ONBOARDING);
}
