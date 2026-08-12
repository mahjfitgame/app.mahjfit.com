import { Service, computed, signal } from '@angular/core';
import { SignalStateService } from '../../service';
import { SIGNAL_STATE_EXAMPLE_USER_MODULE_STATE_STORE_KEY } from './const';
import {
  UserModulePreferenceType,
  UserModuleRecordType,
  UserModuleThemeType,
  isUserModulePreference,
  isUserModuleTheme,
} from './type';

/**
 * Complete state example for a feature module.
 *
 * - signal() creates runtime-only state.
 * - localStoragePersistSignal() creates encrypted local-storage state.
 * - scope selects the active ID for fields that declare that scope type.
 */
@Service({ autoProvided: false })
export class UserModuleState extends SignalStateService {
  protected override readonly storeKey = SIGNAL_STATE_EXAMPLE_USER_MODULE_STATE_STORE_KEY;

  // ---------------------------------------------------------------------------
  // Runtime state: memory only, cleared when this service is destroyed/reloaded.
  // ---------------------------------------------------------------------------

  private readonly loadingStore = signal(false);
  private readonly usersStore = signal<ReadonlyArray<UserModuleRecordType>>([]);
  private readonly errorStore = signal<string | null>(null);

  public readonly loading = this.loadingStore.asReadonly();
  public readonly users = this.usersStore.asReadonly();
  public readonly error = this.errorStore.asReadonly();
  public readonly hasUsers = computed(() => this.users().length > 0);

  // ---------------------------------------------------------------------------
  // Local-storage state: encrypted, versioned, validated, and scope-aware.
  // ---------------------------------------------------------------------------

  private readonly searchStore = this.localStoragePersistSignal('search', '', {
    // version = 1, debounceMs = 200, crossTab = false use their defaults.
    scope: 'user',
    validate: (value): value is string => typeof value === 'string',
  });
  public readonly search = this.searchStore.asReadonly();

  private readonly themeStore = this.localStoragePersistSignal<UserModuleThemeType>(
    'theme',
    'system',
    {
      crossTab: true,
      validate: isUserModuleTheme,
    },
  );
  public readonly theme = this.themeStore.asReadonly();
  public readonly darkMode = computed(() => this.theme() === 'dark');

  private readonly preferenceStore = this.localStoragePersistSignal<UserModulePreferenceType>(
    'preference',
    {
      pageSize: 25,
      notificationsEnabled: true,
    },
    {
      scope: 'user',
      crossTab: true,
      validate: isUserModulePreference,
    },
  );
  public readonly preference = this.preferenceStore.asReadonly();

  constructor() {
    super();
    this.initializeSignalState();
  }

  // ---------------------------------------------------------------------------
  // Scope
  // ---------------------------------------------------------------------------

  /**
   * Call after login/session restoration and before changing persisted values.
   * Setting this scope automatically reloads this state's persisted fields.
   */
  public setUserScope(userId: string | number): void {
    this.scope.setScope('user', userId);
  }

  /**
   * Call on logout. User-scoped fields return to their initial in-memory values;
   * the previous user's saved values are not deleted.
   */
  public clearUserScope(): void {
    this.scope.clearScope('user');
  }

  // ---------------------------------------------------------------------------
  // Runtime state methods
  // ---------------------------------------------------------------------------

  public setLoading(loading: boolean): void {
    this.loadingStore.set(loading);
  }

  public setUsers(users: ReadonlyArray<UserModuleRecordType>): void {
    this.usersStore.set(users);
  }

  public setError(error: string | null): void {
    this.errorStore.set(error);
  }

  public resetRuntimeState(): void {
    this.loadingStore.set(false);
    this.usersStore.set([]);
    this.errorStore.set(null);
  }

  // ---------------------------------------------------------------------------
  // Local-storage state methods
  // ---------------------------------------------------------------------------

  public setSearch(search: string): void {
    this.searchStore.set(search.trim());
  }

  public setTheme(theme: UserModuleThemeType): void {
    this.themeStore.set(theme);
  }

  public setPageSize(pageSize: number): void {
    if (!Number.isInteger(pageSize) || pageSize <= 0) {
      return;
    }

    this.preferenceStore.update((preference) => ({
      ...preference,
      pageSize,
    }));
  }

  public setNotificationsEnabled(notificationsEnabled: boolean): void {
    this.preferenceStore.update((preference) => ({
      ...preference,
      notificationsEnabled,
    }));
  }
}
