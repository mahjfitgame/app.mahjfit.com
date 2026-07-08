// file: libs/src/sqlite/driver/electron.ts
import { SqliteDriverType, SqliteQueryMethodType, SqliteQueryType, SqliteResultType, SqliteTransactionType, SqliteSqlType } from "../type";

export class SqliteElectronDriver implements SqliteDriverType {
  public async init(): Promise<void> {
    throw new Error(
      [
        'ElectronSqliteDriver is not implemented yet.',
        'Future options:',
        '1. Use @capacitor-community/sqlite with @capacitor-community/electron.',
        '2. Use better-sqlite3 through Electron preload + IPC.',
      ].join('\n')
    );
  }

  public async execute(
    _sql: SqliteSqlType,
    _params: unknown[],
    _method: SqliteQueryMethodType
  ): Promise<SqliteResultType> {
    throw new Error('ElectronSqliteDriver.execute() is not implemented yet.');
  }

  public async batch(
    _queries: SqliteQueryType[]
  ): Promise<SqliteResultType[]> {
    throw new Error('ElectronSqliteDriver.batch() is not implemented yet.');
  }

  public async transaction<Result>(
    _callback: (tx: SqliteTransactionType) => Promise<Result>
  ): Promise<Result> {
    throw new Error('ElectronSqliteDriver.transaction() is not implemented yet.');
  }
}
