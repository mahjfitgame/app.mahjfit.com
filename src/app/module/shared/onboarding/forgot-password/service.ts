// file: src/app/module/shared/onboarding/forgot-password/service.ts
import { inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SigninRoute } from "../signin/route";
import { GlobalProgressBarService } from "src/app/base/global-progress-bar/service";
import { I18nService } from "src/app/base/internationalization/service";
import { PlatformService } from "@libs/platform/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { NotifyService } from "src/app/base/notify/service";
import { NotifyBannerService } from "src/app/base/notify-banner/service";
import { SignatureService } from "@libs/signature/service";
import { UtilityService } from "@libs/utility/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { AuthorisationRoleEnumAddon, AuthorisationRoleMapAddon, UserAuthentication } from "@bfw/api-sdk/graphql/endpoints/shared";
import { BfwApiSdkError } from "@bfw/api-sdk/core";
import { ForgotPasswordState } from "./state";
import { ONBOARDING_FORGOTPASSWORD_I18N_KEY } from "@module/shared/onboarding/forgot-password/const";
import { RecoverPasswordRoute } from "../recover-password/route";
import { ForgotPasswordRoute } from "./route";
import { FoundationModuleServiceType } from "@libs/foundation-module/type/service";

@Service({ autoProvided: false })
export class ForgotPasswordService implements FoundationModuleServiceType {
    public readonly SigninRoute = SigninRoute;
    public readonly AuthorisationRoleMapAddon = AuthorisationRoleMapAddon;
    public readonly DefaultAuthorisationRole = AuthorisationRoleEnumAddon.USER; //USER

    public readonly route = inject(ForgotPasswordRoute);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);
    public readonly ps = inject(PlatformService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly notify = inject(NotifyService);
    public readonly notifyBanner = inject(NotifyBannerService);
    public readonly sign = inject(SignatureService);
    public readonly utility = inject(UtilityService);

    public readonly api = inject(BfwApiService);

    public readonly state = inject(ForgotPasswordState);

    constructor() {
        // load api service
        this.api.sdk.graphql.use(UserAuthentication);
    }
    public initI18n(): void {
        this.i18n.useModule(ONBOARDING_FORGOTPASSWORD_I18N_KEY);
    }
    public setModuleInfo(): void {

    }
    public alterBreadcrumb(): void {

    }
    public fieldErrorMessage(fieldState: { errors?: () => Array<{ message?: string }> }): string | null {
        return fieldState.errors?.()?.[0]?.message ?? null;
    }
    public async onSubmit(): Promise<void> {
        if (this.state.mutationFormProcessing()) {
            return;
        }

        this.gpbs.start();
        this.state.setMutationFormProcessing(this.gpbs.processing);
        let precheck = true;

        const mutationForm = this.state.mutationForm;
        mutationForm().markAsTouched();
        this.gpbs.stream = 10;

        if (mutationForm().invalid()) {
            precheck = false;
        }

        this.notifyBanner.state.clearAlert();
        this.gpbs.stream = 20;

        if (precheck) {
            try {
                this.gpbs.stream = 30;
                const publicid = this.ctxp.state.publicid();

                if (publicid) {
                    // set returning url
                    const url = `${this.conf.appHostBackofficeWebDomain}${RecoverPasswordRoute.absolutePath(publicid)}`;

                    const http = await this.api.sdk.graphql.userAuthentication.forgotPassword({
                        input: {
                            un_pe_pm: mutationForm.un_pe_pm().value(),
                            arole_id: mutationForm.arole_id().value(),
                            pass_recover_url: url,
                        },
                        selection: {
                            snapshot: {
                                success: true
                            }
                        }
                    });
                    this.gpbs.stream = 70;

                    const response = http.data;
                    const snapshot = http.data.snapshot;

                    // show the success message
                    if (snapshot?.success?.length) {
                        this.notifyBanner.success((snapshot.success).join(' '));

                        // as success need to reset the form
                        this.state.resetMutationForm();
                    }
                    this.gpbs.stream = 80;
                } else {
                    throw new Error('Public token not found, please reload the page and try again.');
                }

                this.gpbs.stream = 90;
            } catch (error: any | BfwApiSdkError) {
                const message = error instanceof BfwApiSdkError
                    ? error.errors()[0] ?? error.message
                    : error instanceof Error
                        ? error.message
                        : this.i18n.translate('ONBOARDING_FORGOTPASSWORD.MESSAGE.ERROR');

                this.log.error('[ForgotPasswordService] password recovery process failed', error);
                this.notifyBanner.error(message);
                this.gpbs.stream = 90;
            }
        }

        this.gpbs.stream = 100;
        this.gpbs.stop();
        this.state.setMutationFormProcessing(this.gpbs.processing);
    }
}
