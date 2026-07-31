// file: libs/src/context-profile/state.ts

import { computed, effect, inject, Service } from "@angular/core";
import { Session } from "@bfw/api-sdk/graphql/endpoints/shared";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api";
import { ContextProfileStateFieldEnum } from "./enum";
import type { ContextProfileSessionPayload } from "./type";
import { jwtDecode } from "jwt-decode";
import { AppModuleStateType } from "@libs/utility/type";

@Service()
export class ContextProfileState extends SignalStateService implements AppModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);

    public readonly api = inject(BfwApiService);
    
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
    public override readonly storeKey = 'cp';

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a


    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████
    
    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _hostToken = this.localStoragePersistSignal<string | null>(
        ContextProfileStateFieldEnum.HOST_TOKEN, // context profile host authorization
        null,
        {
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
            crossTab: true,
            validate: (value): value is string | null => value === null || typeof value === 'string',
        },
    )
    private readonly ctxs = this._ctxs.asReadonly();

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _statefulToken_ck = this.cookiePersistSignal<string | null>(
        ContextProfileStateFieldEnum.STATEFUL_TOKEN, // context stateful authorization: cookie, keep name same as source is different
        null,
        {
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
            crossTab: true,
            validate: this.validateSessionToken,
            deleteOnNull: true,
        },
    );*/
    private readonly statefulToken_ldb = 
        () => null;
        //this._statefulToken_ldb.asReadonly();


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
    /**
     * @isAuthenticated
     * signal to check if user is authenticated using sign in or not
     * based on available staeful authorization token  and its expiry it decides
     * 
     * @returns {boolean}
     */
    public readonly isAuthenticated = computed<boolean>(() => {
        return this.authenticatedSession();
    });

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
        isAuthenticated: this.isAuthenticated(),

    }));    

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();

        // load api service
        this.api.sdk.graphql.use(Session);
    }
    
    // ████ LISTENERS ███████████████████████████████████████████████████
    public override onActivate(): void {
        // later on update bfw api headers as signal state change
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }

            this.setBfwApiHeaderCtxs();
            this.setBfwApiHeaderStateHostAuthorization();
            this.setBfwApiHeaderStatefulAuthorization();
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
    }
    public override onDeactivate(): void {
        
    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████
    
    // SIGNAL SETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
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
    
    // SESSION METHODS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public clearSessionToken(): void {
        // sessionPayload, sessionExpiry, and isAuthenticated reset from this source signal.
        this.setStatefulTokenCk(null);
        /*
        this.setStatefulTokenLs(null);
        this.setStatefulTokenCk(null);
        this.setStatefulTokenSs(null);
        this.setStatefulTokenLdb(null);
        */
    }
    public setSessionToken(token: string | null): void {
        // Updating the source token invalidates all derived session signals.
        this.setStatefulTokenCk(token);

        // Angular memoizes this decoded payload until the token changes again.
        const payload = this.sessionPayload();
        const exp = payload?.exp;

        if (
            payload?.kl === true &&
            typeof exp === 'number' &&
            Number.isFinite(exp)
        ) {
            this.setNextCookiePersistedExpiry(
                ContextProfileStateFieldEnum.STATEFUL_TOKEN,
                new Date(exp * 1000),
            );
        }

        // we are not using below states, just for reference
        /*
        this.setStatefulTokenLs(null);
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
    private authenticatedSession(): boolean {
        const token = this.sessionToken();
        const expiry = this.sessionExpiry();

        return (
            typeof token === 'string' &&
            token !== '' &&
            expiry !== 0 &&
            Date.now() < expiry
        );
    }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    
    public validateSessionToken(value: unknown): value is string | null {
        return typeof value === 'string' || value === null;
    }

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████

    // SET BFW API SDK CONFIGURATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public configureBfwApiHeaders(): void {
        // used when we need to force update otherwise signal effect will take care of dynamic update
        this.api.sdk.setHeaderCtxs(this.ctxs());
        
        this.api.sdk.graphql.jwtHostAuthorization.setToken(this.hostToken() ?? '');
        this.api.sdk.rest.jwtHostAuthorization.setToken(this.hostToken() ?? '');

        this.api.sdk.graphql.jwtStatefulAuthorization.setToken(this.sessionToken() ?? '');
        this.api.sdk.rest.jwtStatefulAuthorization.setToken(this.sessionToken() ?? '');
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
