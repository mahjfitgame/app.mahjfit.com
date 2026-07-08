// file: app/base/theme/type.ts

export enum ThemeEnum {
  DEFAULT = 'default',
}

export enum ThemeModeEnum {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum ThemePreferenceEnum {
  SYSTEM = 'system',
  LIGHT = ThemeModeEnum.LIGHT,
  DARK = ThemeModeEnum.DARK,
}