// file: app/base/theme/state.ts
import { Service, computed, effect, inject, signal } from '@angular/core';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { SignalStateService } from '@libs/signal-state/service';

import { ThemeEnum, ThemeModeEnum, ThemePreferenceEnum } from '@base/theme/type';
import { AppModuleStateType } from '@libs/utility/type';

@Service()
export class ThemeState extends SignalStateService implements AppModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = 'theme';

    private readonly systemThemeMediaQuery: MediaQueryList | null =
        typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    private readonly attrTheme = 'data-bfw-theme';
    private readonly attrThemeMode = 'data-bfw-theme-mode';
    private readonly attrThemePreference = 'data-bfw-theme-preference';

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly systemThemeMode = signal(
        this.systemThemeMediaQuery?.matches ? ThemeModeEnum.DARK : ThemeModeEnum.LIGHT,
    );

    private readonly _themePreference = this.localStoragePersistSignal<ThemePreferenceEnum>(
        'tpref',
        ThemePreferenceEnum.SYSTEM,
        {
            crossTab: true,
            validate: this.isThemePreference,
        },
    );
    public readonly themePreference = this._themePreference.asReadonly();

    public readonly themeMode = computed<ThemeModeEnum>(() => {
        const preference = this.themePreference();

        if (preference === ThemePreferenceEnum.LIGHT) {
        return ThemeModeEnum.LIGHT;
        }
        if (preference === ThemePreferenceEnum.DARK) {
        return ThemeModeEnum.DARK;
        }

        return this.systemThemeMode();
    });
    public readonly isDarkMode = computed(() => this.themeMode() === ThemeModeEnum.DARK);

    private readonly _theme = this.localStoragePersistSignal<ThemeEnum>('theme', ThemeEnum.DEFAULT, {
        crossTab: true,
        validate: this.isTheme,
    });
    public readonly theme = this._theme.asReadonly();

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    // n/a

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████

    public override onActivate(): void {
        this.listenSystemThemeChanges();

        const themeEffect = effect(() => {
            const theme = this.theme();
            const themePreference = this.themePreference();
            const themeMode = this.themeMode();

            if (typeof document === 'undefined') {
                return;
            }

            document.body.setAttribute(this.attrTheme, theme);
            document.body.setAttribute(
                this.attrThemeMode,
                this.ready() ? themeMode : ThemeModeEnum.LIGHT,
            );
            document.body.setAttribute(this.attrThemePreference, themePreference);
        });

        this.registerDeactivationCleanup(() => themeEffect.destroy());
    }

    public override onDeactivate(): void {

    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    public setTheme(theme: ThemeEnum): void {
        this._theme.set(theme);
    }
    public setThemePreference(themePreference: ThemePreferenceEnum): void {
        this._themePreference.set(themePreference);
    }
    public toggleThemePreference(themePreference?: ThemePreferenceEnum): void {
        const nextThemePreference =
        themePreference ??
        (this.themeMode() === ThemeModeEnum.DARK
            ? ThemePreferenceEnum.LIGHT
            : ThemePreferenceEnum.DARK);

        this.setThemePreference(nextThemePreference);
    }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████

    public isTheme(value: unknown): value is ThemeEnum {
        return Object.values(ThemeEnum).includes(value as ThemeEnum);
    }
    public isThemePreference(value: unknown): value is ThemePreferenceEnum {
        return Object.values(ThemePreferenceEnum).includes(value as ThemePreferenceEnum);
    }
    public isThemeMode(value: unknown): value is ThemeModeEnum {
        return Object.values(ThemeModeEnum).includes(value as ThemeModeEnum);
    }

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████

    private listenSystemThemeChanges(): void {
        if (!this.systemThemeMediaQuery) {
        return;
        }

        const handleSystemThemeChange = (event: MediaQueryListEvent): void => {
        this.systemThemeMode.set(event.matches ? ThemeModeEnum.DARK : ThemeModeEnum.LIGHT);
        };

        this.systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange);
        this.registerDeactivationCleanup(() => {
            this.systemThemeMediaQuery?.removeEventListener('change', handleSystemThemeChange);
        });
    }

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
