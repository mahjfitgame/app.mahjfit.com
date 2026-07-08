// file: src/app/core/persistent-db/migrations/db-version.ts

/**
 * This must match the latest database structure included in schema.sql.
 *
 * When schema.sql changes because of a new release,
 * update this version.
 */

// HOW TO START SQLITE MIGRATION?
// MIGRATION STEP 1: Update `public/db/schema.static.sql` this is in some cases if needed
// MIGRATION STEP 2: run `npm run migration:upgrade` will update `public/db/upgrade.up.sql`
// MIGRATION STEP 3: run `npm run migration:schema` will update main `public/db/schema.sql` used for fresh setup
// MIGRATION STEP 4: CHANGE VERSION
export const SQLITE_CURRENT_DB_VERSION = '1.0.4';
export const SQLITE_CURRENT_DB_VERSION_CONFIG_KEY = 'current_sqlite_db_version';
