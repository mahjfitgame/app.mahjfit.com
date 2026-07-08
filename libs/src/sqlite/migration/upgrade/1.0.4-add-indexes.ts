// file: libs/src/sqlite/migration/update/1.0.3-add-sync-meta-last-pulled-index.ts

import { LocalMigrationType } from "@libs/sqlite/module/_local_migrations/type";
import { sql } from "drizzle-orm";

export const MIGRATION_1_0_4_ADD_INDEXES: LocalMigrationType = {
  version: '1.0.4',

  name: 'add-indexes',

  up: [
    /**
     * New index for sync meta last pulled column.
     */
    sql`
    CREATE INDEX IF NOT EXISTS in__local_migrations_executed ON _local_migrations (lm_executed);
    `,
    sql`
    CREATE INDEX IF NOT EXISTS in__local_migrations_status ON _local_migrations (lm_status);
    `,
    sql`
    CREATE INDEX IF NOT EXISTS in_sync_queue_operation ON te_sync_queue (syq_operation);
    `,
  ],

  down: [
    /**
     * Rollback sync meta last pulled index.
     */
    sql`
    DROP INDEX IF EXISTS in__local_migrations_executed
    `,
    sql`
    DROP INDEX IF EXISTS in__local_migrations_status
    `,
    sql`
    DROP INDEX IF EXISTS in_sync_queue_operation
    `,
  ],
};
