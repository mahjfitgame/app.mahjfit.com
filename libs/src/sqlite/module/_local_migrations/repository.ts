// file: libs/src/sqlite/module/_local_migrations/repository.ts

import { inject, Service } from "@angular/core";
import { eq } from "drizzle-orm";
import { SqliteService } from "@libs/sqlite/service";
import { SqliteResultType, SqliteTransactionType } from "@libs/sqlite/type";
import { localMigrationsEntity, LocalMigrationsEntity } from "./entity";
import { LocalMigrationsCreateInputDto } from "./dto";

export class _LocalMigrationsRepository {
  public constructor(
    private readonly driver: SqliteTransactionType
  ) {}

  public async createTableIfNotExists(): Promise<void> {
    await this.driver.execute(
      `
      CREATE TABLE IF NOT EXISTS ${LocalMigrationsEntity.TABLE} (
        ${LocalMigrationsEntity.VERSION} TEXT PRIMARY KEY NOT NULL,
        ${LocalMigrationsEntity.NAME} TEXT NOT NULL,
        ${LocalMigrationsEntity.EXECUTED} INTEGER NOT NULL,
        ${LocalMigrationsEntity.SQL_UP} TEXT,
        ${LocalMigrationsEntity.SQL_DOWN} TEXT,
        ${LocalMigrationsEntity.CHECKSUM} TEXT,
        ${LocalMigrationsEntity.STATUS} TEXT NOT NULL
      )
      `,
      [],
      'run'
    );
  }

  public async exists(version: string): Promise<boolean> {
    const result = await this.driver.execute(
      `
      SELECT ${LocalMigrationsEntity.VERSION}
      FROM ${LocalMigrationsEntity.TABLE}
      WHERE ${LocalMigrationsEntity.VERSION} = ?
      LIMIT 1
      `,
      [version],
      'get'
    );

    const value = this.getFirstColumn(result);

    return typeof value === 'string' && value.length > 0;
  }

  public async insert(input: LocalMigrationsCreateInputDto): Promise<void> {
    await this.driver.execute(
      `
      INSERT INTO ${LocalMigrationsEntity.TABLE} (
        ${LocalMigrationsEntity.VERSION},
        ${LocalMigrationsEntity.NAME},
        ${LocalMigrationsEntity.EXECUTED},
        ${LocalMigrationsEntity.SQL_UP},
        ${LocalMigrationsEntity.SQL_DOWN},
        ${LocalMigrationsEntity.CHECKSUM},
        ${LocalMigrationsEntity.STATUS}
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      this.toInsertParams(input),
      'run'
    );
  }

  public async insertOrIgnore(input: LocalMigrationsCreateInputDto): Promise<void> {
    await this.driver.execute(
      `
      INSERT OR IGNORE INTO ${LocalMigrationsEntity.TABLE} (
        ${LocalMigrationsEntity.VERSION},
        ${LocalMigrationsEntity.NAME},
        ${LocalMigrationsEntity.EXECUTED},
        ${LocalMigrationsEntity.SQL_UP},
        ${LocalMigrationsEntity.SQL_DOWN},
        ${LocalMigrationsEntity.CHECKSUM},
        ${LocalMigrationsEntity.STATUS}
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      this.toInsertParams(input),
      'run'
    );
  }

  private toInsertParams(input: LocalMigrationsCreateInputDto): unknown[] {
    return [
      input.version,
      input.name,
      Date.now(),
      JSON.stringify(input.sql_up),
      JSON.stringify(input.sql_down),
      input.checksum,
      input.status,
    ];
  }

  private getFirstColumn(result: SqliteResultType): unknown {
    const rows = result.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    const first = rows[0];

    if (Array.isArray(first)) {
      return first.length > 0 ? first[0] : null;
    }

    if (first && typeof first === 'object') {
      const values = Object.values(first);
      return values.length > 0 ? values[0] : null;
    }

    return first;
  }
}

@Service()
export class LocalMigrationsRepository {
  private readonly sqlite = inject(SqliteService);

  public async exists(version: string): Promise<boolean> {
    const results = await this.sqlite.db
      .select({
        version: localMigrationsEntity.version,
      })
      .from(localMigrationsEntity)
      .where(eq(localMigrationsEntity.version, version))
      .limit(1);

    return results.length > 0;
  }

  public async insert(input: LocalMigrationsCreateInputDto): Promise<void> {
    await this.sqlite.db
      .insert(localMigrationsEntity)
      .values(this.toInsertValue(input));
  }

  public async insertOrIgnore(input: LocalMigrationsCreateInputDto): Promise<void> {
    await this.sqlite.db
      .insert(localMigrationsEntity)
      .values(this.toInsertValue(input))
      .onConflictDoNothing({
        target: localMigrationsEntity.version,
      });
  }

  private toInsertValue(input: LocalMigrationsCreateInputDto) {
    return {
      version: input.version,
      name: input.name,
      executed: Date.now(),
      sqlUp: JSON.stringify(input.sql_up),
      sqlDown: JSON.stringify(input.sql_down),
      checksum: input.checksum,
      status: input.status,
    };
  }
}
