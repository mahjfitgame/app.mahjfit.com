// file: libs/src/signal-state/service.ts
import {
  DestroyRef,
  EffectRef,
  Injector,
  WritableSignal,
  effect,
  inject,
  signal,
} from '@angular/core';
import { SignalStateCrossTabSync } from './cross.tab.sync';
import { SignalStateScope } from './scope';
import { SignalStateLocalStorage } from './local.storage';
import { SignalStateSessionStorage } from './session.storage';
import { SignalStateLocalDb } from './local.db';
import { SignalStateServerSync } from './server.sync';
import { SignalStateCookie } from './cookie';
import {
  CookiePersistSignalOptionsType,
  LocalDbPersistSignalOptionsType,
  LocalStoragePersistSignalOptionsType,
  ServerSyncSignalOptionsType,
  NormalizedPersistSignalOptionsType,
  PersistRegistration,
  PersistSignalOptionsBaseType,
  PersistSignalRegistrationType,
  SessionStoragePersistSignalOptionsType,
  SignalStateServerSyncSourceType,
  SignalStateLocalDbSourceType,
  SignalStateCookieSourceType,
  SignalStateStorageType,
} from './type';
import { SignalStateUtility } from './utility';

/**
 * Native Angular signal base with optional encrypted browser persistence.
 * Use signal() for runtime state, localStoragePersistSignal() for state that must
 * survive application restarts, and sessionStoragePersistSignal() for state that
 * should be removed when the browser session ends.
 */
export abstract class SignalStateService {
  /**
   * Keeps the storeKey: string dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  protected abstract readonly storeKey: string;

  /**
   * Keeps the scope dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  protected readonly scope = inject(SignalStateScope);

  /**
   * Keeps the localStorage dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly localStorage = inject(SignalStateLocalStorage);
  /**
   * Keeps the sessionStorage dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly sessionStorage = inject(SignalStateSessionStorage);
  /**
   * Keeps the localDb dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly localDb = inject(SignalStateLocalDb);
  /**
   * Keeps the serverSync dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly serverSync = inject(SignalStateServerSync);
  /**
   * Keeps the cookie dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly cookieStorage = inject(SignalStateCookie);
  /**
   * Keeps the crossTabSync dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly crossTabSync = inject(SignalStateCrossTabSync);
  /**
   * Keeps the utility dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly utility = inject(SignalStateUtility);
  /**
   * Keeps the injector dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly injector = inject(Injector);
  /**
   * Keeps the destroyRef dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Keeps the registrations dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly registrations = new Map<string, PersistRegistration>();
  /**
   * Keeps the effectReferences: EffectRef[] dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly effectReferences: EffectRef[] = [];
  /**
   * Keeps the crossTabCleanups: Array<() dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly crossTabCleanups: Array<() => void> = [];
  /**
   * Keeps the deactivationCleanups: Array<() dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly deactivationCleanups: Array<() => void> = [];

  /**
   * Keeps the readyStore dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly readyStore = signal(false);
  /**
   * Keeps the syncingStore dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  private readonly syncingStore = signal(false);

  /**
   * Keeps the ready dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  public readonly ready = this.readyStore.asReadonly();
  /**
   * Keeps the syncing dependency or state holder used by this class.
   * It is readonly so the service wiring stays stable for the instance lifetime.
   */
  public readonly syncing = this.syncingStore.asReadonly();

  /**
   * Tracks whether persisted signals have already been initialized.
   * This prevents late registrations after effects and loading have started.
   */
  private initialized = false;
  /**
   * Tracks whether Angular has destroyed this state service.
   * Async work checks this flag before applying stale updates.
   */
  private destroyed = false;
  /**
   * Monotonic counter used to ignore stale load-all operations.
   * Only the latest load sequence may update ready and syncing flags.
   */
  private loadAllSequence = 0;

  /**
   * Creates the service instance through Angular dependency injection.
   * All injected collaborators are resolved from field initializers.
   */
  constructor() {}

  /**
   * Creates a writable signal whose value is persisted in encrypted local storage.
   * Use this for preferences that should survive browser restarts.
   */
  protected localStoragePersistSignal<T>(
    field: string,
    initialValue: T,
    options: LocalStoragePersistSignalOptionsType<T>,
  ): WritableSignal<T> {
    return this.persistSignal('local', field, initialValue, options);
  }

  /**
   * Creates a writable signal whose value is persisted in encrypted session storage.
   * Use this for state that should survive reloads only within the current session.
   */
  protected sessionStoragePersistSignal<T>(
    field: string,
    initialValue: T,
    options: SessionStoragePersistSignalOptionsType<T>,
  ): WritableSignal<T> {
    return this.persistSignal('session', field, initialValue, options);
  }

  /**
   * Creates a writable signal whose value is persisted through the local database adapter.
   * Use this for larger or repository-backed state.
   */
  protected localDbPersistSignal<T>(
    field: string,
    initialValue: T,
    options: LocalDbPersistSignalOptionsType<T>,
  ): WritableSignal<T> {
    return this.persistSignal('localDb', field, initialValue, options);
  }

  /**
   * Creates a writable signal whose value is synchronized through a server source.
   * Use this for API-owned state that can still participate in signal workflows.
   */
  protected serverSyncSignal<T>(
    field: string,
    initialValue: T,
    options: ServerSyncSignalOptionsType<T>,
  ): WritableSignal<T> {
    return this.persistSignal('server', field, initialValue, options);
  }

  /**
   * Creates a writable signal whose value is persisted in an encrypted cookie.
   * Use this only for small state that must be available through cookies.
   */
  protected cookiePersistSignal<T>(
    field: string,
    initialValue: T,
    options: CookiePersistSignalOptionsType<T>,
  ): WritableSignal<T> {
    return this.persistSignal('cookie', field, initialValue, options);
  }

  /**
   * Registers one persisted signal before initialization starts.
   * It validates field uniqueness, captures the initial value, and stores normalized options.
   */
  private persistSignal<T>(
    storage: SignalStateStorageType,
    field: string,
    initialValue: T,
    options: PersistSignalOptionsBaseType<T> & {
      crossTab?: boolean;
      source?:
        | SignalStateLocalDbSourceType
        | SignalStateServerSyncSourceType
        | SignalStateCookieSourceType;
    },
  ): WritableSignal<T> {
    const storageDescription = this.storageDescription(storage);
    if (this.initialized) {
      throw new Error(
        `${storageDescription} persisted signals must be declared before initializeSignalState().`,
      );
    }

    const normalizedField = field?.trim();
    if (!normalizedField) {
      throw new Error(`${storageDescription} persisted signal field is required.`);
    }

    const registrationKey = this.registrationKey(storage, normalizedField);
    if (this.registrations.has(registrationKey)) {
      throw new Error(
        `${storageDescription} persisted signal "${normalizedField}" is already registered.`,
      );
    }

    const state = signal(initialValue);
    const registration: PersistSignalRegistrationType<T> = {
      storage,
      field: normalizedField,
      initialValue: this.cloneValue(initialValue),
      state,
      options: this.normalizeOptions(options, storageDescription),
      ready: false,
      loadSequence: 0,
      lastSavedSnapshot: '',
      cookieWriteRevision: signal(0),
      savedCookieWriteRevision: 0,
    };

    this.registrations.set(registrationKey, registration);
    return state;
  }

  /**
   * Lifecycle hook invoked once after this state service is initialized.
   */
  protected onActivate(): void {}

  /**
   * Lifecycle hook invoked once when Angular destroys this state service.
   * Override for state-specific teardown that cannot be registered directly.
   */
  /**
   * Handles the onDeactivate operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  protected onDeactivate(): void {}

  /**
   * Registers a teardown callback owned by this state service. If teardown is
   * registered after destruction (for example, after an async subscription
   * resolves), it is executed immediately instead of leaking the resource.
   */
  /**
   * Handles the registerDeactivationCleanup operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  protected registerDeactivationCleanup(cleanup: () => void): void {
    if (this.destroyed) {
      cleanup();
      return;
    }

    this.deactivationCleanups.push(cleanup);
  }

  /**
   * Handles the initializeSignalState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  protected initializeSignalState(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.initializeScopeEffect();
    this.initializeSaveEffects();

    this.destroyRef.onDestroy(() => this.destroySignalState());
    this.onActivate();
  }

  /**
   * Overrides the expiry for the next write of one registered cookie field.
   * The registration's initialization-time cookie options remain unchanged.
   */
  protected setNextCookiePersistedExpiry(field: string, expires: string | Date): void {
    const normalizedField = field?.trim();
    if (!normalizedField) {
      throw new Error('Cookie persisted signal field is required.');
    }

    const registration = this.registrations.get(this.registrationKey('cookie', normalizedField));
    if (!registration || registration.storage !== 'cookie') {
      throw new Error(`Cookie persisted signal "${normalizedField}" is not registered.`);
    }

    const date = expires instanceof Date ? expires : new Date(expires);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Cookie expiry must be a valid Date or date string.');
    }

    registration.nextCookieExpires = date.toUTCString();
    registration.cookieWriteRevision.update((revision) => revision + 1);
  }

  /**
   * Handles the resetLocalStoragePersistedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public resetLocalStoragePersistedState(): void {
    this.resetPersistedState('local');
  }

  /**
   * Handles the resetSessionStoragePersistedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public resetSessionStoragePersistedState(): void {
    this.resetPersistedState('session');
  }

  /**
   * Handles the resetLocalDbPersistedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public resetLocalDbPersistedState(): void {
    this.resetPersistedState('localDb');
  }

  /**
   * Handles the resetServerSyncedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public resetServerSyncedState(): void {
    this.resetPersistedState('server');
  }

  /**
   * Handles the resetCookiePersistedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public resetCookiePersistedState(): void {
    this.resetPersistedState('cookie');
  }

  /**
   * Handles the clearLocalStoragePersistedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async clearLocalStoragePersistedState(): Promise<void> {
    await this.clearPersistedState('local');
  }

  /**
   * Handles the clearSessionStoragePersistedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async clearSessionStoragePersistedState(): Promise<void> {
    await this.clearPersistedState('session');
  }

  /**
   * Handles the clearLocalDbPersistedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async clearLocalDbPersistedState(): Promise<void> {
    await this.clearPersistedState('localDb');
  }

  /**
   * Handles the clearServerSyncedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async clearServerSyncedState(): Promise<void> {
    await this.clearPersistedState('server');
  }

  /**
   * Handles the clearCookiePersistedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async clearCookiePersistedState(): Promise<void> {
    await this.clearPersistedState('cookie');
  }

  /**
   * Handles the clearLocalStoragePersistedField operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async clearLocalStoragePersistedField(field: string): Promise<void> {
    await this.clearPersistedField('local', field);
  }

  /**
   * Handles the clearSessionStoragePersistedField operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async clearSessionStoragePersistedField(field: string): Promise<void> {
    await this.clearPersistedField('session', field);
  }

  /**
   * Handles the clearLocalDbPersistedField operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async clearLocalDbPersistedField(field: string): Promise<void> {
    await this.clearPersistedField('localDb', field);
  }

  /**
   * Handles the clearServerSyncedField operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async clearServerSyncedField(field: string): Promise<void> {
    await this.clearPersistedField('server', field);
  }

  /**
   * Handles the clearCookiePersistedField operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public async clearCookiePersistedField(field: string): Promise<void> {
    await this.clearPersistedField('cookie', field);
  }

  /**
   * Handles the localStoragePersistedSnapshot operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public localStoragePersistedSnapshot(): Readonly<Record<string, unknown>> {
    return this.persistedSnapshot('local');
  }

  /**
   * Handles the sessionStoragePersistedSnapshot operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public sessionStoragePersistedSnapshot(): Readonly<Record<string, unknown>> {
    return this.persistedSnapshot('session');
  }

  /**
   * Handles the localDbPersistedSnapshot operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public localDbPersistedSnapshot(): Readonly<Record<string, unknown>> {
    return this.persistedSnapshot('localDb');
  }

  /**
   * Handles the serverSyncedSnapshot operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public serverSyncedSnapshot(): Readonly<Record<string, unknown>> {
    return this.persistedSnapshot('server');
  }

  /**
   * Handles the cookiePersistedSnapshot operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  public cookiePersistedSnapshot(): Readonly<Record<string, unknown>> {
    return this.persistedSnapshot('cookie');
  }

  /**
   * Handles the resetPersistedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private resetPersistedState(storage: SignalStateStorageType): void {
    for (const registration of this.registrationsFor(storage)) {
      registration.state.set(this.cloneValue(registration.initialValue));
      registration.lastSavedSnapshot = '';
    }
  }

  /**
   * Handles the clearPersistedState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private async clearPersistedState(storage: SignalStateStorageType): Promise<void> {
    await Promise.all(
      this.registrationsFor(storage).map((registration) => this.clearRegistration(registration)),
    );
  }

  /**
   * Handles the clearPersistedField operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private async clearPersistedField(storage: SignalStateStorageType, field: string): Promise<void> {
    const registration = this.registrations.get(this.registrationKey(storage, field));
    if (registration) {
      await this.clearRegistration(registration);
    }
  }

  /**
   * Handles the persistedSnapshot operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private persistedSnapshot(storage: SignalStateStorageType): Readonly<Record<string, unknown>> {
    const snapshot: Record<string, unknown> = {};

    for (const registration of this.registrationsFor(storage)) {
      snapshot[registration.field] = registration.state();
    }

    return snapshot;
  }

  /**
   * Applies defaults and validates the options for a persisted signal.
   * The returned object is used by loaders, savers, and cross-tab listeners.
   */
  private normalizeOptions<T>(
    options: PersistSignalOptionsBaseType<T> & {
      crossTab?: boolean;
      source?:
        | SignalStateLocalDbSourceType
        | SignalStateServerSyncSourceType
        | SignalStateCookieSourceType;
    },
    storageDescription: string,
  ): NormalizedPersistSignalOptionsType<T> {
    const scope = options.scope?.trim();
    if (options.scope !== undefined && !scope) {
      throw new Error(`${storageDescription} persisted signal scope is required when provided.`);
    }

    return {
      version: options.version ?? 1,
      debounceMs: options.debounceMs ?? 200,
      crossTab: options.crossTab ?? false,
      scope,
      validate: options.validate,
      serialize: options.serialize,
      deserialize: options.deserialize,
      deleteOnNull: options.deleteOnNull ?? false,
      source: 'source' in options ? options.source : undefined,
    };
  }

  /**
   * Handles the initializeScopeEffect operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private initializeScopeEffect(): void {
    const reference = effect(
      () => {
        this.scope.scopes();
        this.refreshCrossTabListeners();
        void this.loadAllRegistrations();
      },
      { injector: this.injector },
    );

    this.effectReferences.push(reference);
  }

  /**
   * Handles the initializeSaveEffects operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private initializeSaveEffects(): void {
    for (const registration of this.registrations.values()) {
      const reference = effect(
        (onCleanup) => {
          const value = registration.state();
          const syncing = this.syncingStore();
          const cookieWriteRevision = registration.cookieWriteRevision();

          if (!registration.ready || syncing || this.destroyed) {
            return;
          }

          let persistedValue: unknown;
          try {
            persistedValue = registration.options.serialize
              ? registration.options.serialize(value)
              : value;
          } catch (error) {
            console.error(this.logPrefix(registration.field, 'serialize failed'), error);
            return;
          }

          const snapshot = this.serializeSnapshot(persistedValue);
          const hasRuntimeCookieExpiry =
            registration.storage === 'cookie' &&
            cookieWriteRevision !== registration.savedCookieWriteRevision;

          if (snapshot === registration.lastSavedSnapshot && !hasRuntimeCookieExpiry) {
            return;
          }

          const key = this.resolveStorageKey(registration);
          if (!key) {
            return;
          }

          const cookieOptions = this.cookieOptionsForSave(registration, hasRuntimeCookieExpiry);
          const timer = setTimeout(() => {
            void this.saveRegistration(
              registration,
              key,
              persistedValue,
              snapshot,
              cookieOptions,
              cookieWriteRevision,
            );
          }, registration.options.debounceMs);

          onCleanup(() => clearTimeout(timer));
        },
        { injector: this.injector },
      );

      this.effectReferences.push(reference);
    }
  }

  /**
   * Handles the loadAllRegistrations operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private async loadAllRegistrations(): Promise<void> {
    const loadSequence = ++this.loadAllSequence;
    this.readyStore.set(false);
    this.syncingStore.set(true);

    try {
      await Promise.all(
        [...this.registrations.values()].map((registration) => this.loadRegistration(registration)),
      );

      if (loadSequence === this.loadAllSequence && !this.destroyed) {
        this.readyStore.set(true);
      }
    } finally {
      if (loadSequence === this.loadAllSequence && !this.destroyed) {
        this.syncingStore.set(false);
      }
    }
  }

  /**
   * Handles the loadRegistration operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private async loadRegistration(registration: PersistRegistration): Promise<void> {
    const loadSequence = ++registration.loadSequence;
    registration.ready = false;

    const key = this.resolveStorageKey(registration);
    if (!key) {
      this.applyInitialValue(registration);
      registration.ready = true;
      return;
    }

    let stored = await this.loadFromStorage(registration, key);

    if (loadSequence !== registration.loadSequence || this.destroyed) {
      return;
    }

    if (stored) {
      await this.saveServerCrossTabSessionRegistration(registration, key, stored.s);
    } else {
      stored = await this.loadServerCrossTabSessionRegistration(registration, key);
    }

    if (loadSequence !== registration.loadSequence || this.destroyed) {
      return;
    }

    if (stored && this.applyStoredValue(registration, stored.s)) {
      registration.lastSavedSnapshot = this.serializeSnapshot(stored.s);
    } else {
      this.applyInitialValue(registration);
    }

    registration.ready = true;
  }

  /**
   * Handles the applyStoredValue operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private applyStoredValue(registration: PersistRegistration, storedValue: unknown): boolean {
    try {
      const value = registration.options.deserialize
        ? registration.options.deserialize(storedValue)
        : storedValue;

      if (!registration.options.validate(value)) {
        return false;
      }

      registration.state.set(value);
      return true;
    } catch (error) {
      console.error(this.logPrefix(registration.field, 'stored value failed'), error);
      return false;
    }
  }

  /**
   * Handles the applyInitialValue operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private applyInitialValue(registration: PersistRegistration): void {
    const initialValue = this.cloneValue(registration.initialValue);
    registration.state.set(initialValue);

    const persistedInitialValue = registration.options.serialize
      ? registration.options.serialize(initialValue)
      : initialValue;

    registration.lastSavedSnapshot = this.serializeSnapshot(persistedInitialValue);
  }

  /**
   * Writes one registration to its backend and updates the saved snapshot.
   * When cross-tab sync is enabled, it also publishes the changed key.
   */
  private async saveRegistration(
    registration: PersistRegistration,
    key: string,
    persistedValue: unknown,
    snapshot: string,
    cookieOptions?: SignalStateCookieSourceType,
    cookieWriteRevision = registration.savedCookieWriteRevision,
  ): Promise<void> {
    try {
      if (registration.options.deleteOnNull && persistedValue === null) {
        await this.removeFromStorage(registration, key);
        await this.removeServerCrossTabSessionRegistration(registration, key);
      } else {
        await this.saveToStorage(registration, key, persistedValue, cookieOptions);
        await this.saveServerCrossTabSessionRegistration(registration, key, persistedValue);
      }

      registration.lastSavedSnapshot = snapshot;
      this.consumeCookieWriteOverride(registration, cookieWriteRevision);

      if (this.canCrossTabSync(registration) && registration.options.crossTab) {
        this.crossTabSync.publish(key);
      }
    } catch (error) {
      console.error(this.logPrefix(registration.field, 'save failed'), error);
    }
  }

  /**
   * Handles the clearRegistration operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private async clearRegistration(registration: PersistRegistration): Promise<void> {
    const key = this.resolveStorageKey(registration);
    if (!key) {
      return;
    }

    await this.removeFromStorage(registration, key);
    await this.removeServerCrossTabSessionRegistration(registration, key);
    registration.lastSavedSnapshot = '';
    this.consumeCookieWriteOverride(registration, registration.cookieWriteRevision());

    if (this.canCrossTabSync(registration) && registration.options.crossTab) {
      this.crossTabSync.publish(key);
    }
  }

  /**
   * Handles the refreshCrossTabListeners operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private refreshCrossTabListeners(): void {
    this.clearCrossTabListeners();

    for (const registration of this.registrations.values()) {
      if (!this.canCrossTabSync(registration) || !registration.options.crossTab) {
        continue;
      }

      const key = this.resolveStorageKey(registration);
      if (!key) {
        continue;
      }

      this.crossTabCleanups.push(
        this.crossTabSync.listen(key, () => {
          void this.loadRegistration(registration);
        }),
      );
    }
  }

  /**
   * Handles the canCrossTabSync operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private canCrossTabSync(registration: PersistRegistration): boolean {
    return (
      registration.storage === 'local' ||
      registration.storage === 'session' ||
      registration.storage === 'localDb' ||
      registration.storage === 'server' ||
      registration.storage === 'cookie'
    );
  }

  /**
   * Handles the isServerCrossTabRegistration operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private isServerCrossTabRegistration(registration: PersistRegistration): boolean {
    return registration.storage === 'server' && registration.options.crossTab;
  }

  private async saveServerCrossTabSessionRegistration(
    registration: PersistRegistration,
    key: string,
    persistedValue: unknown,
  ): Promise<void> {
    if (!this.isServerCrossTabRegistration(registration)) {
      return;
    }

    await this.sessionStorage.save(key, persistedValue, registration.options.version);
  }

  private async loadServerCrossTabSessionRegistration(
    registration: PersistRegistration,
    key: string,
  ): Promise<{ v: number; u: string; s: unknown } | null> {
    if (!this.isServerCrossTabRegistration(registration)) {
      return null;
    }

    return this.sessionStorage.load<unknown>(key, registration.options.version);
  }

  private async removeServerCrossTabSessionRegistration(
    registration: PersistRegistration,
    key: string,
  ): Promise<void> {
    if (!this.isServerCrossTabRegistration(registration)) {
      return;
    }

    await this.sessionStorage.remove(key);
  }

  /**
   * Handles the clearCrossTabListeners operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private clearCrossTabListeners(): void {
    for (const cleanup of this.crossTabCleanups.splice(0)) {
      cleanup();
    }
  }

  /**
   * Handles the resolveStorageKey operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private resolveStorageKey(registration: PersistRegistration): string | null {
    const scopeType = registration.options.scope;
    const scope = scopeType ? this.scope.getScope(scopeType) : null;

    if (scopeType && !scope) {
      return null;
    }

    return this.storageFor(registration).buildStorageKey(this.storeKey, registration.field, scope);
  }

  /**
   * Loads one registration through the concrete backend adapter.
   */
  private async loadFromStorage(
    registration: PersistRegistration,
    key: string,
  ): Promise<{ v: number; u: string; s: unknown } | null> {
    if (registration.storage === 'local') {
      return this.localStorage.load<unknown>(key, registration.options.version);
    }

    if (registration.storage === 'session') {
      return this.sessionStorage.load<unknown>(key, registration.options.version);
    }

    if (registration.storage === 'localDb') {
      return this.localDb.load<unknown>(
        key,
        registration.options.version,
        registration.options.source as SignalStateLocalDbSourceType | undefined,
      );
    }

    if (registration.storage === 'server') {
      return this.serverSync.load<unknown>(
        key,
        registration.options.version,
        registration.options.source as SignalStateServerSyncSourceType | undefined,
      );
    }

    return this.cookieStorage.load<unknown>(
      key,
      registration.options.version,
      registration.options.source as SignalStateCookieSourceType | undefined,
    );
  }

  /**
   * Saves one registration through the concrete backend adapter.
   */
  private async saveToStorage(
    registration: PersistRegistration,
    key: string,
    persistedValue: unknown,
    cookieOptions?: SignalStateCookieSourceType,
  ): Promise<void> {
    if (registration.storage === 'local') {
      await this.localStorage.save(key, persistedValue, registration.options.version);
      return;
    }

    if (registration.storage === 'session') {
      await this.sessionStorage.save(key, persistedValue, registration.options.version);
      return;
    }

    if (registration.storage === 'localDb') {
      await this.localDb.save(
        key,
        persistedValue,
        registration.options.version,
        registration.options.source as SignalStateLocalDbSourceType | undefined,
      );
      return;
    }

    if (registration.storage === 'server') {
      await this.serverSync.save(
        key,
        persistedValue,
        registration.options.version,
        registration.options.source as SignalStateServerSyncSourceType | undefined,
      );
      return;
    }

    await this.cookieStorage.save(
      key,
      persistedValue,
      registration.options.version,
      cookieOptions ?? (registration.options.source as SignalStateCookieSourceType | undefined),
    );
  }

  /**
   * Resolves cookie options for one scheduled write without changing registration defaults.
   */
  private cookieOptionsForSave(
    registration: PersistRegistration,
    hasRuntimeCookieExpiry: boolean,
  ): SignalStateCookieSourceType | undefined {
    if (registration.storage !== 'cookie') {
      return undefined;
    }

    if (!hasRuntimeCookieExpiry) {
      return registration.options.source as SignalStateCookieSourceType | undefined;
    }

    return {
      ...(registration.options.source as SignalStateCookieSourceType | undefined),
      expires: registration.nextCookieExpires,
    };
  }

  /**
   * Marks a matching cookie write override as consumed without clearing a newer override.
   */
  private consumeCookieWriteOverride(
    registration: PersistRegistration,
    cookieWriteRevision: number,
  ): void {
    if (
      registration.storage !== 'cookie' ||
      cookieWriteRevision <= registration.savedCookieWriteRevision
    ) {
      return;
    }

    registration.savedCookieWriteRevision = cookieWriteRevision;
    if (registration.cookieWriteRevision() === cookieWriteRevision) {
      registration.nextCookieExpires = undefined;
    }
  }

  /**
   * Removes one registration through the concrete backend adapter.
   */
  private async removeFromStorage(registration: PersistRegistration, key: string): Promise<void> {
    if (registration.storage === 'local') {
      await this.localStorage.remove(key);
      return;
    }

    if (registration.storage === 'session') {
      await this.sessionStorage.remove(key);
      return;
    }

    if (registration.storage === 'localDb') {
      await this.localDb.remove(
        key,
        registration.options.source as SignalStateLocalDbSourceType | undefined,
      );
      return;
    }

    if (registration.storage === 'server') {
      await this.serverSync.remove(
        key,
        registration.options.source as SignalStateServerSyncSourceType | undefined,
      );
      return;
    }

    await this.cookieStorage.remove(
      key,
      registration.options.source as SignalStateCookieSourceType | undefined,
    );
  }

  /**
   * Selects the adapter that matches a registration storage type.
   * This keeps load, save, and remove operations backend-neutral.
   */
  private storageFor(
    registration: PersistRegistration,
  ):
    | SignalStateLocalStorage
    | SignalStateSessionStorage
    | SignalStateLocalDb
    | SignalStateServerSync
    | SignalStateCookie {
    if (registration.storage === 'local') {
      return this.localStorage;
    }

    if (registration.storage === 'session') {
      return this.sessionStorage;
    }

    if (registration.storage === 'localDb') {
      return this.localDb;
    }

    if (registration.storage === 'server') {
      return this.serverSync;
    }

    return this.cookieStorage;
  }

  /**
   * Handles the registrationsFor operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private registrationsFor(storage: SignalStateStorageType): PersistRegistration[] {
    return [...this.registrations.values()].filter(
      (registration) => registration.storage === storage,
    );
  }

  /**
   * Handles the registrationKey operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private registrationKey(storage: SignalStateStorageType, field: string): string {
    return `${storage}:${field?.trim()}`;
  }

  /**
   * Handles the storageDescription operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private storageDescription(storage: SignalStateStorageType): string {
    if (storage === 'local') {
      return 'Local-storage';
    }

    if (storage === 'session') {
      return 'Session-storage';
    }

    if (storage === 'localDb') {
      return 'Local-db';
    }

    if (storage === 'server') {
      return 'Server-sync';
    }

    return 'Cookie';
  }

  /**
   * Handles the serializeSnapshot operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private serializeSnapshot(value: unknown): string {
    this.utility.assertSerializable(value);
    return JSON.stringify(value) as string;
  }

  /**
   * Handles the cloneValue<T> operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private cloneValue<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
  }

  /**
   * Handles the logPrefix operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private logPrefix(field: string, operation: string): string {
    return `[SignalStateService:${this.storeKey}:${field}] ${operation}`;
  }

  /**
   * Handles the destroySignalState operation for signal-state persistence.
   * The method keeps callers on a single safe path for this behavior.
   */
  private destroySignalState(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.onDeactivate();

    for (const cleanup of this.deactivationCleanups.splice(0).reverse()) {
      cleanup();
    }

    ++this.loadAllSequence;

    for (const registration of this.registrations.values()) {
      ++registration.loadSequence;
    }

    for (const reference of this.effectReferences) {
      reference.destroy();
    }

    this.effectReferences.length = 0;
    this.clearCrossTabListeners();
  }
}
