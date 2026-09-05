# Signal State module manual

This document is the complete developer guide for `libs/src/signal-state`.

`SignalStateService` is the recommended entry point. It gives Angular feature-state classes a consistent pattern for runtime signals, persisted signals, scope-aware keys, cross-tab reloads, and state-owned cleanup.

The module supports:

- ordinary in-memory Angular `signal()` state;
- encrypted, versioned local-storage persistence;
- encrypted, versioned session-storage persistence;
- encrypted, versioned cookie persistence through `CookieService`;
- encrypted, versioned local database persistence through `AppStateRepository` or a custom source;
- encrypted, versioned server-backed synchronization through a custom source;
- required runtime validation for every restored persisted value;
- optional `serialize` and `deserialize` hooks;
- debounced automatic saves after signal writes;
- optional cross-tab notifications for local, session, cookie, local-db, and server-backed fields;
- global or scope-specific storage keys;
- `ready` and `syncing` signals for restoration state;
- lifecycle hooks for state-owned listeners, subscriptions, timers, and other resources;
- reset, clear, and snapshot APIs per persistence backend;
- low-level storage, scope, utility, and cross-tab services for migrations and infrastructure.

> Most application code should extend `SignalStateService` and should not call the low-level adapters directly.

---

## 1. Files and responsibilities

| File                    | Main export                   | Responsibility                                                                                                                                 |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `const.ts`              | `SIGNAL_STATE_STORAGE_PREFIX` | Defines the storage-key prefix, currently `ss`.                                                                                                |
| `type.ts`               | Public types                  | Storage kinds, envelopes, source interfaces, options, normalized options, and registration types.                                              |
| `utility.ts`            | `SignalStateUtility`          | Builds keys, normalizes segments/keys, checks JSON serializability, parses envelopes, and validates envelope shape.                            |
| `scope.ts`              | `SignalStateScope`            | Root-level registry of active scope IDs such as user, tenant, organization, workspace, or project.                                             |
| `local.storage.ts`      | `SignalStateLocalStorage`     | Low-level encrypted persistence through `PreferencesLocalStorageService`.                                                                      |
| `session.storage.ts`    | `SignalStateSessionStorage`   | Low-level encrypted persistence through `BrowserSessionStorageService`.                                                                        |
| `cookie.ts`             | `SignalStateCookie`           | Low-level encrypted persistence through `CookieService`.                                                                                       |
| `local.db.ts`           | `SignalStateLocalDb`          | Low-level encrypted persistence through `AppStateRepository` by default, or a custom local-db source.                                          |
| `server.sync.ts`        | `SignalStateServerSync`       | Low-level encrypted server-sync adapter. Uses a no-op source unless a custom source is provided. Can also accept plain server values on load.  |
| `cross.tab.sync.ts`     | `SignalStateCrossTabSync`     | Multiplexes exact-key notifications through `BrowserTabsSyncService`.                                                                          |
| `service.ts`            | `SignalStateService`          | Base class that owns registrations, async loading, auto-saving, scopes, cross-tab listeners, reset/clear/snapshot APIs, and lifecycle cleanup. |
| `example/user-module/*` | Example state/service/types   | A focused feature example using runtime state, scoped local persistence, global local persistence, and a workflow service.                     |
| `example/*`             | Larger exploratory example    | Demonstrates runtime signals, local storage, local DB, server sync, resources, and WebSocket-style cleanup ideas.                              |

Application code usually imports from the library barrel:

```ts
import { SignalStateService, LocalStoragePersistSignalOptionsType } from '@libs';
```

Direct imports are also possible:

```ts
import { SignalStateService } from '@libs/signal-state/service';
```

---

## 2. Choosing a state kind

| State kind      | Declaration                     | Lifetime                                                                                                      | Cross-tab option                                        | Typical use                                                                                              |
| --------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Runtime only    | `signal()`                      | Until the state instance is destroyed or the page reloads.                                                    | No.                                                     | Loading flags, API rows, transient errors, open panels.                                                  |
| Local storage   | `localStoragePersistSignal()`   | Survives reloads and browser restarts until removed.                                                          | Yes.                                                    | Durable preferences, theme, remembered filters.                                                          |
| Session storage | `sessionStoragePersistSignal()` | Survives reloads in the current browser tab/session.                                                          | Yes, but each tab reloads from its own session storage. | Drafts, wizard progress, tab-specific filters.                                                           |
| Cookie          | `cookiePersistSignal()`         | Depends on browser/cookie expiry rules and the provided cookie options.                                       | Yes.                                                    | Small cookie-visible preferences or state that must participate in cookie transport.                     |
| Local DB        | `localDbPersistSignal()`        | Depends on the repository/source. Defaults to `AppStateRepository`.                                           | Yes.                                                    | Larger app state, local SQLite/app-state records, values shared with repository-backed infrastructure.   |
| Server sync     | `serverSyncSignal()`            | Depends on the provided API/source. If no source is provided, load returns `null` and save/delete are no-ops. | Yes.                                                    | Server-owned preferences, cached API-backed state, profile/config values synchronized through endpoints. |

A single state class may combine all kinds.

---

## 3. Quick-start: a complete feature state

### 3.1 Define runtime types and validators

Every persisted field needs a runtime validator. TypeScript generics do not protect data loaded from storage, a database, or an API.

```ts
export type Theme = 'light' | 'dark' | 'system';

export interface Preferences {
  pageSize: number;
  notificationsEnabled: boolean;
}

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function isPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<Preferences>;
  return (
    typeof candidate.pageSize === 'number' &&
    Number.isInteger(candidate.pageSize) &&
    candidate.pageSize > 0 &&
    typeof candidate.notificationsEnabled === 'boolean'
  );
}
```

### 3.2 Create a state class

```ts
import { computed, Injectable, signal } from '@angular/core';
import { SignalStateService } from '@libs';
import { isPreferences, isTheme, Preferences, Theme } from './types';

@Injectable()
export class AccountState extends SignalStateService {
  // Stable namespace used in every key for this state.
  protected override readonly storeKey = 'account';

  // Runtime-only state: never registered, never saved.
  private readonly loadingStore = signal(false);
  public readonly loading = this.loadingStore.asReadonly();

  // Global durable preference.
  private readonly themeStore = this.localStoragePersistSignal<Theme>('theme', 'system', {
    crossTab: true,
    validate: isTheme,
  });
  public readonly theme = this.themeStore.asReadonly();
  public readonly darkMode = computed(() => this.theme() === 'dark');

  // User-scoped local-storage preference.
  private readonly preferencesStore = this.localStoragePersistSignal<Preferences>(
    'preferences',
    { pageSize: 25, notificationsEnabled: true },
    {
      scope: 'user',
      version: 1,
      debounceMs: 200,
      crossTab: true,
      validate: isPreferences,
    },
  );
  public readonly preferences = this.preferencesStore.asReadonly();

  // Current-tab draft.
  private readonly draftStore = this.sessionStoragePersistSignal('draft', '', {
    scope: 'user',
    validate: (value): value is string => typeof value === 'string',
  });
  public readonly draft = this.draftStore.asReadonly();

  constructor() {
    super();
    // Must run after all persisted field initializers have registered.
    this.initializeSignalState();
  }

  public setUserScope(userId: string | number): void {
    this.scope.setScope('user', userId);
  }

  public clearUserScope(): void {
    this.scope.clearScope('user');
  }

  public setLoading(loading: boolean): void {
    this.loadingStore.set(loading);
  }

  public setTheme(theme: Theme): void {
    this.themeStore.set(theme);
  }

  public setPageSize(pageSize: number): void {
    if (!Number.isInteger(pageSize) || pageSize <= 0) {
      return;
    }

    this.preferencesStore.update((current) => ({ ...current, pageSize }));
  }

  public setDraft(draft: string): void {
    this.draftStore.set(draft);
  }
}
```

### 3.3 Provide and consume the state

The base class uses Angular `inject()`, so Angular must create the instance in an injection context.

Feature/component lifetime:

```ts
@Component({
  providers: [AccountState],
})
export class AccountPage {
  public readonly state = inject(AccountState);
}
```

Application lifetime:

```ts
@Injectable({ providedIn: 'root' })
export class AccountState extends SignalStateService {
  // ...
}
```

Template gating with `ready()`:

```html
@if (!state.ready()) {
<p>Restoring saved state...</p>
} @else {
<p>Theme: {{ state.theme() }}</p>
<input [value]="state.draft()" (input)="state.setDraft($any($event.target).value)" />
}
```

Activate scopes after authentication/session restoration and before accepting edits that must be persisted:

```ts
this.accountState.setUserScope(authenticatedUser.id);
```

---

## 4. `SignalStateService` API

`SignalStateService` is abstract. A subclass must define `storeKey`, declare any persisted signals as class fields, and call `initializeSignalState()` once from the constructor.

### 4.1 `storeKey`

```ts
protected abstract readonly storeKey: string;
```

`storeKey` is the stable namespace for the state class.

Rules and guidance:

- it must resolve to a non-empty string when keys are built;
- leading/trailing whitespace is trimmed;
- it is URI-encoded in storage keys;
- keep it stable between releases or existing records will no longer be found;
- use distinct values for unrelated state classes.

### 4.2 Persisted signal factories

All factories return a `WritableSignal<T>`. Keep that writable signal private and expose `asReadonly()`.

```ts
protected localStoragePersistSignal<T>(
  field: string,
  initialValue: T,
  options: LocalStoragePersistSignalOptionsType<T>,
): WritableSignal<T>;

protected sessionStoragePersistSignal<T>(
  field: string,
  initialValue: T,
  options: SessionStoragePersistSignalOptionsType<T>,
): WritableSignal<T>;

protected localDbPersistSignal<T>(
  field: string,
  initialValue: T,
  options: LocalDbPersistSignalOptionsType<T>,
): WritableSignal<T>;

protected serverSyncSignal<T>(
  field: string,
  initialValue: T,
  options: ServerSyncSignalOptionsType<T>,
): WritableSignal<T>;

protected cookiePersistSignal<T>(
  field: string,
  initialValue: T,
  options: CookiePersistSignalOptionsType<T>,
): WritableSignal<T>;
```

Common behavior for all five:

1. The signal starts with `initialValue`.
2. `initializeSignalState()` creates effects for loading and saving.
3. Initial loading and every scope change load asynchronously.
4. Missing, unreadable, wrong-version, invalid, undecryptable, or failed values fall back to a clone of `initialValue`.
5. Later `.set()`/`.update()` calls serialize, snapshot, debounce, and save.
6. Repeated JSON-equivalent snapshots are not saved again.
7. If `scope` is configured and no active ID exists, the field uses its initial in-memory value and does not read or write.
8. If `crossTab: true`, successful saves/removals publish the resolved key and other matching state instances reload that field.
9. `options.createSignalOptions` is forwarded to the underlying `signal(initialValue, options)`, so `equal` and `debugName` work exactly as they do on a native signal. See §5.6.

Examples:

```ts
private readonly languageStore = this.localStoragePersistSignal('language', 'en', {
  validate: (value): value is string => typeof value === 'string',
});

private readonly checkoutStepStore = this.sessionStoragePersistSignal('checkout-step', 1, {
  validate: (value): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 1,
});

private readonly deviceIdStore = this.localDbPersistSignal<string | null>('device-id', null, {
  validate: (value): value is string | null => value === null || typeof value === 'string',
});

private readonly countryNameStore = this.serverSyncSignal<string | null>('country-name', null, {
  validate: (value): value is string | null => value === null || typeof value === 'string',
  source: {
    getValue: async <T>(key: string): Promise<T | null> => {
      const value = await api.getPreference(key);
      return value as T | null;
    },
    setValue: async <T>(key: string, value: T): Promise<void> => {
      await api.setPreference(key, value);
    },
    deleteKey: async (key: string): Promise<void> => {
      await api.deletePreference(key);
    },
  },
});

private readonly affiliateCodeStore = this.cookiePersistSignal<string | null>(
  'affiliate-code',
  null,
  {
    validate: (value): value is string | null => value === null || typeof value === 'string',
    source: {
      path: '/',
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString(),
    },
  },
);

private readonly recentSearchesStore = this.localStoragePersistSignal<string[]>(
  'recent-searches',
  [],
  {
    validate: (value): value is string[] =>
      Array.isArray(value) && value.every((entry) => typeof entry === 'string'),
    createSignalOptions: {
      debugName: 'recentSearches',
      equal: (a, b) => a.length === b.length && a.every((entry, index) => entry === b[index]),
    },
  },
);
```

### 4.3 Field names and uniqueness

The `field` argument:

- is trimmed;
- must not be empty;
- is URI-encoded in storage keys;
- should remain stable across releases;
- must be unique within the same storage kind for the same state instance.

The same field name can be reused across different storage kinds:

```ts
private readonly durableDraft = this.localStoragePersistSignal('draft', '', {
  validate: (value): value is string => typeof value === 'string',
});

private readonly tabDraft = this.sessionStoragePersistSignal('draft', '', {
  validate: (value): value is string => typeof value === 'string',
});
```

Registering `localStoragePersistSignal('draft', ...)` twice throws.

### 4.4 `initializeSignalState()`

```ts
protected initializeSignalState(): void;
```

Call it once from the subclass constructor after `super()`:

```ts
constructor() {
  super();
  this.initializeSignalState();
}
```

Rules:

- all persisted fields must be declared before this method runs;
- declaring another persisted signal afterward throws;
- repeated calls are ignored;
- initial loading is asynchronous and represented by `ready`/`syncing`;
- save effects, scope-change reloads, and cross-tab listeners start here;
- `onActivate()` runs once before `initializeSignalState()` returns;
- Angular destruction triggers `onDeactivate()`, registered cleanups, effect destruction, debounce cleanup, and cross-tab listener removal.

Class field initializers run before the constructor body, so declaring stores as fields and then calling `initializeSignalState()` in the constructor is the intended ordering.

### 4.5 `ready` and `syncing`

```ts
public readonly ready: Signal<boolean>;
public readonly syncing: Signal<boolean>;
```

`ready` means the latest full load of this state's registrations has completed. It starts as `false`, becomes `false` again during full reloads caused by scope changes, and becomes `true` after the newest full load completes.

`syncing` is `true` during full registration loads. Save effects are suppressed while it is true, so restored values are not immediately written back as if they were user edits.

A single-field cross-tab reload does not toggle service-wide `syncing`.

Use `ready()` when a UI or side effect must not use declaration defaults before restoration:

```ts
effect(() => {
  if (!this.accountState.ready()) {
    return;
  }

  applyTheme(this.accountState.theme());
});
```

### 4.6 Lifecycle hooks and cleanup

```ts
protected onActivate(): void {}
protected onDeactivate(): void {}
protected registerDeactivationCleanup(cleanup: () => void): void;
```

Use `onActivate()` to start state-owned work once per state instance:

```ts
protected override onActivate(): void {
  const unsubscribe = this.ordersApi.subscribe((orders) => this.ordersStore.set(orders));
  this.registerDeactivationCleanup(unsubscribe);
}
```

Use `onDeactivate()` to stop mutable state-owned controllers, schedules, or grouped resources:

```ts
protected override onDeactivate(): void {
  this.cancelPendingSearch();
  this.reconnectController.stop();
}
```

Use `registerDeactivationCleanup()` to pair a resource with its exact disposer:

```ts
protected override onActivate(): void {
  const onResize = (): void => this.widthStore.set(window.innerWidth);

  window.addEventListener('resize', onResize);
  this.registerDeactivationCleanup(() => window.removeEventListener('resize', onResize));
}
```

Cleanup behavior:

- `onDeactivate()` runs once when Angular destroys the provider/injector that owns the state;
- registered cleanup callbacks run once in reverse registration order;
- if cleanup is registered after the state is already destroyed, it runs immediately;
- base persistence effects and cross-tab listeners are destroyed automatically;
- late async load results are ignored after destruction.

Do not inject a second `DestroyRef` just to clean state-owned resources. Prefer these lifecycle APIs.

### 4.7 Reset, clear, and snapshot APIs

Reset changes in-memory signal values back to declaration defaults. It does **not** remove persisted records directly.

```ts
public resetLocalStoragePersistedState(): void;
public resetSessionStoragePersistedState(): void;
public resetLocalDbPersistedState(): void;
public resetServerSyncedState(): void;
public resetCookiePersistedState(): void;
```

Clear removes currently resolvable records. It does **not** change current in-memory signal values.

```ts
public clearLocalStoragePersistedState(): Promise<void>;
public clearSessionStoragePersistedState(): Promise<void>;
public clearLocalDbPersistedState(): Promise<void>;
public clearServerSyncedState(): Promise<void>;
public clearCookiePersistedState(): Promise<void>;

public clearLocalStoragePersistedField(field: string): Promise<void>;
public clearSessionStoragePersistedField(field: string): Promise<void>;
public clearLocalDbPersistedField(field: string): Promise<void>;
public clearServerSyncedField(field: string): Promise<void>;
public clearCookiePersistSignal(field: string): Promise<void>;
```

Reload re-runs the load path of one field and replaces its in-memory value. It does **not** write the reloaded value back to the backend.

```ts
public reloadLocalStoragePersistedField(field: string): Promise<void>;
public reloadSessionStoragePersistedField(field: string): Promise<void>;
public reloadLocalDbPersistedField(field: string): Promise<void>;
public reloadServerSyncedField(field: string): Promise<void>;
public reloadCookiePersistedField(field: string): Promise<void>;
```

Use it when an external change makes one stored value stale before the next full load. For a server-sync field this calls the field's `source.getValue()` again; for browser backends it re-reads that backend. It is the same per-field path used by cross-tab notifications, so the stale-load sequence guard, `validate`, and the initial-value fallback all apply.

Snapshots return current in-memory values for registrations of one storage kind:

```ts
public localStoragePersistedSnapshot(): Readonly<Record<string, unknown>>;
public sessionStoragePersistedSnapshot(): Readonly<Record<string, unknown>>;
public localDbPersistedSnapshot(): Readonly<Record<string, unknown>>;
public serverSyncedSnapshot(): Readonly<Record<string, unknown>>;
public cookiePersistedSnapshot(): Readonly<Record<string, unknown>>;
```

Examples:

```ts
state.resetLocalStoragePersistedState();

await state.clearLocalStoragePersistedField('theme');
await state.clearLocalDbPersistedState();
await state.clearServerSyncedField('country-name');
await state.clearCookiePersistSignal('affiliate-code');

await state.reloadServerSyncedField('country-name');

const localValues = state.localStoragePersistedSnapshot();
const serverValues = state.serverSyncedSnapshot();
const cookieValues = state.cookiePersistedSnapshot();
```

Important semantics:

- scoped fields can only be cleared while the matching scope is active;
- unknown fields are ignored;
- a single-field reload does not toggle service-wide `ready` or `syncing`;
- a reload does not trigger a save, because it refreshes the saved snapshot before the field becomes ready again;
- clear publishes a cross-tab notification only for fields whose `crossTab` option is true;
- reset can later save defaults because it writes to the signal and clears the saved snapshot;
- snapshots are shallow top-level objects; nested objects are not deep-cloned.

---

## 5. Persistence options

All persisted signal factories share these base options:

```ts
interface PersistSignalOptionsBaseType<T> {
  version?: number;
  debounceMs?: number;
  scope?: string;
  validate: (value: unknown) => value is T;
  serialize?: (value: T) => unknown;
  deserialize?: (value: unknown) => T;
  deleteOnNull?: boolean;
  plainValue?: boolean;
  createSignalOptions?: CreateSignalOptions<T>;
}
```

Local, session, and cookie options add `crossTab?: boolean`.

Cookie options also accept an optional `source` object:

```ts
interface SignalStateCookieSourceType {
  url?: string;
  path?: string;
  expires?: string;
}
```

Local DB and server sync options add both `crossTab?: boolean` and an optional source:

```ts
interface SignalStateLocalDbSourceType {
  getValue: <T>(key: string) => Promise<T | null>;
  setValue: <T>(key: string, value: T) => Promise<void>;
  deleteKey?: (key: string) => Promise<void>;
}

interface SignalStateServerSyncSourceType {
  getValue: <T>(key: string) => Promise<T | null>;
  setValue: <T>(key: string, value: T) => Promise<void>;
  deleteKey?: (key: string) => Promise<void>;
}
```

| Option         | Required               | Default                   | Details                                                                                                               |
| -------------- | ---------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `validate`     | Yes                    | None                      | Runtime type guard applied after optional deserialization.                                                            |
| `version`      | No                     | `1`                       | Envelope version expected on load and written on save. Exact numeric match is required.                               |
| `debounceMs`   | No                     | `200`                     | Trailing-edge delay before saving a changed signal.                                                                   |
| `scope`        | No                     | Global                    | Scope type whose active ID is inserted into the key. Empty strings throw when provided.                               |
| `serialize`    | No                     | Identity                  | Converts runtime `T` to a JSON-compatible persisted representation.                                                   |
| `deserialize`  | No                     | Identity                  | Converts loaded persisted data back to runtime `T`.                                                                   |
| `deleteOnNull` | No                     | `false`                   | Removes the backend record when the persisted representation is `null`.                                               |
| `crossTab`     | No                     | `false`                   | Publishes exact-key notifications after successful save/remove.                                                       |
| `plainValue`   | No                     | `false`                   | Stores the raw value instead of an encrypted envelope. Plain records carry no version, so `version` cannot invalidate them. |
| `source`       | Local DB/server/cookie | Backend-specific default. | Custom DB/server adapter or cookie options. Cookie `path`/`expires` apply on save; `url` applies on save/load/delete. |
| `createSignalOptions` | No              | `undefined`               | Native signal options forwarded to `signal()`. `equal` controls change detection for user writes and restores; `debugName` is DevTools-only. |

### 5.1 Validation

Primitive validator:

```ts
validate: (value): value is boolean => typeof value === 'boolean';
```

Object/array validator:

```ts
interface ColumnConfig {
  id: string;
  visible: boolean;
}

function isColumnConfig(value: unknown): value is ColumnConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ColumnConfig>;
  return typeof candidate.id === 'string' && typeof candidate.visible === 'boolean';
}

validate: (value): value is ColumnConfig[] => Array.isArray(value) && value.every(isColumnConfig);
```

If validation returns `false`, the field falls back to its initial value. Invalid records are not automatically deleted.

### 5.2 Versioning and migration

The stored envelope's `v` must equal the configured `version`. A field expecting version `2` treats an existing version `1` record as unavailable.

```ts
private readonly settingsStore = this.localStoragePersistSignal('settings', defaultSettings, {
  version: 2,
  validate: isSettingsV2,
});
```

There is no migration callback. Migration choices:

1. migrate with low-level storage services before constructing the new state;
2. read a legacy key in app startup, transform it, and save the new version;
3. use a new field name;
4. clear old records and let defaults be saved.

### 5.3 Serialization and deserialization

Use hooks for runtime values that JSON cannot restore naturally, such as `Date`, `Map`, or classes.

```ts
private readonly lastLoginStore = this.localStoragePersistSignal<Date | null>('last-login', null, {
  serialize: (value) => value?.toISOString() ?? null,
  deserialize: (value) => (typeof value === 'string' ? new Date(value) : null),
  validate: (value): value is Date | null =>
    value === null || (value instanceof Date && Number.isFinite(value.getTime())),
});
```

Save pipeline:

```text
runtime signal value
  -> serialize(value), if provided
  -> JSON serializability and duplicate snapshot check
  -> remove the backend record when deleteOnNull is true and the value is null
  -> SignatureService.encryptJson(...)
  -> { v, u, s } envelope
  -> backend write
```

Load pipeline:

```text
backend record
  -> parse/check envelope, if required by that adapter
  -> version check
  -> SignatureService.decryptJson(...), for encrypted envelopes
  -> deserialize(value), if provided
  -> validate(value)
  -> signal.set(value)
```

`validate` checks the deserialized runtime value, not the serialized form.

### 5.4 Debounce and duplicate-write suppression

On every persisted signal write after loading:

1. optional `serialize` runs;
2. the persisted representation is JSON-stringified;
3. if the snapshot equals the last loaded/saved snapshot, nothing is saved;
4. otherwise a timer is scheduled for `debounceMs`;
5. a newer write before the timer fires cancels the older timer;
6. the selected adapter saves the encrypted envelope.

Notes:

- `JSON.stringify(...) === undefined` throws;
- circular structures throw;
- non-JSON values need `serialize`;
- object property order affects snapshot equality;
- serializer errors and save failures are logged and do not throw from the setter;
- use a non-negative finite `debounceMs` by convention. The implementation does not validate it.

### 5.5 Cross-tab sync

When `crossTab: true`:

- successful save publishes the resolved storage key;
- successful remove publishes the resolved storage key;
- listeners in other matching state instances reload only that field;
- listeners are rebuilt when scopes change;
- the notification contains the key, not the state payload;
- simultaneous writes are not merged; the receiving side loads whatever the backend returns.

`SignalStateCrossTabSync` uses `BrowserTabsSyncService` broadcast and local-storage-event plumbing. Session-storage fields can be notified, but each tab reloads from its own tab-scoped session storage. Cookie fields reload from the cookie backend for the resolved key. Server-sync fields with `crossTab: true` additionally mirror loaded/saved server payloads into session storage for temporary per-tab fallback.

### 5.6 Create-signal options (`equal` and `debugName`)

`createSignalOptions` is passed straight to the native `signal()` call that backs the field:

```ts
signal(initialValue, options.createSignalOptions);
```

```ts
interface CreateSignalOptions<T> {
  equal?: (a: T, b: T) => boolean;
  debugName?: string;
}
```

`debugName` only labels the signal in Angular DevTools. It has no effect on persistence.

`equal` matters more, because a persisted write passes through two suppression layers:

1. **`equal`** — the native signal gate. `.set()`/`.update()` with a value the comparator calls equal does not change the signal, so no dependent recomputes and the save effect never reruns.
2. **JSON snapshot comparison** — the persistence gate in §5.4. It runs only when the signal actually changed.

`equal` is therefore the cheaper gate: it stops the work before serialization and stringification happen. Use it for object/array fields that are rebuilt on every update but are frequently structurally identical.

Defaults and semantics:

- without `equal`, Angular's default `Object.is`-style referential comparison applies;
- `equal` receives runtime values of `T`, not the persisted representation, so it runs before `serialize`;
- `equal` also gates the service's own restore writes: initial load, scope-change reloads, `reload*PersistedField()`, and `reset*PersistedState()`;
- restore paths read the value back from the signal after setting it, so `lastSavedSnapshot` always reflects what the signal really holds, even when `equal` rejects a restore.

Cautions:

- an over-loose `equal` silently stops persistence for every change it calls equal — the value never changes, so nothing is ever scheduled;
- an `equal` that returns `true` too often also blocks restored values from replacing the current in-memory value;
- keep `equal` pure, total, and cheap; it runs on every write;
- deep-equality by `JSON.stringify` inside `equal` duplicates work the snapshot layer already does. Prefer a targeted structural comparison.

```ts
private readonly filtersStore = this.sessionStoragePersistSignal<FiltersType>(
  'filters',
  defaultFilters,
  {
    validate: isFiltersType,
    createSignalOptions: {
      equal: (a, b) => a.page === b.page && a.size === b.size && a.term === b.term,
    },
  },
);
```

---

## 6. Scopes

Scopes isolate persisted data by an active identity.

Global field:

```ts
private readonly themeStore = this.localStoragePersistSignal('theme', 'system', {
  validate: isTheme,
});
```

Scoped field:

```ts
private readonly filterStore = this.localStoragePersistSignal('filter', '', {
  scope: 'user',
  validate: (value): value is string => typeof value === 'string',
});
```

A field has either one scope type or no scope. Multiple simultaneous scope segments on one field are not supported.

`SignalStateScope` API:

```ts
public readonly scopes: Signal<Readonly<Record<string, string>>>;
public setScope(type: string, id: string | number | null | undefined): void;
public getScope(type: string): SignalStateScopeType | null;
public clearScope(type: string): void;
public clearAll(): void;
public snapshot(): Readonly<Record<string, string>>;
```

Usage:

```ts
this.scope.setScope('user', 42); // stores { user: '42' }
this.scope.setScope('user', null); // removes user
this.scope.clearScope('tenant'); // removes tenant
this.scope.clearAll(); // removes all scopes
```

Scope-change behavior:

1. every initialized state observes the root scope registry;
2. cross-tab listeners are rebuilt for newly resolved keys;
3. all persisted registrations in the state reload, including global fields;
4. `ready=false` and `syncing=true` during the full reload;
5. scoped fields use the new active ID or reset to initial value if no ID exists.

There is no fallback from a scoped key to a global key, and data from different scopes is never merged.

Switching identities:

```ts
state.setUserScope(42); // loads user 42 records
state.setUserScope(84); // loads user 84 records
state.clearUserScope(); // scoped fields return to initial in-memory values
```

Clearing a scope does not delete records for the previous scope. To delete a user-specific field, clear while that user is active:

```ts
state.setUserScope(42);
await state.clearLocalStoragePersistedField('filter');
state.clearUserScope();
```

---

## 7. Storage keys

All adapters use the same key text format and the prefix `ss`.

Global key:

```text
ss.<storeKey>.<field>
```

Scoped key:

```text
ss.<scope-type>.<scope-id>.<storeKey>.<field>
```

Examples:

```text
ss.account.theme
ss.user.42.account.preferences
```

Every segment is trimmed and encoded with `encodeURIComponent`.

```ts
storeKey = 'shopping cart';
field = 'sort/order';
```

becomes:

```text
ss.shopping%20cart.sort%2Forder
```

The same key text may exist independently in different backends, such as local storage, session storage, cookies, and local DB, because those storage areas are separate.

---

## 8. Stored envelopes and encryption

Encrypted adapters save this envelope shape:

```ts
interface SignalStateStorageEnvelopeType {
  v: number; // schema version
  u: string; // ISO updated timestamp
  s: string; // encrypted JSON payload
}
```

After load/decryption the low-level adapters return:

```ts
interface SignalStateStorageValueType<T> {
  v: number;
  u: string;
  s: T;
}
```

Behavior by adapter:

- local storage, session storage, cookies, and local DB require a valid encrypted envelope and exact version;
- server sync accepts either a valid encrypted envelope or a plain value returned by the provided source;
- plain server values are wrapped conceptually as `{ v: expectedVersion, u: now, s: stored }` before high-level validation;
- malformed envelopes, wrong versions, storage errors, decryption errors, and JSON errors load as `null`;
- the high-level service then applies the field's initial value.

Security note: this is application-level encryption/obfuscation using `SignatureService`. Browser storage and client-side secrets are not a secure vault. Do not store passwords, private keys, refresh tokens, or other high-impact secrets merely because this module encrypts values.

---

## 9. Low-level services

### 9.1 `SignalStateLocalStorage`

```ts
const storage = inject(SignalStateLocalStorage);
const key = storage.buildStorageKey('account', 'theme', null);

await storage.save(key, 'dark', 1);
const value = await storage.load<'light' | 'dark' | 'system'>(key, 1);
await storage.remove(key);
```

Methods:

```ts
buildStorageKey(store: string, field: string, scope: SignalStateScopeType | null): string;
save<T>(key: string, state: T, version = 1): Promise<void>;
load<T>(key: string, expectedVersion = 1): Promise<SignalStateLocalStorageValueType<T> | null>;
remove(key: string): Promise<void>;
```

### 9.2 `SignalStateSessionStorage`

Same API as local storage, but delegates to `BrowserSessionStorageService`.

```ts
const storage = inject(SignalStateSessionStorage);
const key = storage.buildStorageKey('checkout', 'draft', null);

await storage.save(key, { step: 2 }, 1);
const value = await storage.load<{ step: number }>(key, 1);
await storage.remove(key);
```

### 9.3 `SignalStateLocalDb`

Defaults to `AppStateRepository`, but `save`, `load`, and `remove` can receive a custom `SignalStateLocalDbSourceType`.

```ts
const localDb = inject(SignalStateLocalDb);
const key = localDb.buildStorageKey('device', 'did', null);

await localDb.save(key, 'abc-123', 1);
const stored = await localDb.load<string>(key, 1);
await localDb.remove(key);
```

Custom source in a state field:

```ts
private readonly didCustomStore = this.localDbPersistSignal<string | null>('did-custom', null, {
  validate: (value): value is string | null => value === null || typeof value === 'string',
  source: {
    getValue: <T>(key: string) => this.appConfigRepository.getValue(key) as Promise<T | null>,
    setValue: <T>(key: string, value: T) => this.appConfigRepository.setValue(key, value),
    // deleteKey is optional. If omitted, clear/remove writes null with setValue().
  },
});
```

If `deleteKey` is missing, removal writes `null` through `setValue(key, null)`.

### 9.4 `SignalStateServerSync`

`SignalStateServerSync` uses a no-op empty source unless one is provided. A state should usually provide a source in `serverSyncSignal()` options.

```ts
private readonly profileNameStore = this.serverSyncSignal<string | null>('profile-name', null, {
  debounceMs: 500,
  crossTab: true,
  validate: (value): value is string | null => value === null || typeof value === 'string',
  source: {
    getValue: async <T>(key: string) => (await this.api.getProfileSetting(key)) as T | null,
    setValue: async <T>(key: string, value: T) => {
      await this.api.setProfileSetting(key, value);
    },
    deleteKey: async (key: string) => {
      await this.api.deleteProfileSetting(key);
    },
  },
});
```

Server sources may return either:

- the encrypted envelope saved previously by `SignalStateServerSync.save()`, or
- a plain domain value, which is then validated by `SignalStateService`.

If `deleteKey` is missing, removal writes `null` through `setValue(key, null)`.

### 9.5 `SignalStateCookie`

`SignalStateCookie` delegates to `CookieService`. Cookie values are JSON-stringified encrypted envelopes, so this backend is best for small values.

```ts
const cookie = inject(SignalStateCookie);
const key = cookie.buildStorageKey('account', 'affiliate-code', null);

await cookie.save(key, 'summer-2026', 1, { path: '/', expires: 'Tue, 04 Aug 2026 00:00:00 GMT' });
const value = await cookie.load<string>(key, 1);
await cookie.remove(key);
```

Methods:

```ts
buildStorageKey(store: string, field: string, scope: SignalStateScopeType | null): string;
save<T>(
  key: string,
  state: T,
  version = 1,
  options?: SignalStateCookieSourceType,
): Promise<void>;
load<T>(
  key: string,
  expectedVersion = 1,
  options?: SignalStateCookieSourceType,
): Promise<SignalStateCookieValueType<T> | null>;
remove(key: string, options?: SignalStateCookieSourceType): Promise<void>;
```

Cookie limitations:

- browser cookie size limits are small, so prefer compact values;
- client-side code cannot create meaningful `HttpOnly` cookies;
- platform-specific URL/domain handling is controlled by `CookieService`;
- for security-critical cookie attributes, use server `Set-Cookie` headers.

### 9.6 `SignalStateCrossTabSync`

```ts
const sync = inject(SignalStateCrossTabSync);
const cleanup = sync.listen('ss.account.theme', () => {
  console.log('The key changed in another browser context.');
});

sync.publish('ss.account.theme');
cleanup();
```

`listen()` returns a cleanup function. `publish()` sends a key notification only; it does not write storage and does not include a payload.

---

## 10. Lifecycle and internal flow

### 10.1 Construction and initial load

```text
Angular creates subclass
  -> class field initializers run
  -> persisted field factories register WritableSignals
  -> constructor calls initializeSignalState()
  -> scope effect and save effects are created
  -> Angular DestroyRef cleanup is registered
  -> onActivate() runs
  -> scope effect starts async loadAllRegistrations()
  -> ready=false, syncing=true
  -> every registration loads or falls back to its initial value
  -> ready=true, syncing=false
```

`onActivate()` does not mean persisted values are ready. If setup needs restored values, gate it with `ready()`:

```ts
protected override onActivate(): void {
  const reference = effect((onCleanup) => {
    if (!this.ready()) {
      return;
    }

    const stop = this.runtimeSource.watch(this.selectedWorkspaceId());
    onCleanup(stop);
  });

  this.registerDeactivationCleanup(() => reference.destroy());
}
```

### 10.2 User write to backend save

```text
state.setQuery('ameri')
  -> private queryStore.set('ameri')
  -> optional equal from createSignalOptions (equal value stops here)
  -> Angular effect tracking registration.state() reruns
  -> optional serialize
  -> JSON snapshot comparison
  -> resolve key from storeKey + field + active scope
  -> debounce timer
  -> selected adapter save(...)
  -> encrypted envelope is persisted
  -> optional cross-tab key notification
```

A normal `signal()` is never added to the registrations map, so it has no persistence effect and is memory-only.

### 10.3 Scope changes and stale-load protection

Scope changes cause full reloads. The service uses sequence counters so older async results cannot overwrite newer results when scopes change quickly.

```ts
scopes.setScope('user', 42);
scopes.setScope('user', 84);
```

If user `42` finishes loading after user `84`, the user `42` result is ignored.

### 10.4 Destruction

On Angular provider destruction:

1. the service is marked destroyed;
2. `onDeactivate()` runs;
3. registered cleanup callbacks run in reverse order;
4. full-load and per-registration sequences are invalidated;
5. persistence effects are destroyed;
6. effect cleanup cancels pending debounce timers;
7. cross-tab listeners are removed;
8. late async results are ignored.

Provider scope controls when this happens. Component-provided states are destroyed with the component injector. Root-provided states normally live until the application injector is destroyed.

---

## 11. Practical recipes

### 11.1 Global theme synced across tabs

```ts
private readonly themeStore = this.localStoragePersistSignal<Theme>('theme', 'system', {
  crossTab: true,
  validate: isTheme,
});
```

Key: `ss.<storeKey>.theme`.

### 11.2 Per-user preference

```ts
private readonly pageSizeStore = this.localStoragePersistSignal('page-size', 25, {
  scope: 'user',
  validate: (value): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value > 0,
});
```

For user `42`: `ss.user.42.<storeKey>.page-size`.

### 11.3 Current-tab draft

```ts
private readonly formDraftStore = this.sessionStoragePersistSignal<FormDraft>(
  'form-draft',
  EMPTY_FORM_DRAFT,
  {
    scope: 'user',
    debounceMs: 400,
    validate: isFormDraft,
  },
);
```

### 11.4 Local DB value with default repository

```ts
private readonly didStore = this.localDbPersistSignal<string | null>('did', null, {
  crossTab: true,
  validate: (value): value is string | null => value === null || typeof value === 'string',
});
```

### 11.5 Server-backed state

```ts
private readonly serverFilterStore = this.serverSyncSignal<Filter>('filter', DEFAULT_FILTER, {
  scope: 'user',
  debounceMs: 500,
  crossTab: true,
  validate: isFilter,
  source: {
    getValue: async <T>(key: string) => (await this.preferencesApi.get(key)) as T | null,
    setValue: async <T>(key: string, value: T) => {
      await this.preferencesApi.set(key, value);
    },
    deleteKey: async (key: string) => {
      await this.preferencesApi.delete(key);
    },
  },
});
```

### 11.6 Resync one server field when a related signal changes

A server-sync field is loaded on construction, on scope changes, and on cross-tab notifications. When another signal makes it stale before any of those happen, reload only that field.

```ts
protected override onActivate(): void {
  let primed = false;
  let previous: boolean | null = null;

  const resyncEffect = effect(() => {
    const authenticated = this.authenticated();

    if (!this.ready()) {
      return;
    }

    // the initial load already called getValue(), do not fetch twice on startup
    if (!primed) {
      primed = true;
      previous = authenticated;
      return;
    }

    if (previous === authenticated) {
      return;
    }
    previous = authenticated;

    void this.reloadServerSyncedField('authenticated');
  });

  this.registerDeactivationCleanup(() => resyncEffect.destroy());
}
```

The previous-value guard is required because the effect also reads `ready()`, which toggles on scope changes. Without it, a scope change would trigger a redundant single-field reload on top of the full reload it already causes.

### 11.7 Wait for restored persisted values before API work

```ts
protected override onActivate(): void {
  const readyEffect = effect(() => {
    if (!this.ready()) {
      return;
    }

    void this.loadRows(this.filter());
  });

  this.registerDeactivationCleanup(() => readyEffect.destroy());
}
```

Because `ready` toggles after scope changes, this pattern can reload for a new identity. Add a one-shot flag if the work should happen only once.

### 11.8 Logout while preserving saved scoped data

```ts
public logout(): void {
  this.scope.clearScope('user');
  this.resetRuntimeState();
}
```

### 11.9 Logout and delete active user's persisted data

```ts
public async logoutAndForget(): Promise<void> {
  await this.clearLocalStoragePersistedField('search');
  await this.clearSessionStoragePersistedField('draft');
  await this.clearLocalDbPersistedField('did');
  await this.clearServerSyncedField('filter');

  this.scope.clearScope('user');
  this.resetRuntimeState();
}
```

Clear while the scope is still active. Otherwise the scoped key cannot be resolved.

### 11.10 Event listener owned by a state

```ts
@Injectable()
export class ViewportState extends SignalStateService {
  protected override readonly storeKey = 'viewport';

  private readonly widthStore = signal(typeof window === 'undefined' ? 0 : window.innerWidth);
  public readonly width = this.widthStore.asReadonly();

  constructor() {
    super();
    this.initializeSignalState();
  }

  protected override onActivate(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const onResize = (): void => this.widthStore.set(window.innerWidth);
    window.addEventListener('resize', onResize);
    this.registerDeactivationCleanup(() => window.removeEventListener('resize', onResize));
  }
}
```

### 11.11 Mutable timer cleanup

```ts
@Injectable()
export class SearchState extends SignalStateService {
  protected override readonly storeKey = 'search';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.initializeSignalState();
  }

  public scheduleSearch(query: string): void {
    this.cancelScheduledSearch();
    this.searchTimeout = setTimeout(() => {
      this.searchTimeout = null;
      void this.runSearch(query);
    }, 300);
  }

  protected override onDeactivate(): void {
    this.cancelScheduledSearch();
  }

  private cancelScheduledSearch(): void {
    if (this.searchTimeout !== null) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
  }

  private async runSearch(query: string): Promise<void> {
    // Load rows and update runtime signals.
  }
}
```

---

## 12. Error and fallback behavior

| Situation                                     | Result                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| Empty persisted field                         | Registration throws.                                                    |
| Duplicate field in the same storage kind      | Registration throws.                                                    |
| Persisted field declared after initialization | Registration throws.                                                    |
| Empty provided `scope` option                 | Registration throws.                                                    |
| Empty scope type passed to `setScope`         | Throws.                                                                 |
| Empty scope ID passed to `setScope`           | Removes that scope type.                                                |
| Scoped field with no active ID                | Uses initial value and does not read/write.                             |
| Missing storage/backend record                | Uses initial value.                                                     |
| Wrong version                                 | Uses initial value.                                                     |
| Invalid envelope                              | Uses initial value.                                                     |
| Decryption/storage/backend load failure       | Uses initial value.                                                     |
| Server source returns plain value             | Value is deserialized/validated and can be used.                        |
| Deserializer throws                           | Logs error and uses initial value.                                      |
| Validator returns false                       | Uses initial value.                                                     |
| Serializer throws                             | Logs error and skips that save.                                         |
| Save fails                                    | Logs error; signal keeps its in-memory value.                           |
| JSON snapshot cannot be produced              | Throws from snapshot creation; use JSON-compatible data or `serialize`. |
| Clear unknown field                           | No operation.                                                           |
| Clear scoped field without active scope       | No operation.                                                           |

---

## 13. Important caveats

1. Always call `initializeSignalState()`; otherwise persisted signals behave like ordinary in-memory signals.
2. Restoration is asynchronous; use `ready()` when restored values are required.
3. `onActivate()` runs before persistence restoration completes.
4. Validation is required; generics alone are not runtime validation.
5. Persisted values must be JSON-compatible after optional serialization.
6. Scope registry is root/shared; changing `user` affects every state watching `user` scopes.
7. Any scope-registry change triggers a full reload in initialized states, including global fields.
8. A scoped field never falls back to a global key.
9. Changing or clearing scopes does not delete old records.
10. Reset and clear are different: reset changes memory; clear removes backend records.
11. Cross-tab sync sends notifications, not payloads, and does not merge concurrent edits.
12. Session storage remains tab-scoped even when cross-tab notification is enabled.
13. Server sync without a source is effectively read-null/write-no-op.
14. Snapshots are shallow containers.
15. Do not mutate objects in place without `.set()`/`.update()`.
16. Version changes do not migrate records automatically.
17. Do not manually deactivate a state; Angular injector destruction owns lifecycle.
18. Keep writable stores private and expose read-only signals.
19. Do not store high-impact secrets in browser/local app state.
20. A custom `equal` in `createSignalOptions` gates the service's restore writes as well as user writes; an over-loose comparator silently stops both persistence and restoration.

Correct immutable update:

```ts
this.preferencesStore.update((current) => ({
  ...current,
  pageSize: 50,
}));
```

Avoid in-place mutation:

```ts
this.preferencesStore().pageSize = 50;
```

---

## 14. Testing guidance

Test subclasses in an Angular injection context because the base class uses `inject()`.

Recommended coverage:

- defaults before/after absent records;
- successful restoration of valid values;
- fallback for invalid values and wrong versions;
- serializer/deserializer round trips;
- debounce timing and duplicate-save suppression;
- global and scoped key formats;
- scope switching and no-active-scope behavior;
- reset, clear, and snapshot methods for each backend used;
- local DB custom source behavior;
- server source returning encrypted envelopes and plain values;
- cross-tab field reloads;
- `ready`/`syncing` transitions;
- lifecycle hook execution and cleanup ordering;
- cleanup registered after destruction;
- destruction before pending debounce, subscription, timer, or storage load completes.

Example test shape:

```ts
describe('AccountState', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccountState,
        // Provide or mock storage/signature/source dependencies.
      ],
    });
  });

  it('uses a user-specific preference key', () => {
    const state = TestBed.inject(AccountState);
    const scopes = TestBed.inject(SignalStateScope);

    scopes.setScope('user', 42);

    expect(scopes.getScope('user')).toEqual({ type: 'user', id: '42' });
    expect(state.preferences()).toBeDefined();
  });
});
```

Use fake timers for `debounceMs` behavior.

---

## 15. Developer checklist

Before adding a persisted field:

- [ ] Is persistence required, or should this be a normal `signal()`?
- [ ] Which backend is correct: local, session, local DB, or server sync?
- [ ] Is `storeKey` stable and unique?
- [ ] Is the field name stable and unique within that storage kind?
- [ ] Does it need a scope, and is that scope activated before writes?
- [ ] Is the runtime validator strict enough?
- [ ] Is the value JSON-compatible after optional `serialize`?
- [ ] Are `serialize` and `deserialize` logical inverses?
- [ ] Does schema evolution require a version bump and migration plan?
- [ ] Is the default 200 ms debounce appropriate?
- [ ] Does this field need a custom `equal` (structural comparison for objects/arrays), and is that comparator strict enough to still allow real changes and restores?
- [ ] Should cross-tab notification be enabled?
- [ ] Does UI/workflow code wait for `ready()` where required?
- [ ] Are reset and clear semantics correct for logout/restore-default workflows?
- [ ] Are writable stores private and read-only signals public?
- [ ] Does the state acquire listeners, subscriptions, timers, observers, channels, or SDK handles?
- [ ] Is every acquired resource paired with `registerDeactivationCleanup()` or `onDeactivate()`?
- [ ] Is provider scope correct for the intended lifetime?

---

## 16. Repository examples

The focused example in `libs/src/signal-state/example/user-module/` demonstrates:

- runtime-only `loading`, `users`, and `error` signals;
- computed `hasUsers` and `darkMode` signals;
- a user-scoped search string;
- a global theme with cross-tab sync;
- a scoped preference object updated immutably;
- scope activation/clearing;
- separation between state (`UserModuleState`) and workflow service (`UserModuleService`).

The larger `libs/src/signal-state/example/state.ts` additionally shows patterns for local DB fields, custom local DB sources, server-sync fields, Angular resources, WebSocket-style cleanup, and mixing runtime state with persisted state.
