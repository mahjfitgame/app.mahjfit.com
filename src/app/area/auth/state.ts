// file: ./src/app/area/auth/state.ts
import { Portal } from "@angular/cdk/portal";
import { inject, Service, signal, WritableSignal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { AuthSlotPortalType } from "@area/auth/type";
import { AuthAreaLayoutStateRuntimeEnum } from "@area/auth/enum";

@Service({ autoProvided: false })
export class AuthAreaLayoutState extends SignalStateService {
    private readonly conf = inject(ConfService)
    private readonly log = inject(LogService)

    // required for persisted state
    protected override readonly storeKey = "aal";

    private readonly _slotStartSide = signal<AuthSlotPortalType | null>(null);
    public readonly slotStartSide = this._slotStartSide.asReadonly();

    private readonly _slotEndSideHeader = signal<AuthSlotPortalType | null>(null);
    public readonly slotEndSideHeader = this._slotEndSideHeader.asReadonly();

    private readonly _slotEndSideFooter = signal<AuthSlotPortalType | null>(null);
    public readonly slotEndSideFooter = this._slotEndSideFooter.asReadonly();

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();
    }

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
}