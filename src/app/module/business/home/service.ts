// file: src/app/module/business/home/service.ts
import { inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { I18nService } from "@base/internationalization/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleServiceType } from "@libs/foundation-module/type/service";
import { AppConfigRepository } from "@libs/sqlite/module/app-config/repository";
import { OpenAreaRoute } from "@area/open/route";
import { SignoutRoute } from "@module/shared/onboarding/signout/route";
import { SigninRoute } from "@module/shared/onboarding/signin/route";
import { GameRoute } from "src/app/module/business/game/route";
import { FoundationModuleNavigationActionType } from "@libs/foundation-module/type/common";
import { HOME_I18N_KEY } from "./const";
import { HomeState } from "./state";

@Service({ autoProvided: false })
export class HomeService implements FoundationModuleServiceType {

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    // route classes exposed for the template
    public readonly OpenAreaRoute = OpenAreaRoute;
    public readonly SignoutRoute = SignoutRoute;

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);
    public readonly ps = inject(PlatformService);
    public readonly ctxp = inject(ContextProfileService);

    public readonly api = inject(BfwApiService);

    public readonly state = inject(HomeState);

    private readonly appConfigRepository = inject(AppConfigRepository);

    // ████ MODULE PROPERTIES ███████████████████████████████████████████

    public readonly brandLogoSrc = 'assets/majhfit-logo-blue.png';

    public readonly navigationActions: FoundationModuleNavigationActionType[] = [
        /* {
            label: 'GL.MODULE.ONBOARDING.SIGNIN',
            icon: 'lock_open',
            routerLink: SigninRoute.absolutePathArr(),
        },
        {
            label: 'HOME.ACTION.GEO_COUNTRY',
            icon: 'dashboard',
            routerLink: ['/account/geo/country'],
        }, */
        {
            label: "Start Game",
            icon: "gamepad",
            routerLink: GameRoute.absolutePathArr(),
        },
    ];

    constructor() {

    }

    // ████ MODULE METHODS ██████████████████████████████████████████████

    public initI18n(): void {
        this.i18n.useModule(HOME_I18N_KEY);
    }
    public setModuleInfo(): void {
        // the open area has no layout state to publish module info into, unlike the
        // private area which has PrivateAreaLayoutService.state.setModuleInfo()
    }
    public alterBreadcrumb(): void {

    }

    // ████ API CALLS ███████████████████████████████████████████████████

    /**
     * Reads the sqlite schema version this client is running on and puts it in state.
     * A read failure must not break the landing page, so it is logged and left at its default.
     */
    public async loadDbVersion(): Promise<void> {
        try {
            const version = await this.appConfigRepository.getCurrentSqliteDbVersion();
            this.state.setDbVersion(version);
        } catch (e: any) {
            this.log.error(e);
            this.state.setError('Unable to read the local database version.');
        }
    }

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
