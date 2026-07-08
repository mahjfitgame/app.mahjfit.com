// file: libs/src/sqlite/module/app-config/repository.ts

import { inject, Service } from "@angular/core";
import { SQLITE_CURRENT_DB_VERSION_CONFIG_KEY } from "../../migration/version";
import { SqliteResultType, SqliteTransactionType } from "../../type";
import { SqliteService } from "@libs/sqlite/service";
import { appConfigEntity, AppConfigEntity } from "./entity";
import { sql, eq } from 'drizzle-orm';
import { AppConfigKeyValueDto } from "./dto";

export class _AppConfigRepository {
  public constructor(
    private readonly driver: SqliteTransactionType
  ) {}

  public async createTableIfNotExists(): Promise<void> {
    await this.driver.execute(
      `
      CREATE TABLE IF NOT EXISTS ${AppConfigEntity.TABLE} (
        ${AppConfigEntity.KEY} TEXT PRIMARY KEY NOT NULL,
        ${AppConfigEntity.VALUE} TEXT NOT NULL,
        ${AppConfigEntity.UPDATED} INTEGER NOT NULL
      )
      `,
      [],
      'run'
    );
  }

  public async getValue(key: string): Promise<string | null> {
    const result = await this.driver.execute(
      `
      SELECT ${AppConfigEntity.VALUE}
      FROM ${AppConfigEntity.TABLE}
      WHERE ${AppConfigEntity.KEY} = ?
      LIMIT 1
      `,
      [key],
      'get'
    );

    return this.getFirstColumnAsString(result);
  }

  public async setKeyValue(key: string, value: string): Promise<void> {
    await this.driver.execute(
      `
      INSERT INTO ${AppConfigEntity.TABLE} (
        ${AppConfigEntity.KEY},
        ${AppConfigEntity.VALUE},
        ${AppConfigEntity.UPDATED}
      )
      VALUES (?, ?, ?)
      ON CONFLICT(${AppConfigEntity.KEY})
      DO UPDATE SET
        ${AppConfigEntity.VALUE} = excluded.${AppConfigEntity.VALUE},
        ${AppConfigEntity.UPDATED} = excluded.${AppConfigEntity.UPDATED}
      `,
      [key, value, Date.now()],
      'run'
    );
  }

  private getFirstColumnAsString(
    result: SqliteResultType
  ): string | null {
    const value = this.getFirstColumn(result);

    if (typeof value !== 'string') {
      return null;
    }

    return value;
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
  public async getCurrentSqliteDbVersion(): Promise<string> {
    const value = await this.getValue(SQLITE_CURRENT_DB_VERSION_CONFIG_KEY);

    if (!value) {
      return '0.0.0';
    }

    return value;
  }
}

@Service()
export class AppConfigRepository {
  private readonly sqlite = inject(SqliteService);

  public async getValue(key: string): Promise<string | null> {
    const results = await this.sqlite.db
      .select({ 
        // Maps the DB column 'conf_value' to a clean 'value' key in the response
        value: appConfigEntity.value 
      })
      .from(appConfigEntity)
      .where(eq(appConfigEntity.key, key))
      .limit(1);

    // Drizzle returns an array of matching rows, or an empty array if nothing matches
    if (results.length === 0) {
      return null;
    }

    return results[0].value;
  }

  public async setValue<T>(key: string, value: T): Promise<void> {
    const now = Date.now();
    const state: AppConfigKeyValueDto<T> = {
      key,
      value,
    };

    await this.sqlite.db
      .insert(appConfigEntity)
      .values({
        key: state.key,
        value: JSON.stringify(state.value),
        updated: now,
      })
      .onConflictDoUpdate({
        target: appConfigEntity.key,
        set: {
          value: JSON.stringify(state.value),
          updated: now,
        },
      });
  }

  public async getCurrentSqliteDbVersion(): Promise<string> {
    const value = await this.getValue(SQLITE_CURRENT_DB_VERSION_CONFIG_KEY);

    if (!value) {
      return '0.0.0';
    }

    return value;
  }

  
}
