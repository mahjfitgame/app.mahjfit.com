// file: ./libs/src/url/type.ts
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
export interface PatchUrlStateInputType extends UrlStateInputType {
}

export interface ReplaceUrlStateInputType extends UrlStateInputType {
}