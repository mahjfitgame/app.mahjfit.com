declare const BfwApiSdkDefaultRequestHeaders: Readonly<{
    readonly REQ_RES_ID: "reqresid";
    readonly ACCEPT_LANGUAGE: "accept-language";
    readonly CURRENT_BIDI: "bidi";
    readonly APOLLO_REQUIRE_PREFLIGHT: "apollo-require-preflight";
    readonly APP_SAAS_INSTANCE_ID: "asii";
    readonly CTXS: "ctxs";
    readonly CSRF_TOKEN: "csrft";
}>;
type BfwApiSdkDefaultRequestHeaders = (typeof BfwApiSdkDefaultRequestHeaders)[keyof typeof BfwApiSdkDefaultRequestHeaders];
/**
 * Response headers with first-class SDK accessors.
 *
 * The raw response map is not limited to these names. Any server-provided
 * header remains available through BfwApiSdkResponse.headers/getHeader().
 */
declare const BfwApiSdkDefaultResponseHeaders: Readonly<{
    readonly REQ_RES_ID: "reqresid";
    readonly CTXS: "ctxs";
    readonly HOST_AUTHORIZATION: "hostauthorization";
    readonly CSRF_TOKEN: "csrft";
}>;
type BfwApiSdkDefaultResponseHeaders = (typeof BfwApiSdkDefaultResponseHeaders)[keyof typeof BfwApiSdkDefaultResponseHeaders];
type DefaultHeaderNameOverrides = Partial<Record<BfwApiSdkDefaultRequestHeaders, string>>;
type AuthconfRequestHeaderKey = BfwApiSdkDefaultRequestHeaders;
type AuthconfRequestHeaders = Partial<Record<BfwApiSdkDefaultRequestHeaders, RequestHeaderValueSource>>;
declare function resolveRequestHeaderName(overrides: DefaultHeaderNameOverrides | undefined, header: BfwApiSdkDefaultRequestHeaders): string;
declare function findDefaultHeader(name: string): BfwApiSdkDefaultRequestHeaders | undefined;

type BfwApiSdkResponseHeaders = Readonly<Record<string, string | undefined>> & {
    readonly reqresid?: string;
    readonly ctxs?: string;
    readonly hostauthorization?: string;
    readonly csrftoken?: string;
};
type BfwApiSdkResponseInit<T = unknown> = {
    data: T;
    ok: boolean;
    status: number;
    statusText: string;
    url: string;
    headers?: Record<string, string>;
    cookies?: readonly string[];
};
/** Standard response returned by every GraphQL and REST SDK operation. */
declare class BfwApiSdkResponse<T> {
    readonly data: T;
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly url: string;
    readonly headers: BfwApiSdkResponseHeaders;
    private readonly cookies;
    constructor(init: BfwApiSdkResponseInit<T>);
    getHeader(name: string): string | undefined;
    hasHeader(name: string): boolean;
    getResponseHeader(header: BfwApiSdkDefaultResponseHeaders): string | undefined;
    getResHeaderReqResId(): string | undefined;
    getResHeaderCtxs(): string | undefined;
    getResHeaderHostAuthorization(): string | undefined;
    getResHeaderCsrfToken(): string | undefined;
    /**
     * Raw Set-Cookie response header values.
     *
     * Node/server Fetch implementations can expose these values. Browsers hide
     * Set-Cookie from JavaScript, in which case this returns an empty array.
     */
    getCookies(): readonly string[];
    /** Create a response with selected values replaced and all other metadata retained. */
    with<U = T>(changes: Partial<BfwApiSdkResponseInit<U>>): BfwApiSdkResponse<U>;
    /** Transform data while retaining the HTTP metadata. */
    map<U>(mapper: (data: T) => U): BfwApiSdkResponse<U>;
    toJSON(): {
        data: T;
        ok: boolean;
        status: number;
        statusText: string;
        url: string;
        headers: BfwApiSdkResponseHeaders;
    };
}
/** Transform a final SDK response synchronously or asynchronously. */
type BfwApiSdkResponseInterceptor = (response: BfwApiSdkResponse<unknown>) => BfwApiSdkResponse<unknown> | Promise<BfwApiSdkResponse<unknown>>;

/**
 * Structural subset of the Node `Buffer` global, used by the base64 helpers so
 * the SDK never hard-imports a Node builtin.
 */
type NodeBufferLike = {
    from(value: string, encoding: 'utf-8' | 'base64'): {
        toString(encoding: 'utf-8' | 'base64'): string;
    };
};
/**
 * Structural subset of `node:fs`, so callers can pass a plain object in tests
 * and the SDK never hard-imports a Node builtin.
 */
type FsLike = {
    existsSync(path: string): boolean;
    readFileSync(path: string, encoding: string): string;
    writeFileSync(path: string, data: string, encoding: string): void;
    unlinkSync(path: string): void;
};
/** Params accepted by the `Libs` URL pattern helpers. */
type UrlParams = Record<string, string | number | boolean | null | undefined>;
type JwtTokenPair = {
    jwt_access_token: string;
    jwt_refresh_token: string;
};
type RequestHeaderValue = string | boolean | number | null | undefined;
type RequestHeaderValueProvider = () => RequestHeaderValue | Promise<RequestHeaderValue>;
type RequestHeaderValueSource = RequestHeaderValue | RequestHeaderValueProvider;
type RequestHeaderValueMap = Record<string, RequestHeaderValue>;
type RequestHeaders = Record<string, RequestHeaderValueSource>;
type BfwApiSdkRequest<TPayload = unknown> = {
    method: string;
    url: string;
    payload?: TPayload;
    headers: Record<string, string>;
    cookie?: string;
    credentials?: RequestCredentials;
    signal?: AbortSignal;
};
/** Transform an assembled request synchronously or asynchronously before Fetch. */
type BfwApiSdkRequestInterceptor = (request: BfwApiSdkRequest) => BfwApiSdkRequest | Promise<BfwApiSdkRequest>;
type RequestIdOptions = {
    /**
     * Enable/disable automatic request-id header injection.
     * @default true
     */
    enabled?: boolean;
    /**
     * Header name used for the request id.
     * @default BfwApiSdkDefaultRequestHeaders.REQ_RES_ID ("reqresid")
     */
    headerName?: string;
    /**
     * Request id generator.
     * @default uuidv7()
     */
    generator?: () => string;
};
type SigninCredentialsOptions = {
    /**
     * Username used to sign in again when the refresh token has expired.
     * Automatic sign-in stays disabled unless both username and identify exist.
     */
    username?: string;
    /**
     * Identify/password used to sign in again when the refresh token has expired.
     * This value is kept in SDK memory and is not written to the token store.
     */
    identify?: string;
};
type DomainOptions = {
    baseUrl: string;
    timeoutMs?: number;
    /**
     * Optional credentials for automatic sign-in after refresh-token expiry.
     * GraphQL and REST may use different credentials.
     */
    signinCredentials?: SigninCredentialsOptions;
    /**
     * Optional token-store configuration for this domain.
     * Takes precedence over ApiOptions.config.tokenStore.
     */
    tokenStore?: TokenStoreConfig;
    /**
     * Optional websocket connection owned by this API domain.
     * GraphQL and REST use separate clients and their own auth sessions.
     */
    ws?: WsOptions;
    /**
     * Optional overrides for SDK built-in header names. For example, map
     * BfwApiSdkDefaultRequestHeaders.ACCEPT_LANGUAGE to "x-language" if your API expects
     * a custom language header name.
     *
     * For BfwApiSdkDefaultRequestHeaders.REQ_RES_ID, `requestId.headerName` is still
     * supported and takes precedence over this map.
     */
    defaultHeaderNames?: DefaultHeaderNameOverrides;
    /**
     * Default headers for every REST/GraphQL HTTP request. Values may be static
     * or provider functions that are resolved immediately before each request.
     * Per-call headers are applied last so a single request can override them.
     */
    headers?: RequestHeaders;
    fetchImpl?: typeof fetch;
    /**
     * Browser HTTP cookie handling for REST/GraphQL fetch requests.
     *
     * - true: sends browser-managed cookies by using fetch credentials "include".
     * - false: blocks browser-managed cookies by using fetch credentials "omit".
     * - undefined: in browser runtimes, defaults to "include" so browser-managed
     *   cookies are sent on GraphQL/REST requests; in non-browser runtimes, keeps
     *   the runtime fetch default behavior.
     *
     * browserCookie: true | false
     *
     * For cross-origin cookie sessions, the server must also send compatible CORS
     * headers such as Access-Control-Allow-Credentials: true and a non-wildcard
     * Access-Control-Allow-Origin.
     */
    browserCookie?: boolean;
    /**
     * Node.js / SSR cookie forwarding for REST/GraphQL fetch requests.
     *
     * When provided, the SDK sends this value as the HTTP Cookie header unless a
     * Cookie header was already provided in `headers` or per-request headers.
     *
     * Use a function when the cookie value can change per request.
     * ssrCookie: () => req.headers.cookie,
     *
     * Note: browsers forbid manually setting the Cookie header. Use
     * `browserCookie: true` for browser-managed cookies.
     */
    ssrCookie?: string | (() => string | undefined);
    /**
     * Optional request-id header added to every outgoing HTTP request.
     * Useful for request tracing / correlation across services and logs.
     * If both `DomainOptions.requestId` and `ApiOptions.config.requestId` are provided,
     * `ApiOptions.config.requestId` takes precedence.
     */
    requestId?: RequestIdOptions;
};
type WsConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
type WsSocketOptions = {
    /** Socket.IO path or equivalent transport endpoint path. */
    path?: string;
    /** Transport order to try when establishing the socket connection. */
    transports?: string[];
    /** Whether the browser should send cookies or credentials with the socket request. */
    withCredentials?: boolean;
    /** Extra socket auth payload merged into the adapter options. */
    auth?: Record<string, unknown>;
};
type WsSocket = {
    connected: boolean;
    id?: string;
    connect(): void;
    disconnect(): void;
    on(event: string, handler: (payload?: unknown) => void): void;
    off(event: string, handler: (payload?: unknown) => void): void;
    emit(event: string, payload?: unknown): void;
};
type WsSocketFactoryCreateArgs = {
    url: string;
    options?: WsSocketOptions;
};
type WsSocketFactory = (args: WsSocketFactoryCreateArgs) => WsSocket;
type WsConnectOptions = {};
type WsOptions = {
    /** Ws socket server url, e.g. https://your-host */
    baseUrl: string;
    /** Optional prefix before each sdk event name, e.g. `bfw.nestjs.microservice.api`. */
    eventPrefix?: string;
    /** Socket-level options forwarded to the adapter factory, such as socket.io client settings. */
    socket?: WsSocketOptions;
    /** When a token exists, the SDK can auto-set the socket auth token with this prefix. */
    auth?: {
        /** Prefix added before the access token, usually `Bearer`. */
        socketAuthTokenPrefix?: string;
    };
    /** Required adapter/factory for the socket runtime, such as `io` from `socket.io-client`. */
    socketFactory?: WsSocketFactory;
};
type RequestLogContext = {
    domain: 'graphql' | 'rest';
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
};
type RequestLogger = (ctx: RequestLogContext) => void;
type ResponseLogContext = {
    domain: 'graphql' | 'rest';
    method: string;
    response: BfwApiSdkResponse<unknown>;
};
type ResponseLogger = (ctx: ResponseLogContext) => void;
type ServerOptions = {
    /**
     * Server-side store file, resolved against process.cwd() unless the value is
     * an absolute path. Holds the JWT, cookies, and stored headers
     * in one file.
     *
     * Configuring this makes the SDK create the store and expose it as
     * `BfwApiSdk.server`. Every server-store setter automatically persists the
     * complete JWT, cookie, and header snapshot; applications do not need to
     * call `save()`.
     *
     * server: { storeFile: 'bfw.store.json' }
     */
    storeFile: string;
};
type ApiOptions = {
    /**
     * Server-side store.
     *
     * - defined: the SDK builds the store for `server.storeFile` and exposes it
     *   as `BfwApiSdk.server` for the app to drive manually.
     * - undefined (default): no server-side store is created.
     */
    server?: ServerOptions;
    config?: SdkConfig;
    graphql: DomainOptions;
    rest: DomainOptions;
};
type SdkConfig = {
    tokenStore?: TokenStoreConfig;
    /**
     * Request-id header options (applies to BOTH GraphQL + REST domains).
     * If provided, overrides any per-domain `DomainOptions.requestId`.
     */
    requestId?: RequestIdOptions;
    /**
     * Optional built-in header name overrides applied to BOTH GraphQL + REST
     * HTTP requests. Per-domain `DomainOptions.defaultHeaderNames` can override
     * these values for that domain only.
     *
     * For BfwApiSdkDefaultRequestHeaders.REQ_RES_ID, `requestId.headerName` is still
     * supported and takes precedence over this map.
     */
    defaultHeaderNames?: DefaultHeaderNameOverrides;
    /**
     * Default headers applied to BOTH GraphQL + REST HTTP requests. Values may
     * be static or provider functions resolved before each request.
     */
    headers?: RequestHeaders;
    /**
     * If true, SDK logs outgoing request details right before sending.
     * Uses console.debug by default.
     */
    logRequest?: boolean;
    /**
     * Custom request logger. When provided, it overrides default console logging.
     */
    requestLogger?: RequestLogger;
    /**
     * If true, SDK logs response details after receiving server response.
     * Uses console.debug by default.
     */
    logResponse?: boolean;
    /**
     * Custom response logger. When provided, it overrides default console logging.
     */
    responseLogger?: ResponseLogger;
};
/**
 * Client-side token-store configuration.
 */
type TokenStoreConfig = {
    /**
     * Token persistence strategy.
     * - inmemory: use in-memory tokens only (no long-term persistence).
     * - auto: sessionStorage in browsers, then localStorage, cookie, then memory fallback.
     * - cookie: use browser cookie.
     * - browserSessionStorage: use browser sessionStorage.
     * - browserLocalStorage: use browser localStorage.
     * - browserIndexedDb: reserved for future async store support (falls back in current sync API).
     *
     * For server-side persistence use `ApiOptions.server.storeFile` instead.
     */
    persistentStorageStrategy?: 'inmemory' | 'auto' | 'cookie' | 'browserSessionStorage' | 'browserLocalStorage' | 'browserIndexedDb';
    /**
     * Cookie key name when strategy is cookie.
     */
    cookieName?: string;
    /**
     * Cookie path when strategy is cookie.
     */
    cookiePath?: string;
    /**
     * Cookie max age in seconds when strategy is cookie.
     */
    cookieMaxAgeSeconds?: number;
    /**
     * Cookie Secure flag when strategy is cookie.
     */
    cookieSecure?: boolean;
    /**
     * Cookie SameSite mode when strategy is cookie.
     */
    cookieSameSite?: 'Strict' | 'Lax' | 'None';
    /**
     * Browser session storage key when strategy is browserSessionStorage.
     */
    browserSessionStorageKey?: string;
    /**
     * Browser local storage key when strategy is browserLocalStorage.
     */
    browserLocalStorageKey?: string;
};
type GraphqlUploadArgs = {
    query: string;
    variables?: Record<string, unknown>;
    operationName?: string;
    headers?: RequestHeaderValueMap;
    signal?: AbortSignal;
};
type GraphqlResponsePayload<T> = {
    data?: T;
    errors?: any[];
};
type WsEventHandler = (payload: unknown) => void;
type WsEventListener = {
    event: string;
    handler: WsEventHandler;
};
type WsUnsubscribeType = () => void;

interface TokenStore {
    get(): JwtTokenPair | null;
    set(v: JwtTokenPair | null): void;
    clear(): void;
}
declare class MemoryTokenStore implements TokenStore {
    private v;
    get(): JwtTokenPair | null;
    set(v: JwtTokenPair | null): void;
    clear(): void;
}
type BrowserStorageLike = {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
};
declare class BrowserStorageTokenStore implements TokenStore {
    private readonly storage;
    private readonly storageKey;
    constructor(storage: BrowserStorageLike, storageKey: string);
    get(): JwtTokenPair | null;
    set(v: JwtTokenPair | null): void;
    clear(): void;
}
type CookieOptions = {
    name: string;
    path: string;
    maxAgeSeconds?: number;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
};
declare class CookieTokenStore implements TokenStore {
    private readonly doc;
    private readonly options;
    constructor(doc: Document, options: CookieOptions);
    get(): JwtTokenPair | null;
    set(v: JwtTokenPair | null): void;
    clear(): void;
    private buildCookieString;
}
declare function createDefaultTokenStore(config?: TokenStoreConfig): TokenStore;

interface AuthApiLikeObj {
    jwt_access_token: string;
    jwt_refresh_token: string;
}
interface AuthApiLike {
    refresh(jwtRefreshToken: string): Promise<AuthApiLikeObj>;
    signinForTokenRenewal(input: Required<SigninCredentialsOptions>): Promise<AuthApiLikeObj>;
}
interface InitializeTokensType {
    source: 'persistent' | 'bootstrap';
    tokens: JwtTokenPair;
}

type JwtAuthorizationOptions = {
    signinCredentials?: SigninCredentialsOptions;
    signinFailureTriggers?: readonly string[];
};
/**
 * One JwtAuthorization instance per domain (Graph OR Rest).
 * This guarantees:
 * - token storage isolation (no clashes)
 * - single-flight refresh (no stampede)
 */
declare class JwtAuthorization {
    private readonly store;
    private readonly api;
    private readonly options;
    private refreshPromise;
    constructor(store: TokenStore, api: AuthApiLike, options?: JwtAuthorizationOptions);
    /**
     * Explicit overwrite (existing behavior).
     * Use when user just signed in and you intentionally want latest tokens to replace everything.
     */
    setTokens(tokens: JwtTokenPair): void;
    private scoreTokenPair;
    private chooseBestTokens;
    /**
     * Smart startup initializer:
     * - If persisted/store tokens already exist, keep them (default).
     * - If store is empty, use provided bootstrap tokens.
     * - If force=true, always overwrite with bootstrap tokens.
     *
     * Returns which source is active after initialization.
     */
    initializeTokens(bootstrapTokens: JwtTokenPair, opts?: {
        force?: boolean;
    }): InitializeTokensType;
    clear(): void;
    getTokens(): JwtTokenPair | null;
    getAccessToken(): Promise<string>;
    /**
     * Single-flight refresh: if multiple requests hit 401 together,
     * only ONE refresh call runs; others await it.
     */
    refresh(): Promise<string>;
    getAuthHeader(): Promise<Record<string, string>>;
    /**
     * Backward-compatible helper (kept, now powered by shared resolver).
     */
    getJwtFromPersistentStorage(fallbackTokens?: JwtTokenPair): JwtTokenPair | null;
    private getSigninCredentials;
    /**
     * The transport status cannot be used to detect this. A federated gateway
     * rejects the refresh downstream and reports it as HTTP 200 carrying a
     * GraphQL error, while a gateway-level rejection arrives as a real 401. Only
     * the failure code in the message is reliable across both shapes.
     */
    private shouldSigninAfterRefreshFailure;
    private resolveTokensOrNull;
    private hasAnyToken;
    private sanitizeTokenPair;
    private decodeBase64UrlToUtf8;
    private decodeJwtExp;
    private isTokenExpired;
}

export { type AuthApiLikeObj as $, type ApiOptions as A, BfwApiSdkDefaultRequestHeaders as B, CookieTokenStore as C, type DefaultHeaderNameOverrides as D, type WsConnectionState as E, type FsLike as F, type GraphqlResponsePayload as G, type WsEventHandler as H, type WsEventListener as I, JwtAuthorization as J, type WsOptions as K, type WsSocket as L, MemoryTokenStore as M, type NodeBufferLike as N, type WsSocketFactory as O, type WsSocketFactoryCreateArgs as P, type WsSocketOptions as Q, type RequestHeaderValue as R, type SdkConfig as S, type TokenStore as T, type UrlParams as U, type WsUnsubscribeType as V, type WsConnectOptions as W, createDefaultTokenStore as X, findDefaultHeader as Y, resolveRequestHeaderName as Z, type AuthApiLike as _, type AuthconfRequestHeaderKey as a, type AuthconfRequestHeaders as b, BfwApiSdkDefaultResponseHeaders as c, type BfwApiSdkRequest as d, type BfwApiSdkRequestInterceptor as e, BfwApiSdkResponse as f, type BfwApiSdkResponseHeaders as g, type BfwApiSdkResponseInit as h, type BfwApiSdkResponseInterceptor as i, BrowserStorageTokenStore as j, type DomainOptions as k, type GraphqlUploadArgs as l, type JwtAuthorizationOptions as m, type JwtTokenPair as n, type RequestHeaderValueMap as o, type RequestHeaderValueProvider as p, type RequestHeaderValueSource as q, type RequestHeaders as r, type RequestIdOptions as s, type RequestLogContext as t, type RequestLogger as u, type ResponseLogContext as v, type ResponseLogger as w, type ServerOptions as x, type SigninCredentialsOptions as y, type TokenStoreConfig as z };
