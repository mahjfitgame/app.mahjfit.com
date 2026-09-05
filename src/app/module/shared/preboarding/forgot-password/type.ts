// file: src/app/module/shared/preboarding/forgot-password/type.ts
import { AuthorisationRoleEnum } from "@bfw/api-sdk/graphql/endpoints/shared";
import { CrudFormFieldInfoType, CrudStateMutationFieldObjType } from "@base/crud/type";

export interface ForgotPasswordMutationFieldObjType extends CrudStateMutationFieldObjType {
    un_pe_pm: CrudFormFieldInfoType,
    arole_id: CrudFormFieldInfoType,
    pass_recover_url: CrudFormFieldInfoType,
}
export interface ForgotPasswordMutationFormModelType {
    un_pe_pm: string,
    arole_id: AuthorisationRoleEnum,
    pass_recover_url: string,
}

export type ForgotPasswordMutationFormErrorType = Record<keyof ForgotPasswordMutationFormModelType, string | null>;
