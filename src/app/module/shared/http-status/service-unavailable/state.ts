// file: src/app/module/shared/http-status/service-unavailable/state.ts

import { computed, inject, Service } from '@angular/core';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { SignalStateService } from '@libs/signal-state/service';
import { GlobalProgressBarService } from '@base/global-progress-bar/service';
import { ContextProfileService } from '@libs/context-profile/service';
import { BfwApiService } from '@libs/third-party-apis/bfw-api/service';
import { FoundationModuleStateType } from '@libs/foundation/module/type';
import { HttpStatusCode } from '@angular/common/http';
import { HTTP_STATUS_SERVICE_UNAVAILABLE_STATE_STORE_KEY } from './const';

@Service({ autoProvided: false })
export class HttpStatusServiceUnavailableState extends SignalStateService implements FoundationModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    public override readonly storeKey = HTTP_STATUS_SERVICE_UNAVAILABLE_STATE_STORE_KEY;
    public readonly statusCode = HttpStatusCode.ServiceUnavailable;

    /*
    public readonly debugState = computed(() => ({
        statusCode: this.statusCode,
    }));
    */

    constructor() {
        super();
        this.initializeSignalState();
    }

    public override onActivate(): void {}

    public override onDeactivate(): void {}
}