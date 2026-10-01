// file: src/app/module/shared/http-status/forbidden/service.ts

import { inject, Service } from '@angular/core';
import { I18nService } from '@base/internationalization/service';
import { FoundationModuleServiceType } from '@libs/foundation/module/type';
import { OpenAreaRoute } from 'src/app/area/open/route';
import { HTTP_STATUS_FORBIDDEN_I18N_KEY } from './const';
import { HttpStatusForbiddenState } from './state';
import { HttpStatusForbiddenRoute } from './route';
import { FoundationNavigationActionType } from '@libs/foundation/type';
import { SigninRoute } from '../../preboarding/signin/route';

@Service({ autoProvided: false })
export class HttpStatusForbiddenService implements FoundationModuleServiceType {
    public readonly route = inject(HttpStatusForbiddenRoute);
    public readonly state = inject(HttpStatusForbiddenState);
    private readonly i18n = inject(I18nService);

    /**
     * ⚠ sign out, not sign in. a 403 visitor is already signed in, the way to
     * a permitted account is through ending this session first
     */
    public readonly navigationActions: FoundationNavigationActionType[] = [
        {
            label: 'GL.MODULE.HOME',
            icon: 'home',
            routerLink: OpenAreaRoute.absolutePathArr(),
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
        this.i18n.useModule(HTTP_STATUS_FORBIDDEN_I18N_KEY);
    }

    public setModuleInfo(): void {}

    public alterBreadcrumb(): void {}
}
