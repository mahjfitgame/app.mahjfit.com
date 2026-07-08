// file: libs/src/sqlite/module/app-state/repository.ts

import { inject, Service } from '@angular/core';
import { eq } from 'drizzle-orm';
import { SqliteService } from '@libs/sqlite/service';
import { SqliteResultType, SqliteTransactionType } from '@libs/sqlite/type';
import { appStateEntity, AppStateEntity } from './entity';
import { AppStateKeyValueDto } from './dto';

export class _AppStateRepository {
  public constructor(
    private readonly driver: SqliteTransactionType
  ) {}

  public async createTableIfNotExists(): Promise<void> {
    await this.driver.execute(
      `
      CREATE TABLE IF NOT EXISTS ${AppStateEntity.TABLE} (
        ${AppStateEntity.KEY} TEXT PRIMARY KEY NOT NULL,
        ${AppStateEntity.VALUE} TEXT NOT NULL,
        ${AppStateEntity.UPDATED} INTEGER NOT NULL
      )
      `,
      [],
      'run'
    );
  }

  public async getValue<T>(key: string): Promise<T | null> {
    const result = await this.driver.execute(
      `
      SELECT ${AppStateEntity.VALUE}
      FROM ${AppStateEntity.TABLE}
      WHERE ${AppStateEntity.KEY} = ?
      LIMIT 1
      `,
      [key],
      'get'
    );

    return this.parseValue<T>(this.getFirstColumnAsString(result));
  }

  public async setValue<T>(key: string, value: T): Promise<void> {
    await this.driver.execute(
      `
      INSERT INTO ${AppStateEntity.TABLE} (
        ${AppStateEntity.KEY},
        ${AppStateEntity.VALUE},
        ${AppStateEntity.UPDATED}
      )
      VALUES (?, ?, ?)
      ON CONFLICT(${AppStateEntity.KEY})
      DO UPDATE SET
        ${AppStateEntity.VALUE} = excluded.${AppStateEntity.VALUE},
        ${AppStateEntity.UPDATED} = excluded.${AppStateEntity.UPDATED}
      `,
      [key, JSON.stringify(value), Date.now()],
      'run'
    );
  }

  public async deleteKey(key: string): Promise<void> {
    await this.driver.execute(
      `
      DELETE FROM ${AppStateEntity.TABLE}
      WHERE ${AppStateEntity.KEY} = ?
      `,
      [key],
      'run'
    );
  }

  private parseValue<T>(value: string | null): T | null {
    if (value === null) {
      return null;
    }

    return JSON.parse(value) as T;
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
}

@Service()
export class AppStateRepository {
  private readonly sqlite = inject(SqliteService);

  public async getValue<T>(key: string): Promise<T | null> {
    const results = await this.sqlite.db
      .select({
        value: appStateEntity.value,
      })
      .from(appStateEntity)
      .where(eq(appStateEntity.key, key))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    return JSON.parse(results[0].value) as T;
  }

  public async setValue<T>(key: string, value: T): Promise<void> {
    const now = Date.now();
    const state: AppStateKeyValueDto<T> = {
      key,
      value,
    };

    await this.sqlite.db
      .insert(appStateEntity)
      .values({
        key: state.key,
        value: JSON.stringify(state.value),
        updated: now,
      })
      .onConflictDoUpdate({
        target: appStateEntity.key,
        set: {
          value: JSON.stringify(state.value),
          updated: now,
        },
      });
  }

  public async deleteKey(key: string): Promise<void> {
    await this.sqlite.db
      .delete(appStateEntity)
      .where(eq(appStateEntity.key, key));
  }
}
