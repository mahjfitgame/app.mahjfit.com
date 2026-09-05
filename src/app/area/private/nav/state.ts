// file: src/app/area/private/nav/state.ts
import { inject, Service } from '@angular/core';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { FoundationNavService } from '@libs/foundation/nav/service';
import { FoundationNavItemType } from '@libs/foundation/nav/type';
import { PrivateAreaRegistry } from '@area/private/registry';

/**
 * @PrivateNavState
 * the private area's menus, resolved once at mount
 *
 * ⚠ provided on PrivateAreaLayoutComponent, not on PrivateNavComponent, so the
 * sidebar list, the avatar menu and the footer bar all read ONE instance
 */
@Service({ autoProvided: false })
export class PrivateNavState {
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

    /** the sidebar list, nav/template.html — START branch */
    public readonly startNav: FoundationNavItemType[] =
        this.nav.items(PrivateAreaRegistry, FoundationNavPositionEnum.START);

    /** the avatar menu in the sidenav footer, rendered from private/template.html */
    public readonly onboardingNav: FoundationNavItemType[] =
        this.nav.items(PrivateAreaRegistry, FoundationNavPositionEnum.ONBOARDING);

    /** the footer bar, nav/template.html — BOTTOM branch. shares its Home node with startNav */
    public readonly bottomNav: FoundationNavItemType[] =
        this.nav.items(PrivateAreaRegistry, FoundationNavPositionEnum.BOTTOM);

    /** declared, empty today — Rule 3. no row asks for these yet */
    public readonly topNav: FoundationNavItemType[] =
        this.nav.items(PrivateAreaRegistry, FoundationNavPositionEnum.TOP);

    public readonly endNav: FoundationNavItemType[] =
        this.nav.items(PrivateAreaRegistry, FoundationNavPositionEnum.END);
}
