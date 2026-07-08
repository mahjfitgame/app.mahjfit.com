// file: src/app/area/private/state.ts
import { inject, Service, signal } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { EndSideBarOnCloseType, PrivateAreaModuleInfoType, SlotEndSideBarTabBodyType, SlotEndSideBarTabLabelType } from "@area/private/type";
import { Portal } from "@angular/cdk/portal";
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";

@Service({ autoProvided: false })
export class PrivateAreaLayoutState extends SignalStateService {
    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);

    // required for persisted state
    protected override readonly storeKey = 'pal';

    private readonly _moduleInfo = signal<PrivateAreaModuleInfoType | null>(null);
    public readonly moduleInfo = this._moduleInfo.asReadonly();

    private readonly _endSideBarOpen = signal<boolean>(false);
    public readonly endSideBarOpen = this._endSideBarOpen.asReadonly();

    private readonly _endSideBarOnClose = signal<EndSideBarOnCloseType | null>(null);
    public readonly endSideBarOnClose = this._endSideBarOnClose.asReadonly();
    
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

    constructor() {
        super();
        this.initializeSignalState();
    }

    public setModuleInfo(moduleInfo: PrivateAreaModuleInfoType | null): void {
        this._moduleInfo.set(moduleInfo);
    }
    public clearModuleInfo(): void {
        this._moduleInfo.set(null);
    }
    public setEndSideBarOpen(open: boolean): void {
        this._endSideBarOpen.set(open);
    }
    public setEndSideBarOnClose(onClose: EndSideBarOnCloseType | null): void {
        this._endSideBarOnClose.set(onClose);
    }
    public addEndSideBarOnClose(key: string, fn: (() => void)): void {
        this._endSideBarOnClose.update(onClose => {
            // if onClose is null/undefined, fall back to an empty object
            return {
                ...(onClose ?? {}),
                [key]: fn
            };
        });
    }
    public removeEndSideBarOnClose(key: keyof EndSideBarOnCloseType): void {
        this._endSideBarOnClose.update(onClose => {
            // if it's already null/undefined, there's nothing to remove
            if (!onClose) return onClose;

            // create a shallow copy to maintain immutability
            const updated = { ...onClose };
            delete updated[key];

            return updated;
        });
    }
    public runEndSideBarOnClose(): void {
        for(const key in this.endSideBarOnClose()) {
            this.endSideBarOnClose()?.[key]?.();
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
        this.setEndSideBarOpen(false);
        this.setEndSideBarOnClose(null);
        this.setEndSideBarOpenTabIndex(0);
        this.setEndSideBarTabIndexByLabel(null);
        this.setSlotStartSideBarExtension(null);
        this.setSlotMainHeaderToolbarExtension(null);
        this.setSlotMainFooterToolbarExtension(null);
        this.setSlotEndSideBarTabLabel(null);
        this.setSlotEndSideBarTabBody(null);
        this.setSlotEndSideBarFooter(null);
    }
}