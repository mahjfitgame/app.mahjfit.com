# Phase 1 — Foundation (final)

## Implementation status — ✅ code complete, awaiting runtime verification

`npm run build` clean. `npm run test` 23/23 passing.

Files changed: `libs/src/url/{type,state,service,provider}.ts`, `src/app/app.config.ts`,
`src/app/base/crud/url.ts`, and `URL_PROVIDER` removed from 6 component files.
New: `libs/src/url/state.spec.ts`.

**Two deviations from the spec below, both additive:**

1. **`angular.json` test `include`.** Verification step 12a needs a runnable unit
   test, and `libs/**` specs had **never executed** — the builder's `include`
   default is `**/*.spec.ts` resolved against `sourceRoot` (`src/`), and
   `normalizePattern()` strips a leading `src/` rather than treating the pattern
   as workspace-relative. So `libs/src/browser-cache-storage/service.spec.ts` had
   been dormant since it was written. Fixed with an explicit
   `["**/*.spec.ts", "../libs/**/*.spec.ts"]`. ⚠ The `../` is load-bearing —
   "correcting" it to `libs/**/*.spec.ts` silently disables every libs test.
2. **`libs/src/url/state.spec.ts`.** Covers the `parseOrigin()` truth table
   including `tldLabelCount`, plus the host-field split. 16 assertions.

**Known unrelated failure:** `src/app/app.spec.ts` is a stub — a comment and an
unused `TestBed` import, no `describe`. Vitest reports "No test suite found".
This predates Phase 1 (it fails identically on the pre-change tree) and is left
alone; filling or deleting someone's spec file is not this phase's call.

**Still to do — the runtime walk-through.** Everything in Verification below
from step 1 onward needs `npm run dev.web`. Steps 3, 10a, 19 and 20 cover the
mechanisms this phase changed and have no static equivalent.

---

**Scope: Phase 1 only.** `libs/src/url/state.ts` + `libs/src/url/service.ts`, plus 8 mechanical call-site updates in `base/crud/url.ts`. No wrappers, no shims — every reference is moved to its new home in this phase.

## Context

The route layer is well structured — every segment is a `SLUG_*` constant, every path built through `UrlService`, one `route.ts` per module. That stays.

What's missing is a reactive route source. Today `UrlService` opens its own `NavigationEnd` subscription ([service.ts:39-50](libs/src/url/service.ts#L39-L50)) and re-derives route state imperatively. Because it is component-scoped, that subscription is rebuilt on every module navigation, and nothing outside a routed component can read route state at all.

## Architecture rule

**`state.ts` is ground level. `service.ts` imports `state.ts`; `state.ts` never imports `service.ts`.**

The dividing line is **signals**:

| file | class | owns |
|---|---|---|
| `state.ts` | `UrlState` | the signals and everything that reads or writes them |
| `service.ts` | `UrlService` | everything not signal-based — sync engine, live `ActivatedRoute` walks, `window.location` reads, pure param helpers, static path builders |

Both become **root singletons** via `provideUrlModule()`. `UrlService` exposes `public readonly state = inject(UrlState)`, as `ContextProfileService` and `CrudUrl` do.

---

## The signal-era audit

Auditing the existing API against what signals now provide, three things turn out to be obsolete rather than merely relocatable.

### ⓵ `getActiveRoute()` — delete

Every one of its 4 call sites immediately does `.snapshot.X`. **Nobody needs the `ActivatedRoute` object**, only the leaf snapshot:

| call site | reads | replacement |
|---|---|---|
| [service.ts:82](libs/src/url/service.ts#L82) `syncUrlToState` | `.snapshot.queryParams`, `.snapshot.fragment` | `state.getActivatedRouteSnapshot()` |
| [service.ts:116](libs/src/url/service.ts#L116) `syncStateRuntimeToUrl` | same | `state.getActivatedRouteSnapshot()` |
| [crud/url.ts:456](src/app/base/crud/url.ts#L456) | `.snapshot.url.at(0)?.path` | `state.getActivatedRouteSnapshot()` |
| [crud/url.ts:466](src/app/base/crud/url.ts#L466) | `.snapshot.paramMap.get('id')` | `state.getActivatedRouteSnapshot()` |

`getModuleActivatedRoute()` **stays** — it genuinely must return an `ActivatedRoute`, because `syncStateRuntimeToUrl()` passes it as `relativeTo` to `router.navigate()`. That is the only remaining reason the `ActivatedRoute` walk exists.

### ⓶ The nine host signals — convert from pushed to derived

`protocol`, `domain`, `hostname`, `port`, `path`, `subdomain`, `tld`, `username`, `password` are **writable signals imperatively written on every navigation** ([service.ts:88-96](libs/src/url/service.ts#L88-L96)) — nine `setX()` calls inside `syncUrlToState()`. That is the pre-signal push pattern: compute a value, then remember to write it everywhere it might have changed.

Every one of them is pure derivation of `window.location`. They should be `computed`.

`getCurrentHostInfo()` itself stays a **plain method, not a signal** — `window.location` is not a reactive source, there is no `Signal<Location>` and no event to track. A pure parse function plus one `computed` that supplies the navigation trigger is the correct shape, and it is the same pattern used for `getActivatedRouteSnapshot()` above: the live read stays a method, the reactivity comes from the computed wrapping it.

**Keep:** all nine signals, with identical public shape — `state.protocol()` stays a `Signal<string | null>` and `state.path()` stays a `Signal<string>`, so nothing reading them ever changes.
**Change:** the mechanism, split in two. One `origin` computed parses `window.location.href` **once** — it has no tracked dependencies, so it never re-runs. `path` is the only per-navigation read. `hostInfo` composes the two, so it re-derives only when the path actually changes rather than on every navigation. The eight origin fields derive from `origin()`, `path` stands alone, and the parse moves to `state.ts` as `parseOrigin()` behind `getCurrentHostInfo()` — the same rule as the leaf-snapshot walk: a computed's source function lives with the computed.
**Deleted:** the nine `setX()` setters and the nine writes in `syncUrlToState()`, which no longer have anything to do — and `getStateHostInfo()`, which was a method wrapping exactly what `hostInfo()` now is. Callers read `state.hostInfo()`. It has zero callers today, so nothing to update.
**Also fixed:** the tld/subdomain split returned nonsense for IP literals (`127.0.0.1` → `tld: '1'`, `subdomain: '127.0'`) and had no guard for single-label hosts. `parseOrigin()` guards both and returns `null` for each.

**Multi-part public suffixes are handled** via a `tldLabelCount` argument (default `1`) rather than left as a known gap. `1` covers `.com` / `.io` / `.dev`, `2` covers `.co.uk` / `.com.au`. This is not a public suffix list and does not try to be one — it is a single number set once per deployment, which is all a single-domain app needs. See the `parseOrigin()` block below.

**This also fixes a latent staleness bug.** Today the host signals are only written inside `syncUrlToState()`, which runs only when `urlSyncEnabled` is true. So they are populated *only for modules that enable URL sync* — on `dashboard` they hold whatever `geo/country` left behind. As computeds they are always current, for every route, regardless of sync.

`service.ts` keeps `getCurrentHostInfo()` and the nine `getProtocol()` … `getPassword()` accessors as the **live** variants, delegating to state's parse. Live and reactive both stay available, matching the read rule below.

### ⓷ Five set/patch wrappers — delete, do not move

The one place a mechanical move introduces a silent bug. Today:

| call | semantics | delegates to |
|---|---|---|
| `UrlService.setMatrixParams()` | **patch** | `state.patchMatrixParams()` |
| `UrlService.setQueryParams()` | **patch** | `state.patchQueryParams()` |
| `UrlService.replaceMatrixParams()` | **replace** | `state.setMatrixParams()` |
| `UrlService.replaceQueryParams()` | **replace** | `state.setQueryParams()` |
| `UrlService.setFragment()` | pass-through | `state.setFragment()` |
| `UrlState.setMatrixParams()` | **replace** | — |

`setFragment()` is a straight pass-through with no naming collision, so it carries none of the inversion risk — but it is still a second home for one method, so it goes with the other four. Zero callers outside `libs/src/url/`.

`UrlState`'s convention is correct (`setX` replaces, `patchX` merges), so moving `setMatrixParams` down would land on an existing method with **inverted meaning**. Delete all five; callers use:

```
UrlService.setMatrixParams(x)      →  state.patchMatrixParams(x)
UrlService.setQueryParams(x)       →  state.patchQueryParams(x)
UrlService.replaceMatrixParams(x)  →  state.setMatrixParams(x)     ⚠ NOT patchMatrixParams
UrlService.replaceQueryParams(x)   →  state.setQueryParams(x)      ⚠ NOT patchQueryParams
UrlService.setFragment(x)          →  state.setFragment(x)
```

### ⓸ `inject(Location)` — delete

[service.ts:30](libs/src/url/service.ts#L30) injects `Location` from `@angular/common`. Grep for `this.location` across the file returns nothing — it is dead. Drop the field and the import. (`base/crud/url.ts` has its own `Location` injection for `navigateAwayFromCrudAction()`; that one is live and untouched.)

### ⓹ The read rule this establishes

This is the most important thing to carry into Phases 2–3:

| context | read from | why |
|---|---|---|
| templates, `computed`, `effect` | **route signals** — `state.routeParams()`, `state.routeQueryParams()`, … | reactive, memoised |
| imperative code that can run during route activation | **`state.getActivatedRouteSnapshot()`** (live) | route signals fire at step 3; activation is step 2 |

`initUrlSync()` is the concrete case: it runs inside `GeoCountryService`'s constructor, before `lastSuccessfulNavigation` fires. Reading a route signal there returns the **previous** navigation's data. Live reads are always correct; signal reads are only correct after `NavigationEnd`, so imperative code defaults to live.

### What is deliberately NOT changed

- `matrixParams` / `queryParams` / `fragment` stay **writable** signals. They are an authored draft pushed back to the URL, not derived state — a genuine two-way binding.
- The `syncingUrlToState` / `syncingStateToUrl` booleans stay plain booleans. They must not be tracked. *(Worth noting for Phase 2: `sameParams()`'s early return may already make them redundant. Not touching it now — that needs its own verification pass.)*
- `urlSyncEnabled` and URL ownership stay separate flags, as [crud/child/service.ts:25-26](src/app/base/crud/child/service.ts#L25-L26) requires — a module can own the URL while sync is off.
- Unused-but-intentional API is kept: `patchUrlState`, `replaceUrlState`, `setMatrixParam`, `setQueryParam`, `removeMatrixParam`, `removeQueryParam`, `clearUrlState`, `getQueryParams`, `getFragment` all have zero callers today and stay.
- `domain` is `url.host`, which **includes the port** — on localhost it reads `'localhost:4200'` while `hostname` reads `'localhost'`. Misleading name, existing behaviour, zero callers. Not renamed in this phase.

### No wrappers — every reference moves in this phase

Nothing is forwarded. `base/crud` is the only consumer of `UrlService` outside the url module, and its 8 affected call sites are updated directly so there is one home per method and no ambiguity during development.

**Unchanged — these stay on `UrlService` and keep working as-is:**

| method | crud call sites |
|---|---|
| `isUrlSyncEnabled()` | crud/url.ts 41, 101, 149, 232, 263 |
| `initUrlSync()` | crud/url.ts 84, crud/service.ts 499, geo/country/service.ts 413 |
| `enableUrlSync()` | crud/url.ts 94, crud/service.ts 501, geo/country/service.ts 416 |
| `getRouteBasedModuleAlias()` | crud/utility.ts 47 |
| `UrlService.getAbsolutePath()` etc. (static) | 15 route files |

---

## Verified against installed `@angular/router@22.1.1`

*(Re-verified after the 22.0.1 → 22.1.1 upgrade — every claim holds at identical source lines. The only router API delta is `ɵwithActivatedRouteInjectors`: ɵ internal prefix, absent from the `RouterFeatures` union so `provideRouter()` type-rejects it, and its type alias is mis-declared as `RouterFeature<RouterFeatureKind.ViewTransitionsFeature>`. Not usable, not used.)*

- **`paramsInheritanceStrategy` already defaults to `'always'`** — `DEFAULT_PARAMS_INHERITANCE_STRATEGY = 'always'` at `_router-chunk.mjs:1498`. I earlier listed `withRouterConfig(...)` as a prerequisite; it is not. **No config change, no breadcrumb risk.**
- `ActivatedRoute` has **no** signal properties, and **no `toSignal()` bridge is needed either**. `state.ts` ends up with zero rxjs.
- `ActivatedRouteSnapshot` exposes `component`, `routeConfig`, `pathFromRoot`, `params`, `data`.
- **`Router.lastSuccessfulNavigation`** is `signal(null)` with **default equality**, `.set()` with a fresh `Navigation` per navigation (`:3658, :3916`) — notifies exactly once per successful navigation. The trigger for `activatedRouteSnapshot`.
- **`Router.currentNavigation`** is `signal(null, { equal: () => false })` (`:3651`) — re-notifies on every internal `.update()` *during* a navigation. Correct for `routeNavigating()`, **wrong** as a settled-state trigger.
- **`isActive()` uses this exact pattern** — `computed(() => containsTree(router.lastSuccessfulNavigation()?.finalUrl ?? ..., ...))` at `:186`. Angular's own signal helper tracks `lastSuccessfulNavigation()` and derives.
- `Data` is a **type alias** — declaration merging unavailable, so typed route data needs a helper function.
- [app.routes.ts](src/app/app.routes.ts) — duplicate `HttpStatusNotFoundRoute` spread confirmed gone. `**` lives only in [area/open/route.ts:36](src/app/area/open/route.ts#L36); `/account/nonsense` still reaches it by backtracking. Nothing to fix.

### The transition ordering everything turns on

| step | line | what happens |
|---|---|---|
| 1 | `3902` → `4289` → `4203` | `BeforeActivateRoutes` → `commitTransition()` → **`routerState` swapped** |
| 2 | `3905` | `ActivateRoutes.activate()` → **routed components constructed** |
| 3 | `3916` | `lastSuccessfulNavigation.set(...)` → **the signal fires** |
| 4 | `3917` | `NavigationEnd` emitted |

**`activatedRouteSnapshot` can be a plain `computed`** — `routerState` is current at step 1, the signal fires at step 3, so tracking `lastSuccessfulNavigation()` and reading `routerState` always sees the new tree.

**`initUrlSync()` runs at step 2** — hence the live-read rule above, and why module identity comes from `service.getModulePath()`, never from a signal.

**Root scope means `urlSyncEnabled` no longer dies with the component.** Only `geo/country` enables sync today; as a singleton the flag would persist onto `dashboard` and write matrix params there. Hence URL ownership.

### Why the module route walk must be rewritten

`getModuleActivatedRoute()` currently walks `this.aroute.pathFromRoot` backwards ([service.ts:377](libs/src/url/service.ts#L377)). At root, `pathFromRoot` is `[root]` and it returns the root route — `country;cp=3` breaks. Walking down from the leaf is not equivalent either: for `country/create` the leaf is `create`, but matrix params belong on `country`.

Correct equivalent: **deepest route that mounts a component**, then **up to the nearest route owning URL segments**. Verified on every current route:

| URL | module route | segment owner | matches today |
|---|---|---|---|
| `/account/geo/country` | `country` | `country` | ✅ |
| `/account/geo/country/create` | `country` (create is componentless) | `country` | ✅ |
| `/account/geo/country/update/7` | `country` | `country` | ✅ |
| `/account/dashboard` | `dashboard` | `dashboard` | ✅ |
| `/auth/signin` | `signin` | `signin` | ✅ |
| `/` (home, empty path) | `home` | falls back to `home` | ✅ |

---

## Full code

### 1. `libs/src/url/type.ts` — append

Add `import { Route } from '@angular/router';` at the top.

```ts
// ████ ROUTE DATA TYPES ████████████████████████████████████████████
// `Data` in @angular/router is a type alias, not an interface, so declaration
// merging is unavailable. defineRoute() gives the same safety at the call site.

export interface UrlRouteBreadcrumbType {
    label?: string;
    alias?: string;
    disable?: boolean;
    skip?: boolean;
    info?: { icon?: string; iconOnly?: boolean };
    routeInterceptor?: (
        routeLink: unknown[] | null,
        breadcrumb: UrlRouteBreadcrumbType,
    ) => unknown[] | null;
}

/** consumed in Phase 3 — sidenav derived from the route tree */
export interface UrlRouteNavType {
    labelKey: string;
    icon: string;
    group: string;
    order?: number;
    hidden?: boolean;
}

/** consumed in Phase 3 — role gating */
export interface UrlRouteAccessType {
    roles: string[];
}

export interface UrlRouteDataType {
    breadcrumb?: UrlRouteBreadcrumbType;
    nav?: UrlRouteNavType;
    access?: UrlRouteAccessType;
    titleKey?: string;
}

/**
 * Typed route factory. Optional and opt-in per route.
 * Route files stay untouched this phase; they adopt it when Phase 3 starts
 * consuming nav/access/titleKey, so each file is edited only once.
 */
export function defineRoute(
    route: Omit<Route, 'data'> & { data?: UrlRouteDataType },
): Route {
    return route;
}
```

`UrlHostInfoType` stays — `getCurrentHostInfo()` still returns it.

### 2. `libs/src/url/state.ts`

Imports — **no rxjs**:

```ts
import { computed, inject, Service, Signal, signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import {
    UrlHostInfoType,
    UrlParamsType,
    UrlParamValueType,
    UrlRouteDataType,
    PatchUrlStateInputType,
    ReplaceUrlStateInputType,
} from './type';
```

Add to `████ DEPENDENCIES`, **before** the signal fields (field initialisers run in order):

```ts
    /** router is the source of truth for every route signal below */
    public readonly router = inject(Router);
```

**In `████ SIGNAL PROPERTIES`:** replace the nine `_protocol`/`protocol` … `_password`/`password` writable pairs with the computeds shown in the host block below, and delete their nine setters from `████ SIGNAL METHODS`. The public shape is unchanged — `state.protocol()` is still `Signal<string | null>`. Keep `urlSyncEnabled`, `matrixParams`, `queryParams`, `fragment` writable.

#### New block — after `████ SIGNAL PROPERTIES`

```ts
    // ████ ROUTE SIGNAL PROPERTIES █████████████████████████████████
    /**
     * Route state is derived from the Router and is never persisted.
     * The URL is the source of truth; a stored copy would fight it on reload,
     * so none of these use SignalStateService persistence.
     *
     * No subscription anywhere. The snapshot walk runs once per navigation,
     * not once per read, and every computed below memoises, so any number of
     * consumers costs a single derivation.
     */

    /**
     * Deepest activated route snapshot, re-derived once per successful navigation.
     *
     * lastSuccessfulNavigation() is the tracked dependency. It fires at
     * _router-chunk.mjs:3916, after commitTransition() has already swapped
     * routerState at BeforeActivateRoutes, so the tree read below is current.
     *
     * DO NOT REMOVE the bare call — it looks unused but it is the dependency.
     * Removing it freezes this signal at the first navigation.
     * Same pattern Angular's own isActive() uses (_router-chunk.mjs:186).
     */
    public readonly activatedRouteSnapshot = computed<ActivatedRouteSnapshot>(() => {
        this.router.lastSuccessfulNavigation();

        return this.getActivatedRouteSnapshot();
    });

    /**
     * Live read of the deepest activated route snapshot.
     *
     * Public because imperative callers need it: route signals fire after
     * NavigationEnd, but initUrlSync() and other constructor-time code run
     * during route activation, one step earlier. Reading a signal there
     * returns the previous navigation.
     *
     * Rule: reactive code reads the signals, imperative code reads this.
     */
    public getActivatedRouteSnapshot(): ActivatedRouteSnapshot {
        let snapshot = this.router.routerState.snapshot.root;

        while (snapshot.firstChild) {
            snapshot = snapshot.firstChild;
        }

        return snapshot;
    }

    public readonly routeUrl = computed<string>(() => {
        this.activatedRouteSnapshot(); // re-derive on every navigation
        return this.router.url;
    });

    public readonly routeParams = computed(() => this.activatedRouteSnapshot().params);
    public readonly routeQueryParams = computed(() => this.activatedRouteSnapshot().queryParams);
    public readonly routeFragment = computed(() => this.activatedRouteSnapshot().fragment);
    public readonly routeData = computed<UrlRouteDataType>(() => this.activatedRouteSnapshot().data);

    /** root -> activated chain, consumed by breadcrumbs and nav highlighting in Phase 3 */
    public readonly routePathFromRoot = computed(() => this.activatedRouteSnapshot().pathFromRoot);

    /** first URL segment the activated route owns — CRUD action detection uses this in Phase 2 */
    public readonly activatedRouteFirstSegment = computed<string | null>(
        () => this.activatedRouteSnapshot().url.at(0)?.path ?? null,
    );

    /** Router.currentNavigation is already a Signal in v22, no bridge needed */
    public readonly routeNavigating = computed<boolean>(
        () => this.router.currentNavigation() !== null,
    );

    // ████ URL OWNERSHIP SIGNAL PROPERTIES ██████████████████████████
    /**
     * As a root singleton the sync flag no longer dies with the component,
     * so ownership is explicit: one module holds the URL, and navigating
     * away from that module ends its claim.
     *
     * Ownership and enabled-ness are separate on purpose —
     * base/crud/child/service.ts:25-26 documents calling enableUrlSync(false)
     * right after initUrlSync(), so a module can own the URL while sync is off.
     */

    private readonly _urlOwnerPath = signal<string | null>(null);
    public readonly urlOwnerPath = this._urlOwnerPath.asReadonly();
    public readonly urlOwned = computed<boolean>(() => this._urlOwnerPath() !== null);

    // ████ HOST SIGNAL PROPERTIES ██████████████████████████████████
    /**
     * Derived, not pushed. These were nine writable signals fed by nine
     * setX() calls inside syncUrlToState(). Same public shape as before —
     * protocol/domain/hostname/port/subdomain/tld/username/password are still
     * Signal<string | null> and path is still Signal<string> — but they can no
     * longer go stale, and they are now correct on every route rather than only
     * on modules that happen to enable URL sync.
     *
     * Split in two on purpose: an SPA cannot change protocol/host/port without
     * a full page load, so `path` is the only per-navigation read. The origin
     * is parsed once, on first read, and never again.
     */

    /**
     * Label count of the public suffix for this deployment's domain.
     * 1 for .com / .io / .dev, 2 for .co.uk / .com.au.
     *
     * The one line to change when a deployment domain has a two-part suffix.
     * Declared here because field initialisers run in order and origin() below
     * reads it.
     */
    protected readonly tldLabelCount: number = 1;

    /** zero tracked dependencies — this computed runs once and is memoised forever */
    private readonly origin = computed<Omit<UrlHostInfoType, 'path'>>(
        () => UrlState.parseOrigin(window.location.href, this.tldLabelCount),
    );

    /** the only field that moves as the user navigates */
    public readonly path = computed<string>(() => {
        this.activatedRouteSnapshot(); // re-derive once per navigation

        return window.location.pathname || '';
    });

    public readonly protocol  = computed(() => this.origin().protocol);
    public readonly domain    = computed(() => this.origin().domain);
    public readonly hostname  = computed(() => this.origin().hostname);
    public readonly port      = computed(() => this.origin().port);
    public readonly subdomain = computed(() => this.origin().subdomain);
    public readonly tld       = computed(() => this.origin().tld);
    public readonly username  = computed(() => this.origin().username);
    public readonly password  = computed(() => this.origin().password);

    /**
     * Re-derives only when `path` actually changes, not on every navigation —
     * origin() is constant, so Object.is on the path string is what gates it.
     * A naive `{ ...getCurrentHostInfo() }` per navigation would hand every
     * direct consumer a fresh object and re-run them for nothing.
     *
     * getStateHostInfo() is gone — it was a method wrapping what this now is.
     */
    public readonly hostInfo = computed<UrlHostInfoType>(() => ({
        ...this.origin(),
        path: this.path(),
    }));

    /**
     * Live parse of window.location, for imperative callers — UrlService's
     * nine getX() accessors delegate here. Moved from UrlService for the same
     * reason as the leaf-snapshot walk: a computed's source function lives
     * with the computed.
     */
    public getCurrentHostInfo(): UrlHostInfoType {
        return {
            ...UrlState.parseOrigin(window.location.href, this.tldLabelCount),
            path: window.location.pathname || '',
        };
    }

    /**
     * Pure, hence static.
     *
     * @param tldLabelCount how many trailing labels form the public suffix.
     *        1 = example.com, 2 = example.co.uk / example.com.au.
     *        Not a public suffix list — one number per deployment, which is
     *        all a single-domain app needs. Everything below is derived from it
     *        so nothing hardcodes a two-label assumption.
     *
     * subdomain/tld are null for IP literals and for any host without at least
     * one label above the suffix — localhost, [::1], and `co.uk` with a count
     * of 2 all have no registrable-domain structure to split. The old body
     * returned nonsense for these (127.0.0.1 yielded tld '1', subdomain '127.0').
     *
     * The length guard subsumes the old separate single-label check: with a
     * minimum count of 1, `hostParts.length > count` already requires a dot.
     */
    private static parseOrigin(
        href: string,
        tldLabelCount: number = 1,
    ): Omit<UrlHostInfoType, 'path'> {
        const url = new URL(href);
        const hostname = url.hostname;

        let subdomain: string | null = null;
        let tld: string | null = null;

        const suffixLength = Math.max(1, Math.trunc(tldLabelCount));
        const hostParts = hostname.split('.');

        // IPv6 arrives bracketed and dotless, so the length guard covers it
        const isIpLiteral = /^\d+(\.\d+){3}$/.test(hostname);

        if (!isIpLiteral && hostParts.length > suffixLength) {
            tld = hostParts.slice(-suffixLength).join('.');

            /**
             * Registrable domain is the suffix plus exactly one label.
             * Anything above that is subdomain; nothing above it means null.
             */
            const subdomainParts = hostParts.slice(0, -(suffixLength + 1));

            if (subdomainParts.length) {
                subdomain = subdomainParts.join('.');
            }
        }

        return {
            protocol: url.protocol || null,
            domain: url.host || null,
            hostname: url.hostname || null,
            port: url.port || null,
            subdomain,
            tld,
            username: url.username || null,
            password: url.password || null,
        };
    }
```

`parseOrigin()` truth table — implement against this:

| hostname | count | tld | subdomain |
|---|---|---|---|
| `example.com` | 1 | `com` | `null` |
| `app.example.com` | 1 | `com` | `app` |
| `a.b.example.com` | 1 | `com` | `a.b` |
| `example.co.uk` | 2 | `co.uk` | `null` |
| `app.example.co.uk` | 2 | `co.uk` | `app` |
| `example.com.au` | 2 | `com.au` | `null` |
| `co.uk` | 2 | `null` | `null` |
| `localhost` | 1 | `null` | `null` |
| `127.0.0.1` | 1 | `null` | `null` |
| `[::1]` | 1 | `null` | `null` |

**No import changes** — `computed` and `UrlHostInfoType` are already in the import list above, and `Omit` is a TS built-in. The field-order constraint now has a second member: `router = inject(Router)` must precede anything reaching `activatedRouteSnapshot()`, and `tldLabelCount` must precede `origin()`.

**Risk on this block is nil.** Grep across `src/` and `libs/` confirms all nine `UrlService.getProtocol()` … `getPassword()` accessors, `getStateHostInfo()`, and all nine `state.protocol()` … `state.password()` signals have **zero callers outside `libs/src/url/`**. This surface is write-only bookkeeping today — which is also why the staleness bug above never bit anyone.

Persistence is not a concern either: `SignalStateService` registers persisted fields explicitly ([signal-state/service.ts:283-305](libs/src/signal-state/service.ts#L283-L305)) rather than scanning fields, and `UrlState` registers none. Converting writable signals to `computed` changes nothing there.

#### Add to `████ SIGNAL METHODS`

```ts
    public setUrlOwnerPath(value: string | null): void {
        this._urlOwnerPath.set(value);
    }
```

#### New block — URL state mutators, moved from `service.ts`

```ts
    // ████ URL STATE MUTATORS ██████████████████████████████████████
    /**
     * Convention, unchanged: setX replaces, patchX merges.
     * The old UrlService.setMatrixParams()/setQueryParams() were patch helpers
     * and replaceMatrixParams()/replaceQueryParams() were replace helpers —
     * all four are redundant here and are deleted, not moved.
     */

    /** Patch multiple URL state values at once. Existing params are preserved. */
    public patchUrlState(input: PatchUrlStateInputType): void {
        if (input.matrixParams) this.patchMatrixParams(input.matrixParams);
        if (input.queryParams) this.patchQueryParams(input.queryParams);
        if (input.fragment) this.setFragment(input.fragment ?? null);
    }

    /** Replace multiple URL state values at once. Existing params are NOT preserved. */
    public replaceUrlState(input: ReplaceUrlStateInputType): void {
        if (input.matrixParams) this.setMatrixParams(input.matrixParams);
        if (input.queryParams) this.setQueryParams(input.queryParams);
        if ('fragment' in input) this.setFragment(input.fragment ?? null);
    }

    public setMatrixParam(key: string, value: UrlParamValueType): void {
        if (!key) return;
        this.patchMatrixParams({ [key]: value });
    }

    public setQueryParam(key: string, value: UrlParamValueType): void {
        if (!key) return;
        this.patchQueryParams({ [key]: value });
    }

    public removeMatrixParam(key: string): void { /* body unchanged, ends in this.setMatrixParams(next) */ }
    public removeQueryParam(key: string): void { /* body unchanged, ends in this.setQueryParams(next) */ }

    public clearUrlState(): void {
        this.setMatrixParams({});
        this.setQueryParams({});
        this.setFragment(null);
    }

    // ████ URL STATE READERS ███████████████████████████████████████

    public getMatrixParams(): UrlParamsType { return { ...this.matrixParams() }; }
    public getQueryParams(): UrlParamsType { return { ...this.queryParams() }; }
    public getFragment(): string | null { return this.fragment(); }

    // ████ ROUTE READERS ███████████████████████████████████████████

    /** signal for a path or matrix param, trimmed, null when absent */
    public getRouteParam(name: string): Signal<string | null> {
        return computed(() => this.routeParams()[name]?.trim() ?? null);
    }

    public getRouteQueryParam(name: string): Signal<string | null> {
        return computed(() => this.routeQueryParams()[name]?.trim() ?? null);
    }

    /** one-shot live reads, correct even during route activation */
    public readRouteParam(name: string): string | null {
        return this.getActivatedRouteSnapshot().params[name]?.trim() ?? null;
    }

    public readRouteQueryParam(name: string): string | null {
        return this.getActivatedRouteSnapshot().queryParams[name]?.trim() ?? null;
    }
```

`getRouteParam()` / `getRouteQueryParam()` return `computed`, so call them from a field initialiser in a `*Route` class. The `read*` pair reads live — deliberately from the snapshot, not the signal, so constructor-time callers are correct.

No change to `storeKey`, `onActivate()`, `onDeactivate()`.

### 3. `libs/src/url/service.ts`

Imports: drop `DestroyRef`, `takeUntilDestroyed`, `NavigationEnd`, `filter`. Add `untracked`.

```ts
-    private readonly aroute = inject(ActivatedRoute);
-    private readonly destroyRef = inject(DestroyRef);
-    private readonly state = inject(UrlState);
+    public readonly state = inject(UrlState);
```

#### Sync engine

```ts
    // ████ SYNC ENGINE █████████████████████████████████████████████
    /**
     * Both directions live here together. syncUrlToState() could sit in
     * state.ts — it only reads the router and writes own signals — but the two
     * are guarded by the shared reentrancy flags below. Splitting the pair
     * would put a loop guard on one side of a file boundary.
     */

    /**
     * ⚠ Both flags become advisory in this phase. See "Reentrancy flags go
     * async" below — sameParams() is what actually terminates the loop.
     */
    private syncingUrlToState = false;
    private syncingStateToUrl = false;

    constructor() {
        // URL -> STATE
        effect(() => {
            this.state.activatedRouteSnapshot(); // the only tracked dependency

            /**
             * Everything below reads and writes URL state. Run it untracked so
             * those signals do not become dependencies of this effect and start
             * a loop with the STATE -> URL effect below.
             * Same idiom as base/crud/url.ts:63.
             */
            untracked(() => {
                /**
                 * Ownership release MUST come before the urlSyncEnabled check.
                 * crud/child/service.ts:25-26 documents calling
                 * enableUrlSync(false) right after initUrlSync(), so a module
                 * can own the URL with sync already off. Checking
                 * urlSyncEnabled first would return early and strand that
                 * claim forever — urlOwnerPath would still name a module the
                 * user left, and the next initUrlSync() would compare against
                 * a dead path.
                 */
                if (this.state.urlOwned() && this.state.urlOwnerPath() !== this.getModulePath()) {
                    this.state.setUrlOwnerPath(null);
                    this.state.setUrlSyncEnabled(false);
                    this.state.clearUrlState();
                    return;
                }

                if (!this.state.urlSyncEnabled()) {
                    return;
                }

                if (this.syncingStateToUrl) {
                    return;
                }

                this.syncUrlToState();
            });
        });

        // STATE -> URL (unchanged)
        effect(() => {
            if (!this.state.urlSyncEnabled()) return;

            this.state.matrixParams();
            this.state.queryParams();
            this.state.fragment();

            if (this.syncingUrlToState) return;

            this.syncStateRuntimeToUrl();
        });
    }

    public enableUrlSync(flag: boolean): void { this.state.setUrlSyncEnabled(flag); }
    public isUrlSyncEnabled(): boolean { return this.state.urlSyncEnabled(); }

    /**
     * Call once from the child component/module.
     * Reads the current URL into state, claims the URL for this module,
     * then enables sync.
     */
    public initUrlSync(): void {
        this.syncUrlToState();
        this.state.setUrlOwnerPath(this.getModulePath());
        this.enableUrlSync(true);
    }

    /**
     * URL -> State. Now writes three signals instead of twelve — the nine
     * host setX() calls are gone, those signals derive themselves.
     * Reads live, because this also runs from initUrlSync() during route
     * activation, before the route signals fire.
     */
    public syncUrlToState(): void {
        const snapshot = this.state.getActivatedRouteSnapshot();
        const matrixParamRoute = this.getModuleActivatedRoute();

        this.syncingUrlToState = true;

        this.state.setMatrixParams(this.getCurrentMatrixParams(matrixParamRoute));
        this.state.setQueryParams(this.cloneParams(snapshot.queryParams));
        this.state.setFragment(snapshot.fragment ?? null);

        this.syncingUrlToState = false;
    }

    /** State -> URL. Body unchanged apart from the same snapshot swap; still the only method that navigates. */
    public syncStateRuntimeToUrl(): void {
        const snapshot = this.state.getActivatedRouteSnapshot();
        const matrixParamRoute = this.getModuleActivatedRoute();
        /* … rest unchanged, using snapshot.queryParams / snapshot.fragment … */
    }
```

#### Route position

```ts
    // ████ ROUTE POSITION ██████████████████████████████████████████
    /**
     * Live router.routerState reads, no signals involved.
     * getActiveRoute() is gone — every caller only wanted the leaf snapshot,
     * which UrlState.getActivatedRouteSnapshot() provides.
     * The ActivatedRoute walk survives only because syncStateRuntimeToUrl()
     * passes getModuleActivatedRoute() as `relativeTo` to router.navigate().
     */

    /**
     * Deepest route that actually mounts a component — the active module,
     * regardless of how many componentless children sit below it, which is why
     * country -> country/create is not a module change.
     */
    public getModuleComponentRoute(): ActivatedRoute {
        let moduleRoute: ActivatedRoute = this.router.routerState.root;
        let cursor: ActivatedRoute | null = this.router.routerState.root;

        while (cursor) {
            if (cursor.component || cursor.routeConfig?.loadComponent) {
                moduleRoute = cursor;
            }
            cursor = cursor.firstChild;
        }

        return moduleRoute;
    }

    /**
     * Gets the nearest active route segment.
     * This is where matrix params belong. A component can be loaded from an
     * empty child route (`path: ''`), while the visible URL segment that owns
     * matrix params is its parent (for example `country;cp=3`).
     */
    public getModuleActivatedRoute(): ActivatedRoute {
        const moduleRoute = this.getModuleComponentRoute();

        let owner: ActivatedRoute | null = moduleRoute;
        while (owner) {
            if (owner.snapshot.url.length > 0) { return owner; }
            owner = owner.parent;
        }

        return moduleRoute;
    }

    /** live url path of the mounted module, e.g. 'account/geo/country' */
    public getModulePath(): string {
        return this.getModuleComponentRoute()
            .snapshot.pathFromRoot
            .map((snapshot) => snapshot.url.map((segment) => segment.path).join('/'))
            .filter(Boolean)
            .join('/');
    }

    public getRouteBasedModuleAlias(id: string): string {
        const segments = this.getModuleActivatedRoute().snapshot.url;
        const moduleSegment = segments.at(-1)?.path ?? '';

        return `${moduleSegment}~${id}`;
    }
```

#### Host info and param utilities — unchanged, minus the mirror

```ts
    // ████ HOST INFO ███████████████████████████████████████████████
    /**
     * The live variants, all kept. The parse moved to UrlState as the static
     * parseOrigin(), reached through state.getCurrentHostInfo(), so these nine
     * now delegate:
     *
     *   public getProtocol(): string | null {
     *       return this.state.getCurrentHostInfo().protocol;
     *   }
     *   … getDomain, getHostname, getPort, getPath,
     *     getSubdomain, getTld, getUsername, getPassword — same shape.
     *
     * Reactive callers use state.protocol() and friends instead.
     * getStateHostInfo() is deleted — state.hostInfo() is the same thing.
     */

    // ████ PARAM UTILITIES █████████████████████████████████████████
    // getCurrentMatrixParams(route), cloneParams(), cleanParams(), sameParams()
    // — pure helpers of the sync engine, unchanged, still private.
```

#### Path builders

The four `static` methods stay **unchanged** — pure, stateless, and **15 files** call them as `UrlService.getAbsolutePath(...)`.

### 4. `src/app/base/crud/url.ts` — all 8 reference changes

`UrlService` exposes `public readonly state`, so every one of these is a `this.url.X()` → `this.url.state.X()` swap. No new imports, no new injections, no semantic change.

**`getMatrixParams()` — moved to `UrlState`. 4 sites:**

```ts
// lines 110, 241, 266, 341
- const sourceMatrixParams = this.url.getMatrixParams();
+ const sourceMatrixParams = this.url.state.getMatrixParams();
```

**`replaceMatrixParams()` — deleted, maps to `state.setMatrixParams()`. 2 sites:**

```ts
// lines 249, 274
- this.url.replaceMatrixParams(nextMatrixParams);
+ this.url.state.setMatrixParams(nextMatrixParams);
```

> ⚠ **`setMatrixParams`, not `patchMatrixParams`.** The old `replaceMatrixParams()` had replace semantics; `UrlState.setMatrixParams()` replaces, `patchMatrixParams()` merges. Wiring these two lines to `patchMatrixParams` compiles fine and silently leaves stale matrix params in the URL. This is the single highest-risk edit in the phase — verification step 2 exists for it.

**`getActiveRoute()` — deleted, superseded by the leaf snapshot. 2 sites:**

```ts
// getCrudActionFromRoute() — lines 456-457
- const activeRoute = this.url.getActiveRoute();
- const firstPath = activeRoute.snapshot.url.at(0)?.path ?? null;
+ const firstPath = this.url.state.getActivatedRouteSnapshot().url.at(0)?.path ?? null;

// getCrudActionRecordIdFromRoute() — lines 466-467
- const activeRoute = this.url.getActiveRoute();
- const idParam = activeRoute.snapshot.paramMap.get('id');
+ const idParam = this.url.state.getActivatedRouteSnapshot().paramMap.get('id');
```

Deliberately the **live** read, not `state.activatedRouteFirstSegment()` — even though that signal exists and is declared one section above.

#### Why not the signal here (asked and checked)

`getCrudActionFromRoute()` has five callers, and they do not share a timing:

| caller | when it runs |
|---|---|
| [service.ts:274](src/app/base/crud/service.ts#L274) `initCrudActionFromUrl()` | `CrudComponent` constructor — route activation |
| [service.ts:231](src/app/base/crud/service.ts#L231) `shouldLoadListingForCurrentRoute()` | module init chain — route activation |
| [service.ts:259](src/app/base/crud/service.ts#L259) `shouldSkipListingLoadForActiveCrudAction()` | during listing load |
| [url.ts:237](src/app/base/crud/url.ts#L237) via `isCrudActionRoute()` | `CrudUrl` effect, and `syncCrudStateFromUrlState()` at init |
| `isMutationActionRoute()` | same, transitively |

`<app-crud>` sits at [geo/country/template.html:2](src/app/module/shared/geo/country/template.html#L2), unwrapped by any `@if`, so `CrudComponent` is constructed in the creation pass of `GeoCountryComponent`'s view — inside `ActivateRoutes.activate()`, which `_router-chunk.mjs` runs at `:3905`, **before** `lastSuccessfulNavigation.set()` at `:3916`. A signal read on that path returns the previous navigation.

The live read is correct at *every* one of those five timings; the signal is correct only at three. That asymmetry is the whole answer — it is not worth reasoning per-call-site about which are safe when one read works everywhere.

Phase 2 removes the asymmetry rather than working around it: deleting `initCrudActionFromUrl()` and `CrudComponent`'s constructor call moves every remaining caller past `NavigationEnd`, and only then do these become `computed` over `state.activatedRouteFirstSegment()` / `state.routeParams()`. **The two changes only work as a pair** — converting the reads without deleting the constructor call reintroduces the deep-link bug that verification step 6 exists to catch.

So `activatedRouteFirstSegment` ships in Phase 1 declared but unconsumed, same as `UrlRouteDataType` and `defineRoute()`. It is not broadly reusable — CRUD action detection is its only consumer chain — but it is where Phase 2 lands, so it belongs with the rest of the route signals rather than appearing later as a one-off.

**Everything else in `base/crud` is untouched** — `isUrlSyncEnabled()`, `initUrlSync()`, `enableUrlSync()` and `getRouteBasedModuleAlias()` all stay on `UrlService`.

### 5. `libs/src/url/provider.ts`

```ts
// file: ./libs/src/url/provider.ts
import { Provider } from '@angular/core';
import { UrlState } from './state';
import { UrlService } from './service';

export const URL_PROVIDER: Provider[] = [
    UrlState,
    UrlService,
];

/**
 * App-wide URL module.
 * Both classes stay @Service({ autoProvided: false }) so registration is
 * explicit here rather than implicit at the class.
 *
 * Deliberately NO provideAppInitializer — see "No eager instantiation" below.
 */
export function provideUrlModule() {
    return [
        ...URL_PROVIDER,
    ];
}
```

#### No eager instantiation

An earlier draft added `provideAppInitializer(() => inject(UrlService))` so the
route signals would be live from navigation #1. **Dropped.** Two reasons:

1. **Bootstrap ordering.** `UrlState` injects `ContextProfileService`, `BfwApiService`,
   `GlobalProgressBarService`, `ConfService` and `LogService` ([state.ts:18-22](libs/src/url/state.ts#L18-L22)).
   Instantiating `UrlService` from an app initializer registered after
   `provideRouter(...)` pulls that whole graph up *before* `provideAppModule()`'s
   initializer — which [app.config.ts](src/app/app.config.ts) explicitly comments
   must run last. Nothing in Phase 1 is worth that risk.
2. **Nothing needs it.** The only consumer of the URL→STATE effect is
   `syncUrlToState()`, and it is driven by `initUrlSync()`, called from
   `GeoCountryService`'s constructor. Lazy creation is exactly behaviour-preserving:

   | | today | after |
   |---|---|---|
   | step 2 (activation) | `initUrlSync()` → `syncUrlToState()` | same |
   | step 2 | `NavigationEnd` subscription registered | `effect()` registered |
   | step 4 / next flush | subscription fires → `syncUrlToState()` | effect first-run → `syncUrlToState()` |

   Both do the same double sync on the module's first navigation, and the second
   one is idempotent.

`effect()` still binds to the **root** injector, not the component's: `UrlService`
is registered in the root provider array, so even when `CrudUrl` is what first
requests it, Angular constructs it in the environment injector.

Phase 3 revisits this — the sidenav and `TitleStrategy` do need route state before
any module opts in, and by then `provideUrlModule()` can be ordered alongside
`provideAppModule()` deliberately rather than as a side effect.

#### `UrlState`'s unused injections — open decision

`conf`, `log`, `gpbs`, `ctxp` and `api` are declared on `UrlState`
([state.ts:18-22](libs/src/url/state.ts#L18-L22)) and never referenced in the
class body — the standard state-class dependency block. At component scope they
cost nothing, because those services already exist by the time a module mounts.

Flagging rather than deciding, because these are deliberate scaffolding in the
house style, not dead code — the same reasoning that keeps the uncalled guards
and the uncalled `UrlState` methods. Two options:

- **Keep all five** (default, matches convention). Safe as long as
  `provideUrlModule()` has no eager initializer, which is the recommendation
  above — nothing is constructed until a module first injects `UrlService`,
  exactly as today.
- **Prune to `conf` + `log`.** Only worth doing if Phase 3 adds the eager
  initializer and bootstrap ordering turns out to bite; revisit then, not now.

Either way this is not a Phase 1 blocker. It only becomes one if the eager
initializer comes back.

### 6. `src/app/app.config.ts`

```ts
    provideRouter(routes, withComponentInputBinding()),
    provideUrlModule(),
```

Placed after `provideRouter(...)` — it depends on `Router`. With no app
initializer this is purely a registration, so its position only has to satisfy
readability. No router feature changes this phase.

### 7. Component providers — remove `URL_PROVIDER`

A component-level `URL_PROVIDER` would shadow the singletons with a second set. Remove the entry and its import from:

- [geo/country/component.ts:12,41](src/app/module/shared/geo/country/component.ts#L41)
- [signin/component.ts:19,55](src/app/module/shared/onboarding/signin/component.ts#L55)
- [signup/component.ts:13,47](src/app/module/shared/onboarding/signup/component.ts#L47)
- [forgot-password/component.ts:13,47](src/app/module/shared/onboarding/forgot-password/component.ts#L47)
- [recover-password/component.ts:14,35](src/app/module/shared/onboarding/recover-password/component.ts#L35)
- [signout/component.ts:17](src/app/module/shared/onboarding/signout/component.ts#L17) — import only, already not in `providers`

Only `geo/country` actually resolves `UrlService` (via `CrudUrl`); in the five onboarding components nothing injects it, so `URL_PROVIDER` there is already dead and removal is zero-risk.

---

## Code-audit deltas

Findings from walking the live tree that were not in the earlier draft.

### Reentrancy flags go async — `sameParams()` is the real guard

This is the one genuine semantic change hidden inside "replace the subscription
with an effect", and it needs to be understood before the rewrite, not debugged after.

Today `syncingStateToUrl` works because the `NavigationEnd` **subscription is
synchronous**. `syncStateRuntimeToUrl()` sets the flag, calls `router.navigate()`,
and clears it in `.finally()`. The navigate promise resolves at `t.resolve(true)`
(`_router-chunk.mjs:3919`), one line after `NavigationEnd` is emitted — so when
the subscriber runs, the flag is still `true` and the echo is skipped.

An `effect()` is **scheduled**, not synchronous. It runs on the next scheduler
flush, by which time `.finally()` has already cleared the flag. Same for
`syncingUrlToState` guarding the STATE→URL direction — that one is arguably
already dead today for the same reason.

So the echo is no longer suppressed. It terminates anyway:

```
navigate()  →  NavigationEnd  →  URL→STATE effect  →  syncUrlToState()
            →  setMatrixParams(fresh object)  →  identity change, signal notifies
            →  STATE→URL effect  →  sameParams(next, current) === true
            →  early return, no navigate.  Loop ends.
```

The cost is one extra derivation per navigation and no history entry
(`syncStateRuntimeToUrl()` returns before `router.navigate()`, so `replaceUrl: false`
never fires). Acceptable — but it means **`sameParams()` is now load-bearing**.
Verification step 3 is the check for this.

Keep both flags this phase: they still cover the *synchronous* re-entry path
(`initUrlSync()` calling `syncUrlToState()` while an effect is mid-flush).
Phase 2 removes them once that is proven redundant.

### `getRouteBasedModuleAlias()` — verified no ID breakage

The highest-consequence unknown in the route-walk rewrite. `getRouteBasedModuleAlias()`
is the salt for `CrudUtility.encId()` ([utility.ts:47](src/app/base/crud/utility.ts#L47)),
which produces the stable short aliases used as row identifiers. A changed module
segment silently invalidates every encoded ID in flight.

Traced the new `getModuleComponentRoute()` → segment-owner walk against the live
route tree on all six current routes. `country` in every CRUD case, identical to
what the current `aroute.pathFromRoot` reverse-scan returns from
`GeoCountryComponent`'s injector. **No alias change.**

The `cursor.component || cursor.routeConfig?.loadComponent` test is what makes
this safe: every module route in this app uses `loadComponent`, and the
`routeConfig` fallback holds whether or not the lazy chunk has resolved yet.

### `create` / `update` are genuinely componentless — confirmed

[geo/country/route.ts:44-65](src/app/module/shared/geo/country/route.ts#L44-L65) —
both children carry `children: []` and no component, with a comment explaining
that empty array satisfies Angular's route validation. This is what makes
`country → country/create` not a module change, so `;cp=3` survives. Verification
step 4 depends on it.

### `<app-crud>` is a child of `GeoCountryComponent`

Worth stating because it is not obvious from the file layout.
[geo/country/template.html:2](src/app/module/shared/geo/country/template.html#L2)
renders `<app-crud>`, and `CrudComponent` has `providers: []` — it resolves
`CrudService` from `GeoCountryComponent`'s injector. So `CrudComponent`'s
constructor call to `initCrudActionFromUrl()` runs during route activation
(step 2), one level below the component that owns the providers.

That is exactly why the two `crud/url.ts` route reads must stay **live** this
phase, and why removing `URL_PROVIDER` from `GeoCountryComponent` is what
redirects `CrudUrl`'s `inject(UrlService)` to the root singleton.

### `CrudRoute` is an empty class

[base/crud/route.ts](src/app/base/crud/route.ts) is `export class CrudRoute { }`
with two unused slug imports. Phase 3's cleanup note describes
`CrudRoute.create/update/wildcard` as "never called" — those methods do not
exist at all. Not a Phase 1 concern; corrected in `all-phases.md`.

### Deletion checklist for `UrlService`

Everything leaving `UrlService` in this phase, in one list, so the final file can
be diffed against it:

| deleted | replacement |
|---|---|
| `inject(ActivatedRoute)` | root walk from `router.routerState` |
| `inject(DestroyRef)` | effect is root-scoped |
| `inject(Location)` | dead, no replacement |
| `getActiveRoute()` | `state.getActivatedRouteSnapshot()` |
| `getStateHostInfo()` | `state.hostInfo()` |
| `setMatrixParams()` | `state.patchMatrixParams()` |
| `setQueryParams()` | `state.patchQueryParams()` |
| `replaceMatrixParams()` | `state.setMatrixParams()` |
| `replaceQueryParams()` | `state.setQueryParams()` |
| `setFragment()` | `state.setFragment()` |
| `setMatrixParam()` / `setQueryParam()` | moved to `UrlState`, same names |
| `removeMatrixParam()` / `removeQueryParam()` | moved to `UrlState`, same names |
| `patchUrlState()` / `replaceUrlState()` / `clearUrlState()` | moved to `UrlState`, same names |
| `getMatrixParams()` / `getQueryParams()` / `getFragment()` | moved to `UrlState`, same names |

And leaving `UrlState`: the nine `setProtocol()` … `setPassword()` setters
([state.ts:130-164](libs/src/url/state.ts#L130-L164)), replaced by the `origin()`
computeds.

Staying on `UrlService`: `enableUrlSync`, `isUrlSyncEnabled`, `initUrlSync`,
`syncUrlToState`, `syncStateRuntimeToUrl`, the nine live `getX()` host accessors,
`getCurrentHostInfo`, `getModuleComponentRoute`, `getModuleActivatedRoute`,
`getModulePath`, `getRouteBasedModuleAlias`, the four private param helpers, and
the four `static` path builders.

---

## Explicitly not in this phase

- `base/crud` beyond the 8 call sites above. `CrudComponent`'s `NavigationEnd` subscription and `initCrudActionFromUrl()` stay until Phase 2, and no crud logic changes — all 8 edits are `this.url.X()` → `this.url.state.X()`.
- No guard, route-file or `app.routes.ts` changes.
- `pathMatch: 'full'` on `'**'` ([not-found/route.ts:32](src/app/module/shared/http-status/not-found/route.ts#L32)) is a no-op Angular ignores — flagged, not removed.

---

## Verification

`npm run build` clean, then `npm run dev.web`. Everything must behave **exactly as before**.

**Matrix params — main regression surface (route-walk rewrite + set/patch mapping):**
1. `/account/geo/country` → paginate to page 3 → URL shows `country;cp=3` → reload → page 3 restored.
2. Apply a search filter, change it, then clear it. Specific check for `replaceMatrixParams → state.setMatrixParams` — if mis-wired to `patchMatrixParams`, cleared filters linger in the URL instead of disappearing.
3. Apply a view option alongside a filter; the URL must not flicker or double-navigate (that would mean the two effects are looping).
4. `country` → `create` → close → back to listing. `;cp=3` must survive — proving `create` is not a module change.
5. `country` → `update/:id` → close.

**CRUD action detection — the `getActiveRoute()` removal:**
6. Deep-link directly to `/account/geo/country/create` (fresh load, not via navigation). The create form must open. This is the live-vs-signal check — a signal read here would see the previous navigation and open the listing instead.
7. Deep-link directly to `/account/geo/country/update/7`. The form must load record 7.

**URL ownership — new singleton behaviour:**
8. `country` (with `;cp=3`) → `dashboard`. Dashboard's URL stays clean, no matrix params written onto it.
9. `dashboard` → back to `country` → sync re-claims and page state applies.
10. `country` → `geo/state` → back to `country`.
10a. **Ownership release with sync off.** Temporarily add `enableUrlSync(false)` immediately after `initUrlSync()` in `GeoCountryService`, per the pattern `crud/child/service.ts:25-26` documents. Load `country`, navigate to `dashboard`, log `state.urlOwnerPath()` — it must be `null`. If it still reads `account/geo/country`, the two checks inside the URL→STATE effect are in the wrong order. Revert the temporary line after.

**Host signals — push → derive:**
11. Log `state.hostInfo()` from any component on `/account/dashboard` (a module that never enables URL sync). Every field must be populated. Under the old push mechanism these were only written inside `syncUrlToState()`, so on dashboard they held either `null` or whatever `geo/country` last left behind — this step confirms the staleness is gone, and is the one place the upgrade is intentionally *not* behaviour-preserving.
12. On the dev server (`localhost` or `127.0.0.1`), `state.tld()` and `state.subdomain()` must both be `null`. The old parse returned `'1'` / `'127.0'` on `127.0.0.1`. Expected delta from the `parseOrigin()` guard, zero callers affected.
12a. `parseOrigin()` is pure and static — cover the truth table above with a plain unit test rather than by browsing. It is the only genuinely testable unit in this phase and the only place `tldLabelCount` logic can go wrong silently. (`libs/src/url/state.spec.ts`; the repo has vitest via `npm run test` and two existing specs to copy the shape from.)
13. Put `hostInfo()` in an `effect` and navigate `country` (changing page/filter, so matrix params move) → `dashboard` → `country`. It must fire once per **path change**, not once per navigation. Confirms `origin()` is constant and the composed object is gated by the path string, so `hostInfo()` is safe to read directly from a template or effect.

**Instance count:**
14. Temporarily log in `UrlState`'s **and** `UrlService`'s constructors. Navigate across three modules — exactly **one** line each. More means `URL_PROVIDER` is still in a component's `providers`.

**Echo loop — the async reentrancy flags:**
19. Put a counter in `syncStateRuntimeToUrl()` before the `sameParams()` block and another after it. Paginate once on `country`. The method must be **entered twice** (once from the CRUD state change, once from the post-navigation echo) but reach `router.navigate()` only **once**. Entering twice and navigating twice means `sameParams()` is not catching the echo — stop and fix before continuing, that is an infinite loop with `replaceUrl: false` writing history entries.
20. Watch the browser back button after a few paginations: the history depth must match the number of user actions, not double it.

**Bootstrap ordering:**
21. Hard-reload on `/account/dashboard` signed out, then signed in. `AppService.initialize()` must still run before anything URL-related. If `provideUrlModule()` was given an app initializer against the recommendation, this is where it surfaces.

**Untouched areas (sanity):**
15. Private-area breadcrumbs render identically.
16. Sign out → deep-link `/account/geo/country` → signin → sign in → lands back on `/account/geo/country`.
17. `/auth/recover-password/:publicid` still resolves its param.
18. Browser back/forward across all of the above.

`npm run test` after.

---

## What this sets up

Phase 1 leaves no cleanup debt — there are no wrappers to remove and every method has exactly one home.

Phase 2 converts `CrudUrl`'s two route reads to `computed` over `state.activatedRouteFirstSegment()` / `state.routeParams()` and removes `CrudComponent`'s `NavigationEnd` subscription — as a pair, since dropping the constructor call is what makes the signal read safe. It also revisits whether the `syncingUrlToState` / `syncingStateToUrl` booleans are still needed given `sameParams()`'s early return.

Phase 3 adds a reactive `modulePath` computed to `UrlState` for sidenav highlighting — left out here because Phase 1 needs only the live `getModulePath()`. Phase 3's sidenav, title strategy and access rules read `state.routePathFromRoot()` and the `UrlRouteDataType` fields declared here.
