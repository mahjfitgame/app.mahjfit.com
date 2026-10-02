// file: libs/src/context-profile/state.ts

import { computed, effect, inject, linkedSignal, resource, Service, signal } from "@angular/core";
import { ContextProfile, Session, UserAuthentication } from "@bfw/api-sdk/graphql/endpoints/shared";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { ContextProfileStateFieldEnum } from "./enum";
import type { ContextProfilePrivilegePayload, ContextProfileStatefulPayload, ContextProfileStatefulInfo, ContextProfileUauthorisation } from "./type";
import { jwtDecode } from "jwt-decode";
import { SignatureService } from "@libs/signature/service";
import { GlobalProgressBarService } from "src/app/base/global-progress-bar/service";
import { CONTEXT_PROFILE_STATE_STORE_KEY } from "./const";
import { BfwApiSdkError } from "@bfw/api-sdk/core";
import { SLUG_AUTH_AREA } from "src/app/area/auth/slug";
import { SLUG_OPEN_AREA } from "src/app/area/open/slug";

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

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();

        // load api service
        this.api.sdk.graphql.initialize(ContextProfile);
        this.api.sdk.graphql.initialize(Session);
        this.api.sdk.graphql.initialize(UserAuthentication);

    }
    
    // ██████████████████████████████████████████████████████████████████
    // ████ LISTENERS ███████████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    public override onActivate(): void {
        // setHostToken/setCtxs/setCsrfToken/setSessionToken push their own header the
        // moment they are called, so this effect is not needed for that path. It exists
        // for the changes those setters never see: hydration on boot and a cross-tab
        // update from another tab, both of which write straight into the signal.
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }

            this.configureBfwApiHeaders();
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());

        // The _privilegeSwitch loader stays pure (see its own comment) and never
        // writes state directly — this effect reconciles its result into state,
        // always through setPrivilegeToken()/setPrivilegeKeyid(), never the raw
        // _privilegeToken/_privilegeKeyid signals directly. Two cases:
        //
        // 1. Resolved a real token → persist it. This is also what feeds the
        //    header (setPrivilegeToken() pushes it, same as every other setter).
        //
        // 2. Resolved 'null' from an ACTUAL switch attempt (status 'resolved', not
        //    'idle') → the switch failed and the loader swallowed it.
        //    Roll the keyid back to whatever the CURRENT live token actually says.
        const privilegeSyncEffect = effect(() => {
            const token = this._privilegeSwitch.value();

            if (typeof token === 'string' && token !== '') {
                this.setPrivilegeToken(token);
            } else if (
                this._privilegeSwitch.status() === 'resolved' &&
                this.privilegeKeyid() !== (this.privilegeTokenPayload()?.sub ?? null)
            ) {
                this.setPrivilegeKeyid(this.privilegeTokenPayload()?.sub ?? null);
            }
        });

        this.registerDeactivationCleanup(() => privilegeSyncEffect.destroy());
    }
    public override onDeactivate(): void {
        
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ _redirectAfterAuth ██████████████████████████████████████████  
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
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

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
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
    public setRedirectAfterAuth(url: string | null): void {
        // need to check if url is again with auth/ then we need to make it to home
        // so check of url has SLUG_AUTH_AREA
        if(url?.includes(SLUG_AUTH_AREA)) {
            url = null;
        }
        this._redirectAfterAuth.set(url);
    }

    public useRedirectAfterAuth(): string | null {
        const url = this.redirectAfterAuth();
        // must reset when used, only one time use
        this.setRedirectAfterAuth(null);
        return url;
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ _handshaked █████████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * The client/server handshake is what mints the host token, the ctxs and the stateful token,
     * so it must be the first request the app makes. Any state driven request that leaves before
     * it would go out unauthorized, this gate is what holds them back.
     * Runtime only, never persisted, every app run must handshake again.
     * Opened from AppService.clientServerHandShake() on success only.
     */
    private readonly _handshaked = signal<boolean>(false);
    public readonly handshaked = this._handshaked.asReadonly();

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setHandshaked(value: boolean): void {
        this._handshaked.set(value);
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ _csrfToken ██████████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
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

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public validateCsrft(value: unknown): value is string | null {
        return typeof value === 'string' || value === null;
    }
    public setCsrfToken(value: string | null): void {
        this._csrfToken.set(value);

        // set BfwApiSdk header
        this.setBfwApiHeaderCsrfToken();
    }
    public clearCsrfToken(): void {
        this.setCsrfToken(null);
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ _hostToken ██████████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
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

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setHostToken(value: string | null): void {
        this._hostToken.set(value);

        // set BfwApiSdk header
        this.setBfwApiHeaderHostAuthorization();
    }
    public clearHostToken(): void {
        this.setHostToken(null);
    }
    
    // ██████████████████████████████████████████████████████████████████
    // ████ _ctxs ███████████████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // for persistent storage params, for security reasons, keep names unpredictable obfuscated, such as keyid becomes id
    // this is session keyid only used for verification checking with server side ctxs
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

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setCtxs(ctxs: string | null): void {
        // this is session keyid
        this._ctxs.set(ctxs);

        // set BfwApiSdk header
        this.setBfwApiHeaderCtxs();
    }
    public clearCtxs(): void {
        this.setCtxs(null);
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ _statefulToken ██████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _statefulToken = this.cookiePersistSignal<string | null>(
        ContextProfileStateFieldEnum.STATEFUL_TOKEN, // context stateful authorization: cookie, keep name same as source is different
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateStatefulToken,
            deleteOnNull: true,
            source: {
                path: '/',
            }
        },
    );
    public readonly statefulToken = this._statefulToken.asReadonly();

    private readonly statefulTokenPayload = computed<ContextProfileStatefulPayload | null>(() => {
        return this.decodeStatefulToken(this.statefulToken());
    });

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public validateStatefulToken(value: unknown): value is string | null {
        return typeof value === 'string' || value === null;
    }
    public setStatefulToken(token: string | null): void {
        // Angular memoizes this decoded payload until the token changes again.
        const payload = this.decodeStatefulToken(token);
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
        this._statefulToken.set(token);

        // set BfwApiSdk header
        this.setBfwApiHeaderStatefulAuthorization();
    }
    private decodeStatefulToken(token: string | null): ContextProfileStatefulPayload | null {
        if (!token) {
            return null;
        }

        try {
            return jwtDecode<ContextProfileStatefulPayload>(token);
        } catch {
            return null;
        }
    }
    private clearStatefulToken(): void {
        // sessionPayload, sessionExpiry, and authenticated reset from this source signal.
        this.setStatefulToken(null);
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ _statefulInfo ███████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
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

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public validateStatefulInfo(value: unknown): value is ContextProfileStatefulInfo | null {
        return (
            value === null ||
            (
                typeof value === 'object' &&
                (value as any)?.user?.username !== '' &&
                (value as any)?.udevice?.keyid !== '' &&
                (value as any)?.session?.keyid !== ''
            )
        );
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

    // ██████████████████████████████████████████████████████████████████
    // ████ _uauthorisation █████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _uauthorisation = this.cookiePersistSignal<ContextProfileUauthorisation[] | null>(
        ContextProfileStateFieldEnum.UAUTHORISATION,
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validateUauthorisation,
            deleteOnNull: true,
            source: {
                path: '/',
            }
        }
    );
    public readonly uauthorisation = this._uauthorisation.asReadonly();
    public readonly uauthorisationKeyVal = computed<Record<string, string>>(() => this.getUauthorisationKeyVal());

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public validateUauthorisation(value: unknown): value is ContextProfileUauthorisation[] | null {
        return (
            value === null ||
            Array.isArray(value) ||
            (
                // must have 1 key of authorisation
                (value as any)[0]?.keyid !== '' &&
                (value as any)[0]?.arole_id !== ''
            )
        );
    }
    public setUauthorisation(uauthorisation: ContextProfileUauthorisation[] | null): void {
        const exp = this.sessionExpiry();
        if(this.sessionKeepLogged() && exp && exp > 0) {
            this.setNextCookiePersistSignalExpiry(
                ContextProfileStateFieldEnum.UAUTHORISATION,
                new Date(exp),
            );
        }

        this._uauthorisation.set(uauthorisation);
    }
    public clearUauthorisation(): void {
        this.setUauthorisation(null);
    }
    public getUauthorisationKeyVal(): Record<string, string> {
        return Object.fromEntries(
            this.uauthorisation()
                ?.filter((a) => typeof a.keyid === 'string' && a.keyid !== '')
                .map((a) => [a.keyid as string, a.fr_authorisation_role?.role_title ?? '']) ?? []
        );
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ _privilegeToken █████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _privilegeToken = this.cookiePersistSignal<string | null>(
        ContextProfileStateFieldEnum.PRIVILEGE_TOKEN, // context profile privilege authorization
        null,
        {
            debounceMs: 0,
            crossTab: true,
            validate: this.validatePrivilegeToken,
            deleteOnNull: true,
            source: {
                path: '/',
            }
        },
    );
    public readonly privilegeToken = this._privilegeToken.asReadonly();

    private readonly privilegeTokenPayload = computed<ContextProfilePrivilegePayload | null>(() => {
        return this.decodePrivilegeToken(this.privilegeToken());
    });

    private readonly _privilegeKeyid = linkedSignal<string | null>(() => this.privilegeTokenPayload()?.sub ?? null);
    public readonly privilegeKeyid = this._privilegeKeyid.asReadonly();

    public readonly privilegeRoleTitle = computed<string | null>(() => this.privilegeTokenPayload()?.rt ?? null);

    private readonly _privilegeSwitch = resource({
        params: () => (this.ready() && this.handshaked() && this.privilegeKeyid())
            ? this.privilegeKeyid()
            : undefined,
        defaultValue: null,
        loader: async ({ params, abortSignal }): Promise<string | null> => {
            if (!params) {
                return null;
            }

            try {
                const http = await this.api.sdk.graphql.userAuthentication.switchPrivilegeAuthorisation({
                    selection: {
                        ptoken: true,
                    },
                    input: {
                        keyid: params,
                    },
                    signal: abortSignal,
                });

                return http.data?.ptoken ?? null;
            } catch (e: any | BfwApiSdkError) {
                this.log.error('[CTXP] Privilege switch failed.', e);
                return null;
            }
        },
    });
    public readonly privilegeSwitch = this._privilegeSwitch.value.asReadonly();

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public validatePrivilegeToken(value: unknown): value is string | null {
        return typeof value === 'string' || value === null;
    }
    public setPrivilegeToken(value: string | null): void {
        const exp = this.sessionExpiry();
        if(this.sessionKeepLogged() && exp && exp > 0) {
            this.setNextCookiePersistSignalExpiry(
                ContextProfileStateFieldEnum.PRIVILEGE_TOKEN,
                new Date(exp),
            );
        }

        this._privilegeToken.set(value);

        // set BfwApiSdk header — same as every other setter in this file
        this.setBfwApiHeaderPrivilegeAuthorization();
    }
    public decodePrivilegeToken(token: string | null): ContextProfilePrivilegePayload | null {
        if (!token) {
            return null;
        }

        try {
            const payload = jwtDecode<ContextProfilePrivilegePayload>(token);

            // sub/rt come back from jwtDecode() as ciphertext — the server encrypts them
            // with the same static-key scheme as SignatureService.sme() before embedding them as claims.
            // smd() is the matching static decrypt.
            return {
                ...payload,
                sub: payload.sub ? SignatureService.smd(payload.sub) : payload.sub,
                rt: payload.rt ? SignatureService.smd(payload.rt) : payload.rt,
            };
        } catch {
            return null;
        }
    }
    public clearPrivilegeToken(): void {
        this.setPrivilegeToken(null);
    }
    public setPrivilegeKeyid(keyid: string | null): void {
        this._privilegeKeyid.set(keyid);
    }
    public clearPrivilegeKeyid(): void {
        this.setPrivilegeKeyid(null);
    }
    public reloadPrivilege(): boolean {
        if (!this.privilegeKeyid()) {
            return false;
        }

        return this._privilegeSwitch.reload();
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ authenticated ███████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly localContextAuthenticated = computed<boolean>(() => {
        const token = this.statefulToken();
        const expiry = this.sessionExpiry();

        return (
            typeof token === 'string' &&
            token !== '' &&
            expiry !== 0 &&
            Date.now() < expiry
        );
    });

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

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public validateServerContextAuthenticated(value: unknown): value is boolean {
        return typeof value === 'boolean';
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ session █████████████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly sessionExpiry = computed<number>(() => {
        return this.getSessionExpiry();
    });

    private readonly sessionKeepLogged = computed<boolean>(() => {
        return this.getSessionKeepLogged();
    });

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
        const token = this.statefulToken();

        return (typeof token === 'string' && token !== '') || this.statefulInfo() !== null;
    });
    
    public readonly sessionPublicId = computed<string | null>(() => {
        const ctxs = this.ctxs();

        if(ctxs){
            const pid = this.sign.toBase64(ctxs);
            return pid;
        }
        return null;
    });

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public validateSessionPublicId(id: string | null): boolean {
        const pid = this.sessionPublicId();
        
        if(!id || !pid) return false;

        return pid === id;
    }
    public clearSession(): void {
        // main session token
        this.clearStatefulToken();

        // other required info to clear
        this.clearStatefulInfo();

        // clear uauthorisation
        this.clearUauthorisation();

        // clear privilege keyid and token explicitly
        this.clearPrivilegeKeyid();
        this.clearPrivilegeToken();
    }
    private getSessionExpiry(): number {
        // use main signin token to determine session expiry
        const exp = this.statefulTokenPayload()?.exp;

        return typeof exp === 'number' && Number.isFinite(exp)
            ? exp * 1000
            : 0;
    }
    private getSessionKeepLogged(): boolean {
        return this.statefulTokenPayload()?.kl ?? false;
    }

    // ██████████████████████████████████████████████████████████████████
    // ████ debugState ██████████████████████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly debugState = computed(() => ({
        hostToken: this.hostToken(),
        ctxs: this.ctxs(),
        statefulToken_ck: this.statefulToken(), // until browser is closed or expiry provided
        sessionToken: this.statefulToken(),
        sessionPayload: this.statefulTokenPayload(),
        sessionExpiry: this.sessionExpiry(),
        sessionKeepLogged: this.sessionKeepLogged(),
        uauthorisation: this.uauthorisation(),
        privilegeToken: this.privilegeToken(),
        privilegeTokenPayload: this.privilegeTokenPayload(),
        privilegeKeyid: this.privilegeKeyid(),
        privilegeRoleTitle: this.privilegeRoleTitle(),
        privilegeStatus: this._privilegeSwitch.status(),
        privilegeLoading: this._privilegeSwitch.isLoading(),
        handshaked: this.handshaked(),
        localContextAuthenticated: this.localContextAuthenticated(),
        serverContextAuthenticated: this.serverContextAuthenticated(),
        authenticated: this.authenticated(),
        redirectAfterAuth: this.redirectAfterAuth(),
    }));

    // methods ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    

    // ██████████████████████████████████████████████████████████████████
    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // ██████████████████████████████████████████████████████████████████
    /**
     * A reload builds a brand new BfwApiSdk instance with empty in-memory headers,
     * while these signals still carry whatever was persisted from before the reload.
     * Call this once, right after whenReady(), to push the (re)hydrated values into
     * the sdk before any request leaves - otherwise that request looks like a brand
     * new client and the server won't recognize the returning session.
     */
    public configureBfwApiHeaders(): void {
        this.setBfwApiHeaderHostAuthorization();
        this.setBfwApiHeaderCtxs();
        this.setBfwApiHeaderCsrfToken();
        this.setBfwApiHeaderStatefulAuthorization();
        this.setBfwApiHeaderPrivilegeAuthorization();
    }
    public setBfwApiHeaderHostAuthorization(): void {
        const token = this.hostToken();
        if(typeof token === 'string' && token !== '') {
            //this.log.info('[CTXP] Setting host token in BfwApiService');
            
            this.api.sdk.graphql.btHostAuthorization.setToken(token);
            this.api.sdk.rest.btHostAuthorization.setToken(token);
        } else {
            //this.log.info('[CTXP] Clearing host token from BfwApiService');
            
            this.api.sdk.graphql.btHostAuthorization.clear();
            this.api.sdk.rest.btHostAuthorization.clear();
        }
    }
    public setBfwApiHeaderCtxs(): void {
        const token = this.ctxs();
        if(typeof token === 'string' && token !== '') {
            //this.log.info('[CTXP] Setting ctxs in BfwApiService');
            
            this.api.sdk.setHeaderCtxs(this.ctxs());
        } else {
            //this.log.info('[CTXP] Clearing ctxs from BfwApiService');
            
            this.api.sdk.setHeaderCtxs(null);
        }
    }
    public setBfwApiHeaderCsrfToken(): void {
        const token = this.csrfToken();
        if(typeof token === 'string' && token !== '') {
            //this.log.info('[CTXP] Setting csrf token in BfwApiService');
            
            this.api.sdk.setHeaderCsrfToken(this.csrfToken());
        } else {
            //this.log.info('[CTXP] Clearing csrf token from BfwApiService');
            
            this.api.sdk.setHeaderCsrfToken(null);
        }
    }
    public setBfwApiHeaderStatefulAuthorization(): void {
        const token = this.statefulToken();
        if(typeof token === 'string' && token !== '') {
            //this.log.info('[CTXP] Setting stateful token in BfwApiService');
            
            this.api.sdk.graphql.btStatefulAuthorization.setToken(token);
            this.api.sdk.rest.btStatefulAuthorization.setToken(token);
        } else {
            //this.log.info('[CTXP] Clearing stateful token from BfwApiService');
            
            this.api.sdk.graphql.btStatefulAuthorization.clear();
            this.api.sdk.rest.btStatefulAuthorization.clear();
        }
    }
    public setBfwApiHeaderPrivilegeAuthorization(): void {
        const token = this.privilegeToken();
        if(typeof token === 'string' && token !== '') {
            this.api.sdk.graphql.btPrivilegeAuthorization.setToken(token);
            this.api.sdk.rest.btPrivilegeAuthorization.setToken(token);
        } else {
            this.api.sdk.graphql.btPrivilegeAuthorization.clear();
            this.api.sdk.rest.btPrivilegeAuthorization.clear();
        }
    }

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
