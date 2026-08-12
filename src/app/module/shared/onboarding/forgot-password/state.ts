// file: src/app/module/shared/onboarding/forgot-password/state.ts
import { inject, Service, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { AuthorisationRoleEnum } from "@bfw/api-sdk/graphql/endpoints/shared";
import { CrudFieldUiTypeEnum } from "@base/crud/enum";
import { disabled, form, minLength, required, validate } from "@angular/forms/signals";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation-module/type/state";
import { ForgotPasswordMutationFieldObjType, ForgotPasswordMutationFormErrorType, ForgotPasswordMutationFormModelType } from "@module/shared/onboarding/forgot-password/type";
import { CrudChildMutationStateType } from "src/app/base/crud/child/type/mutation.state";
import { ONBOARDING_FORGOTPASSWORD_STATE_STORE_KEY } from "./const";

@Service({ autoProvided: false })
export class ForgotPasswordState extends SignalStateService implements FoundationModuleStateType, CrudChildMutationStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    // required for persisted state
    public override readonly storeKey = ONBOARDING_FORGOTPASSWORD_STATE_STORE_KEY;

    // ████ CRUD OBJECTS ████████████████████████████████████████████
    // set mutation field obj
    public readonly MUTATION_FIELD_OBJ: ForgotPasswordMutationFieldObjType = {
        un_pe_pm: {
            type: CrudFieldUiTypeEnum.TEXT,
            label: 'ONBOARDING_FORGOTPASSWORD.FIELD_LABEL.USERNAME',
            placeholder: 'ONBOARDING_FORGOTPASSWORD.FIELD_PLACEHOLDER.USERNAME',
            hint: '',
            url_matrix_param: 'uem',
            value: null,
            validation: {
                required: {
                    message: 'ONBOARDING_FORGOTPASSWORD.VALIDATION.USERNAME',
                    value: true,
                },
                min_length: {
                    message: 'ONBOARDING_FORGOTPASSWORD.VALIDATION.USERNAME_MIN_LENGTH',
                    value: 4,
                }
            }
        },
        arole_id: {
            type: CrudFieldUiTypeEnum.SELECT,
            label: 'ONBOARDING_FORGOTPASSWORD.FIELD_LABEL.AROLE_ID',
            placeholder: 'ONBOARDING_FORGOTPASSWORD.FIELD_PLACEHOLDER.AROLE_ID',
            hint: '',
            url_matrix_param: 'ar',
            value: null,
            validation: {
                required: {
                    message: 'ONBOARDING_FORGOTPASSWORD.VALIDATION.AROLE_ID',
                    value: true,
                }
            }
        },
        pass_recover_url: {
            type: CrudFieldUiTypeEnum.URL,
            label: 'ONBOARDING_FORGOTPASSWORD.FIELD_LABEL.PASS_RECOVER_URL',
            placeholder: 'ONBOARDING_FORGOTPASSWORD.FIELD_PLACEHOLDER.PASS_RECOVER_URL',
            hint: '',
            url_matrix_param: 'pru',
            value: null,
            validation: {
                required: {
                    message: 'ONBOARDING_FORGOTPASSWORD.VALIDATION.PASS_RECOVER_URL',
                    value: true,
                }
            }
        },
    };

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████

    public readonly _mutationFieldObj = signal<ForgotPasswordMutationFieldObjType>(this.MUTATION_FIELD_OBJ);
    public readonly mutationFieldObj = this._mutationFieldObj.asReadonly();

    public readonly _mutationFormError = signal<ForgotPasswordMutationFormErrorType>({
        un_pe_pm: null,
        arole_id: null,
        pass_recover_url: null,
    });
    public readonly mutationFormError = this._mutationFormError.asReadonly();

    public readonly _mutationFormModel = signal<ForgotPasswordMutationFormModelType>({
        un_pe_pm: '',
        arole_id: AuthorisationRoleEnum.USER,
        pass_recover_url: '',
    });
    public readonly mutationFormModel = this._mutationFormModel.asReadonly();

    public readonly _mutationFormProcessing = signal(false);
    public readonly mutationFormProcessing = this._mutationFormProcessing.asReadonly();

    public readonly mutationForm = form(this._mutationFormModel, (sp) => {
        const fo = this.mutationFieldObj();

        disabled(sp, { when: () => this.mutationFormProcessing() });

        // ─── FIELD: un_pe_pm ──────────────────────────────────────────────────
        required(sp.un_pe_pm, { message: fo.un_pe_pm.validation?.required?.message });
        minLength(sp.un_pe_pm, fo.un_pe_pm.validation?.min_length?.value, { message: fo.un_pe_pm.validation?.min_length?.message });
        validate(sp.un_pe_pm, () => {
            const mfError = this.mutationFormError().un_pe_pm;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });

        // ─── FIELD: arole_id ──────────────────────────────────────────────────
        /*
        required(sp.arole_id, { message: fo.arole_id.validation?.required?.message });
        validate(sp.arole_id, () => {
            const mfError = this.mutationFormError().arole_id;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });
        */

        // ─── FIELD: pass_recover_url ──────────────────────────────────────────
        /*
        required(sp.pass_recover_url, { message: fo.pass_recover_url.validation?.required?.message });
        validate(sp.pass_recover_url, () => {
            const mfError = this.mutationFormError().pass_recover_url;
            return mfError ? { kind: 'mf_error', message: mfError } : null;
        });
        */
    });

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████



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

    // ████ SIGNAL FORM METHODS ██████████████████████████████████████████████

    public setMutationFieldObj(mutationFieldObj: ForgotPasswordMutationFieldObjType): void {
        this._mutationFieldObj.set(mutationFieldObj);
    }
    public setMutationFormError(error: ForgotPasswordMutationFormErrorType): void {
        this._mutationFormError.set(error);
    }
    public updateMutationFormError(error: Partial<ForgotPasswordMutationFormErrorType>): void {
        this._mutationFormError.update(current => ({
            ...current,
            ...error
        }));
    }
    public clearMutationFormError(): void {
        this._mutationFormError.set({
            un_pe_pm: null,
            arole_id: null,
            pass_recover_url: null,
        });
    }
    public setMutationFormModel(input: ForgotPasswordMutationFormModelType): void {
        this._mutationFormModel.set(input);
    }
    public updateMutationFormModel(input: Partial<ForgotPasswordMutationFormModelType>): void {
        this._mutationFormModel.update(current => ({
            ...current,
            ...input
        }));
    }
    public clearMutationFormModel(): void {
        this._mutationFormModel.set({
            un_pe_pm: '',
            arole_id: AuthorisationRoleEnum.USER,
            pass_recover_url: '',
        });
    }
    public setMutationFormProcessing(processing: boolean): void {
        this._mutationFormProcessing.set(processing);
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
