// file: src/app/area/protected/state.ts
import { inject, Service, signal } from "@angular/core";
import { Portal } from "@angular/cdk/portal";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { FoundationModuleStateType } from "@libs/foundation/module/type";
import { ProtectedAreaLayoutSlotEnum } from "@area/protected/enum";
import { ProtectedAreaModuleInfoType } from "@area/protected/type";
import { PROTECTED_AREA_STATE_STORE_KEY } from "@area/protected/const";

/**
 * @ProtectedAreaLayoutState
 * every signal this area's shell owns (Rule: signals live in state.ts)
 *
 * ⚠ the small sibling of PrivateAreaLayoutState. two slots and a moduleInfo,
 * because the shell is a top bar and a page — no drawers, so no drawer state.
 * grow it WITH the template, never ahead of it
 */
@Service({ autoProvided: false })
export class ProtectedAreaLayoutState extends SignalStateService implements FoundationModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = PROTECTED_AREA_STATE_STORE_KEY;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    /** published by the routed module's setModuleInfo(), rendered in the top bar */
    private readonly _moduleInfo = signal<ProtectedAreaModuleInfoType | null>(null);
    public readonly moduleInfo = this._moduleInfo.asReadonly();

    private readonly _slotMainHeaderToolbarExtension = signal<Portal<any> | null>(null);
    public readonly slotMainHeaderToolbarExtension = this._slotMainHeaderToolbarExtension.asReadonly();

    private readonly _slotMainFooterToolbarExtension = signal<Portal<any> | null>(null);
    public readonly slotMainFooterToolbarExtension = this._slotMainFooterToolbarExtension.asReadonly();

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    // n/a

    constructor() {
        super();

        // Signal-state fields must be initialized before the base service is initialized.
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████

    public override onActivate(): void {

    }

    public override onDeactivate(): void {

    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    public setModuleInfo(moduleInfo: ProtectedAreaModuleInfoType | null): void {
        this._moduleInfo.set(moduleInfo);
    }
    public clearModuleInfo(): void {
        this._moduleInfo.set(null);
    }

    public setSlotMainHeaderToolbarExtension(extension: Portal<any> | null): void {
        this._slotMainHeaderToolbarExtension.set(extension);
    }
    public setSlotMainFooterToolbarExtension(extension: Portal<any> | null): void {
        this._slotMainFooterToolbarExtension.set(extension);
    }

    /**
     * ⚠ the ONE entry point the directive uses, keyed by the slot enum. do not
     * add a per slot input to ProtectedAreaLayoutDirective — a new slot must
     * cost one enum member and one case, nothing more
     */
    public setPortal(layout: ProtectedAreaLayoutSlotEnum, portal: Portal<unknown>): void {
        switch (layout) {
            case ProtectedAreaLayoutSlotEnum.SLOT_MAIN_HEADER_TOOLBAR_EXTENSION:
                this._slotMainHeaderToolbarExtension.set(portal);
                break;
            case ProtectedAreaLayoutSlotEnum.SLOT_MAIN_FOOTER_TOOLBAR_EXTENSION:
                this._slotMainFooterToolbarExtension.set(portal);
                break;
        }
    }

    /**
     * ⚠ IDENTITY CHECKED. two modules can hold the same slot across a route
     * change: the arriving one sets its portal in ngAfterViewInit BEFORE the
     * leaving one runs ngOnDestroy, so a blind null would erase the new portal
     */
    public clearPortal(layout: ProtectedAreaLayoutSlotEnum, portal: Portal<unknown>): void {
        switch (layout) {
            case ProtectedAreaLayoutSlotEnum.SLOT_MAIN_HEADER_TOOLBAR_EXTENSION:
                if (this.slotMainHeaderToolbarExtension() === portal) {
                    this._slotMainHeaderToolbarExtension.set(null);
                }
                break;
            case ProtectedAreaLayoutSlotEnum.SLOT_MAIN_FOOTER_TOOLBAR_EXTENSION:
                if (this.slotMainFooterToolbarExtension() === portal) {
                    this._slotMainFooterToolbarExtension.set(null);
                }
                break;
        }
    }

    /** called from the layout's ngOnDestroy, so nothing leaks into the next mount */
    public setDefault(): void {
        this.clearModuleInfo();
        this.setSlotMainHeaderToolbarExtension(null);
        this.setSlotMainFooterToolbarExtension(null);
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
