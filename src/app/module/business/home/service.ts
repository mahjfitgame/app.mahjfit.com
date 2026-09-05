// file: src/app/module/business/home/service.ts
import { inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { I18nService } from "@base/internationalization/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleServiceType } from "@libs/foundation/module/type";
import { AppConfigRepository } from "@libs/sqlite/module/app-config/repository";
import { OpenAreaRoute } from "@area/open/route";
import { SignoutRoute } from "@module/shared/onboarding/signout/route";
import { SigninRoute } from "@module/shared/preboarding/signin/route";
import { FoundationNavigationActionType } from "@libs/foundation/type";
import { HOME_I18N_KEY } from "./const";
import { HomeState } from "./state";
import { GeoCountryRoute } from "../../shared/geo/country/route";
import { GameRoute } from "../game/route";

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

    public navigationActions: FoundationNavigationActionType[] = [

        /*{
            label: 'GL.MODULE.PREBOARDING.SIGNIN',
            icon: 'lock_open',
            routerLink: SigninRoute.absolutePathArr(),
        },
        {
            label: 'HOME.ACTION.GEO_COUNTRY',
            icon: 'dashboard',
            //  * ⚠ was the literal ['/account/geo/country'], which the private area
            //  * slug rename ('account' -> 'private') turned into a dead link. a
            //  * class field is safe for Rule 7 — DI constructs this service long
            //  * after AreaRoute.routes() filled FoundationModulePath
            
            routerLink: GeoCountryRoute.absolutePathArr(),
        },
        */
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
    public genNavigationActions(): FoundationNavigationActionType[] {
        if (this.ctxp.state.authenticated()) {
            this.navigationActions.push({
                label: 'Start Game',
                icon: 'dashboard',
                routerLink: GameRoute.absolutePathArr(),
            });
            this.navigationActions.push({
                label: 'Signout',
                icon: 'logout',
                routerLink: SignoutRoute.absolutePathArr(),
            });

        } else {
            this.navigationActions.push({
                label: 'Signin',
                icon: 'lock_open',
                routerLink: SigninRoute.absolutePathArr(),
            });
        }
        return this.navigationActions;
    }

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
