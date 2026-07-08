// file: ./libs/src/signal-state/example/state.ts
import {
  DestroyRef,
  Injectable,
  Service,
  computed,
  effect,
  inject,
  resource,
  signal,
} from '@angular/core';
import { PreferencesLocalStorageService } from '../../preferences-local-storage/service';

type ThemeMode = 'light' | 'dark' | 'system';

interface ProductData {
  id: string;
  name: string;
  price: number;
}

@Service()
export class StateExample {
  private readonly ls = inject(PreferencesLocalStorageService);
  private readonly destroyRef = inject(DestroyRef);

  // 1. Runtime state
  public readonly screenWidth = signal(window.innerWidth);

  // 2. Local persisted state
  public readonly themeMode = signal<ThemeMode>('system');

  // Used only so we do not save before local storage has loaded.
  private readonly themeLoaded = signal(false);

  // Product id controls the API resource.
  public readonly productId = signal<string | null>(null);

  // 3. API state using Angular Resource
  /*
    value()
    isLoading()
    error()
    status()
    hasValue()
    reload()
  */
  public readonly productData = resource({
    params: () => {
      const id = this.productId();

      return id ? { id } : undefined;
    },

    loader: async ({ params, abortSignal }): Promise<ProductData> => {
      const response = await fetch(`/api/products/${params.id}`, {
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error('Product load failed');
      }

      return response.json() as Promise<ProductData>;
    },
  });

  // Optional easy reads
  public readonly product = computed(() =>
    this.productData.hasValue() ? this.productData.value() : null,
  );

  public readonly productLoading = computed(() => this.productData.isLoading());
  public readonly productError = computed(() => this.productData.error());

  constructor() {
    this.listenScreenWidth();
    void this.loadThemeMode();

    effect(() => {
      if (!this.themeLoaded()) {
        return;
      }

      void this.ls.set('theme-mode', this.themeMode());
    });
  }

  public setThemeMode(themeMode: ThemeMode): void {
    this.themeMode.set(themeMode);
  }

  public loadProduct(id: string): void {
    this.productId.set(id);
  }

  public reloadProduct(): void {
    this.productData.reload();
  }

  private listenScreenWidth(): void {
    const onResize = () => {
      this.screenWidth.set(window.innerWidth);
    };

    window.addEventListener('resize', onResize);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onResize);
    });
  }

  private async loadThemeMode(): Promise<void> {
    const saved = await this.ls.get<ThemeMode>('theme-mode');

    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      this.themeMode.set(saved);
    }

    this.themeLoaded.set(true);
  }
}

###############

// full object based

import { Injectable, computed, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';
export type AppBidi = 'ltr' | 'rtl';

export interface UserStateModel {
    theme: AppTheme;
    bidi: AppBidi;
    notification: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class UserState {

    // Main private state signal.
    // This keeps all user UI preferences in one object.
    private readonly state = signal<UserStateModel>({
        theme: 'light',
        bidi: 'ltr',
        notification: true,
    });

    // Public readonly signals.
    // Components can read these, but cannot directly update them.
    public readonly theme = computed(() => this.state().theme);
    public readonly bidi = computed(() => this.state().bidi);
    public readonly notification = computed(() => this.state().notification);

    // Optional full state reader.
    public readonly value = computed(() => this.state());

    public setTheme(theme: AppTheme): void {
        // Update only theme and keep other fields unchanged.
        this.state.update((current) => ({
            ...current,
            theme,
        }));
    }

    public setBidi(bidi: AppBidi): void {
        // Update only bidi direction and keep other fields unchanged.
        this.state.update((current) => ({
            ...current,
            bidi,
        }));
    }

    public setNotification(notification: boolean): void {
        // Update only notification setting and keep other fields unchanged.
        this.state.update((current) => ({
            ...current,
            notification,
        }));
    }

    public toggleTheme(): void {
        // Switch light to dark and dark to light.
        this.state.update((current) => ({
            ...current,
            theme: current.theme === 'light' ? 'dark' : 'light',
        }));
    }

    public toggleBidi(): void {
        // Switch layout direction between ltr and rtl.
        this.state.update((current) => ({
            ...current,
            bidi: current.bidi === 'ltr' ? 'rtl' : 'ltr',
        }));
    }

    public toggleNotification(): void {
        // Reverse current notification setting.
        this.state.update((current) => ({
            ...current,
            notification: !current.notification,
        }));
    }

    public reset(): void {
        // Restore default user state.
        this.state.set({
            theme: 'light',
            bidi: 'ltr',
            notification: true,
        });
    }
}

######################################
// single field bsed

import { Injectable, Signal, WritableSignal, computed, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';
export type AppBidi = 'ltr' | 'rtl';

@Injectable({
    providedIn: 'root',
})
export class UserState {

    /**
     * Private writable signals.
     *
     * WritableSignal means this class can read and update the value.
     * We keep these private so components cannot directly mutate the state.
     */
    private readonly themeState: WritableSignal<AppTheme> = signal<AppTheme>('light');
    private readonly bidiState: WritableSignal<AppBidi> = signal<AppBidi>('ltr');
    private readonly notificationState: WritableSignal<boolean> = signal<boolean>(true);

    /**
     * Public readonly signals.
     *
     * Signal means outside code can only read the value.
     * Components cannot call set() or update() on these signals.
     */
    public readonly theme: Signal<AppTheme> = this.themeState.asReadonly();
    public readonly bidi: Signal<AppBidi> = this.bidiState.asReadonly();
    public readonly notification: Signal<boolean> = this.notificationState.asReadonly();

    /**
     * Computed signals.
     *
     * These automatically update when the signals they read are changed.
     */
    public readonly isDarkTheme: Signal<boolean> = computed(() => this.theme() === 'dark');
    public readonly isRtl: Signal<boolean> = computed(() => this.bidi() === 'rtl');
    public readonly isNotificationEnabled: Signal<boolean> = computed(() => this.notification());

    public setTheme(theme: AppTheme): void {
        // Directly replace the current theme value.
        this.themeState.set(theme);
    }

    public setBidi(bidi: AppBidi): void {
        // Directly replace the current direction value.
        this.bidiState.set(bidi);
    }

    public setNotification(notification: boolean): void {
        // Directly replace the current notification value.
        this.notificationState.set(notification);
    }

    public toggleTheme(): void {
        // update() is best when new value depends on old value.
        this.themeState.update((theme) => theme === 'light' ? 'dark' : 'light');
    }

    public toggleBidi(): void {
        // update() receives the current value and returns the next value.
        this.bidiState.update((bidi) => bidi === 'ltr' ? 'rtl' : 'ltr');
    }

    public toggleNotification(): void {
        // Reverse the current boolean value.
        this.notificationState.update((notification) => !notification);
    }

    public reset(): void {
        // Restore all values to defaults.
        this.themeState.set('light');
        this.bidiState.set('ltr');
        this.notificationState.set(true);
    }
}

##############

// sample standard class 

import { Signal, WritableSignal, signal } from '@angular/core';

/**
 * Base class for simple Angular Signal based state.
 *
 * This gives us common store-like features:
 * - private writable state
 * - public readonly state
 * - patch state
 * - reset state
 * - localStorage load/save
 *
 * Keep this class small.
 * Do not turn it into a private NgRx clone with emotional baggage.
 */
export abstract class BaseSignalState<TState extends object> {

    /**
     * Internal writable state.
     *
     * Child classes can update state through protected methods only.
     */
    protected readonly state: WritableSignal<TState>;

    /**
     * Public readonly full state.
     *
     * Components can read the full state, but cannot directly mutate it.
     */
    public readonly value: Signal<TState>;

    protected constructor(
        protected readonly initialState: TState,
        private readonly storageKey?: string,
    ) {
        const loadedState = this.loadFromStorage();

        this.state = signal<TState>({
            ...this.initialState,
            ...loadedState,
        });

        this.value = this.state.asReadonly();
    }

    /**
     * Replace the complete state.
     */
    protected setState(state: TState): void {
        this.state.set(state);
        this.saveToStorage();
    }

    /**
     * Patch only selected fields.
     *
     * Similar idea to NgRx patchState().
     */
    protected patchState(patch: Partial<TState>): void {
        this.state.update((current) => ({
            ...current,
            ...patch,
        }));

        this.saveToStorage();
    }

    /**
     * Update state using current value.
     *
     * Useful when next state depends on previous state.
     */
    protected updateState(updater: (current: TState) => TState): void {
        this.state.update(updater);
        this.saveToStorage();
    }

    /**
     * Reset to initial default state.
     */
    public reset(): void {
        this.setState({
            ...this.initialState,
        });
    }

    /**
     * Save current state to localStorage.
     */
    protected saveToStorage(): void {
        if (!this.storageKey) {
            return;
        }

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state()));
        } catch {
            // Ignore storage errors.
            // Example: private mode, storage quota, malformed browser behavior.
        }
    }

    /**
     * Load saved state from localStorage.
     */
    private loadFromStorage(): Partial<TState> {
        if (!this.storageKey) {
            return {};
        }

        try {
            const raw = localStorage.getItem(this.storageKey);

            if (!raw) {
                return {};
            }

            const parsed = JSON.parse(raw) as Partial<TState>;

            if (!parsed || typeof parsed !== 'object') {
                return {};
            }

            return parsed;
        } catch {
            // If saved JSON is broken, use default state.
            return {};
        }
    }
}


###############
// saqmple child using BaseSignalState
import { Injectable, Signal, computed } from '@angular/core';
import { BaseSignalState } from './base-signal-state';

export type AppTheme = 'light' | 'dark';
export type AppBidi = 'ltr' | 'rtl';

export interface UserStateModel {
    theme: AppTheme;
    bidi: AppBidi;
}

const initialUserState: UserStateModel = {
    theme: 'light',
    bidi: 'ltr',
};

@Injectable({
    providedIn: 'root',
})
export class UserState extends BaseSignalState<UserStateModel> {

    public constructor() {
        /**
         * USER_STATE is the localStorage key.
         * BaseSignalState will load saved state automatically.
         */
        super(initialUserState, 'USER_STATE');
    }

    /**
     * Property selectors.
     *
     * Similar to NgRx SignalStore auto-generated state signals.
     */
    public readonly theme: Signal<AppTheme> = computed(() => this.state().theme);
    public readonly bidi: Signal<AppBidi> = computed(() => this.state().bidi);

    /**
     * Computed selectors.
     */
    public readonly isDarkTheme: Signal<boolean> = computed(() => this.theme() === 'dark');
    public readonly isRtl: Signal<boolean> = computed(() => this.bidi() === 'rtl');

    public setTheme(theme: AppTheme): void {
        // Update only theme.
        this.patchState({
            theme,
        });
    }

    public setBidi(bidi: AppBidi): void {
        // Update only layout direction.
        this.patchState({
            bidi,
        });
    }

    public toggleTheme(): void {
        // Update theme based on current theme.
        this.updateState((current) => ({
            ...current,
            theme: current.theme === 'light' ? 'dark' : 'light',
        }));
    }

    public toggleBidi(): void {
        // Update bidi based on current bidi value.
        this.updateState((current) => ({
            ...current,
            bidi: current.bidi === 'ltr' ? 'rtl' : 'ltr',
        }));
    }
}

##############
// sample persisted

import { Injectable, Signal, WritableSignal, computed, effect, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';
export type AppBidi = 'ltr' | 'rtl';

export interface UserPersistedStateModel {
    theme: AppTheme;
    bidi: AppBidi;
    notification: boolean;
}

export interface UserRuntimeStateModel {
    loading: boolean;
    error: string | null;
    initialized: boolean;
}

export interface UserStateModel extends UserPersistedStateModel, UserRuntimeStateModel {}

const USER_STATE_STORAGE_KEY = 'USER_STATE';

const defaultPersistedState: UserPersistedStateModel = {
    theme: 'light',
    bidi: 'ltr',
    notification: true,
};

const defaultRuntimeState: UserRuntimeStateModel = {
    loading: false,
    error: null,
    initialized: false,
};

@Injectable({
    providedIn: 'root',
})
export class UserState {

    /**
     * Main state.
     *
     * Persisted fields:
     * - theme
     * - bidi
     * - notification
     *
     * Runtime-only fields:
     * - loading
     * - error
     * - initialized
     */
    private readonly state: WritableSignal<UserStateModel> = signal<UserStateModel>({
        ...defaultPersistedState,
        ...defaultRuntimeState,
        ...this.loadPersistedState(),
    });

    /**
     * Public full readonly state.
     */
    public readonly value: Signal<UserStateModel> = this.state.asReadonly();

    /**
     * Persisted field selectors.
     */
    public readonly theme: Signal<AppTheme> = computed(() => this.state().theme);
    public readonly bidi: Signal<AppBidi> = computed(() => this.state().bidi);
    public readonly notification: Signal<boolean> = computed(() => this.state().notification);

    /**
     * Runtime-only field selectors.
     */
    public readonly loading: Signal<boolean> = computed(() => this.state().loading);
    public readonly error: Signal<string | null> = computed(() => this.state().error);
    public readonly initialized: Signal<boolean> = computed(() => this.state().initialized);

    /**
     * Computed selectors.
     */
    public readonly isDarkTheme: Signal<boolean> = computed(() => this.theme() === 'dark');
    public readonly isRtl: Signal<boolean> = computed(() => this.bidi() === 'rtl');
    public readonly isNotificationEnabled: Signal<boolean> = computed(() => this.notification());

    public constructor() {
        /**
         * Persist only selected fields.
         *
         * Runtime fields like loading/error/initialized are not saved.
         */
        effect(() => {
            const persistedState: UserPersistedStateModel = {
                theme: this.theme(),
                bidi: this.bidi(),
                notification: this.notification(),
            };

            localStorage.setItem(USER_STATE_STORAGE_KEY, JSON.stringify(persistedState));
        });
    }

    /**
     * Generic state patch helper.
     *
     * This gives NgRx-like patchState behavior using Angular signal only.
     */
    private patchState(patch: Partial<UserStateModel>): void {
        this.state.update((current) => ({
            ...current,
            ...patch,
        }));
    }

    public setTheme(theme: AppTheme): void {
        // Update persisted theme field.
        this.patchState({
            theme,
        });
    }

    public setBidi(bidi: AppBidi): void {
        // Update persisted bidi field.
        this.patchState({
            bidi,
        });
    }

    public setNotification(notification: boolean): void {
        // Update persisted notification field.
        this.patchState({
            notification,
        });
    }

    public toggleTheme(): void {
        // Toggle persisted theme field.
        this.patchState({
            theme: this.theme() === 'light' ? 'dark' : 'light',
        });
    }

    public toggleBidi(): void {
        // Toggle persisted bidi field.
        this.patchState({
            bidi: this.bidi() === 'ltr' ? 'rtl' : 'ltr',
        });
    }

    public toggleNotification(): void {
        // Toggle persisted notification field.
        this.patchState({
            notification: !this.notification(),
        });
    }

    public setLoading(loading: boolean): void {
        // Update runtime-only loading field.
        this.patchState({
            loading,
        });
    }

    public setError(error: string | null): void {
        // Update runtime-only error field.
        this.patchState({
            error,
        });
    }

    public markInitialized(): void {
        // Mark state as initialized for current app session only.
        this.patchState({
            initialized: true,
        });
    }

    public resetRuntimeState(): void {
        // Reset only runtime fields.
        // Persisted fields stay unchanged.
        this.patchState({
            ...defaultRuntimeState,
        });
    }

    public resetPersistedState(): void {
        // Reset only persisted fields.
        // Runtime fields stay unchanged.
        this.patchState({
            ...defaultPersistedState,
        });
    }

    public resetAll(): void {
        // Reset full state.
        this.state.set({
            ...defaultPersistedState,
            ...defaultRuntimeState,
        });
    }

    private loadPersistedState(): Partial<UserPersistedStateModel> {
        try {
            const raw = localStorage.getItem(USER_STATE_STORAGE_KEY);

            if (!raw) {
                return {};
            }

            const parsed = JSON.parse(raw) as Partial<UserPersistedStateModel>;

            return {
                theme: parsed.theme === 'light' || parsed.theme === 'dark'
                    ? parsed.theme
                    : defaultPersistedState.theme,

                bidi: parsed.bidi === 'ltr' || parsed.bidi === 'rtl'
                    ? parsed.bidi
                    : defaultPersistedState.bidi,

                notification: typeof parsed.notification === 'boolean'
                    ? parsed.notification
                    : defaultPersistedState.notification,
            };
        } catch {
            // If localStorage has invalid JSON, ignore it.
            return {};
        }
    }
}