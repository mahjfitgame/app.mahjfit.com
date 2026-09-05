// file: libs/src/context-profile/state.ts

import { computed, effect, inject, resource, Service, signal } from "@angular/core";
import { ContextProfile, Session } from "@bfw/api-sdk/graphql/endpoints/shared";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { ContextProfileStateFieldEnum } from "./enum";
import type { ContextProfileSessionPayload, ContextProfileStatefulInfo } from "./type";
import { jwtDecode } from "jwt-decode";
import { SignatureService } from "@libs/signature/service";
import { GlobalProgressBarService } from "src/app/base/global-progress-bar/service";
import { CONTEXT_PROFILE_STATE_STORE_KEY } from "./const";
import { BfwApiSdkError } from "@bfw/api-sdk/core";

@Service()
export class ContextProfileState extends SignalStateService {

    // ████ DEPENDENCIES ████████████████████████████████████████████████
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly api = inject(BfwApiService);

    private readonly sign = inject(SignatureService);
    
    /**
     * Here naming rules are bit different due to security reasons
     * c = context
     * h = host
     * sf = stateful
     * a = authorization
     * any other characters are as per nature of variable or functionality
     * 
     * This module is session but internally consider it as state as per backend functionality
     * This differentiation is required to manage potential security protocols
     */
    
    // ████ CLASS PROPERTIES ████████████████████████████████████████████
    public override readonly storeKey = CONTEXT_PROFILE_STATE_STORE_KEY;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a


    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████
    
    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _redirectAfterAuth = this.localStoragePersistSignal<string | null>(
        ContextProfileStateFieldEnum.REDIRECT_AFTER_AUTH,
        null,
        {
            debounceMs: 0,
            deleteOnNull: true,
            validate: this.validateRedirectAfterAuth,
        },
    );
    public readonly redirectAfterAuth = this._redirectAfterAuth.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * The client/server handshake is what mints the host token, the ctxs and the stateful token,
     * so it must be the first request the app makes. Any state driven request that leaves before
     * it would go out unauthorized, this gate is what holds them back.
     * Runtime only, never persisted, every app run must handshake again.
     * Opened from AppService.clientServerHandShake() on success only.
     */
    private readonly _handshaked = signal<boolean>(false);
    public readonly handshaked = this._handshaked.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _csrfToken = this.cookiePersistSignal<string | null>(
        ContextProfileStateFieldEnum.CSRF_TOKEN,
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateCsrft,
            deleteOnNull: true,
            source: {
                path: '/',
            }
        },
    );
    public readonly csrfToken = this._csrfToken.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _hostToken = this.localStoragePersistSignal<string | null>(
        ContextProfileStateFieldEnum.HOST_TOKEN, // context profile host authorization
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: (value): value is string | null => value === null || typeof value === 'string',
        }
        );
    public readonly hostToken = this._hostToken.asReadonly();
    
    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // for persistent storage params, for security reasons, keep names unpredictable obfuscated, such as keyid becomes id
    private readonly _ctxs = this.localStoragePersistSignal<string | null>(
        ContextProfileStateFieldEnum.CTXS, // context profile keyid (sid): this actually session keyid not id, keep the name annonymous for security
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: (value): value is string | null => value === null || typeof value === 'string',
        },
    )
    public readonly ctxs = this._ctxs.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _statefulToken_ck = this.cookiePersistSignal<string | null>(
        ContextProfileStateFieldEnum.STATEFUL_TOKEN, // context stateful authorization: cookie, keep name same as source is different
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateSessionToken,
            deleteOnNull: true,
            source: {
                path: '/',
            }
        },
    );
    private readonly statefulToken_ck = this._statefulToken_ck.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // _statefulToken_ls is not in use only for reference
    /*private readonly _statefulToken_ls = this.localStoragePersistSignal<string | null>(
        ContextProfileStateFieldEnum.STATEFUL_TOKEN, // context profile stateful authorization: local storage, keep name same as source is different
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateSessionToken,
            deleteOnNull: true,
        },
    );*/
    private readonly statefulToken_ls = 
        () => null;
        //this._statefulToken_ls.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // _statefulToken_ss is not in use, only for reference
    /*private readonly _statefulToken_ss = this.sessionStoragePersistSignal<string | null>(
        ContextProfileStateFieldEnum.STATEFUL_TOKEN, // context stateful authorization: session storage, keep name same as source is different
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateSessionToken,
            deleteOnNull: true,
        },
    );*/
    private readonly statefulToken_ss = 
        () => null;
        //this._statefulToken_ss.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // _statefulToken_ldb is not in use, only for reference
    /*private readonly _statefulToken_ldb = this.localDbPersistSignal<string | null>(
        ContextProfileStateFieldEnum.STATEFUL_TOKEN, // context stateful authorization: local db, keep name same as source is different
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateSessionToken,
            deleteOnNull: true,
        },
    );*/
    private readonly statefulToken_ldb = 
        () => null;
        //this._statefulToken_ldb.asReadonly();


    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _statefulInfo = this.cookiePersistSignal<ContextProfileStatefulInfo | null>(
        ContextProfileStateFieldEnum.STATEFUL_INFO,
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateStatefulInfo,
            deleteOnNull: true,
            source: {
                path: '/',
            }
        },
    );
    public readonly statefulInfo = this._statefulInfo.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * This is readonly state
     */
    private readonly _serverContextAuthenticated = resource({
        // undefined keeps the resource idle, so nothing is fetched before the state is ready.
        // ready() alone is not enough, hydration releases this loader and the handshake at the
        // same moment and this loader wins the race, so the handshake gate is required here too.
        // any change of this value re-runs the loader, that is what resyncs the flag.
        params: () => this.ready() && this.handshaked()
            ? this.localContextAuthenticated()
            : undefined,
        defaultValue: false,
        loader: async ({ params, abortSignal, previous }): Promise<boolean> => {
            if (!params) {
                return false;
            }

            // a session change needs the server to settle its session store first,
            // otherwise this reads back the state from before the change.
            // previous is idle only on the very first load, that one is not delayed.
            if (previous.status !== 'idle') {
                await new Promise((resolve) => setTimeout(resolve, 400));
            }

            try {
                const http = await this.api.sdk.graphql.contextProfile.authenticated({
                    signal: abortSignal,
                });

                // the api owns this value, so it is still validated before it reaches the signal
                return this.validateServerContextAuthenticated(http.data) ? http.data : false;
            } catch(e: any | BfwApiSdkError) {
                return false;
            }
        },
    });
    public readonly serverContextAuthenticated = this._serverContextAuthenticated.value.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly localContextAuthenticated = computed<boolean>(() => {
        return this.isLocalContextAuthenticated();
    })

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly sessionToken = computed<string | null>(() => {
        return this.getSessionToken();
    });

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly sessionPayload = computed<ContextProfileSessionPayload | null>(() => {
        return this.decodeSessionToken(this.sessionToken());
    });

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly sessionExpiry = computed<number>(() => {
        return this.getSessionExpiry();
    });

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly sessionKeepLogged = computed<boolean>(() => {
        return this.getSessionKeepLogged();
    })

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * Presence, not validity.
     *
     * A tampered or expired token answers true here, which is the only question
     * signout actually has: is there a credential in this browser that has to go.
     * localContextAuthenticated() cannot answer it, a token that fails to decode
     * reports expiry 0 and reads as no session at all.
     *
     * statefulInfo is included because deleting one of the two cookies is just as
     * easy as editing the other, and either remnant still needs clearing.
     */
    public readonly sessionRemnant = computed<boolean>(() => {
        const token = this.sessionToken();

        return (typeof token === 'string' && token !== '') || this.statefulInfo() !== null;
    });

    /**
     * @authenticated
     * signal to check if user is authenticated using sign in or not
     * based on available staeful authorization token  and its expiry it decides
     * 
     * @returns {boolean}
     */
    public readonly authenticated = computed<boolean>(() => {
        // the local token is the fast source, it decides on its own first
        if (!this.localContextAuthenticated()) {
            return false;
        }

        // the server check is async, it is idle before ready() and in flight right after a
        // sign in. collapsing to false in those windows logs the user back out mid navigation,
        // so the signed local token is trusted until the server actually answers.
        const status = this._serverContextAuthenticated.status();
        if (status !== 'resolved' && status !== 'error') {
            return true;
        }

        return this.serverContextAuthenticated();
    });

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly publicid = computed<string | null>(() => {
        return this.getPublicid();
    })

    // ████ STATE DEBUGGER ██████████████████████████████████████████████

    public readonly debugState = computed(() => ({
        hostToken: this.hostToken(),
        ctxs: this.ctxs(),
        statefulToken_ls: this.statefulToken_ls(), // long storage
        statefulToken_ck: this.statefulToken_ck(), // until browser is closed or expiry provided
        statefulToken_ss: this.statefulToken_ss(), // until browser tab is closed, only tab specific
        statefulToken_ldb: this.statefulToken_ldb(), // long storage out of end user control, most secure but also most expensive as it might not be available in all browsers
        sessionToken: this.sessionToken(),
        sessionPayload: this.sessionPayload(),
        sessionExpiry: this.sessionExpiry(),
        sessionKeepLogged: this.sessionKeepLogged(),
        handshaked: this.handshaked(),
        localContextAuthenticated: this.localContextAuthenticated(),
        serverContextAuthenticated: this.serverContextAuthenticated(),
        authenticated: this.authenticated(),
        redirectAfterAuth: this.redirectAfterAuth(),
    }));    

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();

        // load api service
        this.api.sdk.graphql.initialize(ContextProfile);
        this.api.sdk.graphql.initialize(Session);

    }
    
    // ████ LISTENERS ███████████████████████████████████████████████████
    public override onActivate(): void {
        // later on update bfw api headers as signal state change
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }

            this.setBfwApiHeaderCsrfToken();
            this.setBfwApiHeaderCtxs();
            this.setBfwApiHeaderStateHostAuthorization();
            this.setBfwApiHeaderStatefulAuthorization();
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());

        // the context authenticated resource resyncs itself, its params track ready() and authenticated()
    }
    public override onDeactivate(): void {
        
    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████
    
    // SIGNAL SETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setRedirectAfterAuth(url: string | null): void {
        this._redirectAfterAuth.set(url);
    }
    public setHandshaked(value: boolean): void {
        this._handshaked.set(value);
    }
    public useRedirectAfterAuth(): string | null {
        const url = this.redirectAfterAuth();
        // must reset when used, only one time use
        this.setRedirectAfterAuth(null);
        return url;
    }
    public setCsrfToken(value: string | null): void {
        this._csrfToken.set(value);
    }
    public clearCsrfToken(): void {
        this._csrfToken.set(null);
    }
    public setHostToken(value: string | null): void {
        this._hostToken.set(value);
    }
    public setCtxs(ctxs: string | null): void {
        // this is session keyid
        this._ctxs.set(ctxs);
    }
    private setStatefulTokenCk(token: string | null): void {
        this._statefulToken_ck.set(token);
    }
    private setStatefulTokenLs(token: string | null): void {
        // not in use
        //this._statefulToken_ls.set(token);
    }
    private setStatefulTokenSs(token: string | null): void {
        // not in use
        //this._statefulToken_ss.set(token);
    }
    private setStatefulTokenLdb(token: string | null): void {
        // not in use
        //this._statefulToken_ldb.set(token);
    }
    public setStatefulInfo(info: ContextProfileStatefulInfo | null): void {
        // set the expiry for stateful info
        const exp = this.sessionExpiry();
        if(this.sessionKeepLogged() && exp && exp > 0) {
            this.setNextCookiePersistSignalExpiry(
                ContextProfileStateFieldEnum.STATEFUL_INFO,
                new Date(exp),
            );
        }

        this._statefulInfo.set(info);
    }
    private clearStatefulInfo(): void {
        this.setStatefulInfo(null);
    }
    // SESSION METHODS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public clearSession(): void {
        // main session token
        this.clearSessionToken();

        // other required info to clear
        this.clearStatefulInfo();
    }
    public setSessionToken(token: string | null): void {
        // Angular memoizes this decoded payload until the token changes again.
        const payload = this.decodeSessionToken(token);
        const exp = payload?.exp;

        if (
            payload?.kl &&
            typeof exp === 'number' &&
            Number.isFinite(exp)
        ) {
            this.setNextCookiePersistSignalExpiry(
                ContextProfileStateFieldEnum.STATEFUL_TOKEN,
                new Date(exp * 1000),
            );
        }

        // Updating the source token invalidates all derived session signals.
        this.setStatefulTokenCk(token);

        // we are not using below states, just for reference
        /*
        this.setStatefulTokenLs(null);
        this.setStatefulTokenSs(null);
        this.setStatefulTokenLdb(null);
        */
    }
    private clearSessionToken(): void {
        // sessionPayload, sessionExpiry, and authenticated reset from this source signal.
        this.setStatefulTokenCk(null);
        /*
        this.setStatefulTokenLs(null);
        this.setStatefulTokenCk(null);
        this.setStatefulTokenSs(null);
        this.setStatefulTokenLdb(null);
        */
    }
    private decodeSessionToken(token: string | null): ContextProfileSessionPayload | null {
        if (!token) {
            return null;
        }

        try {
            return jwtDecode<ContextProfileSessionPayload>(token);
        } catch {
            return null;
        }
    }
    private getSessionToken(): string | null {
        return this.statefulToken_ck();
        /*
        const sft_ss = this.statefulToken_ss();
        const sft_ck = this.statefulToken_ck();
        const sft_ls = this.statefulToken_ls();
        const sft_ldb = this.statefulToken_ldb();

        if (sft_ss !== null) {
            return sft_ss;
        }
        if (sft_ck && sft_ck !== null) {
            return sft_ck;
        }
        if (sft_ls && sft_ls !== null) {
            return sft_ls;
        }
        if (sft_ldb && sft_ldb !== null) {
            return sft_ldb;
        }

        return null;
        */
    }
    private getSessionExpiry(): number {
        const exp = this.sessionPayload()?.exp;

        return typeof exp === 'number' && Number.isFinite(exp)
            ? exp * 1000
            : 0;
    }
    private getSessionKeepLogged(): boolean {
        return this.sessionPayload()?.kl ?? false;
    }
    private isLocalContextAuthenticated(): boolean {
        const token = this.sessionToken();
        const expiry = this.sessionExpiry();

        return (
            typeof token === 'string' &&
            token !== '' &&
            expiry !== 0 &&
            Date.now() < expiry
        );
    }
    private getPublicid(): string | null {
        const ctxs = this.ctxs();

        if(ctxs){
            const pid = this.sign.toBase64(ctxs);
            return pid;
        }
        return null;
    }
    // ████ STATEFUL INFO HELPER METHODS ██████████████████████████████████████
    
    // user
    public get user_fullname(): string | null {
        const user = this.statefulInfo()?.user;

        const name = ((user?.fname ?? '') + ' ' + (user?.lname ?? '')).trim();
        const alt = this.user_username ?? this.user_primary_email;

        return name || alt || null;
    }
    public get user_url_slug(): string | null {
        const user = this.statefulInfo()?.user;
        return user?.url_slug ?? null;
    }
    public get user_username(): string | null {
        const user = this.statefulInfo()?.user;
        return user?.username ?? null;
    }
    public get user_primary_email(): string | null {
        const user = this.statefulInfo()?.user;
        return user?.primary_email ?? null;
    }
    public get user_primary_mobile(): string | null {
        const user = this.statefulInfo()?.user;
        return user?.primary_mobile ?? null;
    }
    public get user_primary_mobile_cc(): string | null {
        const user = this.statefulInfo()?.user;
        return user?.primary_mobile_cc ?? null;
    }
    public get user_whatsapp(): string | null {
        const user = this.statefulInfo()?.user;
        return user?.whatsapp ?? null;
    }
    public get user_whatsapp_cc(): string | null {
        const user = this.statefulInfo()?.user;
        return user?.whatsapp_cc ?? null;
    }
    public get user_file_profile_banner_url_direct(): string | null {
        const user = this.statefulInfo()?.user;
        return user?.file_profile_banner_url?.direct ?? null;
    }
    public get user_file_profile_photo_url_direct(): string | null {
        const user = this.statefulInfo()?.user;
        return user?.file_profile_photo_url?.direct ?? null;
    }
    public get user_file_profile_photo_url_thumb(): string | null {
        const user = this.statefulInfo()?.user;
        return user?.file_profile_photo_url?.thumb ?? null;
    }
    public get user_monogram_avatar(): string {
        const user = this.statefulInfo()?.user;

        const name = (user?.fname?.[0] ?? '') + (user?.lname?.[0] ?? '');
        const alt = (this.user_username ?? this.user_primary_email ?? '').slice(0, 2);
        const rand = String(Math.random() * 100 | 0).padStart(2, '0');

        return (name || alt || rand).toUpperCase();
    }
    // udevice
    public get udevice_user_defined_id(): string | null {
        const udevice = this.statefulInfo()?.udevice;
        return udevice?.user_defined_id ?? null;
    }
    public get udevice_user_defined_name(): string | null {
        const udevice = this.statefulInfo()?.udevice;
        return udevice?.user_defined_name ?? null;
    }
    // authorisation
    public get authorisation_role_title(): string | null {
        const authorisation = this.statefulInfo()?.authorisation;
        return authorisation?.role_title ?? null;
    }
    // device
    public get device_name(): string | null {
        const device = this.statefulInfo()?.device;
        return device?.name ?? null;
    }
    public get device_interface(): string | null {
        const device = this.statefulInfo()?.device;
        return device?.interface ?? null;
    }
    public get device_os(): string | null {
        const device = this.statefulInfo()?.device;
        return device?.os ?? null;
    }


    

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    
    public validateSessionToken(value: unknown): value is string | null {
        return typeof value === 'string' || value === null;
    }
    public validateRedirectAfterAuth(value: unknown): value is string | null {
        return (
            value === null ||
            (
                typeof value === 'string' &&
                value.startsWith('/') &&
                !value.startsWith('//')
            )
        );
    }
    public validateStatefulInfo(value: unknown): value is ContextProfileStatefulInfo | null {
        return (
            value === null ||
            (
                typeof value === 'object' &&
                (value as any)?.user?.username !== '' &&
                (value as any)?.authorisation?.role_title !== ''
            )
        );
    }
    public validateServerContextAuthenticated(value: unknown): value is boolean {
        return typeof value === 'boolean';
    }
    public validatePublicid(id: string | null): boolean {
        const pid = this.publicid();
        
        if(!id || !pid) return false;

        return pid === id;
    }
    public validateCsrft(value: unknown): value is string | null {
        return typeof value === 'string' || value === null;
    }
    

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████

    // SET BFW API SDK CONFIGURATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public configureBfwApiHeaders(): void {
        // used when we need to force update otherwise signal effect will take care of dynamic update
        this.api.sdk.setHeaderCsrfToken(this.csrfToken());

        this.api.sdk.setHeaderCtxs(this.ctxs());
        
        this.api.sdk.graphql.jwtHostAuthorization.setToken(this.hostToken() ?? '');
        this.api.sdk.rest.jwtHostAuthorization.setToken(this.hostToken() ?? '');

        this.api.sdk.graphql.jwtStatefulAuthorization.setToken(this.sessionToken() ?? '');
        this.api.sdk.rest.jwtStatefulAuthorization.setToken(this.sessionToken() ?? '');
    }
    public setBfwApiHeaderCsrfToken(): void {
        const token = this.csrfToken();
        if(typeof token === 'string' && token !== '') {
            this.log.info('[CTXP] Setting csrf token in BfwApiService');
            
            this.api.sdk.setHeaderCsrfToken(this.csrfToken());
        } else {
            this.log.info('[CTXP] Clearing csrf token from BfwApiService');
            
            this.api.sdk.setHeaderCsrfToken(null);
        }
    }
    public setBfwApiHeaderCtxs(): void {
        const token = this.ctxs();
        if(typeof token === 'string' && token !== '') {
            this.log.info('[CTXP] Setting ctxs in BfwApiService');
            
            this.api.sdk.setHeaderCtxs(this.ctxs());
        } else {
            this.log.info('[CTXP] Clearing ctxs from BfwApiService');
            
            this.api.sdk.setHeaderCtxs(null);
        }
    }
    public setBfwApiHeaderStateHostAuthorization(): void {
        const token = this.hostToken();
        if(typeof token === 'string' && token !== '') {
            this.log.info('[CTXP] Setting host token in BfwApiService');
            
            this.api.sdk.graphql.jwtHostAuthorization.setToken(token);
            this.api.sdk.rest.jwtHostAuthorization.setToken(token);
        } else {
            this.log.info('[CTXP] Clearing host token from BfwApiService');
            
            this.api.sdk.graphql.jwtHostAuthorization.clear();
            this.api.sdk.rest.jwtHostAuthorization.clear();
        }
    }
    public setBfwApiHeaderStatefulAuthorization(): void {
        const token = this.sessionToken();
        if(typeof token === 'string' && token !== '') {
            this.log.info('[CTXP] Setting stateful token in BfwApiService');
            
            this.api.sdk.graphql.jwtStatefulAuthorization.setToken(token);
            this.api.sdk.rest.jwtStatefulAuthorization.setToken(token);
        } else {
            this.log.info('[CTXP] Clearing stateful token from BfwApiService');
            
            this.api.sdk.graphql.jwtStatefulAuthorization.clear();
            this.api.sdk.rest.jwtStatefulAuthorization.clear();
        }
    }

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
