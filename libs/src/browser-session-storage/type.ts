// file: libs/src/browser-session-storage/type.ts
export type BrowserSessionStorageMigrationDataProcessorType = (storedKeyData: unknown) => unknown;

export interface BrowserSessionStorageKeyMigrationType {
  fromKey: string;
  toKey: string;
  dataProcessor?: BrowserSessionStorageMigrationDataProcessorType;
}
