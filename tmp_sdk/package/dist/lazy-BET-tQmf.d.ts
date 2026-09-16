import { f as BfwApiSdkResponse, g as BfwApiSdkResponseHeaders, k as DomainOptions, u as RequestLogger, w as ResponseLogger, i as BfwApiSdkResponseInterceptor, e as BfwApiSdkRequestInterceptor, o as RequestHeaderValueMap, B as BfwApiSdkDefaultRequestHeaders, q as RequestHeaderValueSource, r as RequestHeaders } from './jwt.authorization-BzVAMORw.js';

declare class BfwApiSdkError extends Error {
    readonly message: string;
    readonly response?: BfwApiSdkResponse<unknown> | undefined;
    constructor(message: string, response?: BfwApiSdkResponse<unknown> | undefined);
    get status(): number | undefined;
    get url(): string | undefined;
    get body(): unknown;
    get headers(): BfwApiSdkResponseHeaders | undefined;
    toJSON(): {
        name: string;
        message: string;
        status: number | undefined;
        url: string | undefined;
        body: unknown;
        headers: BfwApiSdkResponseHeaders | undefined;
        response: BfwApiSdkResponse<unknown> | undefined;
    };
    toString(): string;
    errors(): string[];
}
/** Transform or observe a final SDK error before it is thrown to the consumer. */
type BfwApiSdkErrorInterceptor = (error: BfwApiSdkError) => BfwApiSdkError | Promise<BfwApiSdkError>;
declare class AuthError extends Error {
    readonly details?: unknown | undefined;
    constructor(message: string, details?: unknown | undefined);
}

/**
 * Holds a "stateful" JWT (single token string) and exposes it as a header:
 *   statefulauthorization: Bearer <token>
 *
 * This token is separate from the main JwtAuthorization JWT access/refresh pair.
 */
declare class JwtStatefulAuthorization {
    private token;
    /**
     * Sets the stateful JWT.
     * Accepts a plain JWT (recommended) or a full "Bearer <token>" value.
     */
    setToken(token: string): void;
    clear(): void;
    getToken(): string | null;
    getAuthHeader(): Promise<Record<string, string>>;
}

/**
 * Holds a host JWT (single token string) and exposes it as a header:
 *   hostauthorization: Bearer <token>
 *
 * This token is independent from the main access/refresh authorization and
 * the separate stateful authorization token.
 */
declare class JwtHostAuthorization {
    private token;
    /**
     * Sets the host JWT.
     * Accepts a plain JWT (recommended) or a full "Bearer <token>" value.
     */
    setToken(token: string): void;
    clear(): void;
    getToken(): string | null;
    getAuthHeader(): Promise<Record<string, string>>;
}

type BfwSdkHttpRawResponse<T = unknown> = BfwApiSdkResponse<T | undefined>;
type HttpClientOptions = DomainOptions & {
    domain: 'graphql' | 'rest';
    requestLogger?: RequestLogger;
    responseLogger?: ResponseLogger;
};
declare class HttpClient {
    private readonly opts;
    private fetchImpl;
    private readonly requestLogger;
    private readonly responseLogger;
    private readonly requestIdEnabled;
    private readonly requestIdHeaderName;
    private readonly requestIdGenerator;
    private readonly defaultHeaderNames;
    private readonly headers;
    private readonly headerKeysByLowerName;
    private requestInterceptor?;
    private responseInterceptor?;
    private responseErrorInterceptor?;
    constructor(opts: HttpClientOptions);
    registerAfterResponseInterceptor(interceptor: BfwApiSdkResponseInterceptor): void;
    registerAfterResponseErrorInterceptor(interceptor: BfwApiSdkErrorInterceptor): void;
    registerBeforeRequestInterceptor(interceptor: BfwApiSdkRequestInterceptor): void;
    private transformRequest;
    /**
     * Apply the consumer response transformer to a final SDK response.
     * Raw/intermediate responses must not call this method because transports
     * still need their original status and body for retry/error decisions.
     */
    transformResponse<T>(response: BfwApiSdkResponse<T>): Promise<BfwApiSdkResponse<T>>;
    /**
     * Transform a final SDK error after its response has been transformed.
     * If the consumer interceptor fails, preserve the original SDK error.
     */
    private transformResponseError;
    /**
     * Apply final response/error interceptors and throw the resulting SDK error.
     */
    throwResponseError<T>(message: string, response: BfwApiSdkResponse<T>): Promise<never>;
    ensureRequestIdHeader(headers?: RequestHeaderValueMap): Record<string, string>;
    resolveRequestHeaderName(header: BfwApiSdkDefaultRequestHeaders): string;
    setBuiltinRequestHeader(header: BfwApiSdkDefaultRequestHeaders, value: RequestHeaderValueSource): void;
    setRequestHeader(name: string, value: RequestHeaderValueSource): void;
    setRequestHeaders(headers: RequestHeaders): void;
    removeBuiltinRequestHeader(header: BfwApiSdkDefaultRequestHeaders): void;
    removeRequestHeader(name: string): void;
    clearRequestHeaders(): void;
    hasDefaultRequestHeader(name: string): boolean;
    resolveRequestHeaderMap(headers?: RequestHeaderValueMap): Record<string, string>;
    private resolveConfiguredHeaderName;
    private resolveDefaultHeaders;
    private resolveSsrCookie;
    private resolveBrowserCredentials;
    private isBrowserRuntime;
    private getDefaultFetchImpl;
    private serializePayload;
    /**
     * Raw request that does NOT throw on non-2xx.
     * Used by transports to detect 401 and trigger refresh.
     */
    requestRaw<T>(args: {
        method: string;
        url: string;
        headers?: RequestHeaderValueMap;
        body?: unknown;
        signal?: AbortSignal;
    }): Promise<BfwSdkHttpRawResponse<T>>;
    /**
     * Convenience method that throws on non-2xx.
     * Keep for auth endpoints and normal calls where you don't need 401 handling.
     */
    request<T>(args: {
        method: string;
        url: string;
        headers?: RequestHeaderValueMap;
        body?: unknown;
        signal?: AbortSignal;
    }): Promise<BfwApiSdkResponse<T>>;
    private buildTimeoutSignal;
    private responseHeadersToObject;
    private responseCookiesToArray;
    private sanitizeHeaders;
}

type DIFactory<T> = () => T;
declare class LazyRegistry {
    private readonly cache;
    require(key: string, factory: DIFactory<unknown>): unknown;
    get<T>(key: string): T;
}

export { AuthError as A, BfwApiSdkError as B, type DIFactory as D, HttpClient as H, JwtHostAuthorization as J, LazyRegistry as L, type BfwApiSdkErrorInterceptor as a, type BfwSdkHttpRawResponse as b, JwtStatefulAuthorization as c };
