// file: ./src/app/area/private/service.ts
import { inject, Service } from "@angular/core";
import { BreakpointObserverService } from "@libs/breakpoint/service";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PAL_NOTIFICATION_TAB_KEY } from "@area/private/const";
import { I18nService } from "@base/internationalization/service";
import { PrivateAreaLayoutState } from "@area/private/state";

@Service({ autoProvided: false })
export class PrivateAreaLayoutService {

    public PAL_NOTIFICATION_TAB_KEY = PAL_NOTIFICATION_TAB_KEY;
    
    public readonly bos = inject(BreakpointObserverService);
    public readonly i18n = inject(I18nService)

    public readonly state = inject(PrivateAreaLayoutState);

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);

    constructor() {}

    public toggleEndSideBar(callback?: () => void): void {
        this.state.setEndSideBarOpen(!this.state.endSideBarOpen());
        
        if(callback)
            callback();
    }
    public switchEndSideBarTab(tab?: number | string | typeof PAL_NOTIFICATION_TAB_KEY): void {
        if (typeof tab === 'number') {
            this.state.setEndSideBarOpenTabIndex(tab);
        } else if (tab === 'notification') {
            // because fixed notification tab is after dynamic tabs
            const dynamicCount = this.state.slotEndSideBarTabBody()?.length ?? 0; // array count
            this.state.setEndSideBarOpenTabIndex(dynamicCount);
        } else if (typeof tab === 'string') {
            const tabIndexByLabel = this.state.endSideBarTabIndexByLabel() ?? {};
            const tabIndex = tabIndexByLabel[tab];
            if (typeof tabIndex === 'number') {
                this.state.setEndSideBarOpenTabIndex(tabIndex);
            }
        }
    }

    public toogleEndSideBarAndSwitchTab(tab?: number | string | typeof PAL_NOTIFICATION_TAB_KEY, callback?: () => void): void {
        setTimeout(() => {
            this.switchEndSideBarTab(tab);
        }, 10);
        setTimeout(() => {
            this.toggleEndSideBar(callback);
        }, 25);
    }
}