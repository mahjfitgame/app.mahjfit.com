// file: src/app/area/protected/service.ts
import { inject, Service } from "@angular/core";
import { BreakpointObserverService } from "@libs/breakpoint/service";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { UtilityService } from "@libs/utility/service";
import { I18nService } from "@base/internationalization/service";
import { FoundationNavPositionEnum } from "@libs/foundation/nav/enum";
import { ProtectedAreaLayoutState } from "@area/protected/state";

/**
 * @ProtectedAreaLayoutService
 * behaviour for this area's shell. no signals here, they all live in state.ts
 *
 * ⚠ a module publishes its header block through
 * `service.state.setModuleInfo()`, the same call shape the private area uses
 */
@Service({ autoProvided: false })
export class ProtectedAreaLayoutService {

    // ████ CLASS PROPERTIES ████████████████████████████████████████████
    // exposed for the template, which cannot import
    public FoundationNavPositionEnum = FoundationNavPositionEnum;

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly state = inject(ProtectedAreaLayoutState);

    public readonly bos = inject(BreakpointObserverService);
    public readonly i18n = inject(I18nService);
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly utility = inject(UtilityService);

    constructor() {}
}
