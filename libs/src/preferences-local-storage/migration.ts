import { PreferencesLocalStorageKeyMigrationType } from './type';

export const PreferencesLocalStorageMigrationKeyList: PreferencesLocalStorageKeyMigrationType[] = [
  // Example:
  // {
  //   fromKey: 'als.web.feature.legacy',
  //   toKey: 'als.web.feature.current',
  //   dataProcessor: (state) => ({
  //     ...(typeof state === 'object' && state ? state : {}),
  //     version: 2,
  //   }),
  // },
];
