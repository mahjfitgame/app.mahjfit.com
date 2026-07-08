// file: app/base/theme/const.ts
import { ThemePreferenceEnum } from "@base/theme/type";

export const THEME_PREFERENCE_OPTIONS: ReadonlyArray<{ value: ThemePreferenceEnum; label: string, mat_icon?: string }> = [
    { value: ThemePreferenceEnum.LIGHT, label: 'Light', mat_icon: 'light_mode' },
    { value: ThemePreferenceEnum.DARK, label: 'Dark', mat_icon: 'dark_mode' },
    { value: ThemePreferenceEnum.SYSTEM, label: 'System', mat_icon: 'settings_brightness' },
] as const;