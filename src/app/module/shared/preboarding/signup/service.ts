// file: src/app/module/shared/preboarding/signup/service.ts
import { inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SigninRoute } from "@module/shared/preboarding/signin/route";
import { GlobalProgressBarService } from "src/app/base/global-progress-bar/service";
import { I18nService } from "src/app/base/internationalization/service";
import { PlatformService } from "@libs/platform/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { NotifyService } from "src/app/base/notify/service";
import { NotifyBannerService } from "src/app/base/notify-banner/service";
import { SignatureService } from "@libs/signature/service";
import { UtilityService } from "@libs/utility/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { SignupState } from "./state";
import { AuthorisationRoleEnumAddon, AuthorisationRoleMapAddon, UserAuthentication } from "@bfw/api-sdk/graphql/endpoints/shared";
import { PREBOARDING_SIGNUP_I18N_KEY } from "./const";
import { BfwApiSdkError } from "@bfw/api-sdk/core";
import { SignupRoute } from "./route";
import { FoundationModuleServiceType } from "@libs/foundation/module/type";

@Service({ autoProvided: false })
export class SignupService implements FoundationModuleServiceType {
    public readonly SigninRoute = SigninRoute;
    public readonly AuthorisationRoleMapAddon = AuthorisationRoleMapAddon;
    public readonly DefaultAuthorisationRole = AuthorisationRoleEnumAddon.USER; //USER

    public readonly route = inject(SignupRoute);
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
    
    public readonly state = inject(SignupState);

    constructor(){
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
        this.setDefaultAuthorisationRole();
    }
    public initI18n(): void {
        this.i18n.useModule(PREBOARDING_SIGNUP_I18N_KEY);
    }
    public setModuleInfo(): void {
        
    }
    public alterBreadcrumb(): void {
        
    }
    public fieldErrorMessage(fieldState: { errors?: () => Array<{ message?: string }> }): string | null {
        return fieldState.errors?.()?.[0]?.message ?? null;
    }
    public toggleHidePassword(): void {
        this.state.setHidePassword(!this.state.hidePassword());
    }
    public toggleHidePasswordConfirm(): void {
        this.state.setHidePasswordConfirm(!this.state.hidePasswordConfirm());
    }
    public setDefaultAuthorisationRole(): void {
        if (this.state.mutationForm.arole_id().value()) {
            return;
        }

        this.state.updateMutationFormModel({
            arole_id: this.AuthorisationRoleMapAddon[this.DefaultAuthorisationRole]
        });
    }
    public preventClipboardAction(event: Event): void {
        event.preventDefault();
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
        
        if(precheck) {
            try {
                const username = mutationForm.username().value();
                const identify = mutationForm.identify().value();
                const identifyConfirm = mutationForm.identify_confirm().value();
                this.gpbs.stream = 30;

                const http = await this.api.sdk.graphql.userAuthentication.signUp({
                    input: {
                        primary_email: mutationForm.primary_email().value(),
                        primary_mobile: mutationForm.primary_mobile().value(),
                        primary_mobile_cc: mutationForm.primary_mobile_cc().value(),
                        username: username || undefined,
                        arole_id: mutationForm.arole_id().value(),
                        connsrc_id: mutationForm.connsrc_id().value(),

                        // do not pack for now
                        // this will create issue to run query idrect from graphql platground
                        // also need to change on api, so future consideration
                        identify: identify, //this.utility.packString(identify), 
                        identify_confirm: identifyConfirm, //this.utility.packString(identifyConfirm),
                    },
                    selection: {
                        keyid: true,
                        primary_email: true,
                        primary_mobile: true,
                        primary_mobile_cc: true,
                        username: true,
                        url_slug: true,
                        fname: true,
                        mname: true,
                        lname: true,
                    },
                });
                const response = http.data;
                this.gpbs.stream = 80;

                if (!response.keyid) {
                    const message = response.snapshot?.error?.[0]
                        ?? response.snapshot?.alert?.[0]
                        ?? this.i18n.translate('PREBOARDING_SIGNUP.MESSAGE.ERROR');
                    this.notifyBanner.error(message);
                } else {
                    const message = response.snapshot?.success?.[0]
                        ?? response.snapshot?.message?.[0]
                        ?? this.i18n.translate('PREBOARDING_SIGNUP.MESSAGE.SUCCESS');
                    this.notifyBanner.success(message);

                    // as success need to reset the form
                    this.state.resetMutationForm();
                }
                this.gpbs.stream = 90;
            } catch (error: unknown) {
                const message = error instanceof BfwApiSdkError
                    ? error.errors()[0] ?? error.message
                    : error instanceof Error
                        ? error.message
                        : this.i18n.translate('PREBOARDING_SIGNUP.MESSAGE.ERROR');

                this.log.error('[SignupService] signup failed', error);
                this.notifyBanner.error(message);
                this.gpbs.stream = 90;
            }
        }

        this.gpbs.stream = 100;
        this.gpbs.stop();
        this.state.setMutationFormProcessing(this.gpbs.processing);
    }
}
