// file: src/app/module/shared/preboarding/signin/type.ts
import { SigninStepEnum, UserMultiFactorAuthenticationTypeEnumAddon } from "@bfw/api-sdk/graphql/endpoints/shared";
import { CrudFormFieldInfoType, CrudStateMutationFieldObjType } from "@base/crud/type";

export interface SigninMutationFieldObjType extends CrudStateMutationFieldObjType {
  un_pe_pm: CrudFormFieldInfoType,
  identify: CrudFormFieldInfoType,
  keep_logged: CrudFormFieldInfoType,
  mfa_option: CrudFormFieldInfoType,
  mfa_vi: CrudFormFieldInfoType,
}
export interface SigninMutationFormModelType {
  un_pe_pm: string,
  identify: string,
  keep_logged: boolean,
  mfa_option: UserMultiFactorAuthenticationTypeEnumAddon, // considering email as a default
  mfa_vi: string
}

export type SigninMutationFormErrorType = Record<keyof SigninMutationFormModelType, string | null>;

export type SigninStepResponseType = Record<SigninStepEnum, any>;

export type SigninStepSequenceType = Partial<Record<SigninStepEnum, SigninStepEnum | null>>;

export type SigninAvailableMultiFactorAuthenticationType = Partial<Record<keyof UserMultiFactorAuthenticationTypeEnumAddon, string>>;