// file: src/app/module/shared/http-status/not-found/service.ts

import { inject, Service } from '@angular/core';
import { I18nService } from '@base/internationalization/service';
import { FoundationModuleServiceType } from '@libs/foundation/module/type';
import { OpenAreaRoute } from 'src/app/area/open/route';
import { SigninRoute } from '@module/shared/preboarding/signin/route';
import { HTTP_STATUS_NOT_FOUND_I18N_KEY } from './const';
import { HttpStatusNotFoundState } from './state';
import { HttpStatusNotFoundRoute } from './route';
import { FoundationNavigationActionType } from '@libs/foundation/type';

@Service({ autoProvided: false })
export class HttpStatusNotFoundService implements FoundationModuleServiceType {
    public readonly route = inject(HttpStatusNotFoundRoute);
    public readonly state = inject(HttpStatusNotFoundState);
    private readonly i18n = inject(I18nService);

    public readonly navigationActions: FoundationNavigationActionType[] = [
        {
            label: 'GL.MODULE.HOME',
            icon: 'home',
            routerLink: OpenAreaRoute.absolutePathArr(),
        },
        {
            label: 'GL.MODULE.PREBOARDING.SIGNIN',
            icon: 'login',
            routerLink: SigninRoute.absolutePathArr(),
        },
    ];

    constructor() {
        // █████ FoundationModuleServiceType
        // load this module's translations first, before any label can render.
        // constructor, not component ngOnInit - see I18nService.useModule() for why
        this.initI18n();

        // set module info
        this.setModuleInfo();

        // alter breadcrumbs
        this.alterBreadcrumb();
    }

    public initI18n(): void {
        this.i18n.useModule(HTTP_STATUS_NOT_FOUND_I18N_KEY);
    }

    public setModuleInfo(): void {}

    public alterBreadcrumb(): void {}
}
