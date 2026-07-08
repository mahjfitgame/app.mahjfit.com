// file: libs/src/sqlite-db/driver/type.ts
import { SQL } from "drizzle-orm";
export type SqliteQueryMethodType = 'run' | 'all' | 'get' | 'values';
export type SqliteSqlType = string | SQL<unknown>;

export interface SqliteQueryType {
  sql: string;
  params: unknown[];
  method: SqliteQueryMethodType;
}


export interface SqliteResultType {
  /**
   * Drizzle sqlite-proxy expects:
   * - method === 'get'    -> rows as a single row array
   * - other methods       -> rows as array of row arrays
   */
  rows: unknown[] | unknown[][];
}

export interface SqliteTransactionType {
  execute(
    sql: SqliteSqlType,
    params: unknown[],
    method: SqliteQueryMethodType
  ): Promise<SqliteResultType>;
}

export interface SqliteDriverType {
  init(): Promise<void>;

  execute(
    sql: SqliteSqlType,
    params: unknown[],
    method: SqliteQueryMethodType
  ): Promise<SqliteResultType>;

  batch(queries: SqliteQueryType[]): Promise<SqliteResultType[]>;

  transaction<Result>(
    callback: (tx: SqliteTransactionType) => Promise<Result>
  ): Promise<Result>;
}

export interface SqliteWebWorkerType {
  init(): Promise<void>;

  execute(
    sql: SqliteSqlType,
    params: unknown[],
    method: SqliteQueryMethodType
  ): Promise<SqliteResultType>;

  batch(queries: SqliteQueryType[]): Promise<SqliteResultType[]>;

  transaction(queries: SqliteQueryType[]): Promise<SqliteResultType[]>;
}

export interface SqlitePreparedQuery {
  sql: string;
  params: unknown[];
}