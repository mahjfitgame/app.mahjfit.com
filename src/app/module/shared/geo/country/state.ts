import { effect, Service } from "@angular/core";
import { SignalStateService } from "@libs/signal-state/service";
import { AppModuleStateType } from "@libs/utility/type";

@Service({ autoProvided: false })
export class GeoCountryState extends SignalStateService implements AppModuleStateType  {

    // ████ DEPENDENCIES ████████████████████████████████████████████████
    // n/a

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = 'geocountry';

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████
    // n/a

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    // n/a

    constructor() {
        super();
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████

    public override onActivate(): void {
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
    }

    public override onDeactivate(): void {

    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████
    // n/a

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
