// file: src/app/area/auth/nav/service.ts
import { inject, Service } from '@angular/core';
import { FoundationNavService } from '@libs/foundation/nav/service';
import { FoundationNavItemType } from '@libs/foundation/nav/type';
import { AuthNavState } from '@area/auth/nav/state';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';

/**
 * @AuthNavService
 * mirrors PrivateNavService so the two areas' nav components stay drop-in
 * interchangeable
 *
 * ⚠ no BreakpointObserverService here, unlike the private area — the auth
 * layout has no drawer to collapse, nothing reads a breakpoint
 */
@Service({ autoProvided: false })
export class AuthNavService {
    public FoundationNavPositionEnum = FoundationNavPositionEnum;

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly state = inject(AuthNavState);
    public readonly nav = inject(FoundationNavService);

    // BEHAVIOUR ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * a panel follows its route UNLESS the user has toggled it
     *
     * ⚠ no consumer in this area today — the only markup is the flat footer
     * bar. declared so a START branch can be lifted from private/nav/ verbatim
     * if the auth area ever grows a tree
     */
    public isExpanded(item: FoundationNavItemType): boolean {
        return this.nav.isExpanded(item);
    }

    public onExpandedChange(item: FoundationNavItemType, expanded: boolean): void {
        this.nav.onExpandedChange(item, expanded);
    }
}
