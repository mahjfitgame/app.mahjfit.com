// file: libs/src/auth-session/state.ts

import { computed, effect, inject, Service } from "@angular/core";
import { Session } from "@bfw/api-sdk/graphql/endpoints/shared";
import { YesNoEnum } from "@bfw/api-sdk/graphql/libs/crud.enum";
import { ConfService } from "@libs/conf/service";
import { CookieService } from "@libs/cookie/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api";

@Service()
export class AuthSessionState extends SignalStateService {
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);

    public readonly api = inject(BfwApiService);
    public readonly cookie = inject(CookieService);

    // required for persisted state
    protected override readonly storeKey = 'sess';

    private readonly _sess_ls = this.localStoragePersistSignal<string | null>(
        'pt', // pt: public token
        null,
        {
            crossTab: true,
            validate: this.isSession,
        },
    );
    private readonly sess_ls = this._sess_ls.asReadonly();
    
    private readonly _sess_ck = this.cookiePersistSignal<string | null>(
        'pt',
        null,
        {
            crossTab: true,
            validate: this.isSession,
            cookie: {
                path: '/',
            }
        },
    )
    private readonly sess_ck = this._sess_ck.asReadonly();

    /*
    private readonly _sess_ss = this.sessionStoragePersistSignal<string | null>(
        'pt',
        null,
        {
            crossTab: true,
            validate: this.isSession,
        },
    );
    private readonly sess_ss = this._sess_ss.asReadonly();
    */

    public readonly session = computed<string | null>(() => {
        return this.getSession();
    });

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();

        // load api service
        this.api.sdk.graphql.use(Session);
    }
    public override onActivate(): void {
        effect(() => {
            if (!this.ready()) {
                return;
            }
            this.setStatefulAuthSessionTokenInBfwApi();
        });
    }
    public override onDeactivate(): void {
        
    }
    private setSessLs(token: string | null): void {
        this._sess_ls.set(token);
    }
    private setSessCk(token: string | null): void {
        this._sess_ck.set(token);
    }
    /*
    private setSessSs(token: string | null): void {
        this._sess_ss.set(token);
    }
    */
    public setSession(token: string | null, keep_logged: YesNoEnum): void {
        if (keep_logged === YesNoEnum.YES) {
            this.setSessLs(token);
            this.setSessCk(null);
            //this.setSessSs(null);
        } else {
            this.setSessLs(null);
            this.setSessCk(token);
            //this.setSessSs(token);
        }
    }
    private getSession(): string | null {
        const sess_ls = this.sess_ls();
        const sess_ck = this.sess_ck();
        /*
        const sess_ss = this.sess_ss();

        if (sess_ss !== null) {
            return sess_ss;
        }
        */
        if (sess_ck !== null) {
            return sess_ck;
        }
        if (sess_ls !== null) {
            return sess_ls;
        }

        return null;
    }
    public clearSession(): void {
        this.setSessLs(null);
        this.setSessCk(null);
        //this.setSessSs(null);
    }
    public isSessionAvailable(): boolean {
        return this.session() !== null;
    }
    public setStatefulAuthSessionTokenInBfwApi(token?: string | null): void {
        if(!token){
            this.log.info('[AuthSessionState] Fetching pre saved session token for BfwApiService');
            token = this.session();
        }
        if(typeof token === 'string' && token !== '') {
            this.log.info('[AuthSessionState] Setting stateful auth session token in BfwApiService');
            this.api.sdk.rest.statefulAuthSession.setToken(token);
            this.api.sdk.graphql.statefulAuthSession.setToken(token);
        } else {
            this.log.info('[AuthSessionState] Clearing stateful auth session token from BfwApiService');
            this.api.sdk.rest.statefulAuthSession.clear();
            this.api.sdk.graphql.statefulAuthSession.clear();
        }
    }

    // VALIDATION METHODS

    public isSession(value: unknown): value is string | null {
        return typeof value === 'string' || value === null;
    }
}
