// file: ./src/app/module/shared/http-status/not-found/service.ts

import { inject, Service } from '@angular/core';
import { I18nService } from '@base/internationalization/service';
import { FoundationModuleServiceType } from '@libs/foundation-module/type/service';
import { OpenAreaRoute } from 'src/app/area/open/route';
import { SigninRoute } from '@module/shared/onboarding/signin/route';
import { HTTP_STATUS_NOT_FOUND_I18N_KEY } from './const';
import { HttpStatusNotFoundState } from './state';
import { HttpStatusNotFoundRoute } from './route';
import { FoundationModuleNavigationActionType } from '@libs/foundation-module/type/common';

@Service({ autoProvided: false })
export class HttpStatusNotFoundService implements FoundationModuleServiceType {
    public readonly route = inject(HttpStatusNotFoundRoute);
    public readonly state = inject(HttpStatusNotFoundState);
    private readonly i18n = inject(I18nService);

    public readonly navigationActions: FoundationModuleNavigationActionType[] = [
        {
            label: 'GL.MODULE.HOME',
            icon: 'home',
            routerLink: OpenAreaRoute.absolutePathArr(),
        },
        {
            label: 'GL.MODULE.ONBOARDING.SIGNIN',
            icon: 'login',
            routerLink: SigninRoute.absolutePathArr(),
        },
    ];

    public initI18n(): void {
        this.i18n.useModule(HTTP_STATUS_NOT_FOUND_I18N_KEY);
    }

    public setModuleInfo(): void { }

    public alterBreadcrumb(): void { }
}
