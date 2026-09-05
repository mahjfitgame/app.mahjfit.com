// file: src/app/area/private/nav/service.ts
import { inject, Service } from '@angular/core';
import { FoundationNavService } from '@libs/foundation/nav/service';
import { FoundationNavItemType } from '@libs/foundation/nav/type';
import { PrivateNavState } from '@area/private/nav/state';
import { BreakpointObserverService } from '@libs/breakpoint/service';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';

@Service({ autoProvided: false })
export class PrivateNavService {
    public FoundationNavPositionEnum = FoundationNavPositionEnum;

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly state = inject(PrivateNavState);
    public readonly nav = inject(FoundationNavService);
    public readonly bos = inject(BreakpointObserverService);

    // BEHAVIOUR ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** a panel follows its route UNLESS the user has toggled it */
    public isExpanded(item: FoundationNavItemType): boolean {
        return this.nav.isExpanded(item);
    }

    public onExpandedChange(item: FoundationNavItemType, expanded: boolean): void {
        this.nav.onExpandedChange(item, expanded);
    }
}
