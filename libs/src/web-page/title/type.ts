// file: libs/src/web-page/title/type.ts

/**
 * Where the current title came from.
 *
 * `key`  — an i18n key, re-resolved on every language change
 * `text` — an already-resolved string, e.g. a record name from a detail page
 */
export type WebPageTitleSourceType =
    | { kind: 'key'; value: string }
    | { kind: 'text'; value: string };
