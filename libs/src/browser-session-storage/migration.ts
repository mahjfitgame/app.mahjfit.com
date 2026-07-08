// file: libs/src/browser-session-storage/migration.ts
import type { BrowserSessionStorageKeyMigrationType } from './type';

export const BrowserSessionStorageMigrationKeyList: BrowserSessionStorageKeyMigrationType[] = [
  // Example:
  // {
  //   fromKey: 'ass.web.feature.legacy',
  //   toKey: 'ass.web.feature.current',
  //   dataProcessor: (state) => ({
  //     ...(typeof state === 'object' && state ? state : {}),
  //     version: 2,
  //   }),
  // },
];
