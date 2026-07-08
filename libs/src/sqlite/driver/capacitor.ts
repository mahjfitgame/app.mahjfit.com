// file: libs/src/sqlite/driver/capacitor.ts

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { defineCustomElements as defineJeepSqliteCustomElements } from 'jeep-sqlite/loader';
import { Capacitor } from '@capacitor/core';
import {
  SqliteDriverType,
  SqliteQueryMethodType,
  SqliteQueryType,
  SqliteResultType,
  SqliteTransactionType,
  SqliteSqlType,
} from '../type';
import { SQLITE_DB_NAME, SQLITE_JEEP_WASM_PATH } from '../const';
import { prepareSqliteQuery } from '../utility';

export class SqliteCapacitorDriver implements SqliteDriverType {
  private readonly sqlite = new SQLiteConnection(CapacitorSQLite);

  private db: SQLiteDBConnection | null = null;
  private initPromise: Promise<void> | null = null;
  private webStoreInitialized = false;

  public async init(): Promise<void> {
    if (this.db) {
      return;
    }

    this.initPromise ??= this.initializeConnection();

    try {
      await this.initPromise;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  private async initializeConnection(): Promise<void> {
    const dbName = SQLITE_DB_NAME;

    await this.initWebStore();

    const db = await this.getOrCreateConnection(dbName);
    await db.open();

    this.db = db;
  }

  private async getOrCreateConnection(dbName: string): Promise<SQLiteDBConnection> {
    try {
      /**
       * If this JS SQLiteConnection wrapper already owns the connection, reuse it.
       * This protects repeated init calls in the same app runtime.
       */
      return await this.sqlite.retrieveConnection(dbName, false);
    } catch {
      // No reusable JS connection is registered for this runtime; create it below.
    }

    try {
      return await this.sqlite.createConnection(dbName, false, 'no-encryption', 1, false);
    } catch (error) {
      if (!this.isConnectionAlreadyExistsError(error)) {
        throw error;
      }

      return this.recreateStaleConnection(dbName);
    }
  }

  private async recreateStaleConnection(dbName: string): Promise<SQLiteDBConnection> {
    /**
     * iOS/Android can keep a native connection after the web runtime reloads,
     * while the new JS SQLiteConnection wrapper has an empty connection map.
     * retrieveConnection cannot see that native-only connection, so close the
     * stale handle and create a fresh wrapper/native pair. This closes only the
     * connection, not the database or the IndexedDB/native stored data.
     */
    try {
      await this.sqlite.closeConnection(dbName, false);
    } catch {
      // If the stale connection is already gone, retry createConnection below.
    }

    return this.sqlite.createConnection(dbName, false, 'no-encryption', 1, false);
  }

  private isConnectionAlreadyExistsError(error: unknown): boolean {
    const message = String(error).toLowerCase();

    return message.includes('connection') && message.includes('already exists');
  }

  private async initWebStore(): Promise<void> {
    if (Capacitor.getPlatform() !== 'web' || this.webStoreInitialized) {
      return;
    }

    await this.ensureJeepSqliteElement();
    await this.sqlite.initWebStore();

    this.webStoreInitialized = true;
  }

  private async ensureJeepSqliteElement(): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('[SQLite] jeep-sqlite cannot be initialized outside browser.');
    }

    defineJeepSqliteCustomElements(window);

    let jeepSqliteElement = document.querySelector<HTMLElement & { wasmPath?: string }>('jeep-sqlite');

    if (!jeepSqliteElement) {
      jeepSqliteElement = document.createElement('jeep-sqlite') as HTMLElement & { wasmPath?: string };
      jeepSqliteElement.setAttribute('style', 'display: none;');
      jeepSqliteElement.wasmPath = SQLITE_JEEP_WASM_PATH;
      document.body.appendChild(jeepSqliteElement);
    } else {
      jeepSqliteElement.wasmPath = jeepSqliteElement.wasmPath || SQLITE_JEEP_WASM_PATH;
    }

    await customElements.whenDefined('jeep-sqlite');
  }

  public async execute(
    sql: SqliteSqlType,
    params: unknown[],
    method: SqliteQueryMethodType,
  ): Promise<SqliteResultType> {
    await this.init();
    const query = prepareSqliteQuery(sql, params);

    return this.executeOnOpenDb(query.sql, query.params, method, true);
  }

  private async executeOnOpenDb(
    sql: string,
    params: unknown[],
    method: SqliteQueryMethodType,
    useImplicitTransaction: boolean,
  ): Promise<SqliteResultType> {
    const db = this.requireDb();

    if (method === 'run') {
      await db.run(sql, params, useImplicitTransaction);

      if (useImplicitTransaction) {
        await this.persistWebStore();
      }

      return { rows: [] };
    }

    const result = await db.query(sql, params);
    const values = result.values ?? [];

    if (method === 'get') {
      if (values.length === 0) {
        return { rows: [] };
      }

      return {
        rows: Object.values(values[0]),
      };
    }

    return {
      rows: values.map((row) => Object.values(row)),
    };
  }

  public async batch(queries: SqliteQueryType[]): Promise<SqliteResultType[]> {
    await this.init();

    const results: SqliteResultType[] = [];

    /**
     * Keep strict order.
     * Migrations and sync batches must not run out of order.
     */
    let i = 0;

    while (i < queries.length) {
      const query = queries[i];

      results.push(await this.execute(query.sql, query.params, query.method));

      i++;
    }

    return results;
  }

  public async transaction<Result>(
    callback: (tx: SqliteTransactionType) => Promise<Result>,
  ): Promise<Result> {
    await this.init();
    await this.executeOnOpenDb('BEGIN TRANSACTION', [], 'run', false);

    try {
      const result = await callback({
        execute: (sql, params, method) => {
          const query = prepareSqliteQuery(sql, params);

          return this.executeOnOpenDb(query.sql, query.params, method, false);
        },
      });

      await this.executeOnOpenDb('COMMIT', [], 'run', false);
      await this.persistWebStore();

      return result;
    } catch (error) {
      await this.executeOnOpenDb('ROLLBACK', [], 'run', false);
      throw error;
    }
  }

  private requireDb(): SQLiteDBConnection {
    if (!this.db) {
      throw new Error('[SQLite] Database connection is not initialized.');
    }

    return this.db;
  }

  private async persistWebStore(): Promise<void> {
    if (Capacitor.getPlatform() !== 'web') {
      return;
    }

    await this.sqlite.saveToStore(SQLITE_DB_NAME);
  }
}
