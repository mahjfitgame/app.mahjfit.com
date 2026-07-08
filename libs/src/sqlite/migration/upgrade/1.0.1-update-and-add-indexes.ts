// file: libs/src/sqlite/migration/update/1.0.1-update-indexes.migration.ts

// MIGRATION STEP 5: CREATE MIGRATION FILE using `public/db/upgrade.up.sql` and draft down SQL
// IMPORTANT: you need to perform manual upgrade for chanes in `public/db/schema.static.sql`

import { LocalMigrationType } from "@libs/sqlite/module/_local_migrations/type";
import { sql } from "drizzle-orm";

export const MIGRATION_1_0_1_UPDATE_AND_ADD_INDEXES: LocalMigrationType = {
  version: '1.0.1',

  name: 'update-and-add-indexes',

  up: [
    /**
     * Rename index:
     * old: idx_sync_queue_created_at
     * new: idx_sync_queue_created
     *
     * SQLite does not support direct RENAME INDEX safely across all versions,
     * so drop old index and create new one.
     */
    sql`
    DROP INDEX IF EXISTS idx_sync_queue_created_at
    `,

    sql`
    CREATE INDEX IF NOT EXISTS idx_sync_queue_created
    ON te_sync_queue(syq_created)
    `,

    /**
     * New index for app config updated column.
     */
    sql`
    CREATE INDEX IF NOT EXISTS idx_app_config_updated
    ON te_app_config(conf_updated)
    `,
  ],

  down: [
    /**
     * Rollback newly added app config index.
     */
    sql`
    DROP INDEX IF EXISTS idx_app_config_updated
    `,

    /**
     * Rollback renamed sync queue index.
     */
    sql`
    DROP INDEX IF EXISTS idx_sync_queue_created
    `,

    sql`
    CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at
    ON te_sync_queue(syq_created)
    `,
  ],
};