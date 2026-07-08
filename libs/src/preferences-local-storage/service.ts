import { Service } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { PlatformType } from '@libs/platform/type';
import { PreferencesLocalStorageKeyMigrationType } from './type';
import { PreferencesLocalStorageMigrationKeyList } from './migration';

@Service()
export class PreferencesLocalStorageService {
  private readonly pslug = 'als';
  private readonly preferenceGroup = 'NativeStorage';
  private readonly legacyPreferenceGroup = 'CapacitorStorage';
  private readonly configuredPromise: Promise<void>;

  /**
   * Add future migrations here as full storage key -> full storage key mappings.
   * Optional dataProcessor lets you reshape old data before writing to the new key.
   * Example:
   * {
   *   fromKey: 'als.web.ui.legacy',
   *   toKey: 'als.web.global.ui',
   *   dataProcessor: (oldState) => ({ ...oldState, version: 2 }),
   * }
   */
  private readonly keyMigrations: PreferencesLocalStorageKeyMigrationType[] =
    PreferencesLocalStorageMigrationKeyList;

  constructor() {
    this.configuredPromise = this.configurePreferences();
  }

  private get prefix(): string {
    return `${this.pslug}.${this.group}.`;
  }

  protected get group(): PlatformType {
    // do not use AppPlatformService from library we do not need dependency injection as this might create some circular dependencies
    return Capacitor.getPlatform() as PlatformType;
  }

  public async set<T>(key: string, value: T): Promise<void> {
    await this.configuredPromise;

    await Preferences.set({
      key: this.normalizeKey(key),
      value: this.serialize(value),
    });
  }

  public async get<T>(key: string): Promise<T | null> {
    await this.configuredPromise;

    const result = await Preferences.get({
      key: this.normalizeKey(key),
    });

    if (result.value === null) {
      return null;
    }

    return this.deserialize<T>(result.value);
  }

  public async getOrDefault<T>(key: string, defaultValue: T): Promise<T> {
    const value = await this.get<T>(key);
    return value ?? defaultValue;
  }

  public async has(key: string): Promise<boolean> {
    await this.configuredPromise;

    const result = await Preferences.get({
      key: this.normalizeKey(key),
    });

    return result.value !== null;
  }

  public async remove(key: string): Promise<void> {
    await this.configuredPromise;

    await Preferences.remove({
      key: this.normalizeKey(key),
    });
  }

  public async clear(): Promise<void> {
    const keys = await this.keys();

    for (const key of keys) {
      await this.remove(key);
    }
  }

  public async keys(): Promise<string[]> {
    await this.configuredPromise;

    const result = await Preferences.keys();

    return result.keys
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key.slice(this.prefix.length));
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

  private async configurePreferences(): Promise<void> {
    await this.migratePreferenceGroup(this.legacyPreferenceGroup, this.preferenceGroup);

    await Preferences.configure({
      group: this.preferenceGroup,
    });

    await this.migrateConfiguredKeys();
  }

  private async migratePreferenceGroup(fromGroup: string, toGroup: string): Promise<void> {
    const normalizedFrom = fromGroup?.trim() ?? '';
    const normalizedTo = toGroup?.trim() ?? '';

    if (!normalizedFrom || !normalizedTo || normalizedFrom === normalizedTo) {
      return;
    }

    await Preferences.configure({ group: normalizedFrom });

    const sourceKeys = (await Preferences.keys()).keys.filter((key) => key.startsWith(this.prefix));

    if (!sourceKeys.length) {
      await Preferences.configure({ group: normalizedTo });
      return;
    }

    const sourceEntries: Array<{ key: string; value: string }> = [];
    for (const sourceKey of sourceKeys) {
      const source = await Preferences.get({ key: sourceKey });
      if (source.value === null) {
        continue;
      }

      sourceEntries.push({
        key: sourceKey,
        value: source.value,
      });
    }

    if (!sourceEntries.length) {
      await Preferences.configure({ group: normalizedTo });
      return;
    }

    await Preferences.configure({ group: normalizedTo });

    const migratedKeys: string[] = [];
    for (const source of sourceEntries) {
      const target = await Preferences.get({ key: source.key });
      if (target.value !== null) {
        continue;
      }

      await Preferences.set({
        key: source.key,
        value: source.value,
      });

      migratedKeys.push(source.key);
    }

    if (!migratedKeys.length) {
      return;
    }

    await Preferences.configure({ group: normalizedFrom });

    for (const migratedKey of migratedKeys) {
      await Preferences.remove({ key: migratedKey });
    }

    await Preferences.configure({ group: normalizedTo });
  }

  private async migrateConfiguredKeys(): Promise<void> {
    for (const migration of this.keyMigrations) {
      const fromKey = this.normalizeMigrationKey(migration.fromKey);
      const toKey = this.normalizeMigrationKey(migration.toKey);

      if (!fromKey || !toKey || fromKey === toKey) {
        continue;
      }

      const target = await Preferences.get({ key: toKey });
      if (target.value !== null) {
        continue;
      }

      const source = await Preferences.get({ key: fromKey });
      if (source.value === null) {
        continue;
      }

      const nextValue = this.applyMigrationDataProcessor(migration, source.value);

      await Preferences.set({
        key: toKey,
        value: nextValue,
      });

      await Preferences.remove({ key: fromKey });
    }
  }

  private normalizeMigrationKey(key: string): string {
    return key?.trim() ?? '';
  }

  private applyMigrationDataProcessor(
    migration: PreferencesLocalStorageKeyMigrationType,
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
