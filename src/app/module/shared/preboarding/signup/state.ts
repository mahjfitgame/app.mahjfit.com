// file: src/app/module/shared/preboarding/signup/state.ts
import { computed, effect, inject, Service, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { AuthorisationRoleEnum } from "@bfw/api-sdk/graphql/endpoints/shared";
import { CrudFieldUiTypeEnum } from "@base/crud/enum";
import { disabled, email, form, maxLength, minLength, pattern, required, validate } from "@angular/forms/signals";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation/module/type";
import { SignupMutationFieldObjType, SignupMutationFormErrorType, SignupMutationFormModelType } from "src/app/module/shared/preboarding/signup/type";
import { PREBOARDING_SIGNUP_STATE_STORE_KEY } from "./const";
import { CrudChildStateType } from "src/app/base/crud/child/type/state";
import { CrudMutationStateType } from "src/app/base/crud/type";

@Service({ autoProvided: false })
export class SignupState extends SignalStateService implements FoundationModuleStateType, CrudChildStateType, CrudMutationStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████
    
    // required for persisted state
    public override readonly storeKey = PREBOARDING_SIGNUP_STATE_STORE_KEY;

    // ████ CRUD OBJECTS ████████████████████████████████████████████
    // set mutation field obj
    public readonly MUTATION_FIELD_OBJ: SignupMutationFieldObjType = {
        arole_id: {
            type: CrudFieldUiTypeEnum.SELECT,
            label: 'PREBOARDING_SIGNUP.FIELD_LABEL.AROLE_ID',
            placeholder: 'PREBOARDING_SIGNUP.FIELD_PLACEHOLDER.AROLE_ID',
            hint: '',
            url_matrix_param: 'ar',
            value: null,
            validation: {
                required: { 
                    message: 'PREBOARDING_SIGNUP.VALIDATION.AROLE_ID', 
                    value: true,
                }
            }
        },
        connsrc_id: {
            type: CrudFieldUiTypeEnum.SELECT,
            label: 'PREBOARDING_SIGNUP.FIELD_LABEL.CONNSRC_ID',
            placeholder: 'PREBOARDING_SIGNUP.FIELD_PLACEHOLDER.CONNSRC_ID',
            hint: '',
            url_matrix_param: 'cs',
            value: null,
            validation: {
                required: { 
                    message: 'PREBOARDING_SIGNUP.VALIDATION.CONNSRC_ID', 
                    value: true,
                }
            }
        },
        identify: {
            type: CrudFieldUiTypeEnum.PASSWORD,
            label: 'PREBOARDING_SIGNUP.FIELD_LABEL.IDENTIFY',
            placeholder: 'PREBOARDING_SIGNUP.FIELD_PLACEHOLDER.IDENTIFY',
            hint: '',
            url_matrix_param: 'i',
            value: null,
            validation: {
                required: { 
                    message: 'PREBOARDING_SIGNUP.VALIDATION.IDENTIFY', 
                    value: true,
                },
                min_length: {
                    message: 'PREBOARDING_SIGNUP.VALIDATION.IDENTIFY_MIN_LENGTH',
                    value: 8,
                },
                pattern: {
                    message: 'PREBOARDING_SIGNUP.VALIDATION.IDENTIFY_PATTERN',
                    value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\S{8,})(?!.*(\w)\1{2})/,
                }
            }
        },
        identify_confirm: {
            type: CrudFieldUiTypeEnum.PASSWORD,
            label: 'PREBOARDING_SIGNUP.FIELD_LABEL.IDENTIFY_CONFIRM',
            placeholder: 'PREBOARDING_SIGNUP.FIELD_PLACEHOLDER.IDENTIFY_CONFIRM',
            hint: '',
            url_matrix_param: 'ic',
            value: null,
            validation: {
                required: { 
                    message: 'PREBOARDING_SIGNUP.VALIDATION.IDENTIFY_CONFIRM', 
                    value: true,
                },
                min_length: {
                    message: 'PREBOARDING_SIGNUP.VALIDATION.IDENTIFY_MIN_LENGTH',
                    value: 8,
                },
                pattern: {
                    message: 'PREBOARDING_SIGNUP.VALIDATION.IDENTIFY_PATTERN',
                    value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\S{8,})(?!.*(\w)\1{2})/,
                },
                match_field: {
                    message: 'PREBOARDING_SIGNUP.VALIDATION.IDENTIFY_MISMATCH',
                    value: 'identify',
                }
            }
        },
        primary_email: {
            type: CrudFieldUiTypeEnum.EMAIL,
            label: 'PREBOARDING_SIGNUP.FIELD_LABEL.PRIMARY_EMAIL',
            placeholder: 'PREBOARDING_SIGNUP.FIELD_PLACEHOLDER.PRIMARY_EMAIL',
            hint: '',
            url_matrix_param: 'pe',
            value: null,
            validation: {
                required: { 
                    message: 'PREBOARDING_SIGNUP.VALIDATION.PRIMARY_EMAIL', 
                    value: true,
                },
                email: {
                    message: 'PREBOARDING_SIGNUP.VALIDATION.PRIMARY_EMAIL_FORMAT',
                    value: true,
                }
            }
        },
        primary_mobile: {
            type: CrudFieldUiTypeEnum.TEL,
            label: 'PREBOARDING_SIGNUP.FIELD_LABEL.PRIMARY_MOBILE',
            placeholder: 'PREBOARDING_SIGNUP.FIELD_PLACEHOLDER.PRIMARY_MOBILE',
            hint: '',
            url_matrix_param: 'pm',
            value: null,
            validation: {
                required: { 
                    message: 'PREBOARDING_SIGNUP.VALIDATION.PRIMARY_MOBILE', 
                    value: true,
                },
                max_length: {
                    message: 'PREBOARDING_SIGNUP.VALIDATION.PRIMARY_MOBILE_MAX_LENGTH',
                    value: 15,
                }
            }
        },
        primary_mobile_cc: {
            type: CrudFieldUiTypeEnum.SELECT,
            label: 'PREBOARDING_SIGNUP.FIELD_LABEL.PRIMARY_MOBILE_CC',
            placeholder: 'PREBOARDING_SIGNUP.FIELD_PLACEHOLDER.PRIMARY_MOBILE_CC',
            hint: '',
            url_matrix_param: 'pmcc',
            value: null,
            validation: {
                required: { 
                    message: 'PREBOARDING_SIGNUP.VALIDATION.PRIMARY_MOBILE_CC', 
                    value: true,
                },
                max_length: {
                    message: 'PREBOARDING_SIGNUP.VALIDATION.PRIMARY_MOBILE_CC_MAX_LENGTH',
                    value: 4,
                }
            }
        },
        username: {
            type: CrudFieldUiTypeEnum.TEXT,
            label: 'PREBOARDING_SIGNUP.FIELD_LABEL.USERNAME',
            placeholder: 'PREBOARDING_SIGNUP.FIELD_PLACEHOLDER.USERNAME',
            hint: '',
            url_matrix_param: 'un',
            value: null,
            validation: {
                min_length: {
                    message: 'PREBOARDING_SIGNUP.VALIDATION.USERNAME_MIN_LENGTH',
                    value: 4,
                }
            }
        },
    };

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    
    public readonly _mutationFieldObj = signal<SignupMutationFieldObjType>(this.MUTATION_FIELD_OBJ);
    public readonly mutationFieldObj = this._mutationFieldObj.asReadonly();

    public readonly _mutationFormError = signal<SignupMutationFormErrorType>({
        arole_id: null,
        connsrc_id: null,
        identify: null,
        identify_confirm: null,
        primary_email: null,
        primary_mobile: null,
        primary_mobile_cc: null,
        username: null
    });
    public readonly mutationFormError = this._mutationFormError.asReadonly();

    public readonly _mutationFormModel = signal<SignupMutationFormModelType>({
        arole_id: AuthorisationRoleEnum.USER,
        connsrc_id: 1,
        identify: '',
        identify_confirm: '',
        primary_email: '',
        primary_mobile: '',
        primary_mobile_cc: '',
        username: ''
    });
    public readonly mutationFormModel = this._mutationFormModel.asReadonly();

    public readonly _mutationFormProcessing = signal(false);
    public readonly mutationFormProcessing = this._mutationFormProcessing.asReadonly();

    public readonly mutationForm = form(this._mutationFormModel, (sp) => {
        const fo = this.mutationFieldObj();

        disabled(sp, { when: () => this.mutationFormProcessing() });

        // ─── FIELD: arole_id ──────────────────────────────────────────────────
        required(sp.arole_id, { message: fo.arole_id.validation?.required?.message });
        validate(sp.arole_id, () => {
            const mfError = this.mutationFormError().arole_id;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });

        // ─── FIELD: connsrc_id ──────────────────────────────────────────────────
        required(sp.connsrc_id, { message: fo.connsrc_id.validation?.required?.message });
        validate(sp.connsrc_id, () => {
            const mfError = this.mutationFormError().connsrc_id;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });
        
        // ─── FIELD: identify ──────────────────────────────────────────────────
        required(sp.identify, { message: fo.identify.validation?.required?.message });
        minLength(sp.identify, fo.identify.validation?.min_length?.value, { message: fo.identify.validation?.min_length?.message });
        pattern(sp.identify, fo.identify.validation?.pattern?.value, { message: fo.identify.validation?.pattern?.message });
        validate(sp.identify, () => {
            const mfError = this.mutationFormError().identify;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });

        // ─── FIELD: identify_confirm ──────────────────────────────────────────
        required(sp.identify_confirm, { message: fo.identify_confirm.validation?.required?.message });
        minLength(sp.identify_confirm, fo.identify_confirm.validation?.min_length?.value, { message: fo.identify_confirm.validation?.min_length?.message });
        pattern(sp.identify_confirm, fo.identify_confirm.validation?.pattern?.value, { message: fo.identify_confirm.validation?.pattern?.message });
        validate(sp.identify_confirm, (ctx) => {
            if (ctx.value() !== ctx.valueOf(sp.identify)) {
                return { kind: 'mismatch', message: fo.identify_confirm.validation?.match_field?.message };
            }

            const mfError = this.mutationFormError().identify_confirm;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });

        // ─── FIELD: primary_email ─────────────────────────────────────────────
        required(sp.primary_email, { message: fo.primary_email.validation?.required?.message });
        email(sp.primary_email, { message: fo.primary_email.validation?.email?.message });
        validate(sp.primary_email, () => {
            const mfError = this.mutationFormError().primary_email;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });

        // ─── FIELD: primary_mobile ────────────────────────────────────────────
        required(sp.primary_mobile, { message: fo.primary_mobile.validation?.required?.message });
        maxLength(sp.primary_mobile, fo.primary_mobile.validation?.max_length?.value, { message: fo.primary_mobile.validation?.max_length?.message });
        validate(sp.primary_mobile, () => {
            const mfError = this.mutationFormError().primary_mobile;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });

        // ─── FIELD: primary_mobile_cc ─────────────────────────────────────────
        required(sp.primary_mobile_cc, { message: fo.primary_mobile_cc.validation?.required?.message });
        maxLength(sp.primary_mobile_cc, fo.primary_mobile_cc.validation?.max_length?.value, { message: fo.primary_mobile_cc.validation?.max_length?.message });
        validate(sp.primary_mobile_cc, () => {
            const mfError = this.mutationFormError().primary_mobile_cc;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });

        // ─── FIELD: username ──────────────────────────────────────────────────
        minLength(sp.username, fo.username.validation?.min_length?.value, { message: fo.username.validation?.min_length?.message });
        validate(sp.username, () => {
            const mfError = this.mutationFormError().username;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });
    });

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _hidePassword = signal<boolean>(true);
    public readonly hidePassword = this._hidePassword.asReadonly();

    private readonly _hidePasswordConfirm = signal<boolean>(true);
    public readonly hidePasswordConfirm = this._hidePasswordConfirm.asReadonly();
  
    // ████ STATE DEBUGGER ██████████████████████████████████████████████

    /*
    public readonly debugState = computed(() => ({
        
    }));
    */

    constructor() {
        super();
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████
    
    public override onActivate(): void {
        /*
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }

            this.setHeadingForStep();
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
        */
    }
    public override onDeactivate(): void {
        
    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    public setHidePassword(hidePassword: boolean): void {
        this._hidePassword.set(hidePassword);
    }
    public setHidePasswordConfirm(hidePasswordConfirm: boolean): void {
        this._hidePasswordConfirm.set(hidePasswordConfirm);
    }

    // ████ SIGNAL FORM METHODS ██████████████████████████████████████████████
    public setMutationFieldObj(mutationFieldObj: SignupMutationFieldObjType): void {
        this._mutationFieldObj.set(mutationFieldObj);
    }
    public setMutationFormError(error: SignupMutationFormErrorType): void {
        this._mutationFormError.set(error);
    }
    public updateMutationFormError(error: Partial<SignupMutationFormErrorType>): void {
        this._mutationFormError.update(current => ({
            ...current,
            ...error
        }));
    }
    public clearMutationFormError(): void {
        this._mutationFormError.set({
            arole_id: null,
            connsrc_id: null,
            identify: null,
            identify_confirm: null,
            primary_email: null,
            primary_mobile: null,
            primary_mobile_cc: null,
            username: null
        });
    }
    public setMutationFormModel(input: SignupMutationFormModelType): void {
        this._mutationFormModel.set(input);
    }
    public updateMutationFormModel(input: Partial<SignupMutationFormModelType>): void {
        this._mutationFormModel.update(current => ({
            ...current,
            ...input
        }));
    }
    public clearMutationFormModel(): void {
        this._mutationFormModel.set({
            arole_id: AuthorisationRoleEnum.USER,
            connsrc_id: 1,
            identify: '',
            identify_confirm: '',
            primary_email: '',
            primary_mobile: '',
            primary_mobile_cc: '',
            username: ''
        });
    }
    public setMutationFormProcessing(processing: boolean): void {
        this._mutationFormProcessing.set(processing);
    }
    public setMutationFormValues(input?: SignupMutationFormModelType): void {
        // not in use but required to satisfy the interface   
    }
    public resetMutationForm(): void {
        // reset the form when needed
        this.clearMutationFormError();
        this.clearMutationFormModel();
        this.mutationForm().reset();
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
