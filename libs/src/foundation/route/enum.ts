// file: libs/src/foundation/route/enum.ts

/**
 * Default PARAM names in foundation route slugs.
 *
 * ⚠ NOT column names. What TRAVELS in :index is a record identifier, but which
 * COLUMN that identifier lives in is whatever the module passed to
 * setIndexColumn(). Naming columns is FoundationFieldDefaultNameEnum's job;
 * this enum never names one.
 *
 * Keeping them in separate enums is not tidiness. KEYID used to serve both
 * roles, which meant the param could not be renamed without silently
 * repointing setSecondaryKey() at a column that does not exist - and a row read
 * against a missing column answers undefined, with no compile error and no
 * runtime error. Split, the two concepts can never be renamed into each other.
 */
export enum FoundationRouteDefaultParamEnum {
    INDEX = 'index',
}
