// file: libs/src/sqlite/migration/update/1.0.2-update-local-migrations-sql-columns.ts

import { LocalMigrationType } from "@libs/sqlite/module/_local_migrations/type";
import { sql } from "drizzle-orm";

export const MIGRATION_1_0_2_UPDATE_LOCAL_MIGRATIONS_SQL_COLUMNS: LocalMigrationType = {
  version: '1.0.2',

  name: 'update-local-migrations-sql-columns',

  up: [
    /**
     * Store the migration up SQL next to its down SQL.
     */
    sql`
    ALTER TABLE _local_migrations
    ADD COLUMN lm_sql_up TEXT
    `,

    /**
     * Rename the old rollback SQL column to the new down SQL name.
     */
    sql`
    ALTER TABLE _local_migrations
    RENAME COLUMN lm_rollback_sql TO lm_sql_down
    `,
  ],

  down: [
    sql`
    ALTER TABLE _local_migrations
    RENAME COLUMN lm_sql_down TO lm_rollback_sql
    `,

    /**
     * SQLite does not support dropping a column on all supported runtimes.
     * Leave lm_sql_up in place on manual rollback; older code ignores it.
     */
  ],
};
