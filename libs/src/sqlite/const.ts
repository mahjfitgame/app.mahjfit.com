// file: libs/src/sqlite/driver/const.ts
export const SQLITE_DB_NAME = 'bfw-npw-app' as const;
export const SQLITE_JEEP_WASM_PATH = 'assets';
export const SQLITE_TABLE_PREFIX = 'te_' as const;
export const SQLITE_FOREIGN_KEY_PREFIX = 'fk_' as const;
export const SQLITE_INDEX_PREFIX = 'in_' as const;
export const SQLITE_UNIQUE_INDEX_PREFIX = 'un_' as const;
export const SQLITE_CHECK_PREFIX = 'ch_' as const;
export const LOCAL_DB_DISABLED_LOG_MESSAGE =
  '[LOCAL DB] Disabled by ENABLE_LOCAL_DB=false.';
export const LOCAL_DB_DISABLED_ACCESS_MESSAGE =
  '[LOCAL DB] Local database access is disabled by ENABLE_LOCAL_DB=false.';
