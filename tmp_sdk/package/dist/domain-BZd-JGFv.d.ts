import { i as BfwApiSdkResponseInterceptor, e as BfwApiSdkRequestInterceptor, B as BfwApiSdkDefaultRequestHeaders, q as RequestHeaderValueSource, r as RequestHeaders, o as RequestHeaderValueMap, f as BfwApiSdkResponse, J as JwtAuthorization } from './jwt.authorization-BzVAMORw.js';
import { H as HttpClient, a as BfwApiSdkErrorInterceptor, c as JwtStatefulAuthorization, J as JwtHostAuthorization, D as DIFactory, L as LazyRegistry } from './lazy-BET-tQmf.js';

declare class RestTransport {
    private readonly http;
    private readonly baseUrl;
    constructor(http: HttpClient, baseUrl: string);
    registerAfterResponseInterceptor(interceptor: BfwApiSdkResponseInterceptor): void;
    registerAfterResponseErrorInterceptor(interceptor: BfwApiSdkErrorInterceptor): void;
    registerBeforeRequestInterceptor(interceptor: BfwApiSdkRequestInterceptor): void;
    setBuiltinRequestHeader(header: BfwApiSdkDefaultRequestHeaders, value: RequestHeaderValueSource): void;
    setRequestHeader(name: string, value: RequestHeaderValueSource): void;
    setRequestHeaders(headers: RequestHeaders): void;
    removeBuiltinRequestHeader(header: BfwApiSdkDefaultRequestHeaders): void;
    removeRequestHeader(name: string): void;
    clearRequestHeaders(): void;
    private join;
    post<T>(path: string, body: unknown, headers?: RequestHeaderValueMap, signal?: AbortSignal): Promise<BfwApiSdkResponse<T>>;
    get<T>(path: string, headers?: RequestHeaderValueMap, signal?: AbortSignal): Promise<BfwApiSdkResponse<T>>;
    /**
     * Auth-aware request:
     * - attaches Authorization header from THIS domain's JwtAuthorization
     * - if 401 with a configured failure signal: refresh once and retry once
     */
    requestWithAuth<T>(args: {
        jwtAuthorization: JwtAuthorization;
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        path: string;
        body?: unknown;
        headers?: RequestHeaderValueMap;
        signal?: AbortSignal;
    }): Promise<BfwApiSdkResponse<T>>;
}

declare class RestBase {
    protected readonly rest: RestTransport;
    protected readonly jwtAuthorization: JwtAuthorization;
    protected readonly jwtStatefulAuthorization?: JwtStatefulAuthorization | undefined;
    protected readonly jwtHostAuthorization?: JwtHostAuthorization | undefined;
    constructor(rest: RestTransport, jwtAuthorization: JwtAuthorization, jwtStatefulAuthorization?: JwtStatefulAuthorization | undefined, jwtHostAuthorization?: JwtHostAuthorization | undefined);
    private withSupplementalAuthorizationHeaders;
    protected requestGet<T>(path: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<BfwApiSdkResponse<T>>;
    protected requestPost<T>(path: string, body: unknown, headers?: Record<string, string>, signal?: AbortSignal): Promise<BfwApiSdkResponse<T>>;
    protected requestPut<T>(path: string, body: unknown, headers?: Record<string, string>, signal?: AbortSignal): Promise<BfwApiSdkResponse<T>>;
    protected requestPatch<T>(path: string, body: unknown, headers?: Record<string, string>, signal?: AbortSignal): Promise<BfwApiSdkResponse<T>>;
    protected requestDelete<T>(path: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<BfwApiSdkResponse<T>>;
    protected getPublic<T>(path: string, headers?: Record<string, string>, signal?: AbortSignal): Promise<BfwApiSdkResponse<T>>;
    protected postPublic<T>(path: string, body: unknown, headers?: Record<string, string>, signal?: AbortSignal): Promise<BfwApiSdkResponse<T>>;
}

type RestWsModuleToken<K extends keyof RestWsModuleFactories, T> = {
    key: K;
    _type?: T;
};
/**
 * REST realtime module factories.
 *
 * When a REST resource gains a local `ws.ts` implementation:
 * 1. import its class here;
 * 2. add a `DIFactory<ModuleClass>` entry;
 * 3. export its typed module token;
 * 4. add its bound factory and getter to `RestWsDomain`.
 */
type RestWsModuleFactories = Record<never, never>;

declare class JwksDto {
    static metaname: string;
    kty: string;
    n: string;
    e: string;
    kid: string;
    alg: string;
    use: string;
}
declare class JwksOutputDto extends JwksDto {
    keys: JwksDto[];
}

declare class JwksService extends RestBase {
    private makePath;
    private jsonViaGet;
    readonly json: {
        get: (args?: {
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<JwksOutputDto>>;
    };
}

declare class RestAppDto {
    static metaname: string;
}
declare class RestAppHelloInputDto extends RestAppDto {
    data: Record<string, unknown>;
}
declare class RestAppHelloOutputDto extends RestAppDto {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
}

declare class RestAppService extends RestBase {
    private makePath;
    private helloViaGet;
    private helloViaPost;
    readonly hello: {
        get: (args?: {
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<RestAppHelloOutputDto>>;
        post: (args: {
            input: RestAppHelloInputDto;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<RestAppHelloOutputDto>>;
    };
}

declare enum WebCrawlerResponseTypeEnum {
    LOCAL_CSV = "1",
    REMOTE_GOOGLE_SHEETS = "2",
    REMOTE_MS_EXCEL = "3",
    WEBHOOK_API = "4"
}
declare enum WebCrawlerWorkStatusEnum {
    PENDING = "1",
    SUCCESS = "2",
    FAILED = "3",
    BLOCKED = "8",
    ERROR = "9",
    CANCELLED = "10",
    INTERRUPTED = "11",
    NOT_FOUND = "12",
    TIMEOUT = "13"
}
declare enum WebCrawlerTwofaAuthenticationTypeEnum {
    TWOFAT_2FAAPP = "1",
    TWOFAT_EMAIL = "2",
    TWOFAT_SMS = "3",
    TWOFAT_WHATSAPP = "4",
    TWOFAT_SEQURITY_QUE = "5",
    TWOFAT_SECONDARY_DEVICE = "6"
}

declare class WebCrawlerDto {
    static metaname: string;
}
declare class WebCrawlerBatchDto extends WebCrawlerDto {
    id: string;
    alert_email: string;
    at: string;
}
declare class WebCrawlerAuthDto extends WebCrawlerDto {
    u?: string;
    p?: string;
    keep_login?: boolean;
    twofa: WebCrawlerTwofaAuthenticationTypeEnum | null;
    sque_a?: string | null;
    sans_a?: string;
    sque_b?: string | null;
    sans_b?: string | null;
    sque_c?: string | null;
    sans_c?: string | null;
    sque_d?: string | null;
    sans_d?: string | null;
    sque_e?: string | null;
    sans_e?: string | null;
}
declare class WebCrawlerUniqueQueueDto extends WebCrawlerDto {
    id: string | number;
    browse_url: string;
}
declare class WebCrawlerQueueDto extends WebCrawlerUniqueQueueDto {
}
declare class WebCrawlerReqRespConfDto extends WebCrawlerDto {
    type: WebCrawlerResponseTypeEnum;
    webhook?: string;
    jwt?: string;
    u?: string;
    p?: string;
    at?: string;
}
declare class WebCrawlerRequestDto extends WebCrawlerReqRespConfDto {
}
declare class WebCrawlerResponseDto extends WebCrawlerReqRespConfDto {
}
declare class WebCrawlerInputDto extends WebCrawlerDto {
    client_id: string;
    batch: WebCrawlerBatchDto;
    auth: WebCrawlerAuthDto;
    response: WebCrawlerResponseDto;
    queue: WebCrawlerQueueDto[];
}
declare class WebCrawlerOutputDto extends WebCrawlerQueueDto {
    process_ip: string;
    process_status: WebCrawlerWorkStatusEnum;
    process_at: string;
    process_by: string;
    process_batch: string;
    process_uid: string;
    process_note: string;
    process_raw_data?: string;
}
declare class WebCrawlerAttemptDto extends WebCrawlerDto {
    attempt: number;
    status: WebCrawlerWorkStatusEnum;
    ref: string | null;
    note: string | null;
    output?: WebCrawlerOutputDto;
}
declare class WebCrawlerJobCompleteDto extends WebCrawlerDto {
    service_name: string;
    system_id: string;
    batch_id: string;
    request_queue_id: string;
    output_data_url: string;
    attempt_log_url: string;
    resp_type: WebCrawlerResponseTypeEnum;
    link_expire_date: string;
    request_date: string;
    complete_date: string;
    note: string;
    email_alert: boolean;
}
declare class WebCrawlerJobEnqueueDto extends WebCrawlerDto {
    service_name: string;
    system_id: string;
    batch_id: string;
}
declare class WebCrawlerSubmitOtpInputDto extends WebCrawlerDto {
    otp: string;
}

declare class WebCrawlerService extends RestBase {
    private makePath;
    private submitOtpViaGet;
    private submitOtpViaPost;
    readonly submitOtp: {
        get: (args: {
            fingerprint: string;
            id: string;
            otp: string;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<boolean>>;
        post: (args: {
            fingerprint: string;
            id: string;
            input: WebCrawlerSubmitOtpInputDto;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<boolean>>;
    };
}

declare class WebScraperService extends RestBase {
    private makePath;
    private pingViaGet;
    readonly ping: {
        get: (args?: {
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<string>>;
    };
}

declare enum WebhookGatewayBulkSmsTypeEnum {
    RECEIVED = "RECEIVED",
    SENT = "SENT"
}

declare class WebhookGatewayDto {
    static metaname: string;
}
declare class WebhookGatewayTrialInputDto extends WebhookGatewayDto {
    [key: string]: unknown;
}
declare class WebhookGatewayTrialOutputDto extends WebhookGatewayDto {
    token: string;
}
declare class WebhookGatewayBulkSmsSubmissionDto extends WebhookGatewayDto {
    id?: string | null;
    date?: string | null;
}
declare class WebhookGatewayBulkSmsStatusDto extends WebhookGatewayDto {
    id?: string | null;
    type?: string | null;
}
declare class WebhookGatewayBulkSmsInputDto extends WebhookGatewayDto {
    id: number;
    type: WebhookGatewayBulkSmsTypeEnum;
    from?: number | null;
    to?: number | null;
    body?: string | null;
    encoding?: string | null;
    protocolId?: number | null;
    messageClass?: number | null;
    numberOfParts?: number | null;
    creditCost?: number | null;
    submission?: WebhookGatewayBulkSmsSubmissionDto | null;
    status?: WebhookGatewayBulkSmsStatusDto | null;
    relatedSentMessageId?: string | null;
    userSuppliedId?: string | null;
}

type WebhookGatewayBulkSmsOutput = Record<string, unknown>;

declare class WebhookGatewayService extends RestBase {
    private makePath;
    private trialViaPost;
    private websocketViaGet;
    private bulkSmsViaPost;
    readonly trial: {
        post: (args: {
            input: WebhookGatewayTrialInputDto;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<WebhookGatewayTrialOutputDto>>;
    };
    readonly websocket: {
        get: (args?: {
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<boolean>>;
    };
    readonly bulkSms: {
        post: (args: {
            input: WebhookGatewayBulkSmsInputDto[];
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<WebhookGatewayBulkSmsOutput>>;
    };
}

/** Namespace class for WebLog request contracts. */
declare class WebLogDto {
    static metaname: string;
}
/**
 * A log entry is sent as the request body itself. The server stores it as one
 * JSONL record, so no SDK-level envelope is added around the entry.
 */
declare class WebLogInputDto extends WebLogDto {
    [key: string]: unknown;
}
declare class WebLogWebsiteInputDto extends WebLogInputDto {
}
/**
 * Free-form client-side log payload accepted by the backoffice log endpoint.
 *
 * Kept distinct from the website payload so either contract can be narrowed
 * independently when the API publishes a concrete schema.
 */
declare class WebLogBackofficeInputDto extends WebLogInputDto {
}

/** Client adapter for the public website and backoffice log-ingestion APIs. */
declare class WebLogService extends RestBase {
    private makePath;
    private websiteViaPost;
    private backofficeViaPost;
    readonly website: {
        post: (args: {
            input: WebLogWebsiteInputDto;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<boolean>>;
    };
    readonly backoffice: {
        post: (args: {
            input: WebLogBackofficeInputDto;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<boolean>>;
    };
}

declare class GMBQueueDto extends WebCrawlerQueueDto {
    max_reviews: number;
    u_fname?: string | null;
    u_lname?: string | null;
    b_name?: string | null;
    b_address?: string | null;
    b_country?: string | null;
    b_state?: string | null;
    b_city?: string | null;
    b_zipcode?: string | null;
    b_website?: string | null;
}
declare class GMBReviewDto {
    gr_contributor_name?: string | null;
    gr_contributor_profile_url?: string | null;
    gr_rating?: string | null;
    gr_feedback?: string | null;
    gr_date?: string | null;
}
declare class GMBInputDto extends WebCrawlerInputDto {
    queue: GMBQueueDto[];
}
declare class GMBOutputDto extends WebCrawlerOutputDto implements GMBQueueDto {
    max_reviews: number;
    b_primary_category?: string | null;
    b_secondary_category?: string | null;
    b_toll_free_number?: string | null;
    b_mobile?: number | null;
    b_mobile_cc?: number | null;
    b_email?: string | null;
    b_website_url?: string | null;
    b_about?: string | null;
    b_facebook_profile?: string | null;
    b_instagram_profile?: string | null;
    b_youtube_profile?: string | null;
    b_x_profile?: string | null;
    b_linkedin_profile?: string | null;
    b_tiktok_profile?: string | null;
    b_pinterest_profile?: string | null;
    b_google_my_business_url?: string | null;
    b_google_featured_result?: boolean | null;
    b_google_review_url?: string | null;
    b_google_review_rating?: string | null;
    b_google_review_total?: string | null;
    b_google_review?: GMBReviewDto[] | string | null;
    b_hours_monday?: string | null;
    b_hours_tuesday?: string | null;
    b_hours_wednesday?: string | null;
    b_hours_thursday?: string | null;
    b_hours_friday?: string | null;
    b_hours_saturday?: string | null;
    b_hours_sunday?: string | null;
    b_gmap_plus_code?: string | null;
    b_gmap_url?: string | null;
    b_gmap_latitude?: string | null;
    b_gmap_longitude?: string | null;
}
declare class GMBAttemptDto extends WebCrawlerAttemptDto {
    output?: GMBOutputDto;
}

declare class WebScrGoogleMyBusinessService extends RestBase {
    private makePath;
    private initViaPost;
    private enqueueViaPost;
    readonly init: {
        post: (args: {
            input: GMBInputDto;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<WebCrawlerJobCompleteDto | boolean>>;
    };
    readonly enqueue: {
        post: (args: {
            input: GMBInputDto;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<WebCrawlerJobEnqueueDto>>;
    };
}

declare class FBDMQueueDto extends WebCrawlerQueueDto {
    message: string;
}
declare class FBDMInputDto extends WebCrawlerInputDto {
    queue: FBDMQueueDto[];
}
declare class FBDMOutputDto extends WebCrawlerOutputDto implements FBDMQueueDto {
    message: string;
    is_logged_in?: boolean | null;
    is_sent?: boolean | null;
}
declare class FBDMAttemptDto extends WebCrawlerAttemptDto {
    output?: FBDMOutputDto;
}
declare class FBDMInitOutputDto extends WebCrawlerJobCompleteDto {
}
declare class FBDMEnqueueOutputDto extends WebCrawlerJobEnqueueDto {
}

declare class WebScrFacebookDmService extends RestBase {
    private makePath;
    private initViaPost;
    private enqueueViaPost;
    readonly init: {
        post: (args: {
            input: FBDMInputDto;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<WebCrawlerJobCompleteDto | boolean>>;
    };
    readonly enqueue: {
        post: (args: {
            input: FBDMInputDto;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<WebCrawlerJobEnqueueDto>>;
    };
}

declare enum ChatgptPromptTemplateEnum {
    PERSONALIZED_CONTENT_E_C_M_S = "prompt.personalized.content.for.email.call.message.sms.njk"
}

declare class ChatGptQueueDto extends WebCrawlerQueueDto {
    prompt: string;
    prompt_template: ChatgptPromptTemplateEnum;
    prompt_template_var: Record<string, unknown>;
    reference_data: Record<string, unknown>;
}
declare class ChatGptInputDto extends WebCrawlerInputDto {
    queue: ChatGptQueueDto[];
    global_prompt: string;
}
declare class ChatGptOutputDto extends WebCrawlerOutputDto implements ChatGptQueueDto {
    prompt: string;
    prompt_template: ChatgptPromptTemplateEnum;
    prompt_template_var: Record<string, unknown>;
    reference_data: Record<string, unknown>;
}
declare class ChatGptAttemptDto extends WebCrawlerAttemptDto {
    output?: ChatGptOutputDto;
}
declare class ChatGptInitOutputDto extends WebCrawlerJobCompleteDto {
}
declare class ChatGptEnqueueOutputDto extends WebCrawlerJobEnqueueDto {
}

declare class WebScrChatGptService extends RestBase {
    private makePath;
    private initViaPost;
    private enqueueViaPost;
    readonly init: {
        post: (args: {
            input: ChatGptInputDto;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<WebCrawlerJobCompleteDto | boolean>>;
    };
    readonly enqueue: {
        post: (args: {
            input: ChatGptInputDto;
            headers?: Record<string, string>;
            signal?: AbortSignal;
        }) => Promise<BfwApiSdkResponse<WebCrawlerJobEnqueueDto>>;
    };
}

type RestModuleToken<K extends keyof RestModuleFactories, T> = {
    key: K;
    _type?: T;
};
type RestModuleFactories = {
    restApp: DIFactory<RestAppService>;
    webCrawler: DIFactory<WebCrawlerService>;
    webhookGateway: DIFactory<WebhookGatewayService>;
    jwks: DIFactory<JwksService>;
    webScraper: DIFactory<WebScraperService>;
    webScrGoogleMyBusiness: DIFactory<WebScrGoogleMyBusinessService>;
    webScrFacebookDm: DIFactory<WebScrFacebookDmService>;
    webScrChatGpt: DIFactory<WebScrChatGptService>;
    webLog: DIFactory<WebLogService>;
};
declare const RestApp: RestModuleToken<"restApp", RestAppService>;
declare const WebCrawler: RestModuleToken<"webCrawler", WebCrawlerService>;
declare const WebhookGateway: RestModuleToken<"webhookGateway", WebhookGatewayService>;
declare const Jwks: RestModuleToken<"jwks", JwksService>;
declare const WebScraper: RestModuleToken<"webScraper", WebScraperService>;
declare const WebScrGoogleMyBusiness: RestModuleToken<"webScrGoogleMyBusiness", WebScrGoogleMyBusinessService>;
declare const WebScrFacebookDm: RestModuleToken<"webScrFacebookDm", WebScrFacebookDmService>;
declare const WebScrChatGpt: RestModuleToken<"webScrChatGpt", WebScrChatGptService>;
declare const WebLog: RestModuleToken<"webLog", WebLogService>;

/** Bind REST endpoint modules to the SDK domain dependencies. */
declare function createRestFactories(transport: RestTransport, jwtAuthorization: JwtAuthorization, jwtStatefulAuthorization?: JwtStatefulAuthorization, jwtHostAuthorization?: JwtHostAuthorization): RestModuleFactories;
/** Typed accessors for REST endpoint modules. */
declare abstract class RestDomainAccessors {
    protected abstract readonly reg: LazyRegistry;
    get restApp(): RestAppService;
    get webCrawler(): WebCrawlerService;
    get webhookGateway(): WebhookGatewayService;
    get jwks(): JwksService;
    get webScraper(): WebScraperService;
    get webScrGoogleMyBusiness(): WebScrGoogleMyBusinessService;
    get webScrFacebookDm(): WebScrFacebookDmService;
    get webScrChatGpt(): WebScrChatGptService;
    get webLog(): WebLogService;
}

export { WebLog as $, RestTransport as A, type RestWsModuleFactories as B, ChatGptAttemptDto as C, type RestWsModuleToken as D, WebCrawlerAttemptDto as E, FBDMAttemptDto as F, GMBAttemptDto as G, WebCrawlerAuthDto as H, WebCrawlerBatchDto as I, Jwks as J, WebCrawlerDto as K, WebCrawlerInputDto as L, WebCrawlerJobCompleteDto as M, WebCrawlerJobEnqueueDto as N, WebCrawlerOutputDto as O, WebCrawlerQueueDto as P, WebCrawlerReqRespConfDto as Q, RestApp as R, WebCrawlerRequestDto as S, WebCrawlerResponseDto as T, WebCrawlerResponseTypeEnum as U, WebCrawlerService as V, WebCrawler as W, WebCrawlerSubmitOtpInputDto as X, WebCrawlerTwofaAuthenticationTypeEnum as Y, WebCrawlerUniqueQueueDto as Z, WebCrawlerWorkStatusEnum as _, ChatGptEnqueueOutputDto as a, WebLogBackofficeInputDto as a0, WebLogDto as a1, WebLogInputDto as a2, WebLogService as a3, WebLogWebsiteInputDto as a4, WebScrChatGpt as a5, WebScrChatGptService as a6, WebScrFacebookDm as a7, WebScrFacebookDmService as a8, WebScrGoogleMyBusiness as a9, WebScrGoogleMyBusinessService as aa, WebScraper as ab, WebScraperService as ac, WebhookGateway as ad, WebhookGatewayBulkSmsInputDto as ae, type WebhookGatewayBulkSmsOutput as af, WebhookGatewayBulkSmsStatusDto as ag, WebhookGatewayBulkSmsSubmissionDto as ah, WebhookGatewayBulkSmsTypeEnum as ai, WebhookGatewayDto as aj, WebhookGatewayService as ak, WebhookGatewayTrialInputDto as al, WebhookGatewayTrialOutputDto as am, createRestFactories as an, ChatGptInitOutputDto as b, ChatGptInputDto as c, ChatGptOutputDto as d, ChatGptQueueDto as e, ChatgptPromptTemplateEnum as f, FBDMEnqueueOutputDto as g, FBDMInitOutputDto as h, FBDMInputDto as i, FBDMOutputDto as j, FBDMQueueDto as k, GMBInputDto as l, GMBOutputDto as m, GMBQueueDto as n, GMBReviewDto as o, JwksDto as p, JwksOutputDto as q, JwksService as r, RestAppDto as s, RestAppHelloInputDto as t, RestAppHelloOutputDto as u, RestAppService as v, RestBase as w, RestDomainAccessors as x, type RestModuleFactories as y, type RestModuleToken as z };
