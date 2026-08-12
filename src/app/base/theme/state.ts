// file: app/base/theme/state.ts
import { Service, computed, effect, inject, signal } from '@angular/core';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { SignalStateService } from '@libs/signal-state/service';

import { ThemeEnum, ThemeModeEnum, ThemePreferenceEnum } from '@base/theme/type';
import { GlobalProgressBarService } from '@base/global-progress-bar/service';
import { ContextProfileService } from '@libs/context-profile/service';
import { BfwApiService } from '@libs/third-party-apis/bfw-api/service';
import { FoundationModuleStateType } from '@libs/foundation-module/type/state';
import {
    THEME_ATTRIBUTE,
    THEME_MODE_ATTRIBUTE,
    THEME_PREFERENCE_ATTRIBUTE,
    THEME_STATE_STORE_KEY,
} from './const';
import { ThemeStateFieldEnum } from './enum';

@Service()
export class ThemeState extends SignalStateService implements FoundationModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = THEME_STATE_STORE_KEY;

    private readonly systemThemeMediaQuery: MediaQueryList | null =
        typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    private readonly attrTheme = THEME_ATTRIBUTE;
    private readonly attrThemeMode = THEME_MODE_ATTRIBUTE;
    private readonly attrThemePreference = THEME_PREFERENCE_ATTRIBUTE;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly systemThemeMode = signal(
        this.systemThemeMediaQuery?.matches ? ThemeModeEnum.DARK : ThemeModeEnum.LIGHT,
    );

    private readonly _themePreference = this.localStoragePersistSignal<ThemePreferenceEnum>(
        ThemeStateFieldEnum.PREFERENCE,
        ThemePreferenceEnum.SYSTEM,
        {
            crossTab: true,
            validate: this.isThemePreference,
        },
    );
    public readonly themePreference = this._themePreference.asReadonly();

    /**
     * Persisted copy of the resolved theme mode, stored as a plain readable value.
     * themeMode() above stays the runtime truth, this field only mirrors it so the theme
     * provider and the index.html boot script can read the mode synchronously before the
     * encrypted state is loaded. The theme effect in onActivate() keeps it up to date.
     * 
     * keep the mode readable as raw text for anything outside Angular that needs it later
     * so, plainValue: true
     */
    private readonly _themeMode = this.localStoragePersistSignal<ThemeModeEnum>(
        ThemeStateFieldEnum.MODE,
        ThemeModeEnum.LIGHT,
        {
            crossTab: true,
            plainValue: true,
            validate: this.isThemeMode,
        },
    );
    /**
     * do not read direct plain value from _themeMode() instead decide based on set preference
     * plain value is for bootstrap process only
     */
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

    private readonly _theme = this.localStoragePersistSignal<ThemeEnum>(
        ThemeStateFieldEnum.THEME,
        ThemeEnum.DEFAULT,
        {
            crossTab: true,
            validate: this.isTheme,
        },
    );
    public readonly theme = this._theme.asReadonly();

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    /*
    public readonly debugState = computed(() => ({
        
    })); 
    */

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

            // until the persisted preference is loaded the computed mode is only a default,
            // keep the mode applied at bootstrap so the theme never flashes
            if (!this.ready()) {
                return;
            }

            document.body.setAttribute(this.attrThemeMode, themeMode);
            document.body.setAttribute(this.attrThemePreference, themePreference);

            // mirror the resolved mode so the next app start can read it synchronously,
            // this covers system theme changes too, which never pass through the setters
            this.setThemeMode(themeMode);
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
    public setThemeMode(themeMode: ThemeModeEnum): void {
        this._themeMode.set(themeMode);
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
