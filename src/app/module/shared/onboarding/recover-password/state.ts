// file: src/app/module/shared/onboarding/recover-password/state.ts

import { inject, Service, signal } from '@angular/core';
import { disabled, form, minLength, pattern, required, validate } from '@angular/forms/signals';
import { CrudFieldUiTypeEnum } from '@base/crud/enum';
import { FoundationModuleStateType } from '@libs/foundation-module/type/state';
import { SignalStateService } from '@libs/signal-state/service';
import {
    RecoverPasswordMutationFieldObjType,
    RecoverPasswordMutationFormErrorType,
    RecoverPasswordMutationFormModelType,
} from '@module/shared/onboarding/recover-password/type';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { GlobalProgressBarService } from '@base/global-progress-bar/service';
import { ContextProfileService } from '@libs/context-profile/service';
import { BfwApiService } from '@libs/third-party-apis/bfw-api/service';
import { CrudChildMutationStateType } from 'src/app/base/crud/child/type/mutation.state';
import { ONBOARDING_RECOVERPASSWORD_STATE_STORE_KEY } from './const';

@Service({ autoProvided: false })
export class RecoverPasswordState extends SignalStateService implements FoundationModuleStateType, CrudChildMutationStateType {
    // ████ DEPENDENCIES ████████████████████████████████████████████████
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    // required for persisted state
    public override readonly storeKey = ONBOARDING_RECOVERPASSWORD_STATE_STORE_KEY;

    // ████ CRUD OBJECTS ████████████████████████████████████████████
    // set mutation field obj
    public readonly MUTATION_FIELD_OBJ: RecoverPasswordMutationFieldObjType = {
        un_pe_pm: {
            type: CrudFieldUiTypeEnum.TEXT,
            label: 'ONBOARDING_RECOVERPASSWORD.FIELD_LABEL.USERNAME',
            placeholder: 'ONBOARDING_RECOVERPASSWORD.FIELD_PLACEHOLDER.USERNAME',
            hint: '',
            url_matrix_param: 'uem',
            value: null,
            validation: {
                required: {
                    message: 'ONBOARDING_RECOVERPASSWORD.VALIDATION.USERNAME',
                    value: true,
                },
                min_length: {
                    message: 'ONBOARDING_RECOVERPASSWORD.VALIDATION.USERNAME_MIN_LENGTH',
                    value: 4,
                },
            },
        },
        identify: {
            type: CrudFieldUiTypeEnum.PASSWORD,
            label: 'ONBOARDING_RECOVERPASSWORD.FIELD_LABEL.IDENTIFY',
            placeholder: 'ONBOARDING_RECOVERPASSWORD.FIELD_PLACEHOLDER.IDENTIFY',
            hint: '',
            url_matrix_param: 'i',
            value: null,
            validation: {
                required: {
                    message: 'ONBOARDING_RECOVERPASSWORD.VALIDATION.IDENTIFY',
                    value: true,
                },
                min_length: {
                    message: 'ONBOARDING_RECOVERPASSWORD.VALIDATION.IDENTIFY_MIN_LENGTH',
                    value: 8,
                },
                pattern: {
                    message: 'ONBOARDING_RECOVERPASSWORD.VALIDATION.IDENTIFY_PATTERN',
                    value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\S{8,})(?!.*(\w)\1{2})/,
                },
            },
        },
        identify_confirm: {
            type: CrudFieldUiTypeEnum.PASSWORD,
            label: 'ONBOARDING_RECOVERPASSWORD.FIELD_LABEL.IDENTIFY_CONFIRM',
            placeholder: 'ONBOARDING_RECOVERPASSWORD.FIELD_PLACEHOLDER.IDENTIFY_CONFIRM',
            hint: '',
            url_matrix_param: 'ic',
            value: null,
            validation: {
                required: {
                    message: 'ONBOARDING_RECOVERPASSWORD.VALIDATION.IDENTIFY_CONFIRM',
                    value: true,
                },
                min_length: {
                    message: 'ONBOARDING_RECOVERPASSWORD.VALIDATION.IDENTIFY_MIN_LENGTH',
                    value: 8,
                },
                pattern: {
                    message: 'ONBOARDING_RECOVERPASSWORD.VALIDATION.IDENTIFY_PATTERN',
                    value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\S{8,})(?!.*(\w)\1{2})/,
                },
                match_field: {
                    message: 'ONBOARDING_RECOVERPASSWORD.VALIDATION.IDENTIFY_MISMATCH',
                    value: 'identify',
                },
            },
        },
        pass_recover_token: {
            type: CrudFieldUiTypeEnum.TEXTAREA,
            label: 'ONBOARDING_RECOVERPASSWORD.FIELD_LABEL.PASS_RECOVER_TOKEN',
            placeholder: 'ONBOARDING_RECOVERPASSWORD.FIELD_PLACEHOLDER.PASS_RECOVER_TOKEN',
            hint: 'ONBOARDING_RECOVERPASSWORD.HINT.PASS_RECOVER_TOKEN',
            url_matrix_param: 'prt',
            value: null,
            validation: {
                required: {
                    message: 'ONBOARDING_RECOVERPASSWORD.VALIDATION.PASS_RECOVER_TOKEN',
                    value: true,
                },
            },
        },
    };

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    public readonly _mutationFieldObj = signal<RecoverPasswordMutationFieldObjType>(this.MUTATION_FIELD_OBJ);
    public readonly mutationFieldObj = this._mutationFieldObj.asReadonly();

    public readonly _mutationFormError = signal<RecoverPasswordMutationFormErrorType>({
        un_pe_pm: null,
        identify: null,
        identify_confirm: null,
        pass_recover_token: null,
    });
    public readonly mutationFormError = this._mutationFormError.asReadonly();

    public readonly _mutationFormModel = signal<RecoverPasswordMutationFormModelType>({
        un_pe_pm: '',
        identify: '',
        identify_confirm: '',
        pass_recover_token: '',
    });
    public readonly mutationFormModel = this._mutationFormModel.asReadonly();

    public readonly _mutationFormProcessing = signal(false);
    public readonly mutationFormProcessing = this._mutationFormProcessing.asReadonly();

    public readonly mutationForm = form(this._mutationFormModel, (sp) => {
        const fo = this.mutationFieldObj();

        disabled(sp, { when: () => this.mutationFormProcessing() });

        required(sp.un_pe_pm, { message: fo.un_pe_pm.validation?.required?.message });
        minLength(sp.un_pe_pm, fo.un_pe_pm.validation?.min_length?.value, {
            message: fo.un_pe_pm.validation?.min_length?.message,
        });
        validate(sp.un_pe_pm, () => {
            const error = this.mutationFormError().un_pe_pm;
            return error ? { kind: 'mf_error', message: error } : null;
        });

        required(sp.identify, { message: fo.identify.validation?.required?.message });
        minLength(sp.identify, fo.identify.validation?.min_length?.value, {
            message: fo.identify.validation?.min_length?.message,
        });
        pattern(sp.identify, fo.identify.validation?.pattern?.value, {
            message: fo.identify.validation?.pattern?.message,
        });
        validate(sp.identify, () => {
            const error = this.mutationFormError().identify;
            return error ? { kind: 'mf_error', message: error } : null;
        });

        required(sp.identify_confirm, { message: fo.identify_confirm.validation?.required?.message });
        minLength(sp.identify_confirm, fo.identify_confirm.validation?.min_length?.value, {
            message: fo.identify_confirm.validation?.min_length?.message,
        });
        pattern(sp.identify_confirm, fo.identify_confirm.validation?.pattern?.value, {
            message: fo.identify_confirm.validation?.pattern?.message,
        });
        validate(sp.identify_confirm, (ctx) => {
            if (ctx.value() !== ctx.valueOf(sp.identify)) {
                return {
                    kind: 'mismatch',
                    message: fo.identify_confirm.validation?.match_field?.message,
                };
            }

            const error = this.mutationFormError().identify_confirm;
            return error ? { kind: 'mf_error', message: error } : null;
        });

        required(sp.pass_recover_token, { message: fo.pass_recover_token.validation?.required?.message });
        validate(sp.pass_recover_token, () => {
            const error = this.mutationFormError().pass_recover_token;
            return error ? { kind: 'mf_error', message: error } : null;
        });
    });

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████
    private readonly _hidePassword = signal(true);
    public readonly hidePassword = this._hidePassword.asReadonly();

    private readonly _hidePasswordConfirm = signal(true);
    public readonly hidePasswordConfirm = this._hidePasswordConfirm.asReadonly();

    private readonly _publicid = signal<string | undefined>(undefined);
    public readonly publicid = this._publicid.asReadonly();

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
    public override onActivate(): void { }

    public override onDeactivate(): void { }

    // ████ SIGNAL FORM METHODS ██████████████████████████████████████████████
    public setMutationFieldObj(mutationFieldObj: RecoverPasswordMutationFieldObjType): void {
        this._mutationFieldObj.set(mutationFieldObj);
    }

    public setMutationFormError(error: RecoverPasswordMutationFormErrorType): void {
        this._mutationFormError.set(error);
    }

    public updateMutationFormError(error: Partial<RecoverPasswordMutationFormErrorType>): void {
        this._mutationFormError.update((current) => ({ ...current, ...error }));
    }

    public clearMutationFormError(): void {
        this._mutationFormError.set({
            un_pe_pm: null,
            identify: null,
            identify_confirm: null,
            pass_recover_token: null,
        });
    }

    public setMutationFormModel(input: RecoverPasswordMutationFormModelType): void {
        this._mutationFormModel.set(input);
    }

    public updateMutationFormModel(input: Partial<RecoverPasswordMutationFormModelType>): void {
        this._mutationFormModel.update((current) => ({ ...current, ...input }));
    }

    public clearMutationFormModel(): void {
        this._mutationFormModel.set({
            un_pe_pm: '',
            identify: '',
            identify_confirm: '',
            pass_recover_token: '',
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

    // ████ SIGNAL METHODS ██████████████████████████████████████████████
    public setHidePassword(hidePassword: boolean): void {
        this._hidePassword.set(hidePassword);
    }

    public setHidePasswordConfirm(hidePasswordConfirm: boolean): void {
        this._hidePasswordConfirm.set(hidePasswordConfirm);
    }

    public setPublicid(publicid: string | undefined): void {
        this._publicid.set(publicid);
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
