# User module state example

Provide the state and service at the feature-module or route/component level:

```ts
providers: [UserModuleState, UserModuleService];
```

Each persisted field chooses one optional scope directly in its options:

```ts
private readonly searchStore = this.localStoragePersistSignal('search', '', {
  scope: 'user',
  validate: (value): value is string => typeof value === 'string',
});
```

A field without `scope` is global. A field with `scope: 'user'` requires an active user ID and uses only that user's key. There is no fallback or automatic merge.

After login or session restoration, set the active user scope:

```ts
const userService = inject(UserModuleService);
userService.initializeUser(authenticatedUser.id);
```

For user `42`, this example uses these keys:

```text
ss.user.42.user.search
ss.user.theme
ss.user.42.user.preference
```

The scoped key segments are:

```text
ss.<scope-type>.<scope-id>.<storeKey>.<field>
```

The global key segments are:

```text
ss.<storeKey>.<field>
```

If a field declares a scope but its ID is not active, the field uses its initial in-memory value and does not read or write local storage. It never falls back to a global key.

Runtime signals (`loading`, `users`, `error`) are never saved. Local-storage signals (`search`, `theme`, `preference`) are encrypted through `SignatureService` and validated before loading.

On logout:

```ts
userService.logout();
```

Clearing the user scope does not delete user `42`'s stored values. To delete a user-scoped field intentionally, clear it while that user scope is still active:

```ts
await state.clearLocalStoragePersistedField('search');
```

## Browser-session persistence

Use `sessionStoragePersistSignal()` when a value should survive page reloads in the current tab but disappear after the tab or browser session is closed:

```ts
private readonly draftStore = this.sessionStoragePersistSignal('draft', '', {
  scope: 'user',
  validate: (value): value is string => typeof value === 'string',
});
```

Session-storage signals use the same encryption, versioning, validation, debounce, serialization, scope, and optional `crossTab` behavior as local-storage signals. Because browser `sessionStorage` is tab-scoped, cross-tab notifications reload the matching field in the receiving tab from that tab's own session storage.

The corresponding management methods are:

```ts
state.resetSessionStoragePersistedState();
await state.clearSessionStoragePersistedField('draft');
await state.clearSessionStoragePersistedState();
const snapshot = state.sessionStoragePersistedSnapshot();
```
