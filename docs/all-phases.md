# Signal-based routing upgrade

Visual companion (diagrams + before/after code): https://claude.ai/code/artifact/4a032ef8-c98e-4192-a6bb-3570b144bf15
⚠ Predates the Phase 1 redesign — it still shows `libs/src/router/RouterStore`. Use the API table in Phase 1 below to translate.

**Phase status:** Phase 1 spec finalised in [route-phase-1.md](docs/route-phase-1.md) and audited against the live tree (`@angular/router@22.1.1`). Phases 2–3 below are re-pointed at the Phase 1 API but not yet detailed to the same depth.

## Context

The route layer is well structured but pre-signal. Every URL segment is a `SLUG_*` constant, every path is built through `UrlService`, and each module owns a `route.ts` — that convention stays untouched.

What sits on top of it is Angular 15-era: route state is read from `ActivatedRoute.snapshot` and pushed into signals by hand. Two manual `NavigationEnd` subscriptions exist purely to copy the URL into state ([base/crud/component.ts:56](src/app/base/crud/component.ts#L56), [libs/src/url/service.ts:40](libs/src/url/service.ts#L40)). This causes three real defects, not just style debt:

1. **Guards mutate one-shot state.** [area/guard.ts:21](src/app/area/guard.ts#L21) calls `useRedirectAfterAuth()`, which clears the stored URL. `canMatch` can run more than once per navigation and across sibling candidates, so a rejected candidate can silently consume the user's saved deep link.
2. **Snapshot params go stale.** On `country/update/:id` the parent component stays mounted between records, so `update/7` → `update/9` reads the old id unless something re-triggers by hand.
3. ~~**Duplicate wildcard.**~~ **Resolved before Phase 1.** [app.routes.ts](src/app/app.routes.ts) now spreads only `OpenAreaRoute.routes()`; `**` lives once, at [area/open/route.ts:36](src/app/area/open/route.ts#L36). `/account/nonsense` still reaches it by backtracking. The `pathMatch: 'full'` on `'**'` ([not-found/route.ts:32](src/app/module/shared/http-status/not-found/route.ts#L32)) remains — it is a no-op Angular ignores, flagged not removed.

Outcome: route state becomes a signal at the root and everything downstream becomes `computed()`, with no subscription to register, no init call to remember, and no window where state and URL disagree.

### Verified API constraints (checked against installed `@angular/router@22.1.1`)

- **`ActivatedRoute` has no signal properties.** Still Observable-only — but **no `toSignal()` bridge is needed either.** `Router.lastSuccessfulNavigation` is already a signal, and `routerState` is already swapped by the time it fires, so a plain `computed` over it is sufficient. Phase 1 ends up with zero rxjs in `state.ts`.
- **`paramsInheritanceStrategy` already defaults to `'always'`** — `DEFAULT_PARAMS_INHERITANCE_STRATEGY` at `_router-chunk.mjs:1498`. An earlier draft listed `withRouterConfig(...)` as a Phase 1 prerequisite; **it is not, and there is no breadcrumb regression risk from it.**
- **`Data` is a type alias** (`type Data = { [key: string|symbol]: any }`), not an interface. Declaration merging is unavailable; use a `UrlRouteDataType` interface + `defineRoute()` helper instead.
- **`Router.currentNavigation` and `lastSuccessfulNavigation` are already `Signal<Navigation|null>`** and already used in the codebase. `currentNavigation` is declared `{ equal: () => false }` (`:3651`) so it re-notifies mid-navigation — correct for a `navigating` flag, wrong as a settled-state trigger. `lastSuccessfulNavigation` uses default equality and is `.set()` with a **fresh object literal** per navigation (`:3742` builds it, `:3916` sets it) — it notifies exactly once per successful navigation. That is the trigger everything derives from.
- **`isActive(url, router, matchOptions): Signal<boolean>`** exists (`@publicApi 21.1`), currently unused. Angular implements it with this exact pattern — `computed(() => containsTree(router.lastSuccessfulNavigation()?.finalUrl ?? ...))` at `:186`.
- `linkedSignal`, `RedirectCommand(urlTree, navigationBehaviorOptions?)`, `TitleStrategy`, `PreloadingStrategy` all confirmed present.

### Deliberately out of scope

Resolvers stay at zero. The existing `resource()`-in-state pattern ([libs/src/context-profile/state.ts:182](libs/src/context-profile/state.ts#L182)) is the better fit for this app. Recording it so it reads as a choice, not an oversight.

---

## Phase 1 — Foundation

No behaviour change. Ships independently. **Full spec: [route-phase-1.md](docs/route-phase-1.md) — that document is authoritative, this is the summary.**

### Design change from the original draft

The draft above proposed a new `libs/src/router/` package holding a `RouterStore`.
**That was dropped.** The route signals live on the existing `UrlState` instead, and
`UrlState` / `UrlService` become root singletons via `provideUrlModule()`.

Reasons: `UrlService` already owned a `NavigationEnd` subscription and the leaf
walk, so a `RouterStore` would have been a second home for the same job; the app's
`state.ts` / `service.ts` split is an established convention worth extending
rather than sidestepping; and the whole point of moving `UrlService` to root is
that a component-scoped route reader is the actual defect. A separate store would
have left that unfixed.

So the API names change everywhere below:

| draft | actual |
|---|---|
| `RouterStore` | `UrlState` (root singleton) |
| `store.leaf()` | `state.activatedRouteSnapshot()` |
| `store.url()` | `state.routeUrl()` |
| `store.params()` | `state.routeParams()` |
| `store.queryParams()` | `state.routeQueryParams()` |
| `store.data()` | `state.routeData()` |
| `store.chain()` | `state.routePathFromRoot()` |
| `store.navigating()` | `state.routeNavigating()` |
| `routeParam(name)` | `state.getRouteParam(name)` |
| `routeQueryParam(name)` | `state.getRouteQueryParam(name)` |
| `libs/src/router/type.ts` → `RouteData` | `libs/src/url/type.ts` → `UrlRouteDataType` |
| — (new) | `state.getActivatedRouteSnapshot()` — live read for activation-time callers |
| — (new) | `state.readRouteParam()` / `readRouteQueryParam()` — live one-shots |

### What Phase 1 actually ships

- Route signals on `UrlState`, derived from `router.lastSuccessfulNavigation()`. No subscription, no rxjs.
- The nine host signals (`protocol` … `password`) converted from pushed to `computed`, fixing a staleness bug where they were only populated on modules that enabled URL sync.
- `UrlState` + `UrlService` as root singletons; `URL_PROVIDER` removed from 5 component `providers` blocks.
- URL ownership (`urlOwnerPath`) — needed because a root `urlSyncEnabled` no longer dies with the component.
- `getActiveRoute()` deleted; `getModuleActivatedRoute()` rewritten to walk down from the root instead of up from an injected `ActivatedRoute`.
- The set/patch wrapper collapse — 8 mechanical call-site updates in `base/crud/url.ts`.
- `UrlRouteDataType` + `defineRoute()` declared in `libs/src/url/type.ts`, **unconsumed** until Phase 3, so route files are edited once.

### Config

**No `withRouterConfig(...)`** — `paramsInheritanceStrategy` already defaults to `'always'`.
The only `app.config.ts` change is adding `provideUrlModule()` after `provideRouter(...)`.

### Deletions deferred out of Phase 1

These are route-file edits with no dependency on the signal work, so they move to
Phase 2 where the route files are being opened anyway:

- `pathMatch: 'full'` on `'**'` in [http-status/not-found/route.ts:32](src/app/module/shared/http-status/not-found/route.ts#L32) — no-op, cosmetic
- Empty `canMatch/canActivate/canActivateChild/canDeactivate` arrays in [area/auth/route.ts:25-28](src/app/area/auth/route.ts#L25-L28) and [area/private/route.ts:26-28](src/app/area/private/route.ts#L26-L28)
- The now-unused `AreaGuard` import in `area/auth/route.ts` (the import only — see the guard rule in Phase 2; `AreaGuard.CanMatchAuthenticated` itself stays)

---

## Phase 2 — Signal routing

The actual upgrade. The CRUD layer is the risk surface.

### `src/app/base/crud/url.ts`

`CrudUrl` already has `UrlService` injected, and Phase 1 exposed `url.state`. Convert to `computed`:
- `crudActionFromRoute` — `url.state.activatedRouteFirstSegment()`, guarded by the existing `isCrudActionValue()`
- `crudActionRecordId` — `url.state.routeParams()['id']`, keeping the comma-split single-vs-array logic from [url.ts:465](src/app/base/crud/url.ts#L465)
- `isCrudActionRoute`, `isMutationActionRoute`, `crudBaseUrl` — same derivations over `url.state.routeUrl()`

**These four only become safe as a pair with the `CrudComponent` change below.** Phase 1 deliberately left them as *live* snapshot reads because `initCrudActionFromUrl()` runs from a constructor during route activation, one step before the route signals fire. Converting to `computed` without deleting that constructor call reintroduces the previous-navigation bug that Phase 1's live-read rule exists to prevent.

Keep `navigateAwayFromCrudAction()` imperative; it is an action, not derived state.

### Reentrancy flags

Phase 1 documented that `syncingUrlToState` / `syncingStateToUrl` became **advisory** once the URL→STATE subscription became an `effect()` — effects are scheduled, so both flags are already cleared by the time they would be read, and `sameParams()`'s early return is what actually terminates the echo. Phase 2 confirms that with the counter test (Phase 1 verification step 19) and deletes them if it holds.

Same question for `CrudUrl.syncingCrudAndUrlState` ([url.ts:32](src/app/base/crud/url.ts#L32)), which is set and cleared synchronously around calls that schedule effects.

### `src/app/base/crud/state.ts` + `service.ts`

`crudAction` ([state.ts:338](src/app/base/crud/state.ts#L338)) becomes `linkedSignal(() => this.url.crudActionFromRoute())`. This matters: `closeMutationForm()` and `clearCrudActionAndRecordId()` ([state.ts:482](src/app/base/crud/state.ts#L482)) currently `.set()` it outside navigation, which a plain `computed` would forbid. `linkedSignal` keeps the route as source of truth while allowing local override until the next navigation. Same treatment for `crudActionRecordId`.

Delete `initCrudActionFromUrl()` ([service.ts:273](src/app/base/crud/service.ts#L273)). Call sites `shouldLoadListingForCurrentRoute()` ([service.ts:230](src/app/base/crud/service.ts#L230)) and `shouldSkipListingLoadForActiveCrudAction()` ([service.ts:258](src/app/base/crud/service.ts#L258)) read the new computed instead.

### `src/app/base/crud/component.ts`

Delete the `NavigationEnd` subscription and both `initCrudActionFromUrl()` calls ([lines 52-64](src/app/base/crud/component.ts#L52-L64)). Constructor keeps only `setComponentInjector()`. `Router`, `DestroyRef`, `takeUntilDestroyed`, `filter` imports all drop out.

Note `CrudComponent` is rendered as `<app-crud>` inside [geo/country/template.html:2](src/app/module/shared/geo/country/template.html#L2) and has `providers: []` — it resolves `CrudService` from `GeoCountryComponent`'s injector. Deleting the subscription here is what removes the last per-module `NavigationEnd` listener in the app.

### `libs/src/url/service.ts`

Already done in Phase 1 — the `NavigationEnd` subscription is gone, replaced by an `effect()` tracking `state.activatedRouteSnapshot()`; `getActiveRoute()` is deleted and `getModuleActivatedRoute()` rewritten. Nothing left here for Phase 2 except the reentrancy-flag question above.

### Params → signals

Convert `get*Param()` / `getQueryParam*()` on the `*Route` classes to `state.getRouteParam()` / `state.getRouteQueryParam()` one-liners, and drop their `inject(ActivatedRoute)` fields. Start with [recover-password/route.ts:63-73](src/app/module/shared/onboarding/recover-password/route.ts#L63-L73) — `getParamPublicid()` and `getQueryParamPassRecoverToken()`, both currently `this.activeRoute.snapshot.paramMap.get(...)` — whose consumer `initRouteToken()` ([service.ts:38](src/app/module/shared/onboarding/recover-password/service.ts#L38)) becomes an `effect`.

The same `inject(ActivatedRoute)` field exists unused on other `*Route` classes (for example [geo/country/route.ts:18](src/app/module/shared/geo/country/route.ts#L18), which has an empty PARAM GETTERS section) — remove those too.

Add `input()` bindings on routed components that take params — `withComponentInputBinding()` is already enabled and currently inert. Set `unmatchedInputBehavior: 'undefinedIfStale'` so unrelated inputs aren't clobbered with `undefined`.

### `src/app/area/guard.ts`

Rewrite as exported `const` functional guards (drop the static-class wrapper; they are already `CanMatchFn`, and nothing depends on the class shape).

- `canMatchUnauthenticated` — **peek** `ctxp.state.redirectAfterAuth()` ([context-profile/state.ts:59](libs/src/context-profile/state.ts#L59)), never `useRedirectAfterAuth()`. Return `new RedirectCommand(router.parseUrl(target), { replaceUrl: true })`.
- Move one-shot consumption to the sign-in success path only ([signin/service.ts:584](src/app/module/shared/onboarding/signin/service.ts#L584)), which already calls `useRedirectAfterAuth()`. Those two ([guard.ts:21](src/app/area/guard.ts#L21) and signin) are the only call sites in the app, so after this change signin is the sole consumer.
- `canMatchAuthenticatedOrRedirect` — keep the deep-link capture, return `RedirectCommand`.
- `canMatchPublicid` — unchanged apart from naming.
- `canMatchAuthenticated` — **kept.** It has zero call sites today but is intentional API: it is the plain deny-without-redirect variant, the natural guard for a route that should simply not match for signed-out users. Converted to a `const` with the rest; not deleted. Same rule as the unused-but-intentional `UrlState` methods in Phase 1.

Update the 6 route files that reference `AreaGuard.*`: [private/route.ts:25](src/app/area/private/route.ts#L25), [signup](src/app/module/shared/onboarding/signup/route.ts#L30), [signout](src/app/module/shared/onboarding/signout/route.ts#L29), [signin](src/app/module/shared/onboarding/signin/route.ts#L30), [forgot-password](src/app/module/shared/onboarding/forgot-password/route.ts#L30), [recover-password:33-34](src/app/module/shared/onboarding/recover-password/route.ts#L33-L34).

**Guard file rule for every phase: no guard is removed.** Improve the body, rename, or replace the implementation, but the set of exported guards only grows. Anything currently uncalled is a future hook, not dead code.

---

## Phase 3 — Derived surfaces

### Sidenav from the route tree

Route files adopt `defineRoute()` and declare `data.nav: UrlRouteNavType` (`{ labelKey, icon, group, order?, hidden? }` — already typed in [libs/src/url/type.ts](libs/src/url/type.ts) by Phase 1) alongside their existing `data.breadcrumb`. New `libs/src/url/nav.ts` exports `collectNavItems(config: Routes)`, walking `router.config` and building absolute paths from the accumulated segments.

[area/private/component.ts:79-173](src/app/area/private/component.ts#L79-L173) — the hardcoded `accountMenuItems` and `navItems` arrays become `readonly navItems = computed(() => collectNavItems(this.router.config))`. Per-item active state uses `isActive(item.url, this.router, { paths: 'subset' })`.

Phase 3 also adds a reactive `modulePath` computed to `UrlState` for highlighting — Phase 1 deliberately shipped only the live `getModulePath()`, because that is all the ownership check needs.

This structurally eliminates the current bug class: entries like `/app/settings`, `/app/orders`, `/app/projects`, `/dashboard` point at routes that don't exist and fall through the wildcard to 404. A route that doesn't exist can no longer produce a menu item.

### Transloco `TitleStrategy`

`libs/src/url/title.ts` — `TitleStrategy` subclass injecting `Title` + `TranslocoService`, resolving `data.titleKey` (typed on `UrlRouteDataType` since Phase 1) via `buildTitle()`. Subscribe to `langChanges$` so the title re-resolves on language switch. Provide from `provideUrlModule()`.

This is also where `provideUrlModule()` gains an eager initializer: a `TitleStrategy` and a route-derived sidenav both need `UrlState` live from navigation #1, which Phase 1 deliberately did not require. Order it against `provideAppModule()` explicitly at that point — see the "No eager instantiation" note in [route-phase-1.md](docs/route-phase-1.md) for why it was left out until now.

Convert the 8 literal `title:` strings (`'Sign In'`, `'Geo Country'`, `'Page Not Found'`, …) to `data.titleKey`, adding entries to each module's existing `i18n/` files. Give the layout routes titles too — they currently have none.

### Access rules

New `canMatchAccess` guard added to `area/guard.ts`, reading typed `data.access.roles` (`UrlRouteAccessType`, declared Phase 1) and checking against `ContextProfileState.authorisation_role_title` ([state.ts:546](libs/src/context-profile/state.ts#L546)) — role data that exists today and is never consulted by any route. Added alongside the existing guards, none of which are removed.

Redirect target is `403`. [http-status/forbidden/](src/app/module/shared/http-status/forbidden/) is an **empty folder** — confirmed, as are `unauthorized/`, `coming-soon/`, `internal-server-error/` and `upgrade-required/`. Only `not-found/` and `service-unavailable/` are built. So the route needs building or the target falls back to `404`.

### Remaining router features

```ts
withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })
withViewTransitions({ skipInitialTransition: true })
withPreloading(AuthenticatedPreloadStrategy)   // new: gate load() on ctxp.state.authenticated()
withNavigationErrorHandler(() => new RedirectCommand(
  inject(Router).parseUrl(HttpStatusServiceUnavailableRoute.absolutePath())))
```

`AuthenticatedPreloadStrategy` implements `PreloadingStrategy`; `preload()` returns `load()` when authenticated, else `EMPTY` — warms the 13 lazy chunks behind `account` without pulling them for signed-out visitors.

### Cleanup

`CrudRoute` ([base/crud/route.ts](src/app/base/crud/route.ts)) is an **empty class body** with two unused slug imports — no `create`/`update`/`wildcard` methods exist. Meanwhile [geo/country/route.ts:44-65](src/app/module/shared/geo/country/route.ts#L44-L65) hand-writes componentless `create` and `update/:id` children, including the `children: []` workaround for Angular's route validation. Build `CrudRoute.childRoutes()` to emit that pair and adopt it in `geo/country`, so the next CRUD module does not copy the workaround.

`libs/src/url/enum.ts` is `export {}` — a placeholder. Leave or delete; no consumers either way.

---

## Verification

Per phase, `npm run build` must pass clean first — the typed `UrlRouteDataType` will surface real type errors once `defineRoute()` is adopted in Phase 3, which is the point.

Then `npm run dev.web` and walk these paths:

**Phase 1** — see [route-phase-1.md](docs/route-phase-1.md) for the full 21-step list. The short version: every existing route still resolves; matrix params survive `country → create → back`; deep-linking straight to `/account/geo/country/create` opens the form; URL ownership releases on module change; exactly one `UrlState` instance; and `syncStateRuntimeToUrl()` reaches `router.navigate()` once per user action, not twice.

Note `paramsInheritanceStrategy` is **not** a Phase 1 regression surface — it was already the framework default, so breadcrumbs cannot shift from it. Still worth eyeballing the private-area breadcrumb once, since the module route walk did change.

**Phase 2** — the critical one:
- `/account/geo/country` → click create → `/country/create` opens the mutation overlay → close → back to listing
- Click update on row A, then **navigate directly to row B's update URL without closing**. This is the stale-snapshot bug; the form must show B's record.
- Browser back/forward across listing ⇄ create ⇄ update
- Matrix param sync still works: paginate to page 3, confirm `country;cp=3`, reload, confirm the page is restored
- Sign out, hit `/account/geo/country` directly → redirected to signin → sign in → **must land back on `/account/geo/country`**, not dashboard. Then repeat without the deep link and confirm it lands on dashboard.
- `/auth/recover-password/:publicid` with a valid then an invalid id

**Phase 3** — every sidenav item navigates somewhere real (no 404s); the active item highlights correctly on deep links; `document.title` translates on language switch; DevTools Network shows `account` chunks preloading only after sign-in; scroll position restores on back from a long listing.

`npm run test` (vitest) after each phase.
