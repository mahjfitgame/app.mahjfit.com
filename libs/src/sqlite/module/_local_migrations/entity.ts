// file: libs/src/sqlite/module/_local_migrations/entity.ts

import { columnName, indexName } from '../../utility';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export type LocalMigrationsColumnNameType =
  | 'version'
  | 'name'
  | 'executed'
  | 'sql_up'
  | 'sql_down'
  | 'checksum'
  | 'status';

export class LocalMigrationsEntity {
  // table
  public static readonly TABLE: string = '_local_migrations';

  // column prefix
  private static readonly COLUMN_PREFIX: string = 'lm_';

  public static columnName(cn: LocalMigrationsColumnNameType): string {
    return columnName(this.COLUMN_PREFIX, cn);
  }

  // list of fields
  public static VERSION = this.columnName('version');
  public static NAME = this.columnName('name');
  public static EXECUTED = this.columnName('executed');
  public static SQL_UP = this.columnName('sql_up');
  public static SQL_DOWN = this.columnName('sql_down');
  public static CHECKSUM = this.columnName('checksum');
  public static STATUS = this.columnName('status');

  public static readonly table = sqliteTable(
    this.TABLE,
    {
      version: text(this.columnName('version')).notNull().primaryKey(),

      name: text(this.columnName('name')).notNull(),

      /**
       * Timestamp in milliseconds.
       */
      executed: integer(this.columnName('executed')).notNull(),

      /**
       * JSON string of migration up SQL statements.
       */
      sqlUp: text(this.columnName('sql_up')),

      /**
       * JSON string of migration down SQL statements.
       */
      sqlDown: text(this.columnName('sql_down')),

      /**
       * Checksum of migration up SQL.
       */
      checksum: text(this.columnName('checksum')),

      /**
       * applied | baseline | rolled_back
       */
      status: text(this.columnName('status')).notNull(),
    },
    (t) => [
      index(indexName('_local_migrations_executed')).on(t.executed),
      index(indexName('_local_migrations_status')).on(t.status),
    ],
  );
}

export const localMigrationsEntity = LocalMigrationsEntity.table;
export type LocalMigrationsRow = typeof localMigrationsEntity.$inferSelect;
export type LocalMigrationsInsert = typeof localMigrationsEntity.$inferInsert;
