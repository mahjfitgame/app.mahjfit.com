// file: src/app/module/shared/geo/state/service.ts
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
import { GEO_STATE_I18N_KEY } from "@module/shared/geo/state/const";
import { GeoStateRoute } from "./route";
import { GeoStateState } from "./state";

@Service({ autoProvided: false })
export class GeoStateService implements FoundationModuleServiceType {
    public readonly paLayout = inject(PrivateAreaLayoutService);

    public readonly route = inject(GeoStateRoute);
    public readonly state = inject(GeoStateState);

    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);
    public readonly ps = inject(PlatformService);
    public readonly ctxp = inject(ContextProfileService);

    public readonly api = inject(BfwApiService);

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
        this.i18n.useModule(GEO_STATE_I18N_KEY);
    }
    public setModuleInfo(): void {
        this.paLayout.state.setModuleInfo({
            icon: 'globe',
            url: GeoStateRoute.absolutePath(),
            title: null, //'Geo State',
            hint: null, //'Manage world state data.',
            i18n: {
                title: 'GEO_STATE.MODULE.TITLE',
                hint: 'GEO_STATE.MODULE.HINT',
            }
        });
    }
    public alterBreadcrumb(): void {

    }
}
