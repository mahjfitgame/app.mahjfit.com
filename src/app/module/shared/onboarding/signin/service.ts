// file: ./src/app/module/shared/onboarding/signin/service.ts
import { effect, inject, Service } from "@angular/core";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { SLUG_AUTH_AREA } from "@area/auth/slug";
import { SLUG_SIGNIN } from "@module/shared/onboarding/signin/slug";
import { SignupService } from "@module/shared/onboarding/signup/service";
import { ForgotPasswordService } from "@module/shared/onboarding/forgot-password/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { I18nService } from "@base/internationalization/service";
import { ONBOARDING_SIGNIN_I18N_KEY, UserMultiFactorAuthenticationOptionMap } from "@module/shared/onboarding/signin/const";
import { AppStepSigninSubProcessOutputDto, AppStepSigninUserOutputDto, AppStepSigninUserOutputSelectionSchema, AuthorisationRoleEnum, AuthorisationRoleEnumAddon, SigninStepEnum, StepSigninSubProcessEnum, UserAuthentication, UserMultiFactorAuthenticationTypeEnum, UserMultiFactorAuthenticationTypeEnumAddon } from "@bfw/api-sdk/graphql/endpoints/shared";
import { NotifyService } from "@base/notify/service";
import { NotifyBannerService } from "@base/notify-banner/service";
import { ApiError } from "@bfw/api-sdk/core";
import { AuthAreaLayoutStateRuntimeEnum } from "src/app/area/auth/enum";
import { SigninState } from "./state";
import { NotificationService } from "@libs/notification/service";
//import { NotificationService } from "src/app/base/notification/service";


import { YesNoEnum } from "@bfw/api-sdk/graphql/libs/crud.enum";
import { AuthSessionService } from "@libs/auth-session/service";

@Service({ autoProvided: false })
export class SigninService {
    public readonly AuthAreaLayoutStateRuntimeEnum = AuthAreaLayoutStateRuntimeEnum;
    public readonly SigninStepEnum = SigninStepEnum;
    public readonly UserMultiFactorAuthenticationTypeEnum = UserMultiFactorAuthenticationTypeEnum;
    public readonly UserMultiFactorAuthenticationTypeEnumAddon = UserMultiFactorAuthenticationTypeEnumAddon;
    public readonly UserMultiFactorAuthenticationOptionMap = UserMultiFactorAuthenticationOptionMap;

    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);
    public readonly ps = inject(PlatformService);
    public readonly notify = inject(NotifyService);
    public readonly notifyBanner = inject(NotifyBannerService);
    
    public readonly api = inject(BfwApiService);
    private readonly session = inject(AuthSessionService);

    public readonly state = inject(SigninState);
    public readonly notificationService = inject(NotificationService);

    constructor(){
        // load api service
        this.api.sdk.graphql.use(UserAuthentication);

        effect(() => {
            this.syncHeadingsForStep();
        });
        //this.notificationService.initPushNotification();
        this.notificationService.init();
    }
    public initI18n(): void {
        this.i18n.useModule(ONBOARDING_SIGNIN_I18N_KEY);
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
    private syncHeadingsForStep(step?: SigninStepEnum): void {
        switch (step ?? this.state.step()) {
            case SigninStepEnum.USERNAME:
                this.state.setHeading('ONBOARDING_SIGNIN.STEP.USERNAME.HEADING');
                this.state.setSubHeading('ONBOARDING_SIGNIN.STEP.USERNAME.SUBHEADING');
            break;
            case SigninStepEnum.PASSWORD:
                this.state.setHeading('ONBOARDING_SIGNIN.STEP.PASSWORD.HEADING');
                this.state.setSubHeading('ONBOARDING_SIGNIN.STEP.PASSWORD.SUBHEADING');
            break;
            case SigninStepEnum.MFAO:
                this.state.setHeading('ONBOARDING_SIGNIN.STEP.MFA_OPTION.HEADING');
                this.state.setSubHeading('ONBOARDING_SIGNIN.STEP.MFA_OPTION.SUBHEADING');
            break;
            case SigninStepEnum.VERIFY:
                if(this.state.selected_mfao() === UserMultiFactorAuthenticationTypeEnum.MULTIFAT_SECURITY_QUE) {
                    this.state.setHeading('ONBOARDING_SIGNIN.STEP.VERIFY_SQ_ANSWER.HEADING');
                    this.state.setSubHeading('ONBOARDING_SIGNIN.STEP.VERIFY_SQ_ANSWER.SUBHEADING');
                } else {
                    this.state.setHeading('ONBOARDING_SIGNIN.STEP.VERIFY_OTP.HEADING');
                    this.state.setSubHeading('ONBOARDING_SIGNIN.STEP.VERIFY_OTP.SUBHEADING');
                }
            break;
            case SigninStepEnum.FINISH:
                this.state.setHeading('ONBOARDING_SIGNIN.STEP.FINISH.HEADING');
                this.state.setSubHeading('ONBOARDING_SIGNIN.STEP.FINISH.SUBHEADING');
            break;
            default:
            break;
        }
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
        this.gpbs.start();

        // Ensure errors can display even if user clicks submit without blurring the field.
        this.touchCurrentStepFields();
        if (!this.isCurrentStepValid()) return;

        //xthis.syncFormDataToState();
        
        this.gpbs.stream = 10;

        try {
            let resp: AppStepSigninUserOutputDto | null = null;
            // TODO: wire actual signin flow; for now advance step-by-step.
            switch (this.state.step()) {
                case SigninStepEnum.USERNAME:
                    resp = await this.stepUsername();
                break;
                case SigninStepEnum.PASSWORD:
                    resp = await this.stepPassword();
                break;
                case SigninStepEnum.MFAO:
                    resp = await this.stepMfaOption();
                break;
                case SigninStepEnum.VERIFY:
                    resp = await this.stepVerify();
                break;
                default:
                break;
            }
            this.gpbs.stream = 40;
            // perform common process
            if(resp) {
                // state: save the response, use if required, added provision and might be use ful in debugging
                this.state.pushStepResponse(this.state.step(), resp); // for now there is no use, only debugging
                this.gpbs.stream = 50;

                // state: keep the stamp for secure process
                this.state.setStamp(resp.stamp as string);
                this.gpbs.stream = 60;

                // state: set step sequence
                this.state.updateStepSequence(resp.next_step as SigninStepEnum, resp.previous_step as SigninStepEnum);
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
                }
            }
        } catch (e: any | ApiError) {
            
        } finally {
            this.gpbs.stream = 100;
            this.gpbs.stop();
            
            this.autofocusField();
        }
    }
    /**
     * API PROCESSING
     */
    public getStepSigninSelection(): AppStepSigninUserOutputSelectionSchema {
        const selection: AppStepSigninUserOutputSelectionSchema = {
            stamp: true,
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
                    primary_email: true,
                    primary_mobile: true,
                    primary_mobile_cc: true,
                    whatsapp: true,
                    whatsapp_cc: true,
                    verified: true,
                    suspended: true,
                    active: true,
                    deleted: true,
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
                    interface: true,
                    name: true,
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
    public async stepUsername(): Promise<AppStepSigninUserOutputDto> {
        const un_pe_pm: string = this.state.mutationForm.un_pe_pm().value();
        try {
            const resp: AppStepSigninUserOutputDto = 
                await this.api.sdk.graphql.userAuthentication.stepSigninUser({
                selection: this.getStepSigninSelection(),
                input: {
                    dtoken: this.ps.state.dtoken() as string,
                    dpid: this.ps.state.dpid() as string,
                    arole_id: AuthorisationRoleEnum.SUPER_ADMIN,
                    stamp: this.state.stamp(),
                    un_pe_pm: un_pe_pm
                }
            });
            return resp;
        } catch(e: any | ApiError) {
            const em: string = e.errors()[0];
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
    public async stepPassword(): Promise<AppStepSigninUserOutputDto> {
        const identify: string = this.state.mutationForm.identify().value();
        try{
            const resp: AppStepSigninUserOutputDto = 
                await this.api.sdk.graphql.userAuthentication.stepSigninPassword({
                selection: this.getStepSigninSelection(),
                input: {
                    dtoken: this.ps.state.dtoken() as string,
                    dpid: this.ps.state.dpid() as string,
                    keep_logged: this.state.mutationForm.keep_logged().value() ? YesNoEnum.YES : YesNoEnum.NO,
                    stamp: this.state.stamp(),
                    identify: identify
                }
            });
            return resp;
        } catch(e: any | ApiError) {
            const em: string = e.errors()[0];
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
    public async stepMfaOption(): Promise<AppStepSigninUserOutputDto> {
        const mfao: UserMultiFactorAuthenticationTypeEnumAddon | null = this.state.mutationForm.mfa_option().value();
        try{
            const resp: AppStepSigninUserOutputDto = 
                await this.api.sdk.graphql.userAuthentication.stepSigninMultiFAOption({
                selection: this.getStepSigninSelection(),
                input: {
                    dtoken: this.ps.state.dtoken() as string,
                    dpid: this.ps.state.dpid() as string,
                    stamp: this.state.stamp(),
                    mfa_option: UserMultiFactorAuthenticationOptionMap[mfao]
                }
            });
            return resp;
        } catch(e: any | ApiError) {
            const em: string = e.errors()[0];
            this.state.updateMutationFormError({
                mfa_option: em
            });
            throw e;
        }
    }
    public async stepVerify(): Promise<AppStepSigninUserOutputDto> {
        const vi: string = this.state.mutationForm.mfa_vi().value();
        try{
            const resp: AppStepSigninUserOutputDto = 
                await this.api.sdk.graphql.userAuthentication.stepSigninVerify({
                selection: this.getStepSigninSelection(),
                input: {
                    dtoken: this.ps.state.dtoken() as string,
                    dpid: this.ps.state.dpid() as string,
                    stamp: this.state.stamp(),
                    otp: vi,
                    answer: vi
                }
            });

            return resp;
        } catch(e: any | ApiError) {
            this.state.updateMutationFormError({
                mfa_vi: e.errors()[0]
            });
            throw e;
        }
    }
    public async resendOtp(): Promise<void> {
        this.gpbs.start();

        try{
            const resp: AppStepSigninSubProcessOutputDto = 
                await this.api.sdk.graphql.userAuthentication.stepSigninSubProcess({
                selection: this.getStepSigninSelection(),
                input: {
                    dtoken: this.ps.state.dtoken() as string,
                    dpid: this.ps.state.dpid() as string,
                    stamp: this.state.stamp(),
                    sub_process: StepSigninSubProcessEnum.RESEND_OTP
                }
            });
            this.gpbs.stream = 50;
            
            if(resp) {
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
        } catch(e: any | ApiError) {
            this.state.updateMutationFormError({
                mfa_vi: e.errors()[0]
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
            // set the state ful jwt in persistent storage
             this.session.state.setSession(session?.jwt ?? null, session?.keep_logged ?? YesNoEnum.NO);
        }
    }

    /**
     * @param params An object like { ':id': 123, ':service': 'Ho' }
     * @returns A clean string
     */
    public static authUrlPath(/*id: number, service: string*/): string {
        // 1. Join the parent and child slugs
        let fullPath = [SLUG_AUTH_AREA, SLUG_SIGNIN].join('/');

        // 2. Replace placeholders with actual values, all parameters stay in service only
        const params: Record<string, string | number> = {
            /*
            ':id': 123, 
            ':service': 'Ho'
            */
        };
        Object.entries(params).forEach(([key, value]) => {
            fullPath = fullPath.replace(key, value.toString());
        });

        return '/' + fullPath;
    }
    public static authRouterLink(/*id: number, service: string*/): string[] {
        let fullPath = this.authUrlPath(/*id, service*/);
        
        // 3. Clean up and convert to array
        // Splits by '/', removes empty strings, and removes leftover placeholders
        const segments = fullPath.split('/') // removes empty strings
            .filter(seg => seg && !seg.startsWith(':'));

        return ['/', ...segments];
    }
    public get authSignupUrl(): string {
        return SignupService.authRouterLink().join('/');
    }
    public get authForgotPasswordUrl(): string {
        return ForgotPasswordService.authRouterLink().join('/');
    }
}
