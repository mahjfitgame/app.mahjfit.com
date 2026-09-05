// file: src/app/app.service.ts
import { DOCUMENT, inject, Service } from "@angular/core";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { ConfService } from "@libs/conf/service";
import { CookieService } from "@libs/cookie/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { ScrollDirectionService } from "@libs/scroll-direction/service";
import { I18nService } from "@base/internationalization/service";
import { SplashScreenService } from "@base/splash-screen/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { UserAuthentication, UserDeviceHandShakeInputDto } from "@bfw/api-sdk/graphql/endpoints/shared";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiSdkDefaultRequestHeaders, BfwApiSdkError, BfwApiSdkErrorInterceptor, BfwApiSdkRequest, BfwApiSdkRequestInterceptor, BfwApiSdkResponse, BfwApiSdkResponseInterceptor, checkFailureSignal, FAILURE_CODE, getLastCode, TRIGGER_GRAPHQL_STATEFUL_AUTHORISATION_FAILURE, TRIGGER_REST_STATEFUL_AUTHORISATION_FAILURE } from "@bfw/api-sdk/core";
import { AppState } from "@app/app.state";
import { HttpStatusCode } from "@angular/common/http";
import { Router } from "@angular/router";
import { SignoutRoute } from "./module/shared/onboarding/signout/route";
import { OpenAreaRoute } from "./area/open/route";

@Service()
export class AppService {
    private initializationPromise: Promise<boolean> | null = null;
    private apiInterceptorsRegistered = false;

    public readonly document = inject(DOCUMENT);
    private readonly router = inject(Router);

    public readonly state = inject(AppState);

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);

    public readonly cookie = inject(CookieService);
    public readonly scroll = inject(ScrollDirectionService);
    public readonly ps = inject(PlatformService);
    public readonly splash = inject(SplashScreenService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);

    public readonly i18n = inject(I18nService);
    public readonly api = inject(BfwApiService);

    constructor() { }

    public initialize(): Promise<boolean> {
        this.initializationPromise ??= this.initializeOnce();
        return this.initializationPromise;
    }

    private async initializeOnce(): Promise<boolean> {
        this.splash.stream = 10;

        try {
            await this.ps.init();
            this.splash.stream = 30;

            this.registerApiInterceptorsOnce();
            this.splash.stream = 40;

            const handshake = await this.clientServerHandShake();
            this.splash.stream = 60;

            if (handshake === false) {
                this.state.setStartupSucceeded(false);
                return false;
            }

            await this.afterClientServerHandShake();
            this.splash.stream = 70;

            this.state.setStartupSucceeded(true);
            return true;
        } catch (error) {
            this.log.error('[AppService] initialization failed', error);
            this.state.setStartupSucceeded(false);
            return false;
        } finally {
            this.splash.stream = 90;
        }
    }

    public onWindowScroll(): void {
        this.scroll.updateScrollDirection(this.document, {
            applyTo: this.document.body,
        });
    }

    // ████ CLIENT SERVER HANDSHAKE ████████████████████████████████

    public async clientServerHandShake(retryOnSessionFailure: boolean = true): Promise<string | false> {
        // TODO: need to add or setup logic when user logged in or already logged in we might need to update token with logged in user id
        // need to find some way and work around for this
        try {
            // wait for context state to sync and ready
            await this.ctxp.state.whenReady();

            // load api service
            this.api.sdk.graphql.initialize(UserAuthentication);

            // if token is not exist, get required data
            const hsi = await this.ps.handShakeInfo();

            // set input for new hand shake
            const clientInput: UserDeviceHandShakeInputDto = {
                dtoken: '0', // by default for new device there is no dtoken
                dpid: hsi.dpid ?? '0', // this is possible to get from native platform but in some case it might be missing 

                //u_id: 0,
                //user_defined_id: hsi.user_defined_id,
                //user_defined_name: hsi.user_defined_name,

                from_ip_address: hsi.from_ip_address,
                mac_address: hsi.mac_address,

                avatar: hsi.avatar,
                useragent: hsi.useragent,
                platform: hsi.platform,
                language: hsi.language,
                timezone: hsi.timezone,
                screen_width: Number(hsi.screen_width),
                screen_height: Number(hsi.screen_height),
                device_pixel_ratio: Number(hsi.device_pixel_ratio),
                hardware_concurrency: hsi.hardware_concurrency,
                max_touch_points: hsi.max_touch_points,
                device_memory: hsi.device_memory,
            };

            // if token is alreadu exist
            if (this.ctxp.state.hostToken() && this.ctxp.state.hostToken() !== null && this.ctxp.state.hostToken() !== '') {
                this.log.info('[AppService] Host Token Found.');
            }

            // api handshake: check if existing or add new both in one request
            const http = await this.api.sdk.graphql.userAuthentication.appClientServerHandShake({
                selection: {
                    /*client: {
                        id: true,
                        u_id: true,
                        device_id: true,
                        keyid: true,
                        dtoken: true,
                        dpid: true,
                    },*/
                    /**
                     * ⚠ NO csrf field here. the server renamed it csrf_token -> csrft and the
                     * installed @bfw/api-sdk still models the old name, so selecting either one
                     * is wrong: `csrf_token` fails GraphQL validation with a 400 and takes the
                     * whole handshake (and therefore startup) down, `csrft` is silently dropped
                     * by the sdk's selection builder because its schema class has no such field.
                     *
                     * the csrf token arrives on the `csrft` RESPONSE HEADER regardless, and
                     * registerAfterApiResponseInterceptor() already stores it.
                     * put it back in the selection once the sdk is regenerated.
                     */
                    htoken: true,
                    ctxs: true,
                    csrft: true,
                    stoken: true,
                    logged_in: true,
                    keep_logged: true,
                },
                input: {
                    client: clientInput,
                }
            });

            const resp = http.data;

            const client = resp.client;
            const htoken = resp.htoken ?? null;
            const ctxs = resp.ctxs ?? null;
            const csrft = resp.csrft ?? null;
            const stoken = resp.stoken ?? null;
            const logged_in = resp.logged_in ?? null;
            const keep_logged = resp.keep_logged ?? null;

            // set hand shake identity
            if ((client && Object.keys(client).length > 0 && client.dtoken) || (htoken && ctxs)) {
                // set csrf token in state
                this.ctxp.state.setCsrfToken(csrft as unknown as string | null);

                // set state host authorization
                this.ctxp.state.setHostToken(htoken);

                // set user session ctxs in state
                this.ctxp.state.setCtxs(ctxs);

                // set or clear stateful token in state
                if (logged_in && stoken) {
                    this.ctxp.state.setSessionToken(stoken);
                } else {
                    this.ctxp.state.clearSession();
                }

                // push the tokens into the sdk right now instead of waiting for the header effect.
                // that effect is created in state onActivate(), after the authenticated resource,
                // so on the same flush the resource loader runs first and its request would leave
                // without the stateful token.
                this.ctxp.state.configureBfwApiHeaders();

                // handshake is complete and every token is in state and in the sdk, state driven
                // requests may now leave. keep this last, nothing may fire on a half set state.
                this.ctxp.state.setHandshaked(true);

                return ctxs ?? false;
            }

            // handshake failed so do not allow app to run
            this.log.error('App client/server hand shake failed.');
        } catch (e: any | BfwApiSdkError) {
            this.log.error(`[CLIENT SERVER HANDSHAKE ERROR]`, e);
        }
        return false;
    }
    /**
     * After client/server handshake
     * This is used to initialize various process which require API calls and required data from servver
     * As hand shake is done we can start data retrival and many othe rprocess like web socket etc
     * 
     * Withouth hand shake do not perform any server side operation, so this methos is required
     */
    public async afterClientServerHandShake(): Promise<void> {
        // connect to web socket
        await this.api.sdk.graphql.ws.connect();
    }

    // ████ REGISTER API INTERCEPTORS ██████████████████████████████
    private registerApiInterceptorsOnce(): void {
        if (this.apiInterceptorsRegistered) {
            return;
        }

        this.registerBeforeApiRequestInterceptor();
        this.registerAfterApiResponseInterceptor();
        this.registerAfterApiResponseErrorInterceptor();
        this.apiInterceptorsRegistered = true;
    }
    public registerAfterApiResponseInterceptor(): void {
        // make sure do not add any error related logic
        // it will go inside registerAfterResponseErrorInterceptor()
        const interceptor: BfwApiSdkResponseInterceptor =
            async <T>(res: BfwApiSdkResponse<T>): Promise<BfwApiSdkResponse<T>> => {

                // update csrf token after response
                const csrfToken = res.getResHeaderCsrfToken();
                if (csrfToken) {
                    this.ctxp.state.setCsrfToken(csrfToken);
                }

                // update host token after response
                const hostToken = res.getResHeaderHostAuthorization();
                if (hostToken) {
                    this.ctxp.state.setHostToken(hostToken);
                }

                // update ctxs after response
                const ctxs = res.getResHeaderCtxs();
                if (ctxs) {
                    this.ctxp.state.setCtxs(ctxs);
                }

                this.log.info(`[RES INTERCEPTOR] Completed ${res.getResHeaderReqResId()}`);

                return res;
            };

        this.api.sdk.graphql.registerAfterResponseInterceptor(interceptor);
        this.api.sdk.rest.registerAfterResponseInterceptor(interceptor);
    }
    public registerAfterApiResponseErrorInterceptor(): void {
        // make sure that if its error then also registerAfterResponseInterceptor() will execute
        // so do not duplicate same process in error interceptor

        const interceptor: BfwApiSdkErrorInterceptor =
            async (err: BfwApiSdkError): Promise<BfwApiSdkError> => {
                // if server throw 401, and has failure signal message in error clear session token
                if (err.status === HttpStatusCode.Unauthorized) {
                    const messages = err.errors();

                    const fm = messages[0] ?? err.message;

                    const triggers: string[] = [
                        ...new Set([
                            ...TRIGGER_GRAPHQL_STATEFUL_AUTHORISATION_FAILURE,
                            ...TRIGGER_REST_STATEFUL_AUTHORISATION_FAILURE,
                        ])
                    ];

                    const hasFailureSignal = checkFailureSignal(triggers, messages);

                    if (hasFailureSignal) {
                        const lastcode: any = getLastCode(fm);

                        if (lastcode === FAILURE_CODE.FC_401_SF3) {
                            // sf token corrupted, this is very serious but rare case

                            // logically session will stay as it is on server but server gateway clear client side cookie
                            // clear the session as service cleared sid
                            this.ctxp.state.clearSession();

                            // as session go off remove csrf as server also clear it
                            this.ctxp.state.clearCsrfToken();

                            // redirect to home page with a full page reload
                            //const homeUrl = OpenAreaRoute.absolutePath();
                            //this.document.defaultView?.location.replace(homeUrl);
                        } else if (lastcode === FAILURE_CODE.FC_401_SF2) {
                            // sf token is expired
                            const signoutUrl = SignoutRoute.absolutePath();
                            this.router.navigateByUrl(signoutUrl, {
                                replaceUrl: true
                            });
                        } else {

                        }
                    }
                }

                if (err.response) {
                    // make sure err.response is readonly in error interceptor
                    const res = err.response;

                    this.log.info(`[RES ERR INTERCEPTOR] Completed ${res.getResHeaderReqResId()}`);
                }
                return err;
            };
        this.api.sdk.graphql.registerAfterResponseErrorInterceptor(interceptor);
        this.api.sdk.rest.registerAfterResponseErrorInterceptor(interceptor);
    }
    public registerBeforeApiRequestInterceptor(): void {
        const interceptor: BfwApiSdkRequestInterceptor =
            async <T>(req: BfwApiSdkRequest<T>): Promise<BfwApiSdkRequest<T>> => {
                // add logic to mofify request
                this.log.info(`[REQ INTERCEPTOR] Started ${req.headers[BfwApiSdkDefaultRequestHeaders.REQ_RES_ID] ?? '0'}`);
                return req;
            }
        this.api.sdk.graphql.registerBeforeRequestInterceptor(interceptor);
        this.api.sdk.rest.registerBeforeRequestInterceptor(interceptor);
    }
}
