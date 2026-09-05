// ./src/app/module/shared/onboarding/my-profile/service.ts
import { inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { ServiceExample } from "@libs/signal-state/example/service";
import { I18nService } from "@base/internationalization/service";
import { ONBOARDING_MY_PROFILE_I18N_KEY } from "@module/shared/onboarding/my-profile/const";
import { MyProfileRoute } from "./route";
import { MyProfileState } from "./state";
import { FoundationModuleServiceType } from "@libs/foundation/module/type";

@Service({ autoProvided: false })
export class MyProfileService implements FoundationModuleServiceType {
    public readonly route = inject(MyProfileRoute);
    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);
    public readonly ps = inject(PlatformService);
    public readonly example = inject(ServiceExample);

    public readonly state = inject(MyProfileState);

    constructor(){
        // █████ FoundationModuleServiceType
        // load this module's translations first, before any label can render.
        // constructor, not component ngOnInit - see I18nService.useModule() for why
        this.initI18n();

        // set module info
        this.setModuleInfo();

        // alter breadcrumbs
        this.alterBreadcrumb();
    }
    public initI18n(): void {
        this.i18n.useModule(ONBOARDING_MY_PROFILE_I18N_KEY);
    }
    public setModuleInfo(): void {

    }
    public alterBreadcrumb(): void {

    }
}
