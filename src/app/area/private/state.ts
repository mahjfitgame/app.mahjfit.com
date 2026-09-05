// file: src/app/area/private/state.ts
import { effect, inject, Service, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { EndSideBarOnCloseCallbackType, PrivateAreaModuleInfoType, SlotEndSideBarTabBodyType, SlotEndSideBarTabLabelType } from "@area/private/type";
import { Portal } from "@angular/cdk/portal";
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation/module/type";
import { PRIVATE_AREA_STATE_STORE_KEY } from "./const";

@Service({ autoProvided: false })
export class PrivateAreaLayoutState extends SignalStateService implements FoundationModuleStateType {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = PRIVATE_AREA_STATE_STORE_KEY;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _moduleInfo = signal<PrivateAreaModuleInfoType | null>(null);
    public readonly moduleInfo = this._moduleInfo.asReadonly();

    private readonly _endSideBarIsOpen = signal<boolean>(false);
    public readonly endSideBarIsOpen = this._endSideBarIsOpen.asReadonly();

    private readonly _endSideBarOnCloseCallback = signal<EndSideBarOnCloseCallbackType | null>(null);
    public readonly endSideBarOnCloseCallback = this._endSideBarOnCloseCallback.asReadonly();

    private readonly _endSideBarOpenTabIndex = signal<number>(0);
    public readonly endSideBarOpenTabIndex = this._endSideBarOpenTabIndex.asReadonly();

    private readonly _endSideBarTabIndexByLabel = signal<Record<string, number> | null>(null);
    public readonly endSideBarTabIndexByLabel = this._endSideBarTabIndexByLabel.asReadonly();

    private readonly _slotStartSideBarExtension = signal<Portal<any> | null>(null);
    public readonly slotStartSideBarExtension = this._slotStartSideBarExtension.asReadonly();

    private readonly _slotMainHeaderToolbarExtension = signal<Portal<any> | null>(null);
    public readonly slotMainHeaderToolbarExtension = this._slotMainHeaderToolbarExtension.asReadonly();

    private readonly _slotMainFooterToolbarExtension = signal<Portal<any> | null>(null);
    public readonly slotMainFooterToolbarExtension = this._slotMainFooterToolbarExtension.asReadonly();

    private readonly _slotEndSideBarTabLabel = signal<SlotEndSideBarTabLabelType[] | null>(null);
    public readonly slotEndSideBarTabLabel = this._slotEndSideBarTabLabel.asReadonly();

    private readonly _slotEndSideBarTabBody = signal<SlotEndSideBarTabBodyType[] | null>(null);
    public readonly slotEndSideBarTabBody = this._slotEndSideBarTabBody.asReadonly();

    private readonly _slotEndSideBarFooter = signal<Portal<any> | null>(null);
    public readonly slotEndSideBarFooter = this._slotEndSideBarFooter.asReadonly();

    protected readonly endSideBarTabBodyLabelMap = new WeakMap<Portal<unknown>, string>();

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    // n/a

    constructor() {
        super();
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████

    public override onActivate(): void {
        /*
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
        */
    }

    public override onDeactivate(): void {

    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    public setModuleInfo(moduleInfo: PrivateAreaModuleInfoType | null): void {
        this._moduleInfo.set(moduleInfo);
    }
    public clearModuleInfo(): void {
        this._moduleInfo.set(null);
    }
    public setEndSideBarIsOpen(open: boolean): void {
        this._endSideBarIsOpen.set(open);
    }
    public setEndSideBarOnCloseCallback(callback: EndSideBarOnCloseCallbackType | null): void {
        this._endSideBarOnCloseCallback.set(callback);
    }

    public addEndSideBarOnCloseCallback(key: string, fn: (() => void)): void {
        this._endSideBarOnCloseCallback.update(onClose => {
            // if onClose is null/undefined, fall back to an empty object
            return {
                ...(onClose ?? {}),
                [key]: fn
            };
        });
    }
    public removeEndSideBarOnCloseCallback(key: keyof EndSideBarOnCloseCallbackType): void {
        this._endSideBarOnCloseCallback.update(onClose => {
            // if it's already null/undefined, there's nothing to remove
            if (!onClose) return onClose;

            // create a shallow copy to maintain immutability
            const updated = { ...onClose };
            delete updated[key];

            return updated;
        });
    }
    public runEndSideBarOnCloseCallback(): void {
        for(const key in this.endSideBarOnCloseCallback()) {
            this.endSideBarOnCloseCallback()?.[key]?.();
        }
    }
    public setEndSideBarOpenTabIndex(index: number): void {
        this._endSideBarOpenTabIndex.set(index);
    }
    public setEndSideBarTabIndexByLabel(indexByLabel: Record<string, number> | null): void {
        this._endSideBarTabIndexByLabel.set(indexByLabel);
    }
    public setSlotStartSideBarExtension(extension: Portal<any> | null): void {
        this._slotStartSideBarExtension.set(extension);
    }
    public setSlotMainHeaderToolbarExtension(extension: Portal<any> | null): void {
        this._slotMainHeaderToolbarExtension.set(extension);
    }
    public setSlotMainFooterToolbarExtension(extension: Portal<any> | null): void {
        this._slotMainFooterToolbarExtension.set(extension);
    }
    public setSlotEndSideBarTabLabel(labels: SlotEndSideBarTabLabelType[] | null): void {
        this._slotEndSideBarTabLabel.set(labels);
    }
    public setSlotEndSideBarTabBody(bodies: SlotEndSideBarTabBodyType[] | null): void {
        this._slotEndSideBarTabBody.set(bodies);
    }
    public setSlotEndSideBarFooter(footer: Portal<any> | null): void {
        this._slotEndSideBarFooter.set(footer);
    }
    public setPortal(layout: PrivateAreaLayoutSlotEnum, portal: Portal<unknown>, privateAreaLayoutIndex?: number, privateAreaLayoutLabel?: string): void {
        if (
            layout === PrivateAreaLayoutSlotEnum.SLOT_END_SIDE_BAR_TAB_LABEL ||
            layout === PrivateAreaLayoutSlotEnum.SLOT_END_SIDE_BAR_TAB_BODY
        ) {
            const current = layout === PrivateAreaLayoutSlotEnum.SLOT_END_SIDE_BAR_TAB_LABEL
                ? this.slotEndSideBarTabLabel()
                : this.slotEndSideBarTabBody();
            const next = current ? [...current] : [];

            if (typeof privateAreaLayoutIndex === 'number' && Number.isFinite(privateAreaLayoutIndex) && privateAreaLayoutIndex >= 0) {
                const targetIndex = Math.min(Math.floor(privateAreaLayoutIndex), next.length);
                next.splice(targetIndex, 0, portal);
            } else {
                next.push(portal);
            }

            if (layout === PrivateAreaLayoutSlotEnum.SLOT_END_SIDE_BAR_TAB_LABEL) {
                this._slotEndSideBarTabLabel.set(next);
                return;
            }

            if (privateAreaLayoutLabel) {
                this.endSideBarTabBodyLabelMap.set(portal, privateAreaLayoutLabel);
            }
            this._slotEndSideBarTabBody.set(next);
            this.rebuildEndSideBarTabIndexByLabel();
            return;
        }

        switch (layout) {
            case PrivateAreaLayoutSlotEnum.SLOT_START_SIDE_BAR_EXTENSION:
                this._slotStartSideBarExtension.set(portal);
                break;
            case PrivateAreaLayoutSlotEnum.SLOT_MAIN_HEADER_TOOLBAR_EXTENSION:
                this._slotMainHeaderToolbarExtension.set(portal);
                break;
            case PrivateAreaLayoutSlotEnum.SLOT_MAIN_FOOTER_TOOLBAR_EXTENSION:
                this._slotMainFooterToolbarExtension.set(portal);
                break;
            case PrivateAreaLayoutSlotEnum.SLOT_END_SIDE_BAR_FOOTER:
                this._slotEndSideBarFooter.set(portal);
                break;
        }
    }
    public clearPortal(layout: PrivateAreaLayoutSlotEnum, portal: Portal<unknown>): void {
        if (
            layout === PrivateAreaLayoutSlotEnum.SLOT_END_SIDE_BAR_TAB_LABEL ||
            layout === PrivateAreaLayoutSlotEnum.SLOT_END_SIDE_BAR_TAB_BODY
        ) {
            const current = layout === PrivateAreaLayoutSlotEnum.SLOT_END_SIDE_BAR_TAB_LABEL
                ? this.slotEndSideBarTabLabel()
                : this.slotEndSideBarTabBody();

            if (!current?.includes(portal)) {
                return;
            }

            const next = current.filter(item => item !== portal);

            if (layout === PrivateAreaLayoutSlotEnum.SLOT_END_SIDE_BAR_TAB_LABEL) {
                this._slotEndSideBarTabLabel.set(next.length ? next : null);
                return;
            }

            this._slotEndSideBarTabBody.set(next.length ? next : null);
            this.rebuildEndSideBarTabIndexByLabel();
            return;
        }

        switch (layout) {
            case PrivateAreaLayoutSlotEnum.SLOT_START_SIDE_BAR_EXTENSION:
                if (this.slotStartSideBarExtension() === portal) {
                    this._slotStartSideBarExtension.set(null);
                }
                break;
            case PrivateAreaLayoutSlotEnum.SLOT_MAIN_HEADER_TOOLBAR_EXTENSION:
                if (this.slotMainHeaderToolbarExtension() === portal) {
                    this._slotMainHeaderToolbarExtension.set(null);
                }
                break;
            case PrivateAreaLayoutSlotEnum.SLOT_MAIN_FOOTER_TOOLBAR_EXTENSION:
                if (this.slotMainFooterToolbarExtension() === portal) {
                    this._slotMainFooterToolbarExtension.set(null);
                }
                break;
            case PrivateAreaLayoutSlotEnum.SLOT_END_SIDE_BAR_FOOTER:
                if (this.slotEndSideBarFooter() === portal) {
                    this._slotEndSideBarFooter.set(null);
                }
                break;
        }
    }
    protected rebuildEndSideBarTabIndexByLabel(): void {
        const indexByLabel: Record<string, number> = {};
        let hasLabels = false;

        this.slotEndSideBarTabBody()?.forEach((portal, index) => {
            const label = this.endSideBarTabBodyLabelMap.get(portal);
            if (label) {
                indexByLabel[label] = index;
                hasLabels = true;
            }
        });

        this._endSideBarTabIndexByLabel.set(hasLabels ? indexByLabel : null);
    }
    public setDefault(): void {
        this.clearModuleInfo();
        this.setEndSideBarIsOpen(false);
        this.setEndSideBarOnCloseCallback(null);
        this.setEndSideBarOpenTabIndex(0);
        this.setEndSideBarTabIndexByLabel(null);
        this.setSlotStartSideBarExtension(null);
        this.setSlotMainHeaderToolbarExtension(null);
        this.setSlotMainFooterToolbarExtension(null);
        this.setSlotEndSideBarTabLabel(null);
        this.setSlotEndSideBarTabBody(null);
        this.setSlotEndSideBarFooter(null);
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
