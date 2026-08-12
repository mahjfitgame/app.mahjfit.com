// file: ./src/app/base/internationalization/const.ts
export const I18N_STATE_STORE_KEY = 'i18n' as const;
export const I18N_GLOBAL_KEY = 'global' as const;
export const I18N_KEY = 'app.base.internationalization' as const;

export const I18N_DEFAULT_LANG = 'en';

export const I18N_RUNTIME_DIR = 'i18n-runtime' as const;

export const I18N_SERVER_GLOBAL_ENDPOINT = 'i18n-client' as const;

export const I18N_SERVER_MODULE_ENDPOINT = 'i18n-client' as const;

// 1. Base Western / Left-to-Right Languages
export const I18N_LTR_LANG: string[] = [
    'en', // English
    'hi', // Hindi
    'gu', // Gujarati
    'es', // Spanish
    'fr'  // French
];

// 1. Right-to-Left Languages
export const I18N_RTL_LANG: string[] = [
    'ar' // Arabic
];

// 3. Combined Allowed Languages
export const I18N_ALLOWED_LANG: string[] = [
    ...I18N_LTR_LANG,
    ...I18N_RTL_LANG
];

export const I18N_P_STATE_VERSION: number = 1;

export const I18N_USE_API: boolean = false;
