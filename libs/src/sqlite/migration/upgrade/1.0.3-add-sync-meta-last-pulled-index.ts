// file: libs/src/sqlite/migration/update/1.0.3-add-sync-meta-last-pulled-index.ts

import { LocalMigrationType } from "@libs/sqlite/module/_local_migrations/type";
import { sql } from "drizzle-orm";

export const MIGRATION_1_0_3_ADD_SYNC_META_LAST_PULLED_INDEX: LocalMigrationType = {
  version: '1.0.3',

  name: 'add-sync-meta-last-pulled-index',

  up: [
    /**
     * New index for sync meta last pulled column.
     */
    sql`
    CREATE INDEX IF NOT EXISTS idx_sync_meta_last_pulled
    ON te_sync_meta(sym_last_pulled)
    `,
  ],

  down: [
    /**
     * Rollback sync meta last pulled index.
     */
    sql`
    DROP INDEX IF EXISTS idx_sync_meta_last_pulled
    `,
  ],
};
