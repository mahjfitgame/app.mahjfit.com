// file: src/app/area/auth/state.ts
import { Portal } from "@angular/cdk/portal";
import { effect, inject, Service, signal, WritableSignal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { AuthSlotPortalType } from "@area/auth/type";
import { AuthAreaLayoutStateRuntimeEnum } from "@area/auth/enum";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation-module/type/state";
import { AUTH_AREA_STATE_STORE_KEY } from "./const";

@Service({ autoProvided: false })
export class AuthAreaLayoutState extends SignalStateService implements FoundationModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService)
    public readonly log = inject(LogService)
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = AUTH_AREA_STATE_STORE_KEY;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _slotStartSide = signal<AuthSlotPortalType | null>(null);
    public readonly slotStartSide = this._slotStartSide.asReadonly();

    private readonly _slotEndSideHeader = signal<AuthSlotPortalType | null>(null);
    public readonly slotEndSideHeader = this._slotEndSideHeader.asReadonly();

    private readonly _slotEndSideFooter = signal<AuthSlotPortalType | null>(null);
    public readonly slotEndSideFooter = this._slotEndSideFooter.asReadonly();

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    // n/a

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
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

    /**
     * This is kind of getter method but we want to keep it as a regular method to allow dynamic access based on the enum value
     * instead of having separate getters for each layout slot which would be less scalable and more verbose.
     *
     * Do not define individual getters for each layout slot, instead use a single method to get the portal based on the enum value.
     */
    private state(layout: AuthAreaLayoutStateRuntimeEnum): WritableSignal<AuthSlotPortalType | null> {
        switch (layout) {
            case AuthAreaLayoutStateRuntimeEnum.SLOT_START_SIDE:
                return this._slotStartSide;
            case AuthAreaLayoutStateRuntimeEnum.SLOT_END_SIDE_HEADER:
                return this._slotEndSideHeader;
            case AuthAreaLayoutStateRuntimeEnum.SLOT_END_SIDE_FOOTER:
                return this._slotEndSideFooter;
            default:
                throw new Error(`Unknown auth area layout: ${layout}`);
        }
    }
    // dynamic methods
    public get(layout: AuthAreaLayoutStateRuntimeEnum): Portal<any> | null {
        return this.state(layout)();
    }

    public set(layout: AuthAreaLayoutStateRuntimeEnum, portal: Portal<unknown>): void {
        this.state(layout).set(portal);
    }

    public clear(layout: AuthAreaLayoutStateRuntimeEnum, portal: Portal<unknown>): void {
        this.state(layout).set(null);
    }

    // direct methodes
    public setSlotStartSide(portal: AuthSlotPortalType): void {
        this._slotStartSide.set(portal);
    }
    public clearSlotStartSide(): void {
        this._slotStartSide.set(null);
    }

    public setSlotEndSideHeader(portal: AuthSlotPortalType): void {
        this._slotEndSideHeader.set(portal);
    }
    public clearSlotEndSideHeader(): void {
        this._slotEndSideHeader.set(null);
    }
    public setSlotEndSideFooter(portal: AuthSlotPortalType): void {
        this._slotEndSideFooter.set(portal);
    }
    public clearSlotEndSideFooter(): void {
        this._slotEndSideFooter.set(null);
    }
    public clearAll(): void {
        this.clearSlotStartSide();
        this.clearSlotEndSideHeader();
        this.clearSlotEndSideFooter();
    }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
