// file: libs/src/print/state.ts
import { inject, Service, signal } from '@angular/core';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';
import { SignalStateService } from '@libs/signal-state/service';
import { PRINT_STATE_STORE_KEY } from './const';

@Service()
export class PrintState extends SignalStateService {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = PRINT_STATE_STORE_KEY;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    /**
     * A print job is running (building the document, or the OS dialog is open).
     * Nothing is persisted — a job never outlives the page it started on.
     */
    private readonly _isPrinting = signal(false);
    public readonly isPrinting = this._isPrinting.asReadonly();

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    // n/a

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();
    }

    public setIsPrinting(value: boolean): void {
        this._isPrinting.set(value);
    }
}
