// file: src/app/module/shared/preboarding/signin/service.ts
import { inject, Service } from "@angular/core";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { I18nService } from "@base/internationalization/service";
import { PREBOARDING_SIGNIN_I18N_KEY } from "@module/shared/preboarding/signin/const";
import { AppStepSigninInputDto, AppStepSigninUserOutputDto, AppStepSigninUserOutputSelectionSchema, AuthorisationRoleEnum, SigninStepEnum, StepSigninSubProcessEnum, UserAuthentication, UserMultiFactorAuthenticationMapAddon, UserMultiFactorAuthenticationTypeEnum, UserMultiFactorAuthenticationTypeEnumAddon } from "@bfw/api-sdk/graphql/endpoints/shared";
import { NotifyService } from "@base/notify/service";
import { NotifyBannerService } from "@base/notify-banner/service";
import { BfwApiSdkError, BfwApiSdkResponse } from "@bfw/api-sdk/core";
import { AuthAreaLayoutStateRuntimeEnum } from "src/app/area/auth/enum";
import { SigninState } from "./state";
import { ContextProfileService } from "@libs/context-profile/service";
import { SignatureService } from "@libs/signature/service";
import { UtilityService } from "@libs/utility/service";
import { SignupRoute } from "../../preboarding/signup/route";
import { ForgotPasswordRoute } from "../forgot-password/route";
import { FoundationModuleServiceType } from "@libs/foundation/module/type";
import { DashboardRoute } from "@module/shared/dashboard/route";
import { SigninRoute } from "./route";
import { ContextProfileStatefulInfo } from "@libs/context-profile/type";

@Service({ autoProvided: false })
export class SigninService implements FoundationModuleServiceType {
    public readonly SignupRoute = SignupRoute;
    public readonly ForgotPasswordRoute = ForgotPasswordRoute;
    public finishRedirectUrl: string = DashboardRoute.absolutePath();

    public readonly AuthAreaLayoutStateRuntimeEnum = AuthAreaLayoutStateRuntimeEnum;
    public readonly SigninStepEnum = SigninStepEnum;
    public readonly UserMultiFactorAuthenticationTypeEnum = UserMultiFactorAuthenticationTypeEnum;
    public readonly UserMultiFactorAuthenticationTypeEnumAddon = UserMultiFactorAuthenticationTypeEnumAddon;
    public readonly UserMultiFactorAuthenticationMapAddon = UserMultiFactorAuthenticationMapAddon;

    public readonly route = inject(SigninRoute);
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

    public readonly state = inject(SigninState);

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

        // we might need notification service here in future
    }
    public initI18n(): void {
        this.i18n.useModule(PREBOARDING_SIGNIN_I18N_KEY);
    }
    public setModuleInfo(): void {
        
    }
    public alterBreadcrumb(): void {
        
    }
    public fieldErrorMessage(fieldState: { errors?: () => Array<{ message?: string }> }): string | null {
        const message = fieldState.errors?.()?.[0]?.message;
        return message ?? null;
    }
    public toggleHidePassword(): void {
        this.state.setHidePassword(!this.state.hidePassword());
    }
    public toggleHideVerificationInput(): void {
        this.state.setHideMfaVi(!this.state.hideMfaVi());
    }
    public autofocusField(): void {
        // wait for angular to render the new @if block
        setTimeout(() => {
            const input = document.querySelector('input[autofocus]') as HTMLInputElement | null;
            if (!input) return;
            input.focus();
        }, 100);
    }
    public isCurrentStepValid(): boolean {
        switch (this.state.step()) {
            case SigninStepEnum.USERNAME: 
                return !this.state.mutationForm.un_pe_pm().invalid();
            break;
            case SigninStepEnum.PASSWORD: 
                return !this.state.mutationForm.identify().invalid();
            break;
            case SigninStepEnum.MFAO: 
                return !this.state.mutationForm.mfa_option().invalid();
            break;
            case SigninStepEnum.VERIFY: 
                return !this.state.mutationForm.mfa_vi().invalid();
            break;
        }
        return false;
    }
    private touchCurrentStepFields(): void {
        switch (this.state.step()) {
            case SigninStepEnum.USERNAME:
                this.state.mutationForm.un_pe_pm().markAsTouched();
            break;
            case SigninStepEnum.PASSWORD:
                this.state.mutationForm.identify().markAsTouched();
            break;
            case SigninStepEnum.MFAO:
                this.state.mutationForm.mfa_option().markAsTouched();
            break;
            case SigninStepEnum.VERIFY:
                this.state.mutationForm.mfa_vi().markAsTouched();
            break;
            default:
            break;
        }
    }
    public toogleResendOtpButton() {
        return this.gpbs.processing;
    }
    public goBack(): void {
        const previousStep = this.state.getPreviousStep(this.state.step());

        if(previousStep){
            this.state.setStep(previousStep);
        }
    }
    /**
     * @description on form submit, this mehod is called
     * It holds the functional flow of the form
     * Changing the code order may change the flow and behave differently 
     */
    public async onSubmit() {
        if (this.state.mutationFormProcessing()) {
            return;
        }

        this.gpbs.start();
        this.state.setMutationFormProcessing(this.gpbs.processing);

        let precheck = true;

        // Ensure errors can display even if user clicks submit without blurring the field.
        this.touchCurrentStepFields();
        if (!this.isCurrentStepValid()) {
            precheck = false;
        }
        this.gpbs.stream = 10;

        // this is important, if user is already signed in then do not allow to sign in again in same device
        if(this.ctxp.state.authenticated()) {
            this.state.updateMutationFormError({
                un_pe_pm: 'PREBOARDING_SIGNIN.VALIDATION.ALREADY_SIGNED_IN'
            });
            precheck = false;
        }
        this.gpbs.stream = 20;

        if(precheck) {
            try {
                let http: BfwApiSdkResponse<AppStepSigninUserOutputDto> | null = null;
                // TODO: wire actual signin flow; for now advance step-by-step.
                switch (this.state.step()) {
                    case SigninStepEnum.USERNAME:
                        http = await this.stepUsername();
                    break;
                    case SigninStepEnum.PASSWORD:
                        http = await this.stepPassword();
                    break;
                    case SigninStepEnum.MFAO:
                        http = await this.stepMfaOption();
                    break;
                    case SigninStepEnum.VERIFY:
                        http = await this.stepVerify();
                    break;
                    default:
                    break;
                }
                this.gpbs.stream = 30;

                // perform common api
                if(http) {
                    const resp = http.data;

                    // state: save the response, use if required, added provision and might be use ful in debugging
                    this.state.pushStepResponse(this.state.step(), resp); // for now there is no use, only debugging
                    this.gpbs.stream = 40;

                    // state: keep the stamp for secure api
                    this.state.setStamp(resp.stamp as string);
                    this.gpbs.stream = 50;

                    // state: set step sequence
                    this.state.updateStepSequence(resp.next_step as SigninStepEnum, resp.previous_step as SigninStepEnum);
                    this.gpbs.stream = 60;

                    // state: updated user device as it might get changed during process due to any availabe previous session
                    /*if(resp.dkeyid){
                        this.session.state.setDkeyid(resp.dkeyid as string);    
                    }*/
                    // state: update host authorisation token as it might get changed during process due to any availabe previous session
                    if(resp.htoken){
                        this.ctxp.state.setHostToken(resp.htoken as string);
                    }
                    this.gpbs.stream = 70;

                    // state: keep available_mfao for next step
                    if(resp.available_mfao){
                        this.state.setAvailableMfao(resp.available_mfao);
                    }

                    // state: keep selected_mfao for next step
                    if(resp.selected_mfao){
                        this.state.setSelected_mfao(resp.selected_mfao);
                        this.state.computedMutationFieldObjMfaVi();


                        // If its security question to answer then or 2FA app then do not show resend otp button
                        if(
                            resp.selected_mfao === UserMultiFactorAuthenticationTypeEnum.MULTIFAT_2FAAPP || 
                            resp.selected_mfao === UserMultiFactorAuthenticationTypeEnum.MULTIFAT_SECURITY_QUE
                        ) {
                            this.state.setDisableResendOtp(true);
                        } else {
                            // we need to enable resend otp button
                            this.state.delayEnableResendOtp();
                        }
                    }
                    this.gpbs.stream = 80;

                    // state: check ref id and value
                    if(resp.ref_id) {
                        this.state.setRefId(resp.ref_id);
                    }
                    if(resp.ref_value) {
                        this.state.setRefValue(resp.ref_value);
                    }

                    // state: go to next step
                    this.state.setStep(resp.next_step as SigninStepEnum);
                    
                    this.gpbs.stream = 90;

                    /**
                     * STEP: FINISH 
                     * All process done and now next step is finish so, check authenticated info and process
                     * DO NOT USE SIGNAL [this.state.step()] as it might have security issue
                     */
                    if(resp.next_step === SigninStepEnum.FINISH) {
                        void await this.stepFinish(resp);

                        // as success need to reset the form
                        this.state.resetMutationForm();
                    }
                }
            } catch (e: any | BfwApiSdkError) {
                
            } 
        }
        
        this.gpbs.stream = 100;
        this.gpbs.stop();
        this.state.setMutationFormProcessing(this.gpbs.processing);
        
        this.autofocusField();
    }
    /**
     * API PROCESSING
     */
    public getStepSigninSelection(): AppStepSigninUserOutputSelectionSchema {
        const selection: AppStepSigninUserOutputSelectionSchema = {
            stamp: true,
            htoken: true,
            next_step: true,
            previous_step: true,
            ref_id: true,
            ref_value: true,
            available_mfao: true,
            selected_mfao: true,
            authenticated: {
                user: {
                    keyid: true,
                    fname: true,
                    mname: true,
                    lname: true,
                    url_slug: true,
                    username: true,
                    primary_email: true,
                    primary_mobile: true,
                    primary_mobile_cc: true,
                    whatsapp: true,
                    whatsapp_cc: true,
                    verified: true,
                    suspended: true,
                    active: true,
                    deleted: true,
                    file_profile_photo_url: {
                        direct: true,
                        secure: true,
                        thumb: true
                    }
                }, 
                uauthorisation: {
                    keyid: true,
                    active: true,
                    deleted: true
                },
                udevice: {
                    keyid: true,
                    dtoken: true,
                    dpid: true,
                    user_defined_id: true,
                    user_defined_name: true,
                    active: true,
                    deleted: true,
                },
                authorisation: {
                    keyid: true,
                    role_title: true,
                    active: true,
                    deleted: true
                },
                device: {
                    keyid: true,
                    name: true,
                    interface: true,
                    os: true,
                    user_agent: true,
                    approved: true,
                    active: true,
                    deleted: true,
                },
                session: {
                    keyid: true,
                    jwt: true,
                    keep_logged: true,
                    logged_in: true,
                    active: true,
                    deleted: true,
                }
            },
            snapshot: {
                success: true,
                error: true,
                warning: true,
                info: true,
                imp: true,
                alert: true
            }
        };
        return selection;
    }
    public getStepSigninDefaultInput(): AppStepSigninInputDto {
        const input: AppStepSigninInputDto = {
            stamp: this.state.stamp(),
        };
        return input;
    }
    public async stepUsername(): Promise<BfwApiSdkResponse<AppStepSigninUserOutputDto>> {
        const un_pe_pm: string = this.state.mutationForm.un_pe_pm().value();
        try {
            const http = await this.api.sdk.graphql.userAuthentication.stepSigninUser({
                selection: this.getStepSigninSelection(),
                input: {
                    ...this.getStepSigninDefaultInput(),

                    arole_id: AuthorisationRoleEnum.USER,
                    un_pe_pm: un_pe_pm
                }
            });
            return http;
        } catch(e: any | BfwApiSdkError) {
            const em: string = e.errors()[0] ?? e.message;
            if(em.includes('not found')) {
                this.state.pushInvalidUser(un_pe_pm);
            } else {
                this.state.updateMutationFormError({
                    un_pe_pm: em
                });
            }
            throw e;
        }
    }
    public async stepPassword(): Promise<BfwApiSdkResponse<AppStepSigninUserOutputDto>> {
        const identify: string = this.state.mutationForm.identify().value();

        try{
            const http = await this.api.sdk.graphql.userAuthentication.stepSigninPassword({
                selection: this.getStepSigninSelection(),
                input: {
                    ...this.getStepSigninDefaultInput(),

                    keep_logged: this.state.mutationForm.keep_logged().value() ? new Date() : null,
                    identify: this.utility.packString(identify),
                }
            });
            return http;
        } catch(e: any | BfwApiSdkError) {
            const em: string = e.errors()[0] ?? e.message;
            if(em.includes('invalid')) {
                this.state.pushInvalidIdentify(identify);
            } else {
                this.state.updateMutationFormError({
                    identify: em
                });
            }
            throw e;
        }
    }
    public async stepMfaOption(): Promise<BfwApiSdkResponse<AppStepSigninUserOutputDto>> {
        const mfao: UserMultiFactorAuthenticationTypeEnumAddon | null = this.state.mutationForm.mfa_option().value();
        try{
            const http = await this.api.sdk.graphql.userAuthentication.stepSigninMultiFAOption({
                selection: this.getStepSigninSelection(),
                input: {
                    ...this.getStepSigninDefaultInput(),

                    mfa_option: UserMultiFactorAuthenticationMapAddon[mfao]
                }
            });
            return http;
        } catch(e: any | BfwApiSdkError) {
            const em: string = e.errors()[0] ?? e.message;
            this.state.updateMutationFormError({
                mfa_option: em
            });
            throw e;
        }
    }
    public async stepVerify(): Promise<BfwApiSdkResponse<AppStepSigninUserOutputDto>> {
        const vi: string = this.state.mutationForm.mfa_vi().value();
        try{
            const http = await this.api.sdk.graphql.userAuthentication.stepSigninVerify({
                selection: this.getStepSigninSelection(),
                input: {
                    ...this.getStepSigninDefaultInput(),

                    otp: vi,
                    answer: vi
                }
            });

            return http;
        } catch(e: any | BfwApiSdkError) {
            const em: string = e.errors()[0] ?? e.message;
            this.state.updateMutationFormError({
                mfa_vi: em
            });
            throw e;
        }
    }
    public async resendOtp(): Promise<void> {
        this.gpbs.start();

        try{
            const http = await this.api.sdk.graphql.userAuthentication.stepSigninSubProcess({
                selection: this.getStepSigninSelection(),
                input: {
                    ...this.getStepSigninDefaultInput(),

                    sub_process: StepSigninSubProcessEnum.RESEND_OTP
                }
            });
            this.gpbs.stream = 50;
            
            if(http.data) {
                const resp = http.data;
                
                // update the stamp
                this.state.setStamp(resp.stamp as string);
                this.gpbs.stream = 60;

                // state: check ref id and value
                if(resp.ref_id) {
                    this.state.setRefId(resp.ref_id);
                }
                if(resp.ref_value) {
                    this.state.setRefValue(resp.ref_value);
                }
                this.gpbs.stream = 60;

                // we need to dely enable resend otp button
                this.state.delayEnableResendOtp();
                this.gpbs.stream = 70;

            } else {
                this.state.setRefValue(`Failed to resend OTP.`);
                this.gpbs.stream = 70;

                // as failed we need to enable resend otp button to try again
                this.state.setDisableResendOtp(false);
            }
        } catch(e: any | BfwApiSdkError) {
            const em: string = e.errors()[0] ?? e.message;
            this.state.updateMutationFormError({
                mfa_vi: em
            });
            throw e;
        } finally {
            this.gpbs.stream = 100;
            this.gpbs.stop();
        }
    }
    public async stepFinish(resp: AppStepSigninUserOutputDto): Promise<void> {
        const session = resp.authenticated?.session; 
        const user = resp.authenticated?.user; 
        const uauthorisation = resp.authenticated?.uauthorisation;  
        const authorisation = resp.authenticated?.authorisation;  
        const udevice = resp.authenticated?.udevice;  
        const device = resp.authenticated?.device;

        if(
            user?.suspended === null && 
            user?.active === null && 
            user?.deleted === null && 
            uauthorisation?.active === null && 
            uauthorisation?.deleted === null &&
            udevice?.active === null && 
            udevice?.deleted === null && 
            authorisation?.active === null && 
            authorisation?.deleted === null && 
            device?.active === null && 
            device?.deleted === null &&
            session?.active === null &&
            session?.deleted === null
        ) {
            if(session.logged_in) {
                // set the stateful jwt in persistent storage
                this.ctxp.state.setSessionToken(session?.jwt ?? null);

                // set the stateful info in persistent storage
                const sfinfo: ContextProfileStatefulInfo = {
                    user: {
                        fname: user?.fname ?? null,
                        mname: user?.mname ?? null,
                        lname: user?.lname ?? null,
                        url_slug: user?.url_slug ?? null,
                        username: user?.username ?? null,
                        primary_email: user?.primary_email ?? null,
                        primary_mobile: user?.primary_mobile ?? null,
                        primary_mobile_cc: user?.primary_mobile_cc ?? null,
                        whatsapp: user?.whatsapp ?? null,
                        whatsapp_cc: user?.whatsapp_cc ?? null,
                        file_profile_photo_url: {
                            direct: user?.file_profile_photo_url?.direct ?? null,
                            secure: user?.file_profile_photo_url?.secure ?? null,
                            thumb: user?.file_profile_photo_url?.thumb ?? null
                        }
                    },
                    udevice: {
                        user_defined_id: udevice?.user_defined_id ?? null,
                        user_defined_name: udevice?.user_defined_name ?? null,
                    },
                    authorisation: {
                        role_title: authorisation?.role_title ?? null,
                    },
                    device: {
                        name: device?.name ?? null,
                        interface: device?.interface ?? null,
                        os: device?.os ?? null,
                    },
                    session: {
                        logged_in: session?.logged_in ?? null,
                        keep_logged: session?.keep_logged ?? null
                    }
                };
                this.ctxp.state.setStatefulInfo(sfinfo);
                
                // if user is authenticated, redirect to last page
                // do not use this.ctxp.state.authenticated() in if
                // because sometimes it still contains the previous false result and do not redirect
                if(session?.logged_in && session?.jwt) {
                    this.finishRedirectUrl =
                        this.ctxp.state.redirectAfterAuth() ??
                        DashboardRoute.absolutePath();

                    // wait a while so user can see the success message
                    setTimeout(async () => {
                            const navigated = await this.route.router.navigateByUrl(this.finishRedirectUrl, {
                                replaceUrl: true,
                            });

                            if (navigated) {
                                this.ctxp.state.setRedirectAfterAuth(null);
                            }
                    }, 1.5 * 1000);
                }
            } else {
                // this is for security reason
                this.ctxp.state.clearSession();
            }
        }
    }
}
