// file: src/app/module/shared/onboarding/recover-password/type.ts

import { CrudFormFieldInfoType, CrudStateMutationFieldObjType } from '@base/crud/type';

export interface RecoverPasswordMutationFieldObjType extends CrudStateMutationFieldObjType {
    un_pe_pm: CrudFormFieldInfoType;
    identify: CrudFormFieldInfoType;
    identify_confirm: CrudFormFieldInfoType;
    pass_recover_token: CrudFormFieldInfoType;
}

export interface RecoverPasswordMutationFormModelType {
    un_pe_pm: string;
    identify: string;
    identify_confirm: string;
    pass_recover_token: string;
}

export type RecoverPasswordMutationFormErrorType = Record<keyof RecoverPasswordMutationFormModelType, string | null>;
