// file: src/app/module/shared/onboarding/signin/state.ts
import { computed, effect, inject, Service, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { SigninMutationFormModelType, SigninStepResponseType, SigninMutationFieldObjType, SigninStepSequenceType, SigninAvailableMultiFactorAuthenticationType, SigninMutationFormErrorType } from "@module/shared/onboarding/signin/type";
import { SigninStepEnum, UserMultiFactorAuthenticationTypeEnum, UserMultiFactorAuthenticationTypeEnumAddon } from "@bfw/api-sdk/graphql/endpoints/shared";
import { CrudFieldUiTypeEnum } from "@base/crud/enum";
import { form, hidden, minLength, required, validate } from "@angular/forms/signals";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api";
import { AppModuleStateType } from "@libs/utility/type";

@Service({ autoProvided: false })
export class SigninState extends SignalStateService implements AppModuleStateType {
    
    // ████ DEPENDENCIES ████████████████████████████████████████████████

    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    private readonly gpbs = inject(GlobalProgressBarService);
    private readonly ctxp = inject(ContextProfileService);
    private readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████
    
    // required for persisted state
    public override readonly storeKey = 'sin';

    // set mutation field obj
    public readonly MUTATION_FIELD_OBJ: SigninMutationFieldObjType = {
        un_pe_pm: {
            type: CrudFieldUiTypeEnum.TEXT,
            label: 'ONBOARDING_SIGNIN.FIELD_LABEL.USERNAME',
            placeholder: 'ONBOARDING_SIGNIN.FIELD_PLACEHOLDER.USERNAME',
            hint: '',
            url_matrix_param: 'uem',
            value: null,
            validation: {
                required: { 
                    message: 'GL.VALIDATION.REQUIRED', 
                    value: true,
                },
                min_length: {
                    message: 'GL.VALIDATION.MIN_LENGTH',
                    value: 4,
                }
            }
        },
        identify: {
            type: CrudFieldUiTypeEnum.PASSWORD,
            label: 'ONBOARDING_SIGNIN.FIELD_LABEL.PASSWORD',
            placeholder: 'ONBOARDING_SIGNIN.FIELD_PLACEHOLDER.PASSWORD',
            hint: '',
            url_matrix_param: 'i',
            value: null,
            validation: {
                required: { 
                    message: 'GL.VALIDATION.REQUIRED', 
                    value: true,
                },
                min_length: {
                    message: 'GL.VALIDATION.MIN_LENGTH',
                    value: 5,
                }
            }
        },
        keep_logged: {
            type: CrudFieldUiTypeEnum.CHECKBOX,
            label: 'ONBOARDING_SIGNIN.FIELD_LABEL.KEEP_SIGNED_IN',
            placeholder: '',
            hint: '',
            url_matrix_param: 'kl',
            value: null,
            default: false,
        },
        mfa_option: {
            type: CrudFieldUiTypeEnum.RADIO,
            label: 'ONBOARDING_SIGNIN.FIELD_LABEL.MFA_OPTION',
            placeholder: '',
            hint: '',
            url_matrix_param: 'mo',
            value: null,
            validation: {
                required: { 
                    message: 'GL.VALIDATION.REQUIRED', 
                    value: true,
                }
            }
        },
        mfa_vi: {
            type: CrudFieldUiTypeEnum.TEXT,
            label: 'ONBOARDING_SIGNIN.FIELD_LABEL.OTP',
            placeholder: 'ONBOARDING_SIGNIN.FIELD_PLACEHOLDER.OTP',
            hint: '',
            url_matrix_param: 'vi',
            value: null,
            validation: {
                required: { 
                    message: 'GL.VALIDATION.REQUIRED', 
                    value: true,
                },
                min_length: {
                    message: 'GL.VALIDATION.MIN_LENGTH',
                    value: 3,
                }
            }
        },
    };

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    
    private readonly _mutationFieldObj = signal<SigninMutationFieldObjType>(this.MUTATION_FIELD_OBJ);
    public readonly mutationFieldObj = this._mutationFieldObj.asReadonly();

    private _mutationFormError = signal<SigninMutationFormErrorType>({
        un_pe_pm: null,
        identify: null,
        keep_logged: null,
        mfa_option: null,
        mfa_vi: null
    });
    public readonly mutationFormError = this._mutationFormError.asReadonly();

    public readonly _mutationFormModel = signal<SigninMutationFormModelType>({
        un_pe_pm: '',
        identify: '',
        keep_logged: false,
        mfa_option: UserMultiFactorAuthenticationTypeEnumAddon.MULTIFAT_EMAIL,
        mfa_vi: ''
    });
    public readonly mutationFormModel = this._mutationFormModel.asReadonly();
    
    public readonly mutationForm = form(this._mutationFormModel, (sp) => {
        const fo = this.mutationFieldObj();

        // ─── HIDE FIELD ──────────────────────────────────────────────────
        // Multi-step flow: hide non-active fields so they don't block validation.
        hidden(sp.un_pe_pm, {
            when: () => this.step() !== SigninStepEnum.USERNAME,
        });
        hidden(sp.identify, {
            when: () => this.step() !== SigninStepEnum.PASSWORD,
        });
        hidden(sp.mfa_option, {
            when: () => this.step() !== SigninStepEnum.MFAO,
        });
        hidden(sp.mfa_vi, {
            when: () => this.step() !== SigninStepEnum.VERIFY
        });

        // ─── FIELD: un_pe_pm ──────────────────────────────────────────────────
        required(sp.un_pe_pm, { message: fo.un_pe_pm?.validation?.required?.message });
        minLength(sp.un_pe_pm, fo.un_pe_pm?.validation?.min_length?.value, { message: fo.un_pe_pm?.validation?.min_length?.message });
        validate(sp.un_pe_pm, (ctx) => {
            const mfError = this.mutationFormError().un_pe_pm;
            const invalidUserValue = this.invalidUser();

            if(invalidUserValue && invalidUserValue.includes(ctx.value())) {
                return { kind: 'not_found', message: 'ONBOARDING_SIGNIN.VALIDATION.INVALID_USER' };
            } else if(mfError) {
                return { kind: 'mf_error', message: mfError };
            }
            return null;
        });
        
        // ─── FIELD: identify ──────────────────────────────────────────────────
        required(sp.identify, { message: fo.identify?.validation?.required?.message });
        minLength(sp.identify, fo.identify?.validation?.min_length?.value, { message: fo.identify?.validation?.min_length?.message });
        validate(sp.identify, (ctx) => {
            const mfError = this.mutationFormError().identify;
            const invalidIdentifyValue = this.invalidUser();
            
            if(invalidIdentifyValue && invalidIdentifyValue.includes(ctx.value())) {
                return { kind: 'not_found', message: 'ONBOARDING_SIGNIN.VALIDATION.INVALID_IDENTIFY' };
            } else if(mfError) {
                return { kind: 'mf_error', message: mfError };
            }
            return null;
        });

        // ─── FIELD: mfa_option ──────────────────────────────────────────────────
        required(sp.mfa_option, { message: fo.mfa_option?.validation?.required?.message });
        validate(sp.mfa_option, (ctx) => {
            const mfError = this.mutationFormError().mfa_option;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });

        // ─── FIELD: mfa_vi ──────────────────────────────────────────────────
        required(sp.mfa_vi, { message: fo.mfa_vi?.validation?.required?.message });
        minLength(sp.mfa_vi, fo.mfa_vi?.validation?.min_length?.value, { message: fo.mfa_vi?.validation?.min_length?.message });
        validate(sp.mfa_vi, (ctx) => {
            const mfError = this.mutationFormError().mfa_vi;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });
    });

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████
    
    private readonly _step = signal<SigninStepEnum>(SigninStepEnum.USERNAME);
    public readonly step = this._step.asReadonly();

    private readonly _stepSequence = signal<SigninStepSequenceType>({
        [SigninStepEnum.USERNAME]: null,
    });
    public readonly stepSequence = this._stepSequence.asReadonly();

    private readonly _heading = signal<string | null>(null);
    public readonly heading = this._heading.asReadonly();

    private readonly _subHeading = signal<string | null>(null);
    public readonly subHeading = this._subHeading.asReadonly();

    private readonly _oauthSignin = signal<boolean>(false);
    public readonly oauthSignin = this._oauthSignin.asReadonly();

    private readonly _hidePassword = signal<boolean>(true);
    public readonly hidePassword = this._hidePassword.asReadonly();

    private readonly _hideMfaVi = signal<boolean>(true);
    public readonly hideMfaVi = this._hideMfaVi.asReadonly();

    private readonly _stamp = signal<string>(Date.now().toString());
    public readonly stamp = this._stamp.asReadonly();

    private readonly _stepResponse = signal<SigninStepResponseType | null>(null);
    public readonly stepResponse = this._stepResponse.asReadonly();

    private readonly _invalidUser = signal<string[] | null>(null);
    public readonly invalidUser = this._invalidUser.asReadonly();

    private readonly _invalidIdentify = signal<string[] | null>(null);
    public readonly invalidIdentify = this._invalidIdentify.asReadonly();

    private readonly _available_mfao = signal<SigninAvailableMultiFactorAuthenticationType>({});
    public readonly available_mfao = this._available_mfao.asReadonly();

    private readonly _selected_mfao = signal<UserMultiFactorAuthenticationTypeEnum>(UserMultiFactorAuthenticationTypeEnum.MULTIFAT_EMAIL);
    public readonly selected_mfao = this._selected_mfao.asReadonly();

    private readonly _ref_id = signal<string | null>(null);
    public readonly ref_id = this._ref_id.asReadonly();

    private readonly _ref_value = signal<string | null>(null);
    public readonly ref_value = this._ref_value.asReadonly();

    private readonly _disable_resend_otp = signal<boolean>(false);
    public readonly disable_resend_otp = computed(() => this.computedDisableResendOtp());

    // ████ STATE DEBUGGER ██████████████████████████████████████████████

    public readonly debugState = computed(() => ({
        step: this.step(),
        heading: this.heading(),
        subHeading: this.subHeading(),
        oauthSignin: this.oauthSignin(),
        hidePassword: this.hidePassword(),
        hideMfaVi: this.hideMfaVi(),
        mutationFormModel: this.mutationFormModel(),
        selected_mfao: this.selected_mfao(),
        step_response: this.stepResponse(),
    }));

    constructor() {
        super();
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████
    
    public override onActivate(): void {
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }

            this.setHeadingForStep();
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
    }
    public override onDeactivate(): void {
        
    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████
    
    public setMutationFieldObj(mutationFieldObj: SigninMutationFieldObjType): void {
        this._mutationFieldObj.set(mutationFieldObj);
    }
    public computedMutationFieldObjMfaVi(): void {
        const fieldObject = this.mutationFieldObj();

        if(this.selected_mfao() === UserMultiFactorAuthenticationTypeEnum.MULTIFAT_SECURITY_QUE) {
            fieldObject.mfa_vi.label = 'ONBOARDING_SIGNIN.FIELD_LABEL.SQ_ANSWER';
            fieldObject.mfa_vi.placeholder = 'ONBOARDING_SIGNIN.FIELD_PLACEHOLDER.SQ_ANSWER';
        } else {
            fieldObject.mfa_vi.label = 'ONBOARDING_SIGNIN.FIELD_LABEL.OTP';
            fieldObject.mfa_vi.placeholder = 'ONBOARDING_SIGNIN.FIELD_PLACEHOLDER.OTP';
        }
        
        this.setMutationFieldObj(fieldObject);
    }
    public setMutationFormError(error: SigninMutationFormErrorType): void {
        this._mutationFormError.set(error);
    }
    public updateMutationFormError(error: Partial<SigninMutationFormErrorType>): void {
        this._mutationFormError.update(current => ({
            ...current,
            ...error
        }));
    }
    public clearMutationFormError(): void {
        this._mutationFormError.set({
            un_pe_pm: null,
            identify: null,
            keep_logged: null,
            mfa_option: null,
            mfa_vi: null
        });
    }
    public setMutationFormModel(input: SigninMutationFormModelType): void {
        this._mutationFormModel.set(input);
    }
    public updateMutationFormModel(input: Partial<SigninMutationFormModelType>): void {
        this._mutationFormModel.update(current => ({
            ...current,
            ...input
        }));
    }
    public clearMutationFormModel(): void {
        this._mutationFormModel.set({
            un_pe_pm: '',
            identify: '',
            keep_logged: false,
            mfa_option: UserMultiFactorAuthenticationTypeEnumAddon.MULTIFAT_EMAIL,
            mfa_vi: ''
        });
    }
    public setStep(step: SigninStepEnum): void {
        this._step.set(step);
    }
    public setStepSequence(stepSequence: SigninStepSequenceType): void {
        this._stepSequence.set(stepSequence);
    }
    public updateStepSequence(current: SigninStepEnum, previous: SigninStepEnum | null): void {
        this._stepSequence.update(sequence => ({
            ...sequence,
            [current]: previous
        }))
    }
    public getPreviousStep(step: SigninStepEnum): SigninStepEnum | null {
        return this.stepSequence()[step] ?? null;
    }
    public setHeading(heading: string | null): void {
        this._heading.set(heading);
    }
    public setHeadingForStep(step?: SigninStepEnum): void {
        switch (step ?? this.step()) {
            // we are using i18n keys as its language based
            case SigninStepEnum.USERNAME:
                this.setHeading('ONBOARDING_SIGNIN.STEP.USERNAME.HEADING');
                this.setSubHeading('ONBOARDING_SIGNIN.STEP.USERNAME.SUBHEADING');
            break;
            case SigninStepEnum.PASSWORD:
                this.setHeading('ONBOARDING_SIGNIN.STEP.PASSWORD.HEADING');
                this.setSubHeading('ONBOARDING_SIGNIN.STEP.PASSWORD.SUBHEADING');
            break;
            case SigninStepEnum.MFAO:
                this.setHeading('ONBOARDING_SIGNIN.STEP.MFA_OPTION.HEADING');
                this.setSubHeading('ONBOARDING_SIGNIN.STEP.MFA_OPTION.SUBHEADING');
            break;
            case SigninStepEnum.VERIFY:
                if(this.selected_mfao() === UserMultiFactorAuthenticationTypeEnum.MULTIFAT_SECURITY_QUE) {
                    this.setHeading('ONBOARDING_SIGNIN.STEP.VERIFY_SQ_ANSWER.HEADING');
                    this.setSubHeading('ONBOARDING_SIGNIN.STEP.VERIFY_SQ_ANSWER.SUBHEADING');
                } else {
                    this.setHeading('ONBOARDING_SIGNIN.STEP.VERIFY_OTP.HEADING');
                    this.setSubHeading('ONBOARDING_SIGNIN.STEP.VERIFY_OTP.SUBHEADING');
                }
            break;
            case SigninStepEnum.FINISH:
                this.setHeading('ONBOARDING_SIGNIN.STEP.FINISH.HEADING');
                this.setSubHeading('ONBOARDING_SIGNIN.STEP.FINISH.SUBHEADING');
            break;
            default:
            break;
        }
    }
    public setSubHeading(subHeading: string | null): void {
        this._subHeading.set(subHeading);
    }
    public setOauthSignin(oauthSignin: boolean): void {
        this._oauthSignin.set(oauthSignin);
    }
    public setHidePassword(hidePassword: boolean): void {
        this._hidePassword.set(hidePassword);
    }
    public setHideMfaVi(hideMfaVi: boolean): void {
        this._hideMfaVi.set(hideMfaVi);
    }
    public setStamp(stamp: string): void {
        this._stamp.set(stamp);
    }
    public setStepResponse(response: SigninStepResponseType | null): void {
        this._stepResponse.set(response);
    }
    public pushStepResponse(step: SigninStepEnum, data: any): void {
        const fp = this.stepResponse() ?? {} as SigninStepResponseType;
        fp[step] = data;
        this.setStepResponse(fp);
    }
    public getStepResponse(step: SigninStepEnum): any {
        const fp = this.stepResponse();
        if (fp && fp[step]) {
            return fp[step];
        }
        return null;
    }
    public setInvalidUser(invalidUser: string[] | null): void {
        this._invalidUser.set(invalidUser);
    }
    public pushInvalidUser(invalidUser: string): void {
        this._invalidUser.update(all => [
            ...(all ?? []), 
            invalidUser
        ]);
    }
    public removeInvalidUser(invalidUser: string): void {
        this._invalidUser.update(all => 
            // if currentAlerts is null/undefined, fallback to an empty array, then filter
            (all ?? []).filter(iu => iu !== invalidUser)
        );
    }
    public clearInvalidUser(): void {
        this._invalidUser.set([]);
    }
    public setInvalidIdentify(invalidIdentify: string[] | null): void {
        this._invalidIdentify.set(invalidIdentify);
    }
    public pushInvalidIdentify(invalidIdentify: string): void {
        this._invalidIdentify.update(all => [
            ...(all ?? []), 
            invalidIdentify
        ]);
    }
    public removeInvalidIdentify(invalidIdentify: string): void {
        this._invalidIdentify.update(all => 
            // if currentAlerts is null/undefined, fallback to an empty array, then filter
            (all ?? []).filter(ii => ii !== invalidIdentify)
        );
    }
    public clearInvalidIdentify(): void {
        this._invalidIdentify.set([]);
    }
    public setAvailableMfao(available_mfao: SigninAvailableMultiFactorAuthenticationType): void {
        this._available_mfao.set(available_mfao);
    }
    public setSelected_mfao(selected_mfao: UserMultiFactorAuthenticationTypeEnum): void {
        this._selected_mfao.set(selected_mfao);
    }
    public setRefId(id: string | null): void {
        this._ref_id.set(id);
    }
    public setRefValue(value: string | null): void {
        this._ref_value.set(value);
    }
    public setDisableResendOtp(state: boolean): void {
        this._disable_resend_otp.set(state);
    }
    public computedDisableResendOtp(): boolean {
        // if its pocessing then do not allow to send otp
        if(this.gpbs.processing)
            return true;

        return this._disable_resend_otp();
    }
    public delayEnableResendOtp(minute: number = 0.25): void {
        this._disable_resend_otp.set(true);
        
        setTimeout(() => {
            this._disable_resend_otp.set(false);
        }, minute * 60 * 1000);
    }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a
    
    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a
    
    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a
    
    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
} 