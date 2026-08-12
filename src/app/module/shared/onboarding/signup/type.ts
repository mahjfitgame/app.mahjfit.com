// file: src/app/module/shared/onboarding/signup/type.ts
import { AuthorisationRoleEnum, SigninStepEnum, UserMultiFactorAuthenticationTypeEnumAddon } from "@bfw/api-sdk/graphql/endpoints/shared";
import { CrudFormFieldInfoType, CrudStateMutationFieldObjType } from "src/app/base/crud/type";

export interface SignupMutationFieldObjType extends CrudStateMutationFieldObjType {
    arole_id: CrudFormFieldInfoType,
    connsrc_id: CrudFormFieldInfoType,
    identify: CrudFormFieldInfoType,
    identify_confirm: CrudFormFieldInfoType,
    primary_email: CrudFormFieldInfoType,
    primary_mobile: CrudFormFieldInfoType,
    primary_mobile_cc: CrudFormFieldInfoType,
    username: CrudFormFieldInfoType
}
export interface SignupMutationFormModelType {
    arole_id: AuthorisationRoleEnum,
    connsrc_id: number,
    identify: string,
    identify_confirm: string,
    primary_email: string,
    primary_mobile: string,
    primary_mobile_cc: string,
    username: string
}

export type SignupMutationFormErrorType = Record<keyof SignupMutationFormModelType, string | null>;