// file: src/app/area/auth/service.ts
import { inject, Service } from "@angular/core";
import { AuthAreaLayoutState } from "@area/auth/state";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { I18nService } from "@base/internationalization/service";

@Service({ autoProvided: false })
export class AuthAreaLayoutService {

    public readonly state = inject(AuthAreaLayoutState);

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    
    constructor() {}

}