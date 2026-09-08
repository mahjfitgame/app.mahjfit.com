// file: libs/src/sqlite/driver/factory.ts

import { Service, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { SqliteDriverType } from '../type';
import { SqliteCapacitorDriver } from './capacitor';
import { SqliteDisabledDriver } from './disabled';
import { SqliteElectronDriver } from './electron';
import { SqliteOpfsWebDriver } from './opfs.web';

@Service()
export class SqliteDriverFactory {
  private readonly conf = inject(ConfService);
  private readonly log = inject(LogService);

  public create(): SqliteDriverType {
    if (!this.conf.enableLocalDb) {
      return new SqliteDisabledDriver(this.log);
    }

    const platform = Capacitor.getPlatform();

    if (platform === 'ios' || platform === 'android') {
      return new SqliteCapacitorDriver();
    }

    /**
     * If you later add @capacitor-community/electron,
     * this branch can use @capacitor-community/sqlite Electron support.
     */
    if (platform === 'electron') {
      return new SqliteElectronDriver();
    }

    /**
     * Browser / PWA:
     * Prefer OPFS SQLite only when the browser is already in an OPFS-capable
     * context. If the page is not cross-origin isolated, SQLocal's worker logs
     * SecurityError / timeout messages before our async fallback can recover.
     * Avoid constructing that worker in known-unsupported contexts and go
     * straight to the browser fallback driver.
     */
    if (this.canUseOpfsWebDriver()) {
      return new SqliteOpfsWebDriver();
    }

    this.log.warn(
      '[SQLITE] OPFS storage is unavailable in this browser context. Using Capacitor SQLite IndexedDB driver instead.',
    );

    return this.createBrowserFallback();
  }

  public createBrowserFallback(): SqliteDriverType {
    return new SqliteCapacitorDriver();
  }

  public canFallbackToBrowserDriver(driver: SqliteDriverType): boolean {
    return (
      Capacitor.getPlatform() === 'web' &&
      driver instanceof SqliteOpfsWebDriver
    );
  }

  public async canAccessOpfsRootDirectory(): Promise<boolean> {
    if (!this.canUseOpfsWebDriver()) {
      return false;
    }

    try {
      await navigator.storage.getDirectory();
      return true;
    } catch (error) {
      this.log.warn(
        '[SQLITE] navigator.storage.getDirectory() failed. OPFS SQLite will be skipped.',
        error
      );

      return false;
    }
  }

  private canUseOpfsWebDriver(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    if (!window.isSecureContext || !window.crossOriginIsolated) {
      return false;
    }

    return typeof navigator.storage?.getDirectory === 'function';
  }
}
