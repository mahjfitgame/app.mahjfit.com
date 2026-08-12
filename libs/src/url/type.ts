// file: ./libs/src/url/type.ts
import { Route } from '@angular/router';

export type UrlParamValueType =
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | null
    | undefined;

export type UrlParamsType = Record<string, UrlParamValueType>;
export type UrlCleanParamsType = Record<string, string>;

export interface UrlHostInfoType {
    protocol: string | null;
    domain: string | null;
    hostname: string | null;
    port: string | null;
    path: string;
    subdomain: string | null;
    tld: string | null;
    username: string | null;
    password: string | null;
}
export interface UrlStateInputType {
    matrixParams?: UrlParamsType;
    queryParams?: UrlParamsType;
    fragment?: string | null;
}
export interface UrlStatePatchInputType extends UrlStateInputType {
}

export interface UrlStateReplaceInputType extends UrlStateInputType {
}

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