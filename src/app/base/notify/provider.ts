// file: src/app/base/notify/provider.ts
import { InjectionToken, Type } from '@angular/core';
import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';
import { provideToastr, GlobalConfig, ToastNoAnimation } from 'ngx-toastr';
import { NotifyService } from '@base/notify/service';
import { NotifyComponent } from '@base/notify/component';

export const NOTIFY_DEFAULT_CONFIG: Partial<GlobalConfig> = {
    timeOut: 5 * 1000,
    extendedTimeOut: 1 * 1000,
    positionClass: 'toast-top-right',
    closeButton: true,
    progressBar: true,
    progressAnimation: 'increasing',
    preventDuplicates: true,
    countDuplicates: true,
    newestOnTop: true,
    tapToDismiss: true,
    enableHtml: true,
    resetTimeoutOnDuplicate: true,
    toastComponent: NotifyComponent as Type<unknown>,
};

export const NOTIFY_CONFIG =
    new InjectionToken<Partial<GlobalConfig>>('NOTIFY_CONFIG');

export function provideNotifyModule(
    config: Partial<GlobalConfig> = {},
): EnvironmentProviders {
    const finalConfig: Partial<GlobalConfig> = {
        ...NOTIFY_DEFAULT_CONFIG,
        ...config,
    };

    return makeEnvironmentProviders([
        provideToastr(finalConfig),
        {
            provide: NOTIFY_CONFIG,
            useValue: finalConfig,
        },
        NotifyService,
    ]);
}

export const NOTIFY_PROVIDERS: Provider[] = [
    NotifyService,
];