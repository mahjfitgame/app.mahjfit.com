// file: libs/src/auth-session/state.ts

import { computed, effect, inject, Service } from "@angular/core";
import { DateTime, Session } from "@bfw/api-sdk/graphql/endpoints/shared";
import { ConfService } from "@libs/conf/service";
import { CookieService } from "@libs/cookie/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api";

@Service()
export class ClientSessionState extends SignalStateService {
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);

    public readonly api = inject(BfwApiService);
    public readonly cookie = inject(CookieService);

    // required for persisted state
    protected override readonly storeKey = 's';

    private readonly _dtoken = this.localStoragePersistSignal<string | null>(
        'dt',
        null,
        {
            crossTab: true,
            validate: (value): value is string | null => value === null || typeof value === 'string',
        }
        );
    public readonly dtoken = this._dtoken.asReadonly();

    private readonly _dpid = this.localStoragePersistSignal<string | null>(
        'dp',
        null,
        {
            crossTab: true,
            validate: (value): value is string | null => value === null || typeof value === 'string',
        }
        );
    public readonly dpid = this._dpid.asReadonly();

    private readonly _dkeyid = this.localStoragePersistSignal<string | null>(
        'dk', // this actually user device keyid not id
        null,
        {
            crossTab: true,
            validate: (value): value is string | null => value === null || typeof value === 'string',
        }
        );
    public readonly dkeyid = this._dkeyid.asReadonly();

    // for persistent storage params, for security reasons, keep names unpredictable obfuscated, such as keyid becomes id
    private readonly _skeyid = this.localStoragePersistSignal<string | null>(
        'sk', // this actually session keyid not id
        null,
        {
            crossTab: true,
            validate: (value): value is string | null => value === null || typeof value === 'string',
        },
    )
    private readonly skeyid = this._skeyid.asReadonly();

    private readonly _st_ls = this.localStoragePersistSignal<string | null>(
        'st', // session token: local storage, keep name same as source is different
        null,
        {
            crossTab: true,
            validate: this.isSt,
        },
    );
    private readonly st_ls = this._st_ls.asReadonly();
    
    private readonly _st_ck = this.cookiePersistSignal<string | null>(
        'st', // session token: cookie, keep name same as source is different
        null,
        {
            crossTab: true,
            validate: this.isSt,
            cookie: {
                path: '/',
            }
        },
    )
    private readonly st_ck = this._st_ck.asReadonly();

    /*
    private readonly _st_ss = this.sessionStoragePersistSignal<string | null>(
        'st', // session token: session storage, keep name same as source is different
        null,
        {
            crossTab: true,
            validate: this.isSt,
        },
    );
    private readonly st_ss = this._st_ss.asReadonly();
    */

    public readonly st = computed<string | null>(() => {
        return this.getSt();
    });

    // comment this in production mode to reduce memory usage and browser load
    public readonly debugState = computed(() => ({
        dtoken: this.dtoken(),
        dpid: this.dpid(),
        dkey: this.dkeyid(),
        skey: this.skeyid(),
        st_ls: this.st_ls(),
        st_ck: this.st_ck(),
        //st_s: this.st_ss(),
    }));    

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();

        // load api service
        this.api.sdk.graphql.use(Session);
    }
    
    public override onActivate(): void {
        // later on update bfw api headers as signal state change
        effect(() => {
            if (!this.ready()) {
                return;
            }
            
            this.setBfwApiHeaderDtoken();
            this.setBfwApiHeaderSid();
            this.setBfwApiHeaderStatefulAuthSession();
        });
    }
    public override onDeactivate(): void {
        
    }
    public setDtoken(value: string | null): void {
        this._dtoken.set(value);
    }
    public setDpid(value: string | null): void {
        this._dpid.set(value);
    }

    public setDkeyid(value: string | null): void {
        this._dkeyid.set(value);
    }
    public setSkeyid(skeyid: string | null): void {
        this._skeyid.set(skeyid);
    }
    private setStLs(token: string | null): void {
        this._st_ls.set(token);
    }
    private setStCk(token: string | null): void {
        this._st_ck.set(token);
    }
    /*
    private setStSs(token: string | null): void {
        this._st_ss.set(token);
    }
    */
    public setSt(token: string | null, keep_logged: DateTime | null): void {
        if (keep_logged) {
            this.setStLs(token);
            this.setStCk(null);
            //this.setStSs(null);
        } else {
            this.setStLs(null);
            this.setStCk(token);
            //this.setStSs(token);
        }
    }
    private getSt(): string | null {
        const st_ls = this.st_ls();
        const st_ck = this.st_ck();
        /*
        const st_ss = this.st_ss();

        if (st_ss !== null) {
            return st_ss;
        }
        */
        if (st_ck && st_ck !== null) {
            return st_ck;
        }
        if (st_ls && st_ls !== null) {
            return st_ls;
        }

        return null;
    }
    public clearSt(): void {
        this.setStLs(null);
        this.setStCk(null);
        //this.setSessSs(null);
    }
    public isStAvailable(): boolean {
        return this.st() !== null;
    }

    // VALIDATION METHODS
    public isSt(value: unknown): value is string | null {
        return typeof value === 'string' || value === null;
    }

    // SET BFW API CONFIGURATION
    public configureBfwApiHeaders(): void {
        this.api.sdk.setHeaderDToken(this.dtoken());
        this.api.sdk.setHeaderSid(this.skeyid());
        this.api.sdk.graphql.statefulAuthSession.setToken(this.st() ?? '');
    }
    public setBfwApiHeaderDtoken(): void {
        const token = this.dtoken();
        if(typeof token === 'string' && token !== '') {
            this.log.info('[AuthSessionState] Setting dtoken in BfwApiService');
            
            this.api.sdk.setHeaderDToken(this.dtoken());
        } else {
            this.log.info('[AuthSessionState] Clearing dtoken from BfwApiService');
            
            this.api.sdk.setHeaderDToken(null);
        }
    }
    public setBfwApiHeaderSid(): void {
        const token = this.skeyid();
        if(typeof token === 'string' && token !== '') {
            this.log.info('[AuthSessionState] Setting sid in BfwApiService');
            
            this.api.sdk.setHeaderSid(this.skeyid());
        } else {
            this.log.info('[AuthSessionState] Clearing sid from BfwApiService');
            
            this.api.sdk.setHeaderSid(null);
        }
    }
    public setBfwApiHeaderStatefulAuthSession(): void {
        const token = this.st();
        if(typeof token === 'string' && token !== '') {
            this.log.info('[AuthSessionState] Setting stateful auth session token in BfwApiService');
            
            this.api.sdk.graphql.statefulAuthSession.setToken(token);
            this.api.sdk.rest.statefulAuthSession.setToken(token);
        } else {
            this.log.info('[AuthSessionState] Clearing stateful auth session token from BfwApiService');
            
            this.api.sdk.graphql.statefulAuthSession.clear();
            this.api.sdk.rest.statefulAuthSession.clear();
        }
    }
}
