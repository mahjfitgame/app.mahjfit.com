export type PreferencesLocalStorageMigrationDataProcessorType = (
  storedKeyData: unknown,
) => unknown;

export interface PreferencesLocalStorageKeyMigrationType {
  fromKey: string;
  toKey: string;
  dataProcessor?: PreferencesLocalStorageMigrationDataProcessorType;
}
