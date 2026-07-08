// file: libs/src/sqlite/module/app-state/entity.ts

import { columnName, tableName } from '../../utility';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export type AppStateColumnNameType =
  | 'key'
  | 'value'
  | 'updated';

export class AppStateEntity {
  // table
  public static readonly TABLE: string = tableName('app_state');

  // column prefix
  private static readonly COLUMN_PREFIX: string = 'as_';

  public static columnName(cn: AppStateColumnNameType): string {
    return columnName(this.COLUMN_PREFIX, cn);
  }

  // list of fields
  public static KEY = this.columnName('key');
  public static VALUE = this.columnName('value');
  public static UPDATED = this.columnName('updated');

  public static readonly table = sqliteTable(
    this.TABLE,
    {
      key: text(this.columnName('key')).notNull().primaryKey(),

      value: text(this.columnName('value')).notNull(),

      updated: integer(this.columnName('updated')).notNull(),
    },
  );
}

export const appStateEntity = AppStateEntity.table;
export type AppStateRow = typeof appStateEntity.$inferSelect;
export type AppStateInsert = typeof appStateEntity.$inferInsert;
