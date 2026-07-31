// file: ./src/app/module/shared/onboarding/signout/service.ts
import { inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { SLUG_AUTH_AREA } from "@area/auth/slug";
import { SignupService } from "@module/shared/onboarding/signup/service";
import { ForgotPasswordService } from "@module/shared/onboarding/forgot-password/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { I18nService } from "@base/internationalization/service";
import { NotifyService } from "@base/notify/service";
import { NotifyBannerService } from "@base/notify-banner/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { SignoutState } from "./state";
import { ONBOARDING_SIGNOUT_I18N_KEY } from "./const";
import { SigninRoute } from "../signin/route";
import { OpenAreaRoute } from "src/app/area/open/route";
import { SignoutRoute } from "./route";

@Service()
export class SignoutService {
    public readonly heading = 'ONBOARDING_SIGNOUT.HEADING';
    public readonly subHeading = 'ONBOARDING_SIGNOUT.SUBHEADING';
    public readonly goodbyeMessage = 'ONBOARDING_SIGNOUT.GOODBYE_MESSAGE';
    public readonly failedMessage = 'ONBOARDING_SIGNOUT.FAILED_MESSAGE';

    public readonly home = 'GL.MODULE.HOME';
    public readonly signin = 'GL.MODULE.ONBOARDING.SIGNIN';
    public readonly tryAgain = 'GL.COMMON.TRY_AGAIN';

    public readonly OpenAreaRoute = OpenAreaRoute;
    public readonly SigninRoute = SigninRoute;
    public readonly SignoutRoute = SignoutRoute;


    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);
    public readonly ps = inject(PlatformService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly notify = inject(NotifyService);
    public readonly notifyBanner = inject(NotifyBannerService);
    
    public readonly state = inject(SignoutState);

    constructor(){
        
    }

    public initI18n(): void {
        this.i18n.useModule(ONBOARDING_SIGNOUT_I18N_KEY);
    }
}
