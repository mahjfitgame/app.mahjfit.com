export type UserModuleThemeType = 'light' | 'dark' | 'system';

export interface UserModulePreferenceType {
  pageSize: number;
  notificationsEnabled: boolean;
}

export interface UserModuleRecordType {
  id: number;
  name: string;
}

export function isUserModuleTheme(value: unknown): value is UserModuleThemeType {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function isUserModulePreference(value: unknown): value is UserModulePreferenceType {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<UserModulePreferenceType>;
  return (
    typeof candidate.pageSize === 'number' &&
    Number.isInteger(candidate.pageSize) &&
    candidate.pageSize > 0 &&
    typeof candidate.notificationsEnabled === 'boolean'
  );
}
