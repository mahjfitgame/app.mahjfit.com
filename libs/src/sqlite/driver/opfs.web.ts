// file: libs/src/sqlite/driver/opfs.web.ts
import { SQLocalDrizzle } from 'sqlocal/drizzle';
import { SqliteDriverType, SqliteQueryMethodType, SqliteQueryType, SqliteResultType, SqliteTransactionType, SqliteSqlType } from '../type';
import { SQLITE_DB_NAME } from '../const';
import { prepareSqliteQuery } from '../utility';

export class SqliteOpfsWebDriver implements SqliteDriverType {
  private sqlocal!: SQLocalDrizzle;

  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.sqlocal = new SQLocalDrizzle({
      databasePath: `${SQLITE_DB_NAME}.db`,

      /**
       * Important:
       * Use our Angular-created worker.
       * Do not let SQLocal use its default internal worker.
       */
      processor: new Worker(
        new URL('../web-worker/sqlocal', import.meta.url),
        {
          type: 'module',
        }
      ),
    });

    this.initialized = true;
  }

  public async execute(
    sql: SqliteSqlType,
    params: unknown[],
    method: SqliteQueryMethodType
  ): Promise<SqliteResultType> {
    await this.init();
    const query = prepareSqliteQuery(sql, params);

    return this.sqlocal.driver(query.sql, query.params, method);
  }

  public async batch(
    queries: SqliteQueryType[]
  ): Promise<SqliteResultType[]> {
    await this.init();

    return this.sqlocal.batchDriver(queries);
  }

  public async transaction<Result>(
    callback: (tx: SqliteTransactionType) => Promise<Result>
  ): Promise<Result> {
    await this.init();

    return this.sqlocal.transaction(async (sqlocalTx) => {
      return callback({
        execute: async (sql, params, method) => {
          const query = prepareSqliteQuery(sql, params);
          const rows = await sqlocalTx.sql<Record<string, unknown>>(
            query.sql,
            ...query.params
          );

          if (method === 'run') {
            return { rows: [] };
          }

          if (method === 'get') {
            const firstRow = rows[0];

            return {
              rows: firstRow ? Object.values(firstRow) : [],
            };
          }

          return {
            rows: rows.map((row) => Object.values(row)),
          };
        },
      });
    });
  }
}
