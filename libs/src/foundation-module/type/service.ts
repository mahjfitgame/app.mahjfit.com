// file: libs/src/base-module/type/service.ts

import { SignalStateService } from '@libs/signal-state/service';

export interface FoundationModuleServiceType {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** Module-owned state */
    state: SignalStateService;

    // METHODS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** Initialize the module's internationalization resources. */
    initI18n(): void;

    /** Set module information in the layout. */
    setModuleInfo(): void;

    /** Alter the module breadcrumbs. */
    alterBreadcrumb(): void;
}
