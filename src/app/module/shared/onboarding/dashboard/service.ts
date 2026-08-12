// file: src/app/module/shared/onboarding/dashboard/service.ts
import { inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { I18nService } from "@base/internationalization/service";
import { PrivateAreaLayoutService } from "@area/private/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleServiceType } from "@libs/foundation-module/type/service";
import { ONBOARDING_DASHBOARD_I18N_KEY } from "@module/shared/onboarding/dashboard/const";
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

    constructor() {

    }
    public initI18n(): void {
        this.i18n.useModule(ONBOARDING_DASHBOARD_I18N_KEY);
    }
    public setModuleInfo(): void {
        this.paLayout.state.setModuleInfo({
            icon: 'dashboard',
            url: DashboardRoute.absolutePath(),
            title: null, //'Dashboard',
            hint: null, //'Access to dashboard',
            i18n: {
                title: 'ONBOARDING_DASHBOARD.MODULE.TITLE',
                hint: 'ONBOARDING_DASHBOARD.MODULE.HINT',
            }
        });
    }
    public alterBreadcrumb(): void {

    }
}
