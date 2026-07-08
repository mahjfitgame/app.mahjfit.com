// file: ./libs/src/url/service.ts
import {
    DestroyRef,
    effect,
    inject,
    Service,
} from '@angular/core';
import {
    ActivatedRoute,
    NavigationEnd,
    Router,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import {
    UrlCleanParamsType,
    UrlHostInfoType,
    UrlParamValueType,
    UrlParamsType,
    PatchUrlStateInputType,
    ReplaceUrlStateInputType,
} from './type';
import { Location } from '@angular/common';
import { UrlState } from './state';

@Service({ autoProvided: false })
export class UrlService {

    private readonly router = inject(Router);
    private readonly location = inject(Location);
    private readonly aroute = inject(ActivatedRoute);
    private readonly destroyRef = inject(DestroyRef);

    private readonly state = inject(UrlState);

    private syncingUrlToState = false;
    private syncingStateToUrl = false;

    constructor() {
        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => {
                if (this.syncingStateToUrl) return;
                if (!this.state.urlSyncEnabled()) return;

                this.syncUrlToState();
            });

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
     */
    public initUrlSync(): void {
        this.syncUrlToState();
        this.enableUrlSync(true);
    }

    /**
     * URL -> State
     */
    public syncUrlToState(): void {
        const route = this.getActiveRoute();
        const matrixParamRoute = this.getModuleActivatedRoute();
        const hostInfo = this.getCurrentHostInfo();

        this.syncingUrlToState = true;

        this.state.setProtocol(hostInfo.protocol);
        this.state.setDomain(hostInfo.domain);
        this.state.setHostname(hostInfo.hostname);
        this.state.setPort(hostInfo.port);
        this.state.setPath(hostInfo.path);
        this.state.setSubdomain(hostInfo.subdomain);
        this.state.setTld(hostInfo.tld);
        this.state.setUsername(hostInfo.username);
        this.state.setPassword(hostInfo.password);

        this.state.setMatrixParams(this.getCurrentMatrixParams(matrixParamRoute));
        this.state.setQueryParams(this.cloneParams(route.snapshot.queryParams));
        this.state.setFragment(route.snapshot.fragment ?? null);

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
        const route = this.getActiveRoute();
        const matrixParamRoute = this.getModuleActivatedRoute();

        const nextMatrixParams = this.cleanParams(this.state.matrixParams());
        const nextQueryParams = this.cleanParams(this.state.queryParams());
        const nextFragment = this.state.fragment();

        const currentMatrixParams = this.cleanParams(this.getCurrentMatrixParams(matrixParamRoute));
        const currentQueryParams = this.cleanParams(route.snapshot.queryParams);
        const currentFragment = route.snapshot.fragment ?? null;

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

    /**
     * Patch multiple URL state values at once.
     * Existing params are preserved unless same key is overwritten.
     */
    public patchUrlState(input: PatchUrlStateInputType): void {
        if (input.matrixParams) {
            this.state.patchMatrixParams(input.matrixParams);
        }

        if (input.queryParams) {
            this.state.patchQueryParams(input.queryParams);
        }

        if (input.fragment) {
            this.state.setFragment(input.fragment ?? null);
        }
    }

    /**
     * Replace multiple URL state values at once.
     * Existing params are NOT preserved.
     */
    public replaceUrlState(input: ReplaceUrlStateInputType): void {
        if (input.matrixParams) {
            this.state.setMatrixParams(input.matrixParams);
        }

        if (input.queryParams) {
            this.state.setQueryParams(input.queryParams);
        }

        if ('fragment' in input) {
            this.state.setFragment(input.fragment ?? null);
        }
    }

    public setMatrixParam(key: string, value: UrlParamValueType): void {
        if (!key) return;

        this.state.patchMatrixParams({
            [key]: value,
        });
    }

    public setQueryParam(key: string, value: UrlParamValueType): void {
        if (!key) return;

        this.state.patchQueryParams({
            [key]: value,
        });
    }

    public setMatrixParams(params: UrlParamsType): void {
        this.state.patchMatrixParams(params);
    }
//getCrudFieldGroupMatrixParamsFromState
    public setQueryParams(params: UrlParamsType): void {
        this.state.patchQueryParams(params);
    }

    public replaceMatrixParams(params: UrlParamsType): void {
        this.state.setMatrixParams(params);
    }

    public replaceQueryParams(params: UrlParamsType): void {
        this.state.setQueryParams(params);
    }

    public setFragment(value: string | null): void {
        this.state.setFragment(value);
    }

    public removeMatrixParam(key: string): void {
        if (!key) return;

        const current = this.state.matrixParams();
        const next: UrlParamsType = {};

        for (const k in current) {
            if (k !== key) {
                next[k] = current[k];
            }
        }

        this.state.setMatrixParams(next);
    }

    public removeQueryParam(key: string): void {
        if (!key) return;

        const current = this.state.queryParams();
        const next: UrlParamsType = {};

        for (const k in current) {
            if (k !== key) {
                next[k] = current[k];
            }
        }

        this.state.setQueryParams(next);
    }

    public clearUrlState(): void {
        this.state.setMatrixParams({});
        this.state.setQueryParams({});
        this.state.setFragment(null);
    }

    public getMatrixParams(): UrlParamsType {
        return {
            ...this.state.matrixParams(),
        };
    }

    public getQueryParams(): UrlParamsType {
        return {
            ...this.state.queryParams(),
        };
    }

    public getFragment(): string | null {
        return this.state.fragment();
    }

    /**
     * Separate URL info methods.
     * These are read-only helpers.
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
        const url = new URL(window.location.href);
        const hostname = url.hostname;
        const hostParts = hostname.split('.');

        let subdomain: string | null = null;
        let tld: string | null = null;

        if (hostParts.length > 1) {
            tld = hostParts[hostParts.length - 1];
        }

        if (hostParts.length > 2) {
            subdomain = hostParts.slice(0, hostParts.length - 2).join('.');
        }

        const info: UrlHostInfoType = {
            protocol: url.protocol || null,
            domain: url.host || null,
            hostname: url.hostname || null,
            port: url.port || null,
            path: url.pathname || '',
            subdomain,
            tld,
            username: url.username || null,
            password: url.password || null,
        };

        return info;
    }

    public getStateHostInfo(): UrlHostInfoType {
        const info: UrlHostInfoType = {
            protocol: this.state.protocol(),
            domain: this.state.domain(),
            hostname: this.state.hostname(),
            port: this.state.port(),
            path: this.state.path(),
            subdomain: this.state.subdomain(),
            tld: this.state.tld(),
            username: this.state.username(),
            password: this.state.password(),
        };
        return info;
    }

    /**
     * Helper methods
     */
    public getRouteBasedModuleAlias(id: string): string {
        const route = this.getModuleActivatedRoute();
        const last = route.snapshot.url.at(-1);
        const moduleSegment = last?.path ?? '';

        return `${moduleSegment}~${id}`;
    }
    /**
     * Gets the nearest active route segment.
     * This is where matrix params belong. A component can be loaded from an
     * empty child route (`path: ''`), while the visible URL segment that owns
     * matrix params is its parent (for example `country;cp=3`).
     */
    public getModuleActivatedRoute(): ActivatedRoute {
        const routes = this.aroute.pathFromRoot;

        for (let i = routes.length - 1; i >= 0; i--) {
            if (routes[i].snapshot.url.length > 0) {
                return routes[i];
            }
        }

        return this.aroute;
    }
    public getActiveRoute(): ActivatedRoute {
        let current = this.aroute;

        while (current.firstChild) {
            current = current.firstChild;
        }

        return current;
    }

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
}