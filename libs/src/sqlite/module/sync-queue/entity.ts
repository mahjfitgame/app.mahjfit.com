// file: libs/src/sqlite/module/sync-queue/entity.ts

import { columnName, indexName, tableName } from '../../utility';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export type SyncQueueColumnNameType =
  | 'id'
  | 'operation'
  | 'payload'
  | 'status'
  | 'retry_count'
  | 'created'
  | 'updated';

export class SyncQueueEntity {
  // table
  public static readonly TABLE: string = tableName('sync_queue');

  // column prefix
  private static readonly COLUMN_PREFIX: string = 'syq_';

  public static columnName(cn: SyncQueueColumnNameType): string {
    return columnName(this.COLUMN_PREFIX, cn);
  }

  // list of fields
  public static ID = this.columnName('id');
  public static OPERATION = this.columnName('operation');
  public static PAYLOAD = this.columnName('payload');
  public static STATUS = this.columnName('status');
  public static RETRY_COUNT = this.columnName('retry_count');
  public static CREATED = this.columnName('created');
  public static UPDATED = this.columnName('updated');

  public static readonly table = sqliteTable(
    this.TABLE,
    {
      id: text(this.columnName('id')).notNull().primaryKey(),

      /**
       * Example:
       * friend.create
       * friend.update
       * profile.update
       * game.invite.create
       */
      operation: text(this.columnName('operation')).notNull(),

      /**
       * JSON payload to send to GraphQL / REST later.
       */
      payload: text(this.columnName('payload')).notNull(),

      /**
       * pending | syncing | failed | done
       */
      status: text(this.columnName('status')).notNull(),

      retryCount: integer(this.columnName('retry_count')).notNull().default(0),

      created: integer(this.columnName('created')).notNull(),
      updated: integer(this.columnName('updated')).notNull(),
    },
    (t) => [
      index(indexName('sync_queue_operation')).on(t.operation),
      index(indexName('sync_queue_status')).on(t.status),
      index(indexName('sync_queue_created')).on(t.created),
    ],
  );
}

export const syncQueueEntity = SyncQueueEntity.table;
export type SyncQueueRow = typeof syncQueueEntity.$inferSelect;
export type SyncQueueInsert = typeof syncQueueEntity.$inferInsert;
