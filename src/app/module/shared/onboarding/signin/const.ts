// file: ./src/app/module/shared/geo/country/const.ts
import { UserMultiFactorAuthenticationTypeEnum, UserMultiFactorAuthenticationTypeEnumAddon } from "@bfw/api-sdk/graphql/endpoints/shared";

export const ONBOARDING_SIGNIN_I18N_KEY = 'app.module.shared.onboarding.signin' as const;

export const UserMultiFactorAuthenticationOptionMap: Record<UserMultiFactorAuthenticationTypeEnumAddon, UserMultiFactorAuthenticationTypeEnum> = {
    [UserMultiFactorAuthenticationTypeEnumAddon.MULTIFAT_2FAAPP]: 
        UserMultiFactorAuthenticationTypeEnum.MULTIFAT_2FAAPP,
    [UserMultiFactorAuthenticationTypeEnumAddon.MULTIFAT_EMAIL]: 
        UserMultiFactorAuthenticationTypeEnum.MULTIFAT_EMAIL,
    [UserMultiFactorAuthenticationTypeEnumAddon.MULTIFAT_SMS]: 
        UserMultiFactorAuthenticationTypeEnum.MULTIFAT_SMS,
    [UserMultiFactorAuthenticationTypeEnumAddon.MULTIFAT_WHATSAPP]: 
        UserMultiFactorAuthenticationTypeEnum.MULTIFAT_WHATSAPP,
    [UserMultiFactorAuthenticationTypeEnumAddon.MULTIFAT_SECURITY_QUE]: 
        UserMultiFactorAuthenticationTypeEnum.MULTIFAT_SECURITY_QUE,
    [UserMultiFactorAuthenticationTypeEnumAddon.MULTIFAT_SECONDARY_DEVICE]: 
        UserMultiFactorAuthenticationTypeEnum.MULTIFAT_SECONDARY_DEVICE
};