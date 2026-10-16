// file: src/app/base/crud/service/view.ts
import { afterNextRender, inject, Type } from "@angular/core";
import { MatBottomSheet, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { CrudActionUiLayoutEnum, CrudEndSideBarTabEnum, CrudFieldUiTypeEnum } from "@base/crud/enum";
import { BreakpointSizeEnum } from "@libs/breakpoint/enum";
import { BREAKPOINT_WIDTH } from "@libs/breakpoint/const";
import { CrudViewBottomSheetComponent } from "src/app/base/crud/component/view/bottom-sheet/component";
import { CrudViewDialogComponent } from "src/app/base/crud/component/view/dialog/component";
import { CrudViewPageComponent } from "src/app/base/crud/component/view/page/component";
import { CrudViewRecordComponent } from "src/app/base/crud/component/view/record/component";
import { BfwApiSdkError } from "@bfw/api-sdk/core";
import { CrudFieldInfoType, CrudRecordType } from "@base/crud/type";
import { ImageSlideshowDialog } from "@base/image-slideshow/dialog";
import { ImageSlideshowItemType } from "@base/image-slideshow/type";
import { CrudRootService } from "./root";
import { CrudActionService } from "./action";
import { CrudListingService } from "./listing";

export class CrudViewService {

    // ████████████████████████████████████████████████████████████████████
    // ███ DEPENDENCIES ███████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public readonly viewDialog = inject(MatDialog);
    public readonly viewBottomSheet = inject(MatBottomSheet);

    /**
     * A FIELD initializer, not a constructor param: this class is new-ed inside
     * CrudService's constructor (service/entry.ts), which IS an injection
     * context. @see CrudListingService.imageSlideshowDialog, same idiom.
     */
    private readonly imageSlideshowDialog = inject(ImageSlideshowDialog);

    // View has independent overlays so its lifecycle never changes Mutation UI state.
    private activeViewDialogRef: MatDialogRef<CrudViewDialogComponent> | null = null;
    private activeViewBottomSheetRef: MatBottomSheetRef<CrudViewBottomSheetComponent> | null = null;

    /**
     * Record wrapper of the View host currently on screen, handed over by that
     * host (see `component/view/page/component.ts`). Only the /print/:index
     * route needs it: that print is triggered by the router, not by a button,
     * so there is no template to pass an element from. A plain field, not a
     * signal — it is a DOM handle nothing renders off.
     */
    private autoPrintArea: HTMLElement | null = null;

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
        return this.root.state.view.viewRecordCustomComponent() ?? CrudViewRecordComponent;
    }
    public getViewPageComponent(): Type<any> {
        return this.root.state.view.viewPageCustomComponent() ?? CrudViewPageComponent;
    }
    public toggleViewEndDrawer(): void {
        this.root.state.view.setViewEndDrawerIsOpen(!this.root.state.view.viewEndDrawerIsOpen());
    }
    public async initViewActionFromUrl(
        value: string | number | null = this.action.getCrudActionRecordIndex(),
    ): Promise<void> {
        if (!this.action.ensureActionPermitted(this.root.state.action.hasView())) {
            await this.closeViewAction();
            return;
        }

        if (value === null) {
            this.root.notify.error(this.root.i18n.translate('GL.CRUD.RECORD_ACTION.KEY_MISSING'));
            await this.closeViewAction();
            return;
        }

        this.root.state.view.setViewRecord(null);
        this.root.state.view.setViewRecordProcessing(true);

        try {
            /**
             * ⚠ ONE call where this used to be four steps - see
             * CrudActionService.loadRecordForUrlAction(), which now owns the
             * labelField force-add, the fetch, the not-found branch and the
             * stale-route guard for every url-driven action.
             *
             * PAGE layout never loads the listing (shouldLoadListingOnRouteEnter()),
             * so listingDataSource() stays empty on a direct url load and the
             * fetch inside the guard is the only record PAGE mode ever gets -
             * hence no fastPathRecord here.
             */
            const record = await this.action.loadRecordForUrlAction(
                value,
                this.root.state.view.viewFieldObj(),
                () => this.isViewActionActive(),
                () => this.closeViewAction(),
            );

            if (!record) {
                return;
            }

            this.root.state.view.setViewRecord(record);
            this.root.state.setActionListingRecord(record);

            if (this.root.state.view.viewActionUiLayout() !== CrudActionUiLayoutEnum.PAGE) {
                // Defer until the View host has registered an END_SIDE_BAR portal.
                setTimeout(() => this.openViewOverlay());
            }
        } catch (error: unknown) {
            /**
             * ⚠ KEPT, and now POST-LOAD ONLY - loadRecordForUrlAction() owns
             * every error the fetch itself can raise, so what reaches here is
             * the record publish above. Dropping this block would have turned
             * that into an unhandled rejection, since the entry effect calls
             * this as `void initViewActionFromUrl(...)`.
             */
            this.root.log.error('[VIEW RECORD LOAD FAILED]', error);
            const message = error instanceof BfwApiSdkError
                ? error.errors()[0] ?? this.action.getRecordNotFoundMessage(value)
                : error instanceof Error
                    ? error.message
                    : this.action.getRecordNotFoundMessage(value);

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
            const fullscreen = size === BreakpointSizeEnum.FULL;

            this.activeViewDialogRef = this.viewDialog.open(
                CrudViewDialogComponent,
                {
                    panelClass: [
                        ...(fullscreen ? [] : ['bfw-safe-area-p']),
                        ...(fullscreen ? ['tw:[--mat-dialog-container-shape:0px]'] : []),
                    ],
                    injector: this.root.getComponentInjector(),
                    disableClose: true,
                    width: BREAKPOINT_WIDTH[size],
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
                CrudViewBottomSheetComponent,
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
    // ███ FILE FIELD SLIDESHOW ███████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * Opens the image slideshow over ONE FILE field of the record on screen.
     *
     * The THIRD reader of one `slideshow: {}` declaration, and only the GROUP
     * differs: the listing's opener gathers every visible row in a column, the
     * upload form control its own single preview, and this one the single record
     * being viewed.
     *
     * ⚠ It can NOT reuse CrudListingService.openImageFileFieldSlideshow() -
     * that reads listingDataSource().filteredData, and a PAGE-layout view never
     * loads the listing at all (shouldLoadListingOnRouteEnter() is false there),
     * so the group would be permanently empty on exactly the layout where the
     * picture is largest.
     *
     * A one-item group needs nothing extra: state.showThumbs already gates on
     * slideCount() > 1 and buildMainParams() drops `loop` below two slides.
     */
    public openImageFileFieldSlideshow(
        record: CrudRecordType,
        finfo: CrudFieldInfoType,
    ): void {
        if (!finfo.file?.is_image || !finfo.slideshow) return;

        /**
         * DIRECT with a THUMB fallback, the same pair the listing's opener
         * builds - a SLIDE has no monogram to fall back to, unlike the view
         * panel that drew the picture, so a module whose selection omitted
         * `direct` still gets an image rather than an empty viewer.
         */
        const thumb = this.root.utility.getFileFieldUrl(record, finfo, 'thumb');
        const src = this.root.utility.getFileFieldUrl(record, finfo, 'direct') ?? thumb;

        if (!src) return;

        const item: ImageSlideshowItemType = {
            src,
            thumb: thumb ?? src,
            alt: this.root.utility.getFileFieldMonogram(record, finfo),
        };

        // size is left undefined when the module did not set one, so the
        // slideshow applies its own FULL default rather than this file guessing
        //
        // ⚠ .catch() and not void: open() awaits an import() of the slideshow
        // chunk, which rejects offline or against a hash that a deploy has
        // moved. void leaves that as an unhandled rejection.
        this.imageSlideshowDialog
            .open({
                items: [item],
                size: finfo.slideshow.size,
                // already resolved against the module's PRINT action by the
                // field object, not re-checked here - @see FileSlideshowType.print
                showPrint: finfo.slideshow.print,
            })
            .catch((error) => this.root.log.error('image slideshow open failed', error));
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ PRINT RECORD OPERATION █████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public isPrintActionActive(): boolean {
        return this.root.state.crudAction() === FoundationActionEnum.PRINT;
    }
    public setAutoPrintArea(element: HTMLElement | null): void {
        this.autoPrintArea = element;
    }
    /**
     * Used by the dedicated /print/:index route AND the inline Print button on View.
     *
     * `target` is the element to print — every View host template passes its own
     * record wrapper (`#printArea`), so a page showing two <crud-component> hosts, or a
     * custom view with several printable areas, always prints the right one.
     * PrintService also accepts an id or a CSS selector if a caller prefers that.
     *
     * Everything else (web iframe vs. native live document, RTL, theme, styles)
     * is PrintService's job — see `libs/src/print/service.ts`.
     */
    public async printRecord(target: string | HTMLElement): Promise<void> {
        const result = await this.root.print.element(target, {
            title: this.root.i18n.translate(this.getViewTitle()),
        });

        // `busy` is a second click while the dialog is still open — nothing went
        // wrong, so it stays silent.
        if (!result.ok && !result.busy) {
            // PrintService already logged the cause; this is the user-facing half.
            this.root.notify.error(
                result.error ?? this.root.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND'),
            );
        }
    }
    public async initPrintActionFromUrl(
        value: string | number | null = this.action.getCrudActionRecordIndex(),
    ): Promise<void> {
        if (!this.action.ensureActionPermitted(this.root.state.action.hasPrint())) {
            await this.closeViewAction();
            return;
        }

        if (value === null) {
            this.root.notify.error(this.root.i18n.translate('GL.CRUD.RECORD_ACTION.KEY_MISSING'));
            await this.closeViewAction();
            return;
        }

        this.root.state.view.setViewRecord(null);
        this.root.state.view.setViewRecordProcessing(true);

        try {
            // same PAGE-mode reasoning as initViewActionFromUrl above -
            // /print/:index is always a direct url load, so the fetch inside
            // the guard is the only record it gets, and there is no listing row
            // to pass as a fast path
            const record = await this.action.loadRecordForUrlAction(
                value,
                this.root.state.view.viewFieldObj(),
                () => this.isPrintActionActive(),
                () => this.closeViewAction(),
            );

            if (!record) {
                return;
            }

            this.root.state.view.setViewRecord(record);
            this.root.state.setActionListingRecord(record);

            // Wait for the page host to actually render the loaded record before
            // printing — a setTimeout(0) macrotask is not guaranteed to run after
            // Angular has flushed this DOM update, afterNextRender() is. The host
            // registers its record wrapper in the same phase, hence the null check.
            afterNextRender(() => {
                if (!this.isPrintActionActive()) {
                    return;
                }

                if (!this.autoPrintArea) {
                    // The host renders before the record resolves, so this should be
                    // set by now — logged rather than ignored, since the symptom is
                    // simply nothing happening on the /print/:index route.
                    this.root.log.error('[PRINT RECORD FAILED]', 'No View host registered a print area.');
                    return;
                }

                void this.printRecord(this.autoPrintArea);
            }, { injector: this.root.getComponentInjector() });
        } catch (error: unknown) {
            /** ⚠ POST-LOAD ONLY now - see initViewActionFromUrl's catch. */
            this.root.log.error('[PRINT RECORD LOAD FAILED]', error);
            const message = error instanceof BfwApiSdkError
                ? error.errors()[0] ?? this.action.getRecordNotFoundMessage(value)
                : error instanceof Error
                    ? error.message
                    : this.action.getRecordNotFoundMessage(value);

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
