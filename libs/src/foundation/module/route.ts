// file: libs/src/foundation/module/route.ts
import { computed, inject, isDevMode, Signal } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { LogService } from '@libs/log/service';
import { UrlState } from '@libs/url/state';
import { FoundationActionEnum } from '../action/enum';
import { FoundationAreaEnum } from '../enum';
import { FoundationNavPositionEnum } from '../nav/enum';
import { FoundationModulePath } from './path';
import {
    FoundationModuleRouteDefinitionType,
    FoundationModuleRouteLoaderType,
    FoundationModuleRouteNavType,
    FoundationModuleRouteResolveType,
} from './type';

/**
 * @FoundationModuleRoute
 * the base every *Route class extends: identity, definition, nav, paths, resolve
 *
 * ⚠ EXTENDS, never implements. FoundationModuleRouteType stays the contract and
 * stays checked where it always was — assigning the class into the area registry
 * (TS2418). `implements` still cannot work here for the reason written on that
 * interface: it checks the INSTANCE side and every member here is static.
 *
 * ⚠ STATICS ONLY, and DI never constructs this. a *Route class that needs DI
 * still declares its own inject() fields; nothing here touches the instance.
 *
 * ⚠ EVERY MEMBER IS MEANT TO BE OVERRIDDEN. the defaults below exist so a half
 * written module degrades predictably instead of routing somewhere wrong — they
 * are not values any real module should run on. each one documents its fail mode.
 *
 * ⚠ THE ROUTE INJECTOR, NOT THE COMPONENT'S — see FoundationModuleRouteLoaderType.
 */
export abstract class FoundationModuleRoute {
    // ████ CLASS PROPERTIES ████████████████████████████████████████████
    /**
     * = mod_regisyry_index. SCREAMING_SNAKE, unique within its area.
     *
     * ⚠ declared here so absolutePath() below can read it off the DERIVED class,
     * which is what let 17 identical copies of the path helpers collapse into one.
     *
     * ⚠ FAIL MODE: inheriting this means a module that never declares its own
     * still satisfies FoundationModuleRouteType, so the missing key stops being a
     * compile error. Two guards cover it — the empty test in absolutePath() below,
     * and the duplicate test in FoundationAreaBuilder.walk().
     */
    public static readonly registryKey: string = '';

    /**
     * = mod_ararea_id. also decides route ownership: a foreign area's module is
     * nav only.
     *
     * ⚠ FAIL MODE: OPEN is the UNGUARDED area (canMatch: [] on OpenAreaRoute) and
     * its slug is '', which prefix matches every url. A module that forgets to
     * declare its own area does NOT silently become public, because nav() below
     * defaults to active: false and the builder drops the row before it can route
     * — but declare nav() and forget this, and the builder reads module.area !==
     * row.area_key as BORROWED: a menu entry with no route behind it.
     */
    public static readonly area: FoundationAreaEnum = FoundationAreaEnum.OPEN;

    /**
     * The ONE route-data key every module resolver writes to.
     *
     * ⚠ readonly so typescript infers the literal 'resolved' and not string, which
     * is what makes [this.resolvedKey] a well typed computed key below.
     */
    public static readonly resolvedKey = 'resolved';

    // ████ DEFINITION ██████████████████████████████████████████████████
    /**
     * the CODE OWNED half (Rule 6): the component, the guards, the actions.
     *
     * ⚠ FAIL MODE: /404. a module that never declares its own definition routes
     * to not-found rather than to a blank outlet, so the mistake is visible in
     * the browser instead of silently rendering nothing.
     *
     * ⚠ an override MUST carry `resolve: this.resolve()` itself. this default is
     * the only place it is written for free, and an override replaces the whole
     * object.
     */
    public static definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('@module/shared/http-status/not-found/component')
                .then((c) => c.HttpStatusNotFoundComponent),
            canMatch: [],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            resolve: this.resolve(),
            actions: [],
        };
    }

    // ████ NAV █████████████████████████████████████████████████████████
    /**
     * DATA OWNED (Rule 8), ONE row of te_access_area_navigation.
     *
     * ⚠ FAIL MODE: active: false, which the builder drops outright at pass 1 —
     * no route, no menu entry, and its children never walk either.
     *
     * ⚠ active: false and NOT hidden alone, deliberately, and this is the one
     * default stricter than "hide it". `hidden` is TRANSPARENT, not absent: the
     * builder lifts a hidden row's children to the level above, so a half written
     * module would silently RE-PARENT its whole subtree to the area root.
     * active: false removes the row and the subtree together, which is the only
     * default here that cannot move another module's url.
     */
    public static nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: null,
            url_slug: '',
            label: '',
            icon: '',
            sort_order: 0,
            actions: [],
            hidden: true,
            active: false,
            nav_position: [FoundationNavPositionEnum.START],
        };
    }

    // ████ PATHS ███████████████████████████████████████████████████████
    /**
     * ⚠ `this` is the DERIVED class here, so this one implementation answers for
     * every module. it replaced 17 identical copies.
     *
     * ⚠ the dev guard is not decoration — it is the compile error registryKey lost
     * by becoming inheritable. FoundationModulePath.of('') answers a path, it does
     * not throw, so without this a module missing its key resolves somewhere
     * plausible and wrong.
     *
     * ⚠ a module whose path takes a token (RecoverPasswordRoute) overrides both.
     * The argument must stay OPTIONAL there: FoundationModuleRouteType declares
     * absolutePath(): string and the registry map is where that static shape is
     * checked, so a required argument fails to compile.
     */
    public static absolutePath(): string {
        if (isDevMode() && !this.registryKey) {
            console.error(`[route] ${this.name} does not declare a registryKey`);
        }

        return FoundationModulePath.of(this.registryKey);
    }

    public static absolutePathArr(): string[] {
        return FoundationModulePath.arrOf(this.registryKey);
    }

    /**
     * Shared implementation for the explicit action-path methods declared by a
     * child *Route class. Application code should use those named methods (for
     * example absolutePathDuplicate()) so callers never need to know the action
     * enum or its route placeholders.
     */
    public static absolutePathAction(
        action: FoundationActionEnum,
        params: Record<string, string | number> = {},
    ): string {
        return FoundationModulePath.ofAction(this.registryKey, action, params);
    }

    /** Array form of absolutePathAction(), for Angular routerLink consumers. */
    public static absolutePathActionArr(
        action: FoundationActionEnum,
        params: Record<string, string | number> = {},
    ): string[] {
        return FoundationModulePath.arrOfAction(this.registryKey, action, params);
    }

    // ████ RESOLVE: CONTRACT ███████████████████████████████████████████
    /**
     * what definition().resolve declares. `{}` = nothing resolved, the same
     * declared-and-unused hook `canActivate: []` is.
     *
     * ⚠ override with one of the two policies below, never with a hand built
     * ResolveData, so the payload keeps landing under resolvedKey.
     */
    public static resolve(): FoundationModuleRouteResolveType {
        return {};
    }

    // ████ RESOLVE: POLICY █████████████████████████████████████████████
    /**
     * REQUIRED — the page is meaningless without it.
     *
     * A rejection propagates, which CANCELS the navigation: the router raises
     * NavigationError and withNavigationErrorHandler redirects to /503. That is
     * the point, so there is deliberately no try/catch here.
     */
    protected static required<T>(
        load: FoundationModuleRouteLoaderType<T>,
    ): FoundationModuleRouteResolveType {
        return {
            [this.resolvedKey]: ((route, state) => load(route, state)) as ResolveFn<T>,
        };
    }

    /**
     * OPTIONAL — better present, but not worth a dead page. Logs and hands
     * [fallback] over, so the component renders degraded instead of the user
     * landing on /503 because one lookup was slow to fail.
     *
     * ⚠ inject() is called BEFORE the first await, deliberately. everything after
     * one runs off the injection context and inject() throws there.
     */
    protected static optional<T>(
        load: FoundationModuleRouteLoaderType<T>,
        fallback: T,
    ): FoundationModuleRouteResolveType {
        return {
            [this.resolvedKey]: (async (route, state) => {
                const log = inject(LogService);

                try {
                    return await load(route, state);
                } catch (error) {
                    log.error('[route] optional resolve failed, using fallback', error);

                    return fallback;
                }
            }) as ResolveFn<T>,
        };
    }

    // ████ RESOLVE: READ ███████████████████████████████████████████████
    /**
     * @read()
     * the payload back, typed, from anywhere holding a snapshot
     *
     * ⚠ WALKS pathFromRoot, deepest first, rather than reading snapshot.data.
     *
     * VERIFIED, and not what the obvious reasoning predicts: angular's default
     * paramsInheritanceStrategy is 'always'
     * (_router-chunk.mjs:1498 DEFAULT_PARAMS_INHERITANCE_STRATEGY), NOT the
     * 'emptyOnly' the guides describe. So a module's payload already reaches the
     * deepest snapshot on its own — /404 read a payload declared two levels up
     * with no walk at all.
     *
     * The walk is kept anyway, for two reasons and neither is inheritance:
     *   - it survives withRouterConfig({ paramsInheritanceStrategy: 'emptyOnly' }),
     *     under which an ACTION CHILD (/geo/country/update/42) would stop seeing
     *     its module's payload and every read() would silently answer null
     *   - deepest first means a child that declares its OWN payload wins over an
     *     inherited one, which is the answer a caller expects
     *
     * It costs 4-6 iterations over an array that is already in memory.
     */
    public static read<T>(snapshot: ActivatedRouteSnapshot | null | undefined): T | null {
        const chain = snapshot?.pathFromRoot ?? [];

        for (let i = chain.length - 1; i >= 0; i--) {
            const data = chain[i]?.data;

            if (data && this.resolvedKey in data) {
                return (data[this.resolvedKey] ?? null) as T | null;
            }
        }

        return null;
    }

    /**
     * The payload as a SIGNAL, re-derived once per navigation — what state.ts
     * declares, in one line and without injecting UrlService itself.
     *
     * ⚠ inject() works here because a state class is constructed by DI, so its
     * field initialisers run in an injection context. Called anywhere else it
     * throws.
     */
    protected static routeResolvedSignal<T>(): Signal<T | null> {
        const url = inject(UrlState);

        return computed(() => this.read<T>(url.activatedRouteSnapshot()));
    }
}
