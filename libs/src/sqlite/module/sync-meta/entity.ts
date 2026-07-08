// file: libs/src/sqlite/module/sync-meta/entity.ts

import { columnName, indexName, tableName } from '../../utility';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export type SyncMetaColumnNameType =
  | 'key'
  | 'bootstrap_done'
  | 'last_pulled'
  | 'cursor'
  | 'updated';

export class SyncMetaEntity {
  // table
  public static readonly TABLE: string = tableName('sync_meta');

  // column prefix
  private static readonly COLUMN_PREFIX: string = 'sym_';

  public static columnName(cn: SyncMetaColumnNameType): string {
    return columnName(this.COLUMN_PREFIX, cn);
  }

  // list of fields
  public static KEY = this.columnName('key');
  public static BOOTSTRAP_DONE = this.columnName('bootstrap_done');
  public static LAST_PULLED = this.columnName('last_pulled');
  public static CURSOR = this.columnName('cursor');
  public static UPDATED = this.columnName('updated');

  public static readonly table = sqliteTable(
    this.TABLE,
    {
      key: text(this.columnName('key')).notNull().primaryKey(),

      /**
       * 0 = first bootstrap not done
       * 1 = first bootstrap done
       */
      bootstrapDone: integer(this.columnName('bootstrap_done')).notNull().default(0),

      /**
       * Last successful pull from API.
       */
      lastPulled: integer(this.columnName('last_pulled')).notNull().default(0),

      /**
       * Optional API cursor for incremental sync.
       */
      cursor: text(this.columnName('cursor')),

      updated: integer(this.columnName('updated')).notNull(),
    },
    (t) => [
      index(indexName('sync_meta_last_pulled')).on(t.lastPulled),
    ],
  );
}

export const syncMetaEntity = SyncMetaEntity.table;
export type SyncMetaRow = typeof syncMetaEntity.$inferSelect;
export type SyncMetaInsert = typeof syncMetaEntity.$inferInsert;
