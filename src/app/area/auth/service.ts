// file: src/app/area/auth/service.ts
import { inject, Service } from "@angular/core";
import { AuthAreaLayoutState } from "@area/auth/state";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { I18nService } from "@base/internationalization/service";
import { FoundationNavPositionEnum } from "@libs/foundation/nav/enum";
import { UtilityService } from "@libs/utility/service";

@Service({ autoProvided: false })
export class AuthAreaLayoutService {

    public readonly brandLogoSrc = 'open/assets/brand/icons/icon-128x128.png';
    //public readonly brandLogoSrc = 'private/assets/brand/logo/logo.png';

    public FoundationNavPositionEnum = FoundationNavPositionEnum;

    public readonly state = inject(AuthAreaLayoutState);

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly utility = inject(UtilityService);

    constructor() {}

}