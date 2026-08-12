// file: libs/src/base-module/type/state.ts
import { Signal } from '@angular/core';
import { ConfService } from '@libs/conf/service';
import { ContextProfileService } from '@libs/context-profile/service';
import { LogService } from '@libs/log/service';
import { BfwApiService } from '@libs/third-party-apis/bfw-api/service';
import { GlobalProgressBarService } from 'src/app/base/global-progress-bar/service';

export interface FoundationModuleStateType {
    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    conf: ConfService;
    log: LogService;
    gpbs: GlobalProgressBarService;
    ctxp: ContextProfileService;
    api: BfwApiService;

    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** Persistent state storage key for module */
    storeKey: string;

    /**
     * Debug helper (template-friendly): shows the state info as set.
     * Comment this property in production mode to reduce memory usage and browser load.
     */
    debugState?: Signal<unknown>;

    // LISTENERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** Lifecycle hook invoked once after this state is initialized */
    onActivate(): void;
    /** Lifecycle hook invoked once when Angular destroys this state */
    onDeactivate(): void;
}
