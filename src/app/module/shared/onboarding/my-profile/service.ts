// ./src/app/module/shared/onboarding/my-profile/service.ts
import { inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { ServiceExample } from "@libs/signal-state/example/service";
import { I18nService } from "@base/internationalization/service";
import { ONBOARDING_MY_PROFILE_I18N_KEY } from "@module/shared/onboarding/my-profile/const";
;

@Service({ autoProvided: false })
export class MyProfileService {
    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);
    public readonly ps = inject(PlatformService);
    public readonly example = inject(ServiceExample);
    constructor(){

    
    }
    public initI18n(): void {
        this.i18n.useModule(ONBOARDING_MY_PROFILE_I18N_KEY);
    }
}