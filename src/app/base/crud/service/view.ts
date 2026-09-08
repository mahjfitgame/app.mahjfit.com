// file: src/app/base/crud/service/view.ts
import { afterNextRender, inject, Type } from "@angular/core";
import { MatBottomSheet, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NgxPrintService, PrintOptions } from "ngx-print";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { CrudActionUiLayoutEnum, CrudEndSideBarTabEnum, CrudFieldUiTypeEnum } from "@base/crud/enum";
import { UiSizeEnum } from "@libs/breakpoint/enum";
import { UI_WIDTH } from "@libs/breakpoint/const";
import { CRUD_PRINT_SECTION_ID } from "@base/crud/const";
import { CrudDefaultViewBottomSheetComponent } from "@base/crud/default/view/bottom-sheet/component";
import { CrudDefaultViewDialogComponent } from "@base/crud/default/view/dialog/component";
import { CrudDefaultViewPageComponent } from "@base/crud/default/view/page/component";
import { CrudDefaultViewRecordComponent } from "@base/crud/default/view/record/component";
import { BfwApiSdkError } from "@bfw/api-sdk/core";
import { CrudFieldInfoType, CrudRecordType } from "@base/crud/type";
import { CrudRootService } from "./root";
import { CrudActionService } from "./action";
import { CrudListingService } from "./listing";

export class CrudViewService {

    // ████████████████████████████████████████████████████████████████████
    // ███ DEPENDENCIES ███████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public readonly viewDialog = inject(MatDialog);
    public readonly viewBottomSheet = inject(MatBottomSheet);
    public readonly print = inject(NgxPrintService);

    // View has independent overlays so its lifecycle never changes Mutation UI state.
    private activeViewDialogRef: MatDialogRef<CrudDefaultViewDialogComponent> | null = null;
    private activeViewBottomSheetRef: MatBottomSheetRef<CrudDefaultViewBottomSheetComponent> | null = null;

    constructor(
        private readonly root: CrudRootService,
        private readonly action: CrudActionService,
        private readonly listing: CrudListingService,
    ) {}

    // ████████████████████████████████████████████████████████████████████
    // ███ VIEW RECORD OPERATION ██████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public isViewActionActive(): boolean {
        return this.root.state.crudAction() === FoundationActionEnum.VIEW;
    }
    public getViewIcon(): string {
        return 'visibility';
    }
    public getViewTitle(): string {
        return this.isPrintActionActive() ? 'GL.ACTION.PRINT' : 'GL.ACTION.VIEW';
    }
    public getViewRecordComponent(): Type<any> {
        return this.root.state.view.viewRecordCustomComponent() ?? CrudDefaultViewRecordComponent;
    }
    public getViewPageComponent(): Type<any> {
        return this.root.state.view.viewPageCustomComponent() ?? CrudDefaultViewPageComponent;
    }
    public toggleViewEndDrawer(): void {
        this.root.state.view.setViewEndDrawerIsOpen(!this.root.state.view.viewEndDrawerIsOpen());
    }
    public async initViewActionFromUrl(
        keyid: string | number | null = this.action.getCrudActionRecordSecondaryKeyValue(),
    ): Promise<void> {
        if (!this.action.ensureActionPermitted(this.root.state.action.hasView())) {
            return;
        }

        if (keyid === null) {
            this.root.notify.error(this.root.i18n.translate('GL.CRUD.RECORD_ACTION.KEY_MISSING'));
            return;
        }

        this.root.state.view.setViewRecord(null);
        this.root.state.view.setViewRecordProcessing(true);

        try {
            const record = await this.root.findOneBySecondaryKey(
                keyid,
                this.root.state.view.viewFieldObj(),
            );

            // Ignore a response for a View route that is no longer active.
            if (
                !this.isViewActionActive()
                || this.action.getCrudActionRecordSecondaryKeyValue() !== keyid
            ) {
                return;
            }

            if (!record) {
                this.root.notify.error(this.root.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND'));
                await this.closeViewAction();
                return;
            }

            this.root.state.view.setViewRecord(record);

            if (this.root.state.view.viewActionUiLayout() !== CrudActionUiLayoutEnum.PAGE) {
                // Defer until the View host has registered an END_SIDE_BAR portal.
                setTimeout(() => this.openViewOverlay());
            }
        } catch (error: unknown) {
            this.root.log.error('[VIEW RECORD LOAD FAILED]', error);
            const message = error instanceof BfwApiSdkError
                ? error.errors()[0] ?? this.root.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND')
                : error instanceof Error
                    ? error.message
                    : this.root.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND');

            this.root.notify.error(message);
            await this.closeViewAction();
        } finally {
            this.root.state.view.setViewRecordProcessing(false);
        }
    }
    public openViewOverlay(): void {
        if (!this.isViewActionActive()) {
            return;
        }

        const layout = this.root.state.view.viewActionUiLayout();

        if (layout === CrudActionUiLayoutEnum.DIALOG) {
            if (this.activeViewDialogRef) {
                return;
            }

            const size = this.root.state.view.viewActionUiSize();
            const fullscreen = size === UiSizeEnum.FULL;

            this.activeViewDialogRef = this.viewDialog.open(
                CrudDefaultViewDialogComponent,
                {
                    panelClass: [
                        'bfw-safe-area-p',
                        ...(fullscreen ? ['tw:[--mat-dialog-container-shape:0px]'] : []),
                    ],
                    injector: this.root.getComponentInjector(),
                    disableClose: true,
                    width: UI_WIDTH[size],
                    maxWidth: fullscreen ? '100vw' : 'calc(100vw - 2rem)',
                    height: fullscreen ? '100dvh' : undefined,
                    maxHeight: fullscreen ? '100dvh' : undefined,
                },
            );
            this.activeViewDialogRef.afterClosed().subscribe(() => {
                this.activeViewDialogRef = null;
                if (!this.isViewActionActive()) {
                    this.root.state.view.clearViewRecord();
                }
            });
            return;
        }

        if (layout === CrudActionUiLayoutEnum.BOTTOM_SHEET) {
            if (this.activeViewBottomSheetRef) {
                return;
            }

            this.activeViewBottomSheetRef = this.viewBottomSheet.open(
                CrudDefaultViewBottomSheetComponent,
                {
                    injector: this.root.getComponentInjector(),
                    disableClose: true,
                },
            );
            this.activeViewBottomSheetRef.afterDismissed().subscribe(() => {
                this.activeViewBottomSheetRef = null;
                if (!this.isViewActionActive()) {
                    this.root.state.view.clearViewRecord();
                }
            });
            return;
        }

        if (layout === CrudActionUiLayoutEnum.END_DRAWER) {
            this.root.state.view.setViewEndDrawerIsOpen(true);
            return;
        }

        if (layout === CrudActionUiLayoutEnum.END_SIDE_BAR) {
            this.root.paLayout.state.setEndSideBarIsOpen(true);

            // same thing can be done using 3 different way but behaviour will be different in case of timing
            // setTimeout(() => {
            //     this.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.VIEW);
            // }, 100);

            queueMicrotask(() => {
                this.root.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.VIEW);
            });

            // afterNextRender(() => {
            //     this.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.VIEW);
            // }, { injector: this.getComponentInjector() });
        }
    }
    public closeViewOverlay(): void {
        const hasAnimatedOverlay = Boolean(
            this.activeViewDialogRef || this.activeViewBottomSheetRef,
        );

        if (this.activeViewDialogRef) {
            this.activeViewDialogRef.close();
            this.activeViewDialogRef = null;
        }

        if (this.activeViewBottomSheetRef) {
            this.activeViewBottomSheetRef.dismiss();
            this.activeViewBottomSheetRef = null;
        }

        this.root.state.view.setViewEndDrawerIsOpen(false);

        if (
            this.root.state.view.viewActionUiLayout() === CrudActionUiLayoutEnum.END_SIDE_BAR
            && this.root.paLayout
        ) {
            this.root.paLayout.state.setEndSideBarIsOpen(false);
        }

        if (!hasAnimatedOverlay) {
            this.root.state.view.clearViewRecord();
        }
    }
    public async closeViewAction(): Promise<void> {
        // PAGE-layout View and Print both tear the listing down while active
        // (unlike the overlay View layouts, which keep it mounted underneath),
        // so closing either needs a real reload or it renders empty. Print
        // always renders page-style regardless of viewActionUiLayout(), so it
        // is checked independently rather than folded into that setting.
        const listingWasHidden = this.isPrintActionActive()
            || this.root.state.view.viewActionUiLayout() === CrudActionUiLayoutEnum.PAGE;
        await this.action.closeCrudAction(listingWasHidden);
    }
    public addViewEndDrawerOnCloseCallBack(): void {
        this.root.state.view.addViewEndDrawerOnCloseCallBack('on_view_close', () => {
            if (this.isViewActionActive()) {
                void this.closeViewAction();
            }
        });
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ PRINT RECORD OPERATION █████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public isPrintActionActive(): boolean {
        return this.root.state.crudAction() === FoundationActionEnum.PRINT;
    }
    /** Used by the dedicated /print/:keyid route AND the inline Print button on View. */
    public printRecord(): void {
        this.print.print(new PrintOptions({
            printSectionId: CRUD_PRINT_SECTION_ID,
            //printTitle: this.i18n.translate(this.getViewTitle()),
            useExistingCss: true,
            printMethod: 'iframe',
            printDelay: 200,
        }));
    }
    public async initPrintActionFromUrl(
        keyid: string | number | null = this.action.getCrudActionRecordSecondaryKeyValue(),
    ): Promise<void> {
        if (!this.action.ensureActionPermitted(this.root.state.action.hasPrint())) {
            return;
        }

        if (keyid === null) {
            this.root.notify.error(this.root.i18n.translate('GL.CRUD.RECORD_ACTION.KEY_MISSING'));
            return;
        }

        this.root.state.view.setViewRecord(null);
        this.root.state.view.setViewRecordProcessing(true);

        try {
            const record = await this.root.findOneBySecondaryKey(
                keyid,
                this.root.state.view.viewFieldObj(),
            );

            // Ignore a response for a Print route that is no longer active.
            if (
                !this.isPrintActionActive()
                || this.action.getCrudActionRecordSecondaryKeyValue() !== keyid
            ) {
                return;
            }

            if (!record) {
                this.root.notify.error(this.root.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND'));
                await this.closeViewAction();
                return;
            }

            this.root.state.view.setViewRecord(record);

            // Wait for the page host to actually render the loaded record before
            // printing — a setTimeout(0) macrotask is not guaranteed to run after
            // Angular has flushed this DOM update, afterNextRender() is.
            afterNextRender(() => {
                if (this.isPrintActionActive()) {
                    this.printRecord();
                }
            }, { injector: this.root.getComponentInjector() });
        } catch (error: unknown) {
            this.root.log.error('[PRINT RECORD LOAD FAILED]', error);
            const message = error instanceof BfwApiSdkError
                ? error.errors()[0] ?? this.root.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND')
                : error instanceof Error
                    ? error.message
                    : this.root.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND');

            this.root.notify.error(message);
            await this.closeViewAction();
        } finally {
            this.root.state.view.setViewRecordProcessing(false);
        }
    }
    public formatViewFieldValue(
        key: string,
        fieldInfo: CrudFieldInfoType,
        record: CrudRecordType,
    ): string {
        const value = record[key];

        if (fieldInfo.type === CrudFieldUiTypeEnum.PASSWORD) {
            return this.root.utility.isBlankValue(value) ? '—' : '••••••••';
        }

        if (fieldInfo.type === CrudFieldUiTypeEnum.JSON) {
            return this.root.utility.isBlankValue(value)
                ? String(fieldInfo.default ?? '—')
                : JSON.stringify(value, null, 2);
        }

        const formatted = this.root.validation.formatCrudFieldValue(
            value,
            fieldInfo,
            record,
            this.root.state.getCrudModuleContext(),
        );

        if (this.root.utility.isBlankValue(formatted)) {
            return String(fieldInfo.default ?? '—');
        }

        if (Array.isArray(formatted)) {
            return formatted.join(', ');
        }

        return typeof formatted === 'object'
            ? JSON.stringify(formatted, null, 2)
            : String(formatted);
    }
}
