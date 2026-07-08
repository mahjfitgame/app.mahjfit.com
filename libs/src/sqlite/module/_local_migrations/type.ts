// file: libs/src/sqlite/migration/type.ts

import { SQL } from "drizzle-orm";
import { SqliteSqlType } from "@libs/sqlite/type";

export interface LocalMigrationStatementWithParamsType {
  sql: SqliteSqlType;
  params?: unknown[];
}

export type LocalMigrationStatementType =
  | SQL<unknown>
  | LocalMigrationStatementWithParamsType;

export interface LocalMigrationType {
  /**
   * Must be unique.
   * Example: 1.0.1
   */
  version: string;

  /**
   * Human readable migration name.
   */
  name: string;

  /**
   * SQL statements to apply migration.
   */
  up: LocalMigrationStatementType[];

  /**
   * SQL statements to rollback migration manually.
   *
   * Normal app startup should NOT run this automatically.
   * Failed migration is already protected by transaction rollback.
   */
  down: LocalMigrationStatementType[];
}
