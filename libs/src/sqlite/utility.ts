// file: libs/src/sqlite/utility.ts
import { SQL } from 'drizzle-orm';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import { SqlitePreparedQuery, SqliteSqlType } from './type';
import { SQLITE_CHECK_PREFIX, SQLITE_FOREIGN_KEY_PREFIX, SQLITE_INDEX_PREFIX, SQLITE_TABLE_PREFIX, SQLITE_UNIQUE_INDEX_PREFIX } from "./const";

export function tableName(name: string): string {
    return `${SQLITE_TABLE_PREFIX}${name}`;
}
export function columnName(prefix: string, name: string): string {
    return `${prefix}${name}`;
}
export function foreignKeyName(name: string): string {
    return `${SQLITE_FOREIGN_KEY_PREFIX}${name}`;
}
export function indexName(name: string): string {
    return `${SQLITE_INDEX_PREFIX}${name}`;
}
export function uniqueIndexName(name: string): string {
    return `${SQLITE_UNIQUE_INDEX_PREFIX}${name}`;
}
export function checkName(name: string): string {
    return `${SQLITE_CHECK_PREFIX}${name}`;
}

const sqliteDialect = new SQLiteSyncDialect();
export function prepareSqliteQuery(
    sqlValue: SqliteSqlType,
    params: unknown[] = []
): SqlitePreparedQuery {
    if (typeof sqlValue === 'string') {
        return {
            sql: sqlValue,
            params,
        };
    }

    const query = sqliteDialect.sqlToQuery(sqlValue as SQL<unknown>);

    return {
        sql: query.sql,
        params: [...query.params, ...params],
    };
}
