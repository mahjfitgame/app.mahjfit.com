// file: libs/src/url/type.ts

import { Data } from "@angular/router";

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
// ⚠ MOVED to libs/src/foundation/module/route.ts:
//   UrlRouteBreadcrumbType -> FoundationModuleRouteBreadcrumbType
//   UrlRouteAccessType     -> FoundationModuleRouteAccessType
//   UrlRouteDataType       -> FoundationModuleRouteDataType
//   UrlRouteNavType        -> DELETED, nav is te_access_area_navigation now
//
// route data is a module concern and FoundationAreaBuilder is the only thing
// that writes it. this file keeps URL and param types only
