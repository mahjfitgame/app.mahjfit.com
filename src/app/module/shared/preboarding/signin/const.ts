// file: src/app/module/shared/preboarding/signin/const.ts
import { AuthorisationRoleEnumAddon, UserMultiFactorAuthenticationTypeEnum, UserMultiFactorAuthenticationTypeEnumAddon } from "@bfw/api-sdk/graphql/endpoints/shared";

export const PREBOARDING_SIGNIN_STATE_STORE_KEY = 'sin' as const;

export const PREBOARDING_SIGNIN_I18N_KEY = 'app.module.shared.preboarding.signin' as const;
export const ALLOWED_AUTHORISATION_ROLES: readonly AuthorisationRoleEnumAddon[] = [
    AuthorisationRoleEnumAddon.USER,
    AuthorisationRoleEnumAddon.ADVANCED_USER,
    AuthorisationRoleEnumAddon.ADMIN,
    AuthorisationRoleEnumAddon.SUPER_ADMIN,
    AuthorisationRoleEnumAddon.TECHNICAL_TEAM,
];
