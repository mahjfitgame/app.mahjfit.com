// file: ./libs/src/url/service.ts
import {
    effect,
    inject,
    Service,
    untracked,
} from '@angular/core';
import {
    ActivatedRoute,
    Router,
} from '@angular/router';
import {
    UrlCleanParamsType,
    UrlHostInfoType,
    UrlParamsType,
} from './type';
import { UrlState } from './state';

@Service({ autoProvided: false })
export class UrlService {

    private readonly router = inject(Router);

    public readonly state = inject(UrlState);

    // ████ SYNC ENGINE █████████████████████████████████████████████████
    /**
     * Both directions live here together. syncUrlToState() could sit in
     * state.ts — it only reads the router and writes own signals — but the two
     * are guarded by the shared reentrancy flags below. Splitting the pair
     * would put a loop guard on one side of a file boundary.
     *
     * ⚠ Both flags are advisory. They still cover synchronous re-entry
     * (initUrlSync() calling syncUrlToState() while an effect is mid-flush),
     * but they no longer catch the post-navigation echo: effects are scheduled,
     * so router.navigate()'s .finally() has already cleared syncingStateToUrl
     * by the time the URL -> STATE effect runs. sameParams() in
     * syncStateRuntimeToUrl() is what actually terminates that loop.
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
             * Same idiom as base/crud/url.ts.
             */
            untracked(() => {
                /**
                 * Ownership release MUST come before the urlSyncEnabled check.
                 * base/crud/child/service.ts documents calling
                 * enableUrlSync(false) right after initUrlSync(), so a module
                 * can own the URL with sync already off. Checking
                 * urlSyncEnabled first would return early and strand that
                 * claim forever.
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

        // STATE -> URL
        effect(() => {
            if (!this.state.urlSyncEnabled()) return;

            this.state.matrixParams();
            this.state.queryParams();
            this.state.fragment();

            if (this.syncingUrlToState) return;

            this.syncStateRuntimeToUrl();
        });
    }

    public enableUrlSync(flag: boolean): void {
        this.state.setUrlSyncEnabled(flag);
    }
    public isUrlSyncEnabled(): boolean {
        return this.state.urlSyncEnabled();
    }
    /**
     * Call once from child component/module.
     * Reads the current URL into state, claims the URL for this module,
     * then enables sync.
     */
    public initUrlSync(): void {
        this.syncUrlToState();
        this.state.setUrlOwnerPath(this.getModulePath());
        this.enableUrlSync(true);
    }

    /**
     * URL -> State
     *
     * Writes three signals. The nine host setX() calls are gone — those
     * signals derive themselves from window.location now.
     *
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

    /**
     * State -> URL
     *
     * Writes only:
     * - matrix params
     * - query params
     * - fragment
     *
     * Does not write protocol/domain/port/etc.
     */
    public syncStateRuntimeToUrl(): void {
        const snapshot = this.state.getActivatedRouteSnapshot();
        const matrixParamRoute = this.getModuleActivatedRoute();

        const nextMatrixParams = this.cleanParams(this.state.matrixParams());
        const nextQueryParams = this.cleanParams(this.state.queryParams());
        const nextFragment = this.state.fragment();

        const currentMatrixParams = this.cleanParams(this.getCurrentMatrixParams(matrixParamRoute));
        const currentQueryParams = this.cleanParams(snapshot.queryParams);
        const currentFragment = snapshot.fragment ?? null;

        /**
         * Load-bearing: this is what terminates the post-navigation echo now
         * that the reentrancy flags are advisory. See the sync engine note.
         */
        if (
            this.sameParams(nextMatrixParams, currentMatrixParams) &&
            this.sameParams(nextQueryParams, currentQueryParams) &&
            nextFragment === currentFragment
        ) {
            return;
        }

        this.syncingStateToUrl = true;

        this.router.navigate(
            ['.', nextMatrixParams],
            {
                relativeTo: matrixParamRoute,
                queryParams: nextQueryParams,
                fragment: nextFragment || undefined,
                replaceUrl: false, // to keep url in browser history, back button works as expected
            },
        ).finally(() => {
            this.syncingStateToUrl = false;
        });
    }

    // ████ HOST INFO ███████████████████████████████████████████████████
    /**
     * The live variants. The parse lives on UrlState as the static
     * parseOrigin(), reached through state.getCurrentHostInfo(), so these
     * delegate.
     *
     * Reactive callers use state.protocol() and friends instead.
     */

    public getProtocol(): string | null {
        return this.getCurrentHostInfo().protocol;
    }

    public getDomain(): string | null {
        return this.getCurrentHostInfo().domain;
    }

    public getHostname(): string | null {
        return this.getCurrentHostInfo().hostname;
    }

    public getPort(): string | null {
        return this.getCurrentHostInfo().port;
    }

    public getPath(): string {
        return this.getCurrentHostInfo().path;
    }

    public getSubdomain(): string | null {
        return this.getCurrentHostInfo().subdomain;
    }

    public getTld(): string | null {
        return this.getCurrentHostInfo().tld;
    }

    public getUsername(): string | null {
        return this.getCurrentHostInfo().username;
    }

    public getPassword(): string | null {
        return this.getCurrentHostInfo().password;
    }

    public getCurrentHostInfo(): UrlHostInfoType {
        return this.state.getCurrentHostInfo();
    }

    // ████ ROUTE POSITION ██████████████████████████████████████████████
    /**
     * Live router.routerState reads, no signals involved.
     * getActiveRoute() is gone — every caller only wanted the leaf snapshot,
     * which UrlState.getActivatedRouteSnapshot() provides.
     * The ActivatedRoute walk survives only because syncStateRuntimeToUrl()
     * passes getModuleActivatedRoute() as `relativeTo` to router.navigate().
     */

    public getRouteBasedModuleAlias(id: string): string {
        const segments = this.getModuleActivatedRoute().snapshot.url;
        const moduleSegment = segments.at(-1)?.path ?? '';

        return `${moduleSegment}~${id}`;
    }

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
            if (owner.snapshot.url.length > 0) {
                return owner;
            }

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

    // ████ PARAM UTILITIES █████████████████████████████████████████████

    private getCurrentMatrixParams(route: ActivatedRoute): UrlParamsType {
        const segments = route.snapshot.url;

        if (!segments.length) {
            return {};
        }

        return this.cloneParams(segments[segments.length - 1].parameters);
    }

    private cloneParams(params: Record<string, any>): UrlParamsType {
        const result: UrlParamsType = {};

        for (const key in params) {
            result[key] = params[key];
        }

        return result;
    }

    private cleanParams(params: UrlParamsType): UrlCleanParamsType {
        const result: UrlCleanParamsType = {};

        for (const key in params) {
            const value = params[key];

            if (value === null || value === undefined || value === '') {
                continue;
            }

            if (Array.isArray(value)) {
                if (!value.length) continue;

                result[key] = value.join(',');
                continue;
            }

            result[key] = String(value);
        }

        return result;
    }

    private sameParams(a: UrlParamsType, b: UrlParamsType): boolean {
        const aa = this.cleanParams(a);
        const bb = this.cleanParams(b);

        let aCount = 0;
        let bCount = 0;

        for (const key in aa) {
            aCount++;

            if (aa[key] !== bb[key]) {
                return false;
            }
        }

        for (const key in bb) {
            bCount++;
        }

        return aCount === bCount;
    }

    /**
     * @getRelativePathArr
     * provide relative route array
     * do not provide domin or protocol
     *
     * @param moduleLevel string[]
     * do not include domin or protocol
     *
     * @param params Record<string, string | number>
     *
     * @returns string[]
     * do not provide '/' as first/leading element
     */
    public static getRelativePathArr(
        moduleLevel: string[],
        params: Record<string, string | number> = {}
    ): string[] {
        // 1. Join the slugs
        let fullPath = moduleLevel.join('/');

        // 2. Replace placeholders with actual values
        Object.entries(params).forEach(([key, value]) => {
            fullPath = fullPath.replace(key, value.toString());
        });

        // 3. Clean up unwated or not passed parameters
        // Splits by '/', removes empty strings, and removes leftover placeholders
        const segments = fullPath.split('/') // removes empty strings
            .filter(seg => (seg && seg !== '' && !seg.startsWith(':')));

        return segments;
    }
    /**
     * @getRelativePath
     * provide relative path string
     * do not provide domin or protocol
     *
     * @param moduleLevel string[]
     * do not include domin or protocol
     *
     * @param params Record<string, string | number>
     *
     * @returns string
     * string with not-leading '/'
     */
    public static getRelativePath(
        moduleLevel: string[],
        params: Record<string, string | number> = {},
    ): string {
        const routerLink = this.getRelativePathArr(moduleLevel, params);

        const relative = routerLink.join('/');

        return relative;
    }
    /**
     * @getAbsolutePathArr
     * provide absolute route array
     * do not provide domin or protocol
     *
     * @param moduleLevel string[]
     * do not include domin or protocol
     *
     * @param params Record<string, string | number>
     *
     * @returns string[]
     * provide '/' as first/leading element
     */
    public static getAbsolutePathArr(
        moduleLevel: string[],
        params: Record<string, string | number> = {}
    ): string[] {
        const relativeArr = this.getRelativePathArr(moduleLevel, params);

        // must need '/' at the start for absolute route
        const absoluteArr = ['/', ...relativeArr];

        return absoluteArr;
    }
    /**
     * @getAbsolutePath
     * provide relative path string
     * do not provide domin or protocol
     *
     * @param moduleLevel string[]
     * do not include domin or protocol
     *
     * @param params Record<string, string | number>
     *
     * @returns string
     * string with leading '/'
     */

    public static getAbsolutePath(
        moduleLevel: string[],
        params: Record<string, string | number> = {},
    ): string {
        const relative = this.getRelativePath(moduleLevel, params);

        // must need '/' at the start for absolute path
        const absolute = '/' + relative;

        return absolute
    }
}
