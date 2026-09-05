// file: src/app/module/shared/dashboard/service.ts
import { inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { I18nService } from "@base/internationalization/service";
import { PrivateAreaLayoutService } from "@area/private/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleServiceType } from "@libs/foundation/module/type";
import { DASHBOARD_I18N_KEY } from "src/app/module/shared/dashboard/const";
import { DashboardRoute } from "./route";
import { DashboardState } from "./state";

@Service({ autoProvided: false })
export class DashboardService implements FoundationModuleServiceType {
    public readonly DashboardRoute = DashboardRoute;

    public readonly paLayout = inject(PrivateAreaLayoutService);

    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);
    public readonly ps = inject(PlatformService);
    public readonly ctxp = inject(ContextProfileService);

    public readonly api = inject(BfwApiService);

    public readonly state = inject(DashboardState);

    constructor(){
        // █████ FoundationModuleServiceType
        // load this module's translations first, so the i18n keys setModuleInfo() publishes already resolve.
        // constructor, not component ngOnInit - see I18nService.useModule() for why
        this.initI18n();

        // set module info
        this.setModuleInfo();

        // alter breadcrumbs
        this.alterBreadcrumb();
    }
    public initI18n(): void {
        this.i18n.useModule(DASHBOARD_I18N_KEY);
    }
    public setModuleInfo(): void {
        this.paLayout.state.setModuleInfo({
            icon: 'dashboard',
            url: DashboardRoute.absolutePath(),
            title: null, //'Dashboard',
            hint: null, //'Access to dashboard',
            i18n: {
                title: 'DASHBOARD.MODULE.TITLE',
                hint: 'DASHBOARD.MODULE.HINT',
            }
        });
    }
    public alterBreadcrumb(): void {

    }
}
