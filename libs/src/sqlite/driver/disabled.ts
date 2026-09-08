import {
  SqliteDriverType,
  SqliteQueryMethodType,
  SqliteQueryType,
  SqliteResultType,
  SqliteSqlType,
  SqliteTransactionType,
} from '../type';
import {
  LOCAL_DB_DISABLED_ACCESS_MESSAGE,
  LOCAL_DB_DISABLED_LOG_MESSAGE,
} from '../const';
import { LogService } from '@libs/log/service';

export class SqliteDisabledDriver implements SqliteDriverType {
  private initialized = false;

  public constructor(private readonly log: LogService) {}

  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.log.info(LOCAL_DB_DISABLED_LOG_MESSAGE);
  }

  public async execute(
    _sql: SqliteSqlType,
    _params: unknown[],
    _method: SqliteQueryMethodType,
  ): Promise<SqliteResultType> {
    this.log.info(LOCAL_DB_DISABLED_ACCESS_MESSAGE);

    return { rows: [] };
  }

  public async batch(
    queries: SqliteQueryType[],
  ): Promise<SqliteResultType[]> {
    this.log.info(LOCAL_DB_DISABLED_ACCESS_MESSAGE);

    return queries.map(() => ({ rows: [] }));
  }

  public async transaction<Result>(
    callback: (tx: SqliteTransactionType) => Promise<Result>,
  ): Promise<Result> {
    this.log.info(LOCAL_DB_DISABLED_ACCESS_MESSAGE);

    return callback({
      execute: async () => ({ rows: [] }),
    });
  }
}
