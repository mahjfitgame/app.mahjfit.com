// file: libs/src/sqlite/migration/runner.ts

import { SqliteDriverType, SqlitePreparedQuery } from "../type";
import { LocalMigrationStatusEnum } from "../module/_local_migrations/enum";
import { _LocalMigrationsRepository } from "../module/_local_migrations/repository";
import { LocalMigrationStatementType, LocalMigrationType } from "../module/_local_migrations/type";
import { _AppConfigRepository } from "../module/app-config/repository";
import { SQLITE_CURRENT_DB_VERSION_CONFIG_KEY, SQLITE_CURRENT_DB_VERSION } from "./version";
import { LOCAL_MIGRATION_REGISTRY } from "./registry";
import { prepareSqliteQuery } from "../utility";
import { _AppStateRepository } from "../module/app-state/repository";
import { sql } from "drizzle-orm";
import { LogService } from "@libs/log/service";
import { inject } from "@angular/core";
import { ConfService } from "@libs/conf/service";

export class SqliteMigrationRunner {
  private readonly appConfigRepository: _AppConfigRepository;
  private readonly localMigrationsRepository: _LocalMigrationsRepository;
  private readonly appStateRepository: _AppStateRepository;

  public constructor(
    private readonly driver: SqliteDriverType,
    private readonly conf: ConfService,
    private readonly log: LogService,
  ) {
    this.appConfigRepository = new _AppConfigRepository(this.driver);
    this.localMigrationsRepository = new _LocalMigrationsRepository(this.driver);
    this.appStateRepository = new _AppStateRepository(this.driver);
  }

  public async run(): Promise<void> {
    this.log.info('[SQLITE MIGRATION] Start:'+ Date.now());
    const hasConfigTable =
      await this.tableExists('te_app_config');

      // setup new db fresh proces
    if (!hasConfigTable) {
      await this.runFreshInstall();
      return;
    }

    // db is already found for process any upgrades
    await this.runUpgradeMigrations();
    this.log.info('[SQLITE MIGRATION] End:'+ Date.now());
  }

  private async runFreshInstall(): Promise<void> {
    this.log.info('[SQLITE MIGRATION] No db found, running fresh install.');
    const schemaSql = await this.loadSchemaSql();
    const statements = this.splitSqlStatements(schemaSql);

    await this.driver.transaction(async (tx) => {
      const txAppConfigRepo = new _AppConfigRepository(tx);

      let i = 0;

      while (i < statements.length) {
        const statement = statements[i];

        if (statement.length > 0) {
          await tx.execute(statement, [], 'run');
        }

        i++;
      }

      await txAppConfigRepo.setKeyValue(
        SQLITE_CURRENT_DB_VERSION_CONFIG_KEY,
        SQLITE_CURRENT_DB_VERSION
      );
    });
    this.log.info('[SQLITE MIGRATION] Fresh install completed.');
  }

  private async runUpgradeMigrations(): Promise<void> {
    this.log.info('[SQLITE MIGRATION] Previous db found, running upgrade migration.');
    await this.ensureSystemTables();

    const storedDbVersion =
      await this.getStoredDbVersion();

    const migrations = [...LOCAL_MIGRATION_REGISTRY].sort((a, b) => {
      return this.compareVersion(a.version, b.version);
    });

    let activeDbVersion = storedDbVersion;

    let i = 0;

    while (i < migrations.length) {
      const migration = migrations[i];

      const isNewerThanStored =
        this.compareVersion(migration.version, storedDbVersion) > 0;
      const isSupportedMigration =
        this.compareVersion(
          migration.version,
          SQLITE_CURRENT_DB_VERSION
        ) <= 0;

      if (isNewerThanStored && isSupportedMigration) {
        const alreadyExecuted =
          await this.localMigrationsRepository.exists(migration.version);

        if (!alreadyExecuted) {
          await this.runOneMigration(migration);
        }

        activeDbVersion = migration.version;
      }

      i++;
    }

    /**
     * Save final active DB version.
     */
    await this.appConfigRepository.setKeyValue(
      SQLITE_CURRENT_DB_VERSION_CONFIG_KEY,
      activeDbVersion
    );

    this.log.info('[SQLITE MIGRATION] Upgrade migrations completed.');
  }

  private async runOneMigration(
    migration: LocalMigrationType
  ): Promise<void> {
    await this.driver.transaction(async (tx) => {
      const txAppConfigRepo = new _AppConfigRepository(tx);
      const txLocalMigrationsRepo =
        new _LocalMigrationsRepository(tx);

      let i = 0;

      while (i < migration.up.length) {
        const statement = migration.up[i];
        const query = this.prepareMigrationStatement(statement);

        if (query.sql.trim().length > 0) {
          await tx.execute(query.sql, query.params, 'run');
        }

        i++;
      }

      const sqlUp = migration.up.map((item) => {
        return this.prepareMigrationStatement(item).sql;
      });
      const sqlDown = migration.down.map((item) => {
        return this.prepareMigrationStatement(item).sql;
      });

      await txLocalMigrationsRepo.insert({
        version: migration.version,
        name: migration.name,
        sql_up: sqlUp,
        sql_down: sqlDown,
        checksum: this.createSimpleChecksum(sqlUp.join('\n')),
        status: LocalMigrationStatusEnum.APPLIED,
      });

      /**
       * Version is updated only after migration SQL succeeds.
       * Transaction protects this.
       */
      await txAppConfigRepo.setKeyValue(
        SQLITE_CURRENT_DB_VERSION_CONFIG_KEY,
        migration.version
      );
    });
  }

  private async ensureSystemTables(): Promise<void> {
    await this.appConfigRepository.createTableIfNotExists();
    await this.localMigrationsRepository.createTableIfNotExists();
    await this.appStateRepository.createTableIfNotExists();
  }

  private prepareMigrationStatement(
    statement: LocalMigrationStatementType
  ): SqlitePreparedQuery {
    if (
      typeof statement === 'object' &&
      statement !== null &&
      'sql' in statement
    ) {
      return prepareSqliteQuery(statement.sql, statement.params ?? []);
    }

    return prepareSqliteQuery(statement);
  }

  private async getStoredDbVersion(): Promise<string> {
    return await this.appConfigRepository.getCurrentSqliteDbVersion();
  }

  private async tableExists(tableName: string): Promise<boolean> {
    const result = await this.driver.execute(
      `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
      LIMIT 1
      `,
      [tableName],
      'get'
    );

    return Array.isArray(result.rows) && result.rows.length > 0;
  }

  private async loadSchemaSql(): Promise<string> {
    const response = await fetch('/db/schema.sql');

    if (!response.ok) {
      throw new Error('Failed to load /db/schema.sql');
    }

    return response.text();
  }

  private splitSqlStatements(sql: string): string[] {
    return sql
      .replace(/--.*$/gm, '')
      .split(';')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private compareVersion(a: string, b: string): number {
    const left = a.split('.').map((item) => Number(item));
    const right = b.split('.').map((item) => Number(item));

    let i = 0;

    while (i < 3) {
      const l = left[i] ?? 0;
      const r = right[i] ?? 0;

      if (l > r) {
        return 1;
      }

      if (l < r) {
        return -1;
      }

      i++;
    }

    return 0;
  }

  private createSimpleChecksum(value: string): string {
    let hash = 0;
    let i = 0;

    while (i < value.length) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
      i++;
    }

    return String(hash);
  }
}
