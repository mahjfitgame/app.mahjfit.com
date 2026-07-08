// file: libs/src/sqlite/module/app-config/entity.ts

import { columnName, indexName, tableName } from '../../utility';
import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

export type AppConfigColumnNameType =
  | 'key'
  | 'value'
  | 'updated';

export class AppConfigEntity {
  // table
  public static readonly TABLE: string = tableName('app_config');

  // column prefix
  private static readonly COLUMN_PREFIX: string = 'conf_';

  public static columnName(cn: AppConfigColumnNameType): string {
    return columnName(this.COLUMN_PREFIX, cn);
  }

  // list of fields
  public static KEY = this.columnName('key');
  public static VALUE = this.columnName('value');
  public static UPDATED = this.columnName('updated');

  public static readonly table = sqliteTable(
    this.TABLE,
    {
      key: text(this.columnName('key')).notNull().primaryKey(),//need to set foreign key here like [.references(() => userEntity.id)]

      value: text(this.columnName('value')).notNull(),

      updated: integer(this.columnName('updated')).notNull(),
    },
    (t) => [
      index(indexName('app_config_updated')).on(t.updated),
      // indexes only for real query patterns
      // unique only for real business rules
      // check only for important database-level validation
      // foreignKey only when relation integrity matters
      
      /*
      // table level foreign key
      foreignKey({
        columns: [t.userId],
        foreignColumns: [userEntity.id],
        name: 'fk_config_user',
      }),
      */

     /*
     // database-level validation.
     check('chk_app_config_updated_positive', sql`${t.updated} > 0`)
     */
    ],
  );
}

export const appConfigEntity = AppConfigEntity.table;
export type AppConfigRow = typeof appConfigEntity.$inferSelect;
export type AppConfigInsert = typeof appConfigEntity.$inferInsert;