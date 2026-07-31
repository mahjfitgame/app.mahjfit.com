// file: src/app/core/persistent-db/orm/local-db.service.ts

import { Service, inject } from '@angular/core';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

import { SqliteDriverFactory } from './driver/factory';
import { SqliteDriverType, SqliteTransactionType } from './type';
import { SqliteMigrationRunner } from './migration/runner';
import { LogService } from '@libs/log/service';
import { ConfService } from '@libs/conf/service';

@Service()
export class SqliteService {
  private readonly conf = inject(ConfService);
  private readonly log = inject(LogService);

  private readonly driverFactory = inject(SqliteDriverFactory);

  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private driver: SqliteDriverType =
    this.driverFactory.create();

  /**
   * Drizzle instance used by repositories.
   * must be after driver init
   */
  public readonly db = drizzle(
    async (sql: any, params, method) => {
      return this.driver.execute(sql, params, method);
    },
    async (queries) => {
      return this.driver.batch(queries);
    },
    {
      schema: { 
            // keep it black to mantain modular code base structure 
        },
    }
  );

  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!this.initPromise) {
      this.initPromise = this.initializeDriver();
    }

    return this.initPromise;
  }

  private async initializeDriver(): Promise<void> {
    if (
      this.driverFactory.canFallbackToBrowserDriver(this.driver) &&
      !(await this.driverFactory.canAccessOpfsRootDirectory())
    ) {
      this.driver = this.driverFactory.createBrowserFallback();
    }

    try {
      await this.initCurrentDriver();
    } catch (error) {
      if (!this.driverFactory.canFallbackToBrowserDriver(this.driver)) {
        this.initPromise = null;
        throw error;
      }

      console.warn(
        '[SQLITE] OPFS is unavailable. Falling back to Capacitor SQLite IndexedDB driver.',
        error
      );

      this.driver = this.driverFactory.createBrowserFallback();
      await this.initCurrentDriver();
    }

    this.initialized = true;
  }

  private async initCurrentDriver(): Promise<void> {
    await this.driver.init();

    const migrationRunner = new SqliteMigrationRunner(
      this.driver,
      this.conf,
      this.log
    );
    await migrationRunner.run();
  }

  /**
   * Keep this for low-level module migrations.
   * Repositories should use db, not this.
   */
  public getDriver(): SqliteDriverType {
    return this.driver;
  }

  public async transaction<Result>(
    callback: (tx: SqliteTransactionType) => Promise<Result>
  ): Promise<Result> {
    await this.init();

    return this.driver.transaction(callback);
  }
}
