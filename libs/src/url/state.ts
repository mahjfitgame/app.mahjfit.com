// file: libs/src/url/state.ts
import { computed, effect, inject, Service, Signal, signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { SignalStateService } from '@libs/signal-state/service';
import { SLUG_FOUNDATION_PARAM_PUBLICID } from '@libs/foundation/const';
import {
    UrlHostInfoType,
    UrlParamsType,
    UrlParamValueType,
    UrlStatePatchInputType,
    UrlStateReplaceInputType,
} from './type';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { GlobalProgressBarService } from 'src/app/base/global-progress-bar/service';
import { ContextProfileService } from '@libs/context-profile/service';
import { BfwApiService } from '@libs/third-party-apis/bfw-api/service';
import { URL_STATE_STORE_KEY, URL_TLD_LABEL_COUNT } from './const';
import { FoundationModuleRouteDataType, FoundationModuleStateType } from '@libs/foundation/module/type';

@Service({ autoProvided: false })
export class UrlState extends SignalStateService implements FoundationModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    /**
     * Router is the source of truth for every route signal below.
     * Must stay above them: field initialisers run in declaration order.
     */
    public readonly router = inject(Router);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = URL_STATE_STORE_KEY;

    /**
     * Label count of the public suffix for this deployment's domain.
     * 1 for .com / .io / .dev, 2 for .co.uk / .com.au.
     *
     * The one line to change when a deployment domain has a two-part suffix.
     * Declared here because field initialisers run in order and origin() reads it.
     */
    protected readonly tldLabelCount: number = this.conf.appHostDomainTldLabelCount ?? URL_TLD_LABEL_COUNT;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _urlSyncEnabled = signal<boolean>(false);
    public readonly urlSyncEnabled = this._urlSyncEnabled.asReadonly();

    private readonly _matrixParams = signal<UrlParamsType>({});
    public readonly matrixParams = this._matrixParams.asReadonly();

    private readonly _queryParams = signal<UrlParamsType>({});
    public readonly queryParams = this._queryParams.asReadonly();

    private readonly _fragment = signal<string | null>(null);
    public readonly fragment = this._fragment.asReadonly();

    // ████ ROUTE SIGNAL PROPERTIES █████████████████████████████████████
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
    public readonly routeUrl = computed<string>(() => {
        this.activatedRouteSnapshot(); // re-derive on every navigation
        return this.router.url;
    });
    public readonly routeParams = computed(() => this.activatedRouteSnapshot().params);
    public readonly routeQueryParams = computed(() => this.activatedRouteSnapshot().queryParams);
    public readonly routeFragment = computed(() => this.activatedRouteSnapshot().fragment);
    public readonly routeData = computed<FoundationModuleRouteDataType>(() => this.activatedRouteSnapshot().data);
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

    // ████ URL OWNERSHIP SIGNAL PROPERTIES ██████████████████████████████
    /**
     * As a root singleton the sync flag no longer dies with the component,
     * so ownership is explicit: one module holds the URL, and navigating
     * away from that module ends its claim.
     *
     * Ownership and enabled-ness are separate on purpose —
     * base/crud/child/service.ts documents calling enableUrlSync(false)
     * right after initUrlSync(), so a module can own the URL while sync is off.
     */

    private readonly _urlOwnerPath = signal<string | null>(null);
    public readonly urlOwnerPath = this._urlOwnerPath.asReadonly();
    public readonly urlOwned = computed<boolean>(() => this._urlOwnerPath() !== null);

    // ████ HOST SIGNAL PROPERTIES ██████████████████████████████████████
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
     */
    public readonly hostInfo = computed<UrlHostInfoType>(() => ({
        ...this.origin(),
        path: this.path(),
    }));

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    // n/a

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████

    public override onActivate(): void {
        /*
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
        */
    }

    public override onDeactivate(): void {

    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    public setUrlSyncEnabled(value: boolean): void {
        this._urlSyncEnabled.set(value);
    }

    public setUrlOwnerPath(value: string | null): void {
        this._urlOwnerPath.set(value);
    }

    public setMatrixParams(value: UrlParamsType): void {
        this._matrixParams.set(value);
    }
    public patchMatrixParams(value: UrlParamsType): void {
        this._matrixParams.update((current) => ({
            ...current,
            ...value,
        }));
    }

    public setQueryParams(value: UrlParamsType): void {
        this._queryParams.set(value);
    }
    public patchQueryParams(value: UrlParamsType): void {
        this._queryParams.update((current) => ({
            ...current,
            ...value,
        }));
    }

    public setFragment(value: string | null): void {
        this._fragment.set(value);
    }

    // ████ URL STATE MUTATORS ██████████████████████████████████████████
    /**
     * Convention, unchanged: setX replaces, patchX merges.
     * The old UrlService.setMatrixParams()/setQueryParams() were patch helpers
     * and replaceMatrixParams()/replaceQueryParams() were replace helpers —
     * all of them are redundant here and were deleted, not moved.
     */

    /**
     * Patch multiple URL state values at once.
     * Existing params are preserved unless same key is overwritten.
     */
    public patchUrlState(input: UrlStatePatchInputType): void {
        if (input.matrixParams) {
            this.patchMatrixParams(input.matrixParams);
        }

        if (input.queryParams) {
            this.patchQueryParams(input.queryParams);
        }

        if (input.fragment) {
            this.setFragment(input.fragment ?? null);
        }
    }

    /**
     * Replace multiple URL state values at once.
     * Existing params are NOT preserved.
     */
    public replaceUrlState(input: UrlStateReplaceInputType): void {
        if (input.matrixParams) {
            this.setMatrixParams(input.matrixParams);
        }

        if (input.queryParams) {
            this.setQueryParams(input.queryParams);
        }

        if ('fragment' in input) {
            this.setFragment(input.fragment ?? null);
        }
    }

    public setMatrixParam(key: string, value: UrlParamValueType): void {
        if (!key) return;

        this.patchMatrixParams({
            [key]: value,
        });
    }

    public setQueryParam(key: string, value: UrlParamValueType): void {
        if (!key) return;

        this.patchQueryParams({
            [key]: value,
        });
    }

    public removeMatrixParam(key: string): void {
        if (!key) return;

        const current = this.matrixParams();
        const next: UrlParamsType = {};

        for (const k in current) {
            if (k !== key) {
                next[k] = current[k];
            }
        }

        this.setMatrixParams(next);
    }

    public removeQueryParam(key: string): void {
        if (!key) return;

        const current = this.queryParams();
        const next: UrlParamsType = {};

        for (const k in current) {
            if (k !== key) {
                next[k] = current[k];
            }
        }

        this.setQueryParams(next);
    }

    public clearUrlState(): void {
        this.setMatrixParams({});
        this.setQueryParams({});
        this.setFragment(null);
    }

    // ████ URL STATE READERS ███████████████████████████████████████████

    public getMatrixParams(): UrlParamsType {
        return {
            ...this.matrixParams(),
        };
    }

    public getQueryParams(): UrlParamsType {
        return {
            ...this.queryParams(),
        };
    }

    public getFragment(): string | null {
        return this.fragment();
    }

    // ████ ROUTE READERS ███████████████████████████████████████████████

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

    // ████ STANDARD ROUTE PARAM SIGNALS ████████████████████████████████
    /**
     * `:publicid` is a project-wide standard route param, so it is resolved
     * once here instead of in each module. App-wide because UrlState is a
     * root singleton.
     *
     * ⚠ NOT the same value as ContextProfileState.publicid, which is the
     * SESSION's own id and stays there — session identity, not URL data.
     * This one is the candidate coming out of the URL; that one is what it
     * gets checked against.
     */
    public readonly routeParamPublicid = this.getRouteParam(SLUG_FOUNDATION_PARAM_PUBLICID);

    /** live variant for tier 1-2 callers, same get / read split as everywhere else */
    public readRouteParamPublicid(): string | null {
        return this.readRouteParam(SLUG_FOUNDATION_PARAM_PUBLICID);
    }

    /**
     * Convenience only. The comparison itself stays in ContextProfileState —
     * UrlState supplies the URL half and delegates the session half.
     */
    public readonly isRouteParamPublicidValid = computed<boolean>(
        () => this.ctxp.state.validatePublicid(this.routeParamPublicid()),
    );

    // ████ HOST INFO ███████████████████████████████████████████████████

    /**
     * Live parse of window.location, for imperative callers — UrlService's
     * nine getX() accessors delegate here. Lives with the computed for the
     * same reason as the leaf-snapshot walk: a computed's source function
     * belongs next to the computed.
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
     *        all a single-domain app needs. Everything below derives from it
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

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
