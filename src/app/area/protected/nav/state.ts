// file: src/app/area/protected/nav/state.ts
import { inject, Service } from '@angular/core';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { FoundationNavService } from '@libs/foundation/nav/service';
import { FoundationNavItemType } from '@libs/foundation/nav/type';
import { ProtectedAreaRegistry } from '@area/protected/registry';

/**
 * @ProtectedNavState
 * this area's menus, resolved once at mount
 *
 * ⚠ provided on ProtectedAreaLayoutComponent, not on ProtectedNavComponent, so
 * the top bar, the avatar menu and the footer bar all read ONE instance and ONE
 * build
 */
@Service({ autoProvided: false })
export class ProtectedNavState {
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

    /** the top bar, nav/template.html — TOP branch. this area's main menu */
    public readonly topNav: FoundationNavItemType[] =
        this.nav.items(ProtectedAreaRegistry, FoundationNavPositionEnum.TOP);

    /** the avatar menu in the top bar, rendered from protected/template.html */
    public readonly onboardingNav: FoundationNavItemType[] =
        this.nav.items(ProtectedAreaRegistry, FoundationNavPositionEnum.ONBOARDING);

    /** the footer bar, nav/template.html — BOTTOM branch */
    public readonly bottomNav: FoundationNavItemType[] =
        this.nav.items(ProtectedAreaRegistry, FoundationNavPositionEnum.BOTTOM);

    /**
     * declared, empty today — Rule 3. this shell has no sidebar and no end
     * drawer, so no row asks for these yet
     */
    public readonly startNav: FoundationNavItemType[] =
        this.nav.items(ProtectedAreaRegistry, FoundationNavPositionEnum.START);

    public readonly endNav: FoundationNavItemType[] =
        this.nav.items(ProtectedAreaRegistry, FoundationNavPositionEnum.END);
}
