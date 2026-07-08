// file: libs/src/browser-session-storage/service.ts
import { Service } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import type { PlatformType } from '@libs/platform/type';
import { BrowserSessionStorageMigrationKeyList } from './migration';
import type { BrowserSessionStorageKeyMigrationType } from './type';

@Service()
export class BrowserSessionStorageService {
  private readonly pslug = 'ass';

  /**
   * Add future migrations here as full storage key -> full storage key mappings.
   * Optional dataProcessor lets you reshape old data before writing to the new key.
   * Example:
   * {
   *   fromKey: 'ass.web.ui.legacy',
   *   toKey: 'ass.web.global.ui',
   *   dataProcessor: (oldState) => ({ ...oldState, version: 2 }),
   * }
   */
  private readonly keyMigrations: BrowserSessionStorageKeyMigrationType[] =
    BrowserSessionStorageMigrationKeyList;

  constructor() {
    this.migrateConfiguredKeys();
  }

  private get prefix(): string {
    return `${this.pslug}.${this.group}.`;
  }

  protected get group(): PlatformType {
    // Avoid injecting AppPlatformService because storage can be used by services
    // that AppPlatformService depends on.
    return Capacitor.getPlatform() as PlatformType;
  }

  protected get storage(): Storage {
    return globalThis.sessionStorage;
  }

  public async set<T>(key: string, value: T): Promise<void> {
    this.storage.setItem(this.normalizeKey(key), this.serialize(value));
  }

  public async get<T>(key: string): Promise<T | null> {
    const value = this.storage.getItem(this.normalizeKey(key));

    if (value === null) {
      return null;
    }

    return this.deserialize<T>(value);
  }

  public async getOrDefault<T>(key: string, defaultValue: T): Promise<T> {
    const value = await this.get<T>(key);
    return value ?? defaultValue;
  }

  public async has(key: string): Promise<boolean> {
    return this.storage.getItem(this.normalizeKey(key)) !== null;
  }

  public async remove(key: string): Promise<void> {
    this.storage.removeItem(this.normalizeKey(key));
  }

  public async clear(): Promise<void> {
    const storage = this.storage;
    const prefix = this.prefix;

    // Iterate backwards because removing an item shifts the remaining indexes.
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);

      if (key?.startsWith(prefix)) {
        storage.removeItem(key);
      }
    }
  }

  public async keys(): Promise<string[]> {
    const storage = this.storage;
    const prefix = this.prefix;
    const keys: string[] = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);

      if (key?.startsWith(prefix)) {
        keys.push(key.slice(prefix.length));
      }
    }

    return keys;
  }

  private normalizeKey(key: string): string {
    const normalizedKey = key?.trim();
    return `${this.prefix}${normalizedKey}`;
  }

  private serialize<T>(value: T): string {
    if (typeof value === 'string') {
      return value;
    }

    return JSON.stringify(value);
  }

  private deserialize<T>(value: string): T {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  private migrateConfiguredKeys(): void {
    if (!this.keyMigrations.length) {
      return;
    }

    const storage = this.storage;

    for (const migration of this.keyMigrations) {
      const fromKey = this.normalizeMigrationKey(migration.fromKey);
      const toKey = this.normalizeMigrationKey(migration.toKey);

      if (!fromKey || !toKey || fromKey === toKey) {
        continue;
      }

      if (storage.getItem(toKey) !== null) {
        continue;
      }

      const sourceValue = storage.getItem(fromKey);
      if (sourceValue === null) {
        continue;
      }

      storage.setItem(toKey, this.applyMigrationDataProcessor(migration, sourceValue));
      storage.removeItem(fromKey);
    }
  }

  private normalizeMigrationKey(key: string): string {
    return key?.trim() ?? '';
  }

  private applyMigrationDataProcessor(
    migration: BrowserSessionStorageKeyMigrationType,
    sourceValue: string,
  ): string {
    if (!migration.dataProcessor) {
      return sourceValue;
    }

    try {
      const parsedSourceValue = this.deserialize<unknown>(sourceValue);
      const processedData = migration.dataProcessor(parsedSourceValue);

      if (processedData === undefined) {
        return sourceValue;
      }

      return this.serialize(processedData);
    } catch {
      return sourceValue;
    }
  }
}
