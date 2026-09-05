// file: libs/src/web-page/title/const.ts

/**
 * GLOBAL i18n key for the application name, used as the title suffix.
 * Global rather than per-module: it names the app, not a page.
 */
export const WEB_PAGE_TITLE_APP_NAME_KEY = 'GL.APP.TITLE' as const;

/** joins the page title to the app name — "Sign In | Bfw Angular PWA" */
export const WEB_PAGE_TITLE_SEPARATOR = ' | ' as const;

/**
 * Prefix every route GL.* title shares. Used only to detect transloco echoing a
 * missing key back — see the guard in service.ts.
 */
export const WEB_PAGE_TITLE_I18N_KEY_PREFIX = 'GL.' as const;
