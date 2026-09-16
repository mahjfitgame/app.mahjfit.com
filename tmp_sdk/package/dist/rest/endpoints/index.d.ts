export { C as ChatGptAttemptDto, a as ChatGptEnqueueOutputDto, b as ChatGptInitOutputDto, c as ChatGptInputDto, d as ChatGptOutputDto, e as ChatGptQueueDto, f as ChatgptPromptTemplateEnum, F as FBDMAttemptDto, g as FBDMEnqueueOutputDto, h as FBDMInitOutputDto, i as FBDMInputDto, j as FBDMOutputDto, k as FBDMQueueDto, G as GMBAttemptDto, l as GMBInputDto, m as GMBOutputDto, n as GMBQueueDto, o as GMBReviewDto, J as Jwks, p as JwksDto, q as JwksOutputDto, r as JwksService, R as RestApp, s as RestAppDto, t as RestAppHelloInputDto, u as RestAppHelloOutputDto, v as RestAppService, x as RestDomainAccessors, y as RestModuleFactories, z as RestModuleToken, B as RestWsModuleFactories, D as RestWsModuleToken, W as WebCrawler, E as WebCrawlerAttemptDto, H as WebCrawlerAuthDto, I as WebCrawlerBatchDto, K as WebCrawlerDto, L as WebCrawlerInputDto, M as WebCrawlerJobCompleteDto, N as WebCrawlerJobEnqueueDto, O as WebCrawlerOutputDto, P as WebCrawlerQueueDto, Q as WebCrawlerReqRespConfDto, S as WebCrawlerRequestDto, T as WebCrawlerResponseDto, U as WebCrawlerResponseTypeEnum, V as WebCrawlerService, X as WebCrawlerSubmitOtpInputDto, Y as WebCrawlerTwofaAuthenticationTypeEnum, Z as WebCrawlerUniqueQueueDto, _ as WebCrawlerWorkStatusEnum, $ as WebLog, a0 as WebLogBackofficeInputDto, a1 as WebLogDto, a2 as WebLogInputDto, a3 as WebLogService, a4 as WebLogWebsiteInputDto, a5 as WebScrChatGpt, a6 as WebScrChatGptService, a7 as WebScrFacebookDm, a8 as WebScrFacebookDmService, a9 as WebScrGoogleMyBusiness, aa as WebScrGoogleMyBusinessService, ab as WebScraper, ac as WebScraperService, ad as WebhookGateway, ae as WebhookGatewayBulkSmsInputDto, af as WebhookGatewayBulkSmsOutput, ag as WebhookGatewayBulkSmsStatusDto, ah as WebhookGatewayBulkSmsSubmissionDto, ai as WebhookGatewayBulkSmsTypeEnum, aj as WebhookGatewayDto, ak as WebhookGatewayService, al as WebhookGatewayTrialInputDto, am as WebhookGatewayTrialOutputDto, an as createRestFactories } from '../../domain-BZd-JGFv.js';
import '../../jwt.authorization-BzVAMORw.js';
import '../../lazy-BET-tQmf.js';

declare const AEPS_MAIN_WEB_CRAWLER: string;
declare const AEPS_WEB_CRAWLER_SUBMIT_OTP_VIA_POST: string;
declare const AEPS_WEB_CRAWLER_SUBMIT_OTP_VIA_GET: string;

declare const AEPS_MAIN_REST_APP: string;
declare const AEPS_REST_APP_HELLO: string;

declare const AEPS_MAIN_WEBHOOK_GATEWAY: string;
declare const AEPS_WEBHOOK_GATEWAY_TRIAL: string;
declare const AEPS_WEBHOOK_GATEWAY_WEBSOCKET: string;
declare const AEPS_WEBHOOK_GATEWAY_BULK_SMS: string;

declare const AEPS_MAIN_JWKS: string;
declare const AEPS_JWKS_JSON: string;

declare class WebScraperDto {
    static metaname: string;
}
declare class WebScraperPingOutputDto extends WebScraperDto {
    message: string;
}

declare const AEPS_MAIN_WEB_SCRAPER: string;
declare const AEPS_WEB_SCRAPER_PING: string;

declare const AEPS_MAIN_GOOGLE_MY_BUSINESS: string;
declare const AEPS_GMB_POST_INIT: string;
declare const AEPS_GMB_POST_ENQUEUE: string;

declare const AEPS_MAIN_FACEBOOK_DM: string;
declare const AEPS_FBDM_POST_INIT: string;
declare const AEPS_FBDM_POST_ENQUEUE: string;

declare const AEPS_MAIN_CHAT_GPT: string;
declare const AEPS_CGPT_POST_INIT: string;
declare const AEPS_CGPT_POST_ENQUEUE: string;

/** Base path and endpoint segments for browser log ingestion. */
declare const AEPS_MAIN_WEB_LOG: string;
declare const AEPS_WEB_LOG_WEBSITE: string;
declare const AEPS_WEB_LOG_BACKOFFICE: string;

export { AEPS_CGPT_POST_ENQUEUE, AEPS_CGPT_POST_INIT, AEPS_FBDM_POST_ENQUEUE, AEPS_FBDM_POST_INIT, AEPS_GMB_POST_ENQUEUE, AEPS_GMB_POST_INIT, AEPS_JWKS_JSON, AEPS_MAIN_CHAT_GPT, AEPS_MAIN_FACEBOOK_DM, AEPS_MAIN_GOOGLE_MY_BUSINESS, AEPS_MAIN_JWKS, AEPS_MAIN_REST_APP, AEPS_MAIN_WEBHOOK_GATEWAY, AEPS_MAIN_WEB_CRAWLER, AEPS_MAIN_WEB_LOG, AEPS_MAIN_WEB_SCRAPER, AEPS_REST_APP_HELLO, AEPS_WEBHOOK_GATEWAY_BULK_SMS, AEPS_WEBHOOK_GATEWAY_TRIAL, AEPS_WEBHOOK_GATEWAY_WEBSOCKET, AEPS_WEB_CRAWLER_SUBMIT_OTP_VIA_GET, AEPS_WEB_CRAWLER_SUBMIT_OTP_VIA_POST, AEPS_WEB_LOG_BACKOFFICE, AEPS_WEB_LOG_WEBSITE, AEPS_WEB_SCRAPER_PING, WebScraperDto, WebScraperPingOutputDto };
