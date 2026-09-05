// file: src/app/area/protected/nav/service.ts
import { inject, Service } from '@angular/core';
import { FoundationNavService } from '@libs/foundation/nav/service';
import { FoundationNavItemType } from '@libs/foundation/nav/type';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { BreakpointObserverService } from '@libs/breakpoint/service';
import { ProtectedNavState } from '@area/protected/nav/state';

/**
 * @ProtectedNavService
 * mirrors PrivateNavService and AuthNavService so the three areas' nav
 * components stay drop-in interchangeable
 */
@Service({ autoProvided: false })
export class ProtectedNavService {
    public FoundationNavPositionEnum = FoundationNavPositionEnum;

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly state = inject(ProtectedNavState);
    public readonly nav = inject(FoundationNavService);
    public readonly bos = inject(BreakpointObserverService);

    // BEHAVIOUR ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * a panel follows its route UNLESS the user has toggled it
     *
     * ⚠ no consumer in this area today — the TOP and BOTTOM branches are flat
     * link rows. declared so a nested START branch can be lifted from
     * private/nav/template.html verbatim if this area ever grows a tree
     */
    public isExpanded(item: FoundationNavItemType): boolean {
        return this.nav.isExpanded(item);
    }

    public onExpandedChange(item: FoundationNavItemType, expanded: boolean): void {
        this.nav.onExpandedChange(item, expanded);
    }
}
