// file: libs/src/url/state.ts
import { effect, inject, Service, signal } from '@angular/core';
import { SignalStateService } from '@libs/signal-state/service';
import { AppModuleStateType } from '@libs/utility/type';

import { UrlParamsType } from './type';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';

@Service({ autoProvided: false })
export class UrlState extends SignalStateService implements AppModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    private readonly conf = inject(ConfService)
    private readonly log = inject(LogService)

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = 'url';

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _urlSyncEnabled = signal<boolean>(false);
    public readonly urlSyncEnabled = this._urlSyncEnabled.asReadonly();

    private readonly _protocol = signal<string | null>(null);
    public readonly protocol = this._protocol.asReadonly();

    private readonly _domain = signal<string | null>(null);
    public readonly domain = this._domain.asReadonly();

    private readonly _hostname = signal<string | null>(null);
    public readonly hostname = this._hostname.asReadonly();

    private readonly _port = signal<string | null>(null);
    public readonly port = this._port.asReadonly();

    private readonly _path = signal<string>('');
    public readonly path = this._path.asReadonly();

    private readonly _subdomain = signal<string | null>(null);
    public readonly subdomain = this._subdomain.asReadonly();

    private readonly _tld = signal<string | null>(null);
    public readonly tld = this._tld.asReadonly();

    private readonly _username = signal<string | null>(null);
    public readonly username = this._username.asReadonly();

    private readonly _password = signal<string | null>(null);
    public readonly password = this._password.asReadonly();

    private readonly _matrixParams = signal<UrlParamsType>({});
    public readonly matrixParams = this._matrixParams.asReadonly();

    private readonly _queryParams = signal<UrlParamsType>({});
    public readonly queryParams = this._queryParams.asReadonly();

    private readonly _fragment = signal<string | null>(null);
    public readonly fragment = this._fragment.asReadonly();

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    // n/a

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████

    public override onActivate(): void {
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
    }

    public override onDeactivate(): void {

    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    public setUrlSyncEnabled(value: boolean): void {
        this._urlSyncEnabled.set(value);
    }

    public setMatrixParams(value: UrlParamsType): void {
        this._matrixParams.set(value);
    }
    public patchMatrixParams(value: UrlParamsType): void {
        this._matrixParams.update((current) => ({
            ...current,
            ...value,
        }));
    }

    public setQueryParams(value: UrlParamsType): void {
        this._queryParams.set(value);
    }
    public patchQueryParams(value: UrlParamsType): void {
        this._queryParams.update((current) => ({
            ...current,
            ...value,
        }));
    }

    public setFragment(value: string | null): void {
        this._fragment.set(value);
    }

    public setProtocol(value: string | null): void {
        this._protocol.set(value);
    }

    public setDomain(value: string | null): void {
        this._domain.set(value);
    }

    public setHostname(value: string | null): void {
        this._hostname.set(value);
    }

    public setPort(value: string | null): void {
        this._port.set(value);
    }

    public setPath(value: string): void {
        this._path.set(value);
    }

    public setSubdomain(value: string | null): void {
        this._subdomain.set(value);
    }

    public setTld(value: string | null): void {
        this._tld.set(value);
    }

    public setUsername(value: string | null): void {
        this._username.set(value);
    }

    public setPassword(value: string | null): void {
        this._password.set(value);
    }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
