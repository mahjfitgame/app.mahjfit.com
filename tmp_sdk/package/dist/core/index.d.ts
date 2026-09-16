import { F as FsLike, U as UrlParams, _ as AuthApiLike, f as BfwApiSdkResponse, $ as AuthApiLikeObj, y as SigninCredentialsOptions, n as JwtTokenPair, T as TokenStore, J as JwtAuthorization, K as WsOptions, A as ApiOptions, E as WsConnectionState, V as WsUnsubscribeType, W as WsConnectOptions, H as WsEventHandler, i as BfwApiSdkResponseInterceptor, e as BfwApiSdkRequestInterceptor, B as BfwApiSdkDefaultRequestHeaders, q as RequestHeaderValueSource, r as RequestHeaders, a as AuthconfRequestHeaderKey } from '../jwt.authorization-BzVAMORw.js';
export { b as AuthconfRequestHeaders, c as BfwApiSdkDefaultResponseHeaders, d as BfwApiSdkRequest, g as BfwApiSdkResponseHeaders, h as BfwApiSdkResponseInit, j as BrowserStorageTokenStore, C as CookieTokenStore, D as DefaultHeaderNameOverrides, k as DomainOptions, G as GraphqlResponsePayload, l as GraphqlUploadArgs, m as JwtAuthorizationOptions, M as MemoryTokenStore, N as NodeBufferLike, R as RequestHeaderValue, o as RequestHeaderValueMap, p as RequestHeaderValueProvider, s as RequestIdOptions, t as RequestLogContext, u as RequestLogger, v as ResponseLogContext, w as ResponseLogger, S as SdkConfig, x as ServerOptions, z as TokenStoreConfig, I as WsEventListener, L as WsSocket, O as WsSocketFactory, P as WsSocketFactoryCreateArgs, Q as WsSocketOptions, X as createDefaultTokenStore, Y as findDefaultHeader, Z as resolveRequestHeaderName } from '../jwt.authorization-BzVAMORw.js';
import { L as LazyRegistry, c as JwtStatefulAuthorization, J as JwtHostAuthorization, a as BfwApiSdkErrorInterceptor } from '../lazy-BET-tQmf.js';
export { A as AuthError, B as BfwApiSdkError, b as BfwSdkHttpRawResponse, D as DIFactory, H as HttpClient } from '../lazy-BET-tQmf.js';
import { p as GraphSigninInputDto, q as GraphSigninOutputDto, w as GraphSignupInputDto, x as GraphSignupOutputDto, C as SharedGraphqlWsDomainAccessors, S as SharedGraphqlDomainAccessors, n as GraphService } from '../domain-CfWAji1e.js';
import { Ba as GraphqlTransport, Bb as GraphqlWsModuleFactories, Bc as GraphqlWsModuleToken, B7 as GraphModuleFactories, B9 as GraphqlModuleToken } from '../domain-CwCU_D27.js';
export { B8 as GraphqlBase, Zi as WsBase } from '../domain-CwCU_D27.js';
import { A as RestTransport, B as RestWsModuleFactories, D as RestWsModuleToken, x as RestDomainAccessors, y as RestModuleFactories, z as RestModuleToken } from '../domain-BZd-JGFv.js';
export { w as RestBase } from '../domain-BZd-JGFv.js';
import { WsTransport, WsErrorOutputDto } from '../ws/index.js';
export { WsClient } from '../ws/index.js';
import '../graphql/libs/crud.scalar.js';
import '../graphql/libs/selection.js';
import '../graphql/libs/crud.upload.file.access.url.dto.js';
import '../graphql/libs/crud.enum.js';
import '../graphql/libs/crud.affected.dto.js';
import '../graphql/libs/crud.snapshot.dto.js';
import '../graphql/libs/crud.upload.input.dto.js';
import '../graphql/libs/crud.find.operator.dto.js';
import '../graphql/libs/crud.id.input.dto.js';
import '../graphql/libs/crud.mark.as.main.dto.js';
import '../graphql/libs/crud.pagination.dto.js';
import '../graphql/libs/crud.with.deleted.dto.js';
import '../graphql/libs/crud.record.postion.dto.js';
import '../graphql/libs/crud.upsert.dto.js';
import '../graphql/libs/crud.sort.option.dto.js';
import '../graphql/libs/crud.auto.suggest.dto.js';

declare enum FAILURE_CODE {
    FC_401_H1 = "401.H1",
    FC_401_H2 = "401.H2",
    FC_401_A1 = "401.A1",
    FC_401_A2 = "401.A2",
    FC_401_A3_REFTKN = "401.A3.REFTKN",
    FC_401_SF1 = "401.SF1",
    FC_401_SF2 = "401.SF2",
    FC_401_SF3 = "401.SF3"
}

/**
 * Shared helpers, all bound to `Libs` so any file gets them from one place:
 * `Libs.toBase64()`, `Libs.getNodeFs()`, `Libs.composeUrl()` and so on.
 *
 * Nothing here imports a Node builtin. Each runtime-specific helper probes
 * `globalThis` and returns null when the API is missing, so the same bundle
 * runs in the browser and in Node.
 */

declare class Libs {
    /**
     * Base64 encode, shared by the browser token stores and the server-side
     * store. Resolves btoa first, then the Node Buffer, so both runtimes work.
     */
    static toBase64(value: string): string;
    static fromBase64(value: string): string;
    private static getNodeBuffer;
    private static getTextEncoder;
    private static getTextDecoder;
    static safeGetCwd(): string;
    /** Resolve `node:fs` across runtimes; null in browsers, so `server` degrades. */
    static getNodeFs(): FsLike | null;
    static expandUrlPattern(pattern: string, params?: UrlParams): string;
    static composeUrl(base: string, ...parts: string[]): string;
    static composePatternUrl(base: string, pattern: string, params?: UrlParams, ...extraParts: string[]): string;
}

declare const UNAUTHORIZED_GRAPHQL_ERROR_CODES: readonly ["UNAUTHENTICATED"];
declare const AUTO_REFRESH_TRIGGER_FROM_GRAPHQL_FAILURE: readonly [FAILURE_CODE.FC_401_A1, FAILURE_CODE.FC_401_A2];
declare const AUTO_REFRESH_TRIGGER_FROM_REST_FAILURE: readonly [FAILURE_CODE.FC_401_A1, FAILURE_CODE.FC_401_A2];
declare const AUTO_RENEW_JWT_TRIGGER_FROM_GRAPHQL_REFRESH_FAILURE: readonly [FAILURE_CODE.FC_401_A3_REFTKN];
declare const AUTO_RENEW_JWT_TRIGGER_FROM_REST_REFRESH_FAILURE: readonly [FAILURE_CODE.FC_401_A3_REFTKN];
declare const TRIGGER_GRAPHQL_STATEFUL_AUTHORISATION_FAILURE: readonly [FAILURE_CODE.FC_401_SF1, FAILURE_CODE.FC_401_SF2, FAILURE_CODE.FC_401_SF3];
declare const TRIGGER_REST_STATEFUL_AUTHORISATION_FAILURE: readonly [FAILURE_CODE.FC_401_SF1, FAILURE_CODE.FC_401_SF2, FAILURE_CODE.FC_401_SF3];
declare const TRIGGER_GRAPHQL_HOST_AUTHORISATION_FAILURE: readonly [FAILURE_CODE.FC_401_H1, FAILURE_CODE.FC_401_H2];
declare const TRIGGER_REST_HOST_AUTHORISATION_FAILURE: readonly [FAILURE_CODE.FC_401_H1, FAILURE_CODE.FC_401_H2];
declare const CONFPR_WS_PUBLISH_KEY: string;
declare const CONFPR_WS_SUBSCRIBE_KEY: string;
declare const WS_EVENT_JOIN_ROOM: string;
declare const WS_EVENT_LEAVE_ROOM: string;
declare const WS_ROOM_KEY_SUBJECT: string;
declare const WS_ROOM_KEY_GROUP: string;
declare const WS_ROOM_KEY_SUBGROUP: string;
/** Single error event for every module, published when a server side event handler throws. */
declare const WS_PUBLISH_ERROR: string;

declare function normalizeText(value: unknown): string;
/**
 * Get the last code from a string
 * @param value
 * @returns string
 */
declare function getLastCode(value: unknown): string;
/**
 * Check if a failure signal is present in the response
 * @param triggers
 * @param messages
 * @returns boolean
 */
declare function checkFailureSignal(triggers: readonly string[], messages: readonly unknown[]): boolean;

declare class GraphqlApiAuth implements AuthApiLike {
    private readonly graphService;
    constructor(transport: GraphqlTransport);
    signin(input: GraphSigninInputDto): Promise<BfwApiSdkResponse<GraphSigninOutputDto>>;
    signup(input: GraphSignupInputDto): Promise<BfwApiSdkResponse<GraphSignupOutputDto>>;
    refresh(jwtRefreshToken: string): Promise<AuthApiLikeObj>;
    signinForTokenRenewal(input: Required<SigninCredentialsOptions>): Promise<AuthApiLikeObj>;
}

declare class RestApiAuth implements AuthApiLike {
    private readonly graphqlApiAuth?;
    constructor(_transport: RestTransport, graphqlApiAuth?: GraphqlApiAuth | undefined);
    refresh(jwtRefreshToken: string): Promise<AuthApiLikeObj>;
    signinForTokenRenewal(input: Required<SigninCredentialsOptions>): Promise<AuthApiLikeObj>;
    private getGraphqlApiAuth;
}

/** JWT is namespaced per domain so GraphQL and REST never overwrite each other. */
type ServerDomain = 'graphql' | 'rest';
type ServerSideStoreData = {
    jwt: Partial<Record<ServerDomain, JwtTokenPair>>;
    cookies: Record<string, string>;
    headers: Record<string, string>;
};

/**
 * Minimal, app-controlled server-side store: one file holding the JWT, the
 * cookies and the stored headers.
 *
 * Every setter writes the complete snapshot through to disk after it updates
 * memory. Consumers therefore only need the getter/setter API; they never need
 * to remember a separate `save()` call. The store deliberately does not inspect
 * responses or inject values into requests: the application chooses which
 * cookies and headers it reads and sets.
 */
declare class ServerSideStore {
    private readonly filePath;
    private readonly fs;
    private data;
    constructor(filePath: string, fs: FsLike);
    getJwt(domain: ServerDomain): JwtTokenPair | null;
    setJwt(domain: ServerDomain, jwt: JwtTokenPair | null): void;
    /**
     * Per-domain JWT view shaped as the token store `JwtAuthorization` accepts.
     * `setJwt()` already persists, so this adapter does not need additional I/O.
     */
    tokenStore(domain: ServerDomain): TokenStore;
    /**
     * Copy a named cookie out of a response. Cookies are server issued, so the
     * app never authors a value: the named setters take the response the cookie
     * arrived on, or `null` to clear. An absent `Set-Cookie` on a response means
     * "unchanged", never "clear" - only an explicit `null` clears.
     */
    private setCookieFromResponse;
    getCookie(name: string): string | null;
    setCookie(name: string, value: string | null | undefined): void;
    getCookies(): Readonly<Record<string, string>>;
    /** Build the Cookie request-header value from explicitly stored cookies. */
    getCookieHeader(): string | null;
    setCookieSid(res: BfwApiSdkResponse<unknown> | null): void;
    getCookieSid(): string | null;
    setCookieCsrfToken(res: BfwApiSdkResponse<unknown> | null): void;
    getCookieCsrfToken(): string | null;
    getHeader(name: string): string | null;
    setHeader(name: string, value: string | null | undefined): void;
    getHeaders(): Readonly<Record<string, string>>;
    setHeaderCsrfToken(value: string | null | undefined): void;
    getHeaderCsrfToken(): string | null;
    setHeaderCtxs(value: string | null | undefined): void;
    getHeaderCtxs(): string | null;
    setHeaderHostAuthorization(value: string | null | undefined): void;
    getHeaderHostAuthorization(): string | null;
    setHeaderStatefulAuthorization(value: string | null | undefined): void;
    getHeaderStatefulAuthorization(): string | null;
    load(): void;
    save(): void;
    clear(): void;
}
/**
 * Build a ServerSideStore rooted at storeFile.
 *
 * Returns undefined when no store file is configured, and also when no Node
 * filesystem is available, so a `server` block set in a browser degrades to
 * client mode instead of throwing.
 */
declare function createServerSideStore(storeFile?: string): ServerSideStore | undefined;

/** Realtime connection and typed modules owned by the GraphQL SDK domain. */
declare class GraphqlWsDomain extends SharedGraphqlWsDomainAccessors {
    /** Domain-scoped auth session used for websocket auth refresh logic. */
    readonly jwtAuthorization: JwtAuthorization;
    /** Low-level websocket transport for advanced/raw socket control. */
    readonly transport: WsTransport;
    protected readonly reg: LazyRegistry;
    private readonly factories;
    constructor(opts: WsOptions | undefined, config: ApiOptions['config'] | undefined, 
    /** Domain-scoped auth session used for websocket auth refresh logic. */
    jwtAuthorization: JwtAuthorization);
    /** Latest websocket connection state for the GraphQL domain. */
    get connectionState(): WsConnectionState;
    /** Listen for realtime connection state changes such as connected, disconnected, or reconnecting. */
    onStateChange(handler: (state: WsConnectionState) => void): WsUnsubscribeType;
    /** Open the GraphQL websocket connection for this domain. */
    connect(options?: WsConnectOptions): Promise<void>;
    /** Close the GraphQL websocket connection for this domain. */
    disconnect(): void;
    /** Send a raw GraphQL websocket event through the active socket connection. */
    emit(event: string, payload?: unknown): void;
    /** Subscribe to a raw GraphQL websocket event and receive payload updates. */
    subscribe(event: string, handler: WsEventHandler): WsUnsubscribeType;
    /** Resolve a typed GraphQL websocket event name using the configured prefix, if any. */
    resolveEventName(suffix: string): string;
    /**
     * Subscribe to server side failures of any GraphQL websocket event published
     * on this connection. Not tied to a module, read `event` to know which call failed.
     */
    subscribeError(args: {
        response: (data: WsErrorOutputDto) => void;
    }): WsUnsubscribeType;
    /**
     * Lazily create a GraphQL realtime module (if not already created) and cache it.
     * Call this before accessing the typed getter for that module.
     */
    initialize<K extends keyof GraphqlWsModuleFactories>(token: GraphqlWsModuleToken<K, ReturnType<GraphqlWsModuleFactories[K]>>): ReturnType<GraphqlWsModuleFactories[K]>;
}

declare class GraphqlDomain extends SharedGraphqlDomainAccessors {
    protected readonly reg: LazyRegistry;
    readonly transport: GraphqlTransport;
    readonly apiAuth: GraphqlApiAuth;
    readonly jwtAuthorization: JwtAuthorization;
    readonly jwtStatefulAuthorization: JwtStatefulAuthorization;
    readonly jwtHostAuthorization: JwtHostAuthorization;
    readonly ws: GraphqlWsDomain;
    private readonly factories;
    readonly graph: GraphService;
    constructor(opts: ApiOptions['graphql'], config?: ApiOptions['config'], serverStore?: ServerSideStore);
    registerAfterResponseInterceptor(interceptor: BfwApiSdkResponseInterceptor): this;
    registerAfterResponseErrorInterceptor(interceptor: BfwApiSdkErrorInterceptor): this;
    registerBeforeRequestInterceptor(interceptor: BfwApiSdkRequestInterceptor): this;
    setBuiltinRequestHeader(header: BfwApiSdkDefaultRequestHeaders, value: RequestHeaderValueSource): this;
    setRequestHeader(name: string, value: RequestHeaderValueSource): this;
    setRequestHeaders(headers: RequestHeaders): this;
    removeBuiltinRequestHeader(header: BfwApiSdkDefaultRequestHeaders): this;
    removeRequestHeader(name: string): this;
    clearRequestHeaders(): this;
    /**
     * Lazily create a GraphQL module (if not already created) and cache it.
     * @template K The key of the module to create.
     * @param token The module token.
     * @returns The created module.
     *
     * befrore any module need to use this method to activate tat module such as
     * const obj = new BwfApiSdk(opts);
     * obj.graphql.use(AapiEndpointAuth); <-- this is important
     * obj.graphql.apiEndpointAuth.your_method_will_go();
     */
    initialize<K extends keyof GraphModuleFactories>(token: GraphqlModuleToken<K, ReturnType<GraphModuleFactories[K]>>): ReturnType<GraphModuleFactories[K]>;
}

/** Realtime connection and typed modules owned by the REST SDK domain. */
declare class RestWsDomain {
    readonly jwtAuthorization: JwtAuthorization;
    /** Low-level websocket transport for advanced/raw socket control. */
    readonly transport: WsTransport;
    private readonly reg;
    private readonly factories;
    constructor(opts: WsOptions | undefined, config: ApiOptions['config'] | undefined, jwtAuthorization: JwtAuthorization);
    /** Latest websocket connection state for the REST domain. */
    get connectionState(): WsConnectionState;
    /** Listen for realtime connection state changes such as connected, disconnected, or reconnecting. */
    onStateChange(handler: (state: WsConnectionState) => void): WsUnsubscribeType;
    /** Open the REST websocket connection for this domain. */
    connect(options?: WsConnectOptions): Promise<void>;
    /** Close the REST websocket connection for this domain. */
    disconnect(): void;
    /** Send a raw REST websocket event through the active socket connection. */
    emit(event: string, payload?: unknown): void;
    /** Subscribe to a raw REST websocket event and receive payload updates. */
    subscribe(event: string, handler: WsEventHandler): WsUnsubscribeType;
    /** Resolve a typed REST websocket event name using the configured prefix, if any. */
    resolveEventName(suffix: string): string;
    /**
     * Subscribe to server side failures of any REST websocket event published
     * on this connection. Not tied to a module, read `event` to know which call failed.
     */
    subscribeError(args: {
        response: (data: WsErrorOutputDto) => void;
    }): WsUnsubscribeType;
    /** Lazily create and cache a registered REST realtime module. */
    initialize<K extends keyof RestWsModuleFactories>(token: RestWsModuleToken<K, ReturnType<RestWsModuleFactories[K]>>): ReturnType<RestWsModuleFactories[K]>;
}

declare class RestDomain extends RestDomainAccessors {
    protected readonly reg: LazyRegistry;
    readonly transport: RestTransport;
    readonly apiAuth: RestApiAuth;
    readonly jwtAuthorization: JwtAuthorization;
    readonly jwtStatefulAuthorization: JwtStatefulAuthorization;
    readonly jwtHostAuthorization: JwtHostAuthorization;
    readonly ws: RestWsDomain;
    private readonly factories;
    constructor(opts: ApiOptions['rest'], config?: ApiOptions['config'], graphqlApiAuth?: GraphqlApiAuth, serverStore?: ServerSideStore);
    registerAfterResponseInterceptor(interceptor: BfwApiSdkResponseInterceptor): this;
    registerAfterResponseErrorInterceptor(interceptor: BfwApiSdkErrorInterceptor): this;
    registerBeforeRequestInterceptor(interceptor: BfwApiSdkRequestInterceptor): this;
    setBuiltinRequestHeader(header: BfwApiSdkDefaultRequestHeaders, value: RequestHeaderValueSource): this;
    setRequestHeader(name: string, value: RequestHeaderValueSource): this;
    setRequestHeaders(headers: RequestHeaders): this;
    removeBuiltinRequestHeader(header: BfwApiSdkDefaultRequestHeaders): this;
    removeRequestHeader(name: string): this;
    clearRequestHeaders(): this;
    initialize<K extends keyof RestModuleFactories>(token: RestModuleToken<K, ReturnType<RestModuleFactories[K]>>): ReturnType<RestModuleFactories[K]>;
}

/**
 * Facade for the independent GraphQL and REST domains.
 * Each domain owns its HTTP and optional WebSocket transports.
 */
declare class BfwApiSdk {
    /** Connect with GaphQL API endpoints */
    readonly graphql: GraphqlDomain;
    /** Connect with REST API endpoints */
    readonly rest: RestDomain;
    /**
    * Server-side store when `ApiOptions.server.storeFile` is configured.
    * Undefined in client/browser mode.
    */
    readonly server?: ServerSideStore;
    constructor(opts: ApiOptions);
    /**
     * Set or replace a dynamic default request header for both REST and GraphQL.
     * The value is resolved before each request, so callbacks can read the latest
     * value from app state without recreating the SDK instance.
     */
    setBuiltinRequestHeader(header: BfwApiSdkDefaultRequestHeaders, value: RequestHeaderValueSource): this;
    setRequestHeader(name: string, value: RequestHeaderValueSource): this;
    setRequestHeaders(headers: RequestHeaders): this;
    removeBuiltinRequestHeader(header: BfwApiSdkDefaultRequestHeaders): this;
    removeRequestHeader(name: string): this;
    clearRequestHeaders(): this;
    setAuthconfRequestHeader(name: AuthconfRequestHeaderKey, value: RequestHeaderValueSource): this;
    setHeaderAcceptLanguage(value: RequestHeaderValueSource): this;
    setHeaderCurrentBidi(value: RequestHeaderValueSource): this;
    setHeaderApolloRequirePreflight(value: RequestHeaderValueSource): this;
    setHeaderAppSaasInstanceId(value: RequestHeaderValueSource): this;
    setHeaderCtxs(value: RequestHeaderValueSource): this;
    setHeaderRequestId(value: RequestHeaderValueSource): this;
    setHeaderCsrfToken(value: RequestHeaderValueSource): this;
}

/**
 * Header names behind the store's named accessors.
 *
 * These are the real wire header names, reused from the SDK's own header
 * constants where they exist, so the store file keys match what the server
 * actually sent. `reqresid` is deliberately absent: it is a per-request
 * correlation id, so persisting it would replay one trace id forever.
 */
declare const BfwApiSdkServerStoreHeaders: Readonly<{
    readonly CSRF_TOKEN: "csrft";
    readonly CTXS: "ctxs";
    readonly HOST_AUTHORIZATION: "hostauthorization";
    readonly STATEFUL_AUTHORIZATION: "statefulauthorization";
}>;
type BfwApiSdkServerStoreHeaders = (typeof BfwApiSdkServerStoreHeaders)[keyof typeof BfwApiSdkServerStoreHeaders];

/**
 * Cookie names behind the store's named cookie accessors: the session cookie
 * and the CSRF cookie the server issues at the app-client handshake.
 */
declare const BfwApiSdkServerStoreCookies: Readonly<{
    readonly SID: "app.sid";
    readonly CSRF_TOKEN: "app.csrft";
}>;
type BfwApiSdkServerStoreCookies = (typeof BfwApiSdkServerStoreCookies)[keyof typeof BfwApiSdkServerStoreCookies];

export { AUTO_REFRESH_TRIGGER_FROM_GRAPHQL_FAILURE, AUTO_REFRESH_TRIGGER_FROM_REST_FAILURE, AUTO_RENEW_JWT_TRIGGER_FROM_GRAPHQL_REFRESH_FAILURE, AUTO_RENEW_JWT_TRIGGER_FROM_REST_REFRESH_FAILURE, ApiOptions, AuthconfRequestHeaderKey, BfwApiSdk, BfwApiSdkDefaultRequestHeaders, BfwApiSdkErrorInterceptor, BfwApiSdkRequestInterceptor, BfwApiSdkResponse, BfwApiSdkResponseInterceptor, BfwApiSdkServerStoreCookies, BfwApiSdkServerStoreHeaders, CONFPR_WS_PUBLISH_KEY, CONFPR_WS_SUBSCRIBE_KEY, FAILURE_CODE, FsLike, GraphqlApiAuth, GraphqlDomain, GraphqlTransport, JwtAuthorization, JwtHostAuthorization, JwtStatefulAuthorization, JwtTokenPair, LazyRegistry, Libs, RequestHeaderValueSource, RequestHeaders, RestApiAuth, RestDomain, RestTransport, type ServerDomain, ServerSideStore, type ServerSideStoreData, SigninCredentialsOptions, TRIGGER_GRAPHQL_HOST_AUTHORISATION_FAILURE, TRIGGER_GRAPHQL_STATEFUL_AUTHORISATION_FAILURE, TRIGGER_REST_HOST_AUTHORISATION_FAILURE, TRIGGER_REST_STATEFUL_AUTHORISATION_FAILURE, TokenStore, UNAUTHORIZED_GRAPHQL_ERROR_CODES, UrlParams, WS_EVENT_JOIN_ROOM, WS_EVENT_LEAVE_ROOM, WS_PUBLISH_ERROR, WS_ROOM_KEY_GROUP, WS_ROOM_KEY_SUBGROUP, WS_ROOM_KEY_SUBJECT, WsConnectOptions, WsConnectionState, WsErrorOutputDto, WsEventHandler, WsOptions, WsTransport, WsUnsubscribeType, checkFailureSignal, createServerSideStore, getLastCode, normalizeText };
