// file: src/app/module/shared/preboarding/recover-password/slug.ts
import { SLUG_FOUNDATION_PARAM_PUBLICID } from "@libs/foundation/const";

// main slug
export const SLUG_RECOVER_PASSWORD: string = 'recover-password' as const;

// params slug
//export const SLUG_RECOVER_PASSWORD_PARAM_PUBLICID: string = SLUG_BASE_MODULE_PARAM_PUBLICID;

// query params slug
export const SLUG_RECOVER_PASSWORD_QUERYPARAM_PASS_RECOVER_TOKEN: string = 'pass_recover_token';

// sub slug(s)
export const SLUG_RECOVER_PASSWORD_PUBLICID: string =  `${SLUG_RECOVER_PASSWORD}/:${SLUG_FOUNDATION_PARAM_PUBLICID}` as const;