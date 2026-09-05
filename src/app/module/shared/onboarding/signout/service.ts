// file: src/app/module/shared/onboarding/signout/service.ts
import { inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { I18nService } from "@base/internationalization/service";
import { NotifyService } from "@base/notify/service";
import { NotifyBannerService } from "@base/notify-banner/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { SignoutState } from "./state";
import { ONBOARDING_SIGNOUT_I18N_KEY } from "./const";
import { SigninRoute } from "@module/shared/preboarding/signin/route";
import { OpenAreaRoute } from "src/app/area/open/route";
import { SignoutRoute } from "./route";
import { FoundationModuleServiceType } from "@libs/foundation/module/type";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { UserAuthentication } from "@bfw/api-sdk/graphql/endpoints/shared";
import { BfwApiSdkError } from "@bfw/api-sdk/core";

@Service({ autoProvided: false })
export class SignoutService implements FoundationModuleServiceType {
    public readonly heading = 'ONBOARDING_SIGNOUT.HEADING';
    public readonly subHeading = 'ONBOARDING_SIGNOUT.SUBHEADING';
    public readonly goodbyeMessage = 'ONBOARDING_SIGNOUT.GOODBYE_MESSAGE';
    public readonly failedMessage = 'ONBOARDING_SIGNOUT.FAILED_MESSAGE';

    public readonly home = 'GL.MODULE.HOME';
    public readonly signin = 'GL.MODULE.PREBOARDING.SIGNIN';
    public readonly tryAgain = 'GL.COMMON.TRY_AGAIN';

    public readonly OpenAreaRoute = OpenAreaRoute;
    public readonly SigninRoute = SigninRoute;
    public readonly SignoutRoute = SignoutRoute;


    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly route = inject(SignoutRoute);
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);
    public readonly ps = inject(PlatformService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly notify = inject(NotifyService);
    public readonly notifyBanner = inject(NotifyBannerService);
    
    public readonly api = inject(BfwApiService);

    public readonly state = inject(SignoutState);

    constructor() {
        // █████ FoundationModuleServiceType
        // load this module's translations first, before any label can render.
        // constructor, not component ngOnInit - see I18nService.useModule() for why
        this.initI18n();

        // set module info
        this.setModuleInfo();

        // alter breadcrumbs
        this.alterBreadcrumb();

        // load api service
        this.api.sdk.graphql.initialize(UserAuthentication);

    }

    public initI18n(): void {
        this.i18n.useModule(ONBOARDING_SIGNOUT_I18N_KEY);
    }
    public setModuleInfo(): void {
        
    }
    public alterBreadcrumb(): void {
        
    }
    public async signout(): Promise<string | false> {
        this.gpbs.start();
        let ctxs: string | undefined = undefined;

        try{
            if(this.ctxp.state.ctxs() === null || this.ctxp.state.sessionToken() === null) {
                throw new Error('You have been already signed out.');
            }
            this.gpbs.stream = 10;

            // send signout request to server
            const http = await this.api.sdk.graphql.userAuthentication.signOut({
                input: {
                    ctxs: this.ctxp.state.ctxs() as string,
                    stoken: this.ctxp.state.sessionToken() as string,
                },
                selection: {
                    htoken: true,
                    ctxs: true,
                    stoken: true,
                    logged_in: true,
                    keep_logged: true,
                }    
            });
            this.gpbs.stream = 40;

            ctxs = http.data.ctxs;
            const headerCtxs = http.getResHeaderCtxs();

            if(ctxs && headerCtxs && ctxs === headerCtxs) {
                // Remember the page that opened sign out so a later normal sign in returns there.
                const previousNavigation = this.route.router.lastSuccessfulNavigation()?.previousNavigation;
                const previousUrl = previousNavigation?.finalUrl ?? previousNavigation?.initialUrl;
                if (previousUrl) {
                    this.ctxp.state.setRedirectAfterAuth(
                        this.route.router.serializeUrl(previousUrl),
                    );
                }

                // clear the session
                this.ctxp.state.clearSession();
                this.gpbs.stream = 60;

                // set new ctxs
                this.ctxp.state.setCtxs(ctxs);
                this.gpbs.stream = 90;
            } else {
                throw new Error('Failed to signout. Try again.');
            }
        } catch(e: any | BfwApiSdkError) {
            const message =
                e?.errors?.()?.[0] ??
                e?.message;
    
            this.state.setError(message);

            /**
             * The server either could not be asked to end this session or refused,
             * because the token it was handed is not one it will accept. Keeping an
             * unusable credential in the browser has no upside, so it goes regardless.
             * This is what makes a tampered cookie recoverable at all, the success
             * branch above never runs for one.
             */
            this.ctxp.state.clearSession();

            this.gpbs.stream = 90;
        }

        this.gpbs.stream = 100;
        this.gpbs.stop();

        return ctxs ?? false;
    }
}
