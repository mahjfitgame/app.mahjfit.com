/// file: app/base/notification/state.ts
import { inject, Injectable } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";

@Injectable({ providedIn: "root" })
export class NotificationState extends SignalStateService {
    // DEPENDENCIES
    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);

    // STATE
    protected override readonly storeKey: string = "notify";

    constructor() {
        super();
        this.initializeSignalState();
    }

    // STATE METHODS
}