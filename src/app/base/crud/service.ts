// file: src/app/base/crud/service.ts
import { effect, inject, Injector, Service, signal, Type, untracked } from "@angular/core";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { BreakpointObserverService } from "@libs/breakpoint/service";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignatureService } from "@libs/signature/service";
import { PrivateAreaLayoutService } from "@area/private/service";
import { BreadcrumbService } from "xng-breadcrumb";
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { FOUNDATION_ALL_VALUE } from "@libs/foundation/const";
import { CrudFieldSlotPortalKeyPrefixEnum, CrudFieldUiTypeEnum, CrudListingAdditionalColumnsEnum, CrudDataLoadTypeEnum, CrudActionUiLayoutEnum, CrudEndSideBarTabEnum } from "@base/crud/enum";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { AppPaginationEvent } from "@base/pagination/type";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { CrudUrl } from "@base/crud/url";
import { CrudRoute } from "@base/crud/route";
import { CrudUtility } from "@base/crud/utility";
import { CrudValidation } from "@base/crud/validation";
import { NotifyService } from "@base/notify/service";
import { CrudFieldFlagLabelType, CrudFieldSwitchOptionType, CrudFindInputType, CrudStateListingFieldObjType, CrudStateListOperationFieldObjType, CrudStateMutationFieldObjType, CrudStateSearchFilterFieldObjType, CrudStateViewOptionFieldObjType } from "@base/crud/type";
import { NotifyBannerService } from "@base/notify-banner/service";
import { form } from "@angular/forms/signals";
import { DateTimeService } from "@libs/date-time/service";
import { MatBottomSheet, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { CrudDefaultMutationBottomSheetComponent } from "@base/crud/default/mutation/bottom-sheet/component";
import {MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CrudDefaultMutationDialogComponent } from "@base/crud/default/mutation/dialog/component";
import { CrudDefaultMutationFormComponent } from "@base/crud/default/mutation/form/component";
import { CrudDefaultMutationPageComponent } from "@base/crud/default/mutation/page/component";
import { I18nService } from "@base/internationalization/service";
import { CRUD_I18N_KEY } from "@base/crud/const";
import { CrudState } from "@base/crud/state";
import { BfwApiSdkError } from "@bfw/api-sdk/core";

@Service({ autoProvided: false })
export class CrudService {
    // ████████████████████████████████████████████████████████████████████
    // ███ RAW VARIABLES ██████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public readonly ALL_VALUE = FOUNDATION_ALL_VALUE;

    public readonly PrivateAreaLayoutSlotEnum = PrivateAreaLayoutSlotEnum;
    public readonly CrudFieldUiTypeEnum = CrudFieldUiTypeEnum;
    public readonly CrudFieldSlotPortalKeyPrefixEnum = CrudFieldSlotPortalKeyPrefixEnum;
    public readonly CrudListingAdditionalColumnsEnum = CrudListingAdditionalColumnsEnum;
    public readonly CrudActionUiLayoutEnum = CrudActionUiLayoutEnum;
    public readonly CrudEndSideBarTabEnum = CrudEndSideBarTabEnum;
    public readonly CrudActionEnum = FoundationActionEnum;

    // ████████████████████████████████████████████████████████████████████
    // ███ DEPENDENCIES ███████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private componentInjector: Injector | null = null;

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);

    public readonly api = inject(BfwApiService);

    public readonly notify = inject(NotifyService);
    public readonly notifyBanner = inject(NotifyBannerService);
    public readonly sign = inject(SignatureService);
    public readonly bos = inject(BreakpointObserverService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly breadcrumb = inject(BreadcrumbService);
    public readonly datetime = inject(DateTimeService);

    public readonly paLayout = inject(PrivateAreaLayoutService) ?? null;
    public readonly mutationDialog = inject(MatDialog);
    public readonly mutationBottomSheet = inject(MatBottomSheet);
    
    private activeMutationDialogRef: MatDialogRef<CrudDefaultMutationDialogComponent> | null = null;
    private activeMutationBottomSheetRef: MatBottomSheetRef<CrudDefaultMutationBottomSheetComponent> | null = null;
    
    public readonly state = inject(CrudState);
    public readonly utility = inject(CrudUtility);
    public readonly validation = inject(CrudValidation);
    public readonly url = inject(CrudUrl);
    public readonly route = inject(CrudRoute);

    // ████████████████████████████████████████████████████████████████████
    // ███ API ACCESS █████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private find!: (input: CrudFindInputType, type: CrudDataLoadTypeEnum) => Promise<boolean>;

    // ████████████████████████████████████████████████████████████████████
    // ███ GENERAL ████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████

    constructor() {
        // load the crud translations first, before anything below can render a label.
        // constructor, not CrudComponent.ngOnInit - see I18nService.useModule() for why
        this.initI18n();

        /**
         * Mutation overlay follows the action, which follows the route.
         * This is the UI half of the deleted initCrudActionFromUrl(); the
         * state half (setCrudAction / setCrudActionRecordSecondaryKey) is now
         * the linkedSignal's job. Branch order is unchanged from that method.
         *
         * Runs at tier 3 (effect flush, after NavigationEnd), which is what
         * makes reading the signal safe here and what guarantees
         * CrudComponent has already called setComponentInjector().
         */
        effect(() => {
            // the one tracked read: re-runs whenever the action VALUE changes,
            // including create -> update, not just active -> inactive
            const action = this.state.crudAction();

            untracked(() => {
                /**
                 * Route left the action URL. Was the
                 * `if (!action) clearCrudActionAndRecordKey()` branch.
                 */
                if (!action) {
                    this.closeMutationOverlay();
                    return;
                }

                if (this.isMutationActionActive()) {
                    this.initMutationActionFromUrl();
                    return;
                }

                /**
                 * Future:
                 * if (this.isImportActionActive()) this.initImportActionFromUrl();
                 * if (this.isExportActionActive()) this.initExportActionFromUrl();
                 */
            });
        });
    }
    public initI18n(): void {
        this.i18n.useModule(CRUD_I18N_KEY);
    }

    /**
     * Set the injector from component.
     *  
     * CrudService is feature-scoped via providers (not app-root singleton).
     * Logic is in service, but actual UI rendering context belongs to component tree/overlay host.
     * So, insted of using app-root singleton from service, we need to use component injector.
     * Here we can do same in service like
     * - private readonly injector = inject(Injector);
     * but component-driven injection is better, this keeps service less tightly coupled to DI container acquisition, while still allowing dynamic component resolution. 
     */
    public setComponentInjector(injector: Injector): void {
        this.componentInjector = injector;
    }
    public getComponentInjector(): Injector {
        if (!this.componentInjector) {
            throw new Error('CrudService: [componentInjector] is not set.');
        }
        return this.componentInjector;
    }
    public getListingFieldSlotPortalKey(key: string): string {
        return `${this.CrudFieldSlotPortalKeyPrefixEnum.LISTING}${key}`;
    }
    public getMutationFieldSlotPortalKey(key: string): string {
        return `${this.CrudFieldSlotPortalKeyPrefixEnum.MUTATION}${key}`;
    }
    public getFilterFieldSlotPortalKey(key: string): string {
        return `${this.CrudFieldSlotPortalKeyPrefixEnum.FILTER}${key}`;
    }
    public addEndSideBarOnCloseCallBack(): void {
        if(!this.paLayout) return;
        /**
         * perform required actions when end-side-bar close by registering callback
         * list all call back process this could be as per crud action wise or common
         */
        this.paLayout.state.addEndSideBarOnCloseCallback('on_mutation_close', () => {
            if(this.state.crudAction() !== null)
                this.closeMutationAction();
        });
        
        // add more call back
    }
    

    // ████████████████████████████████████████████████████████████████████
    // ███ CRUD ACTION ████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public isCrudActionActive(): boolean {
        return this.state.crudAction() !== null;
    }
    public getCrudActionRecordPrimaryKeyValue(): string | number | null {
        const keys = this.state.crudActionRecordPrimaryKey();

        if (Array.isArray(keys)) {
            return keys[0] ?? null;
        }

        return keys ?? null;
    }
    public getCrudActionRecordSecondaryKeyValue(): string | number | null {
        const keys = this.state.crudActionRecordSecondaryKey();

        if (Array.isArray(keys)) {
            return keys[0] ?? null;
        }

        return keys ?? null;
    }
    public shouldShowCrudListingLayout(): boolean {
        /**
         * Normal route:
         * /country
         * /country;cp=1
         */
        if (!this.isCrudActionActive()) {
            return true;
        }

        /**
         * Mutation action:
         * /country/add
         * /country/update/:id
         *
         * Overlay modes keep listing visible.
         * Page mode hides listing.
         */
        if (this.isMutationActionActive()) {
            return this.state.mutationActionUiLayout() !== CrudActionUiLayoutEnum.PAGE;
        }

        /**
         * Default future behavior:
         * import/export/insights can start as full-page actions.
         */
        return false;
    }
    
    public shouldLoadListingForCurrentRoute(): boolean {
        const action = this.route.readCrudActionFromRoute();

        /**
         * Normal listing route:
         * /country
         * /country;cp=1
         */
        if (!action) {
            return true;
        }

        /**
         * Mutation action route:
         * /country/create
         * /country/update/:id
         * but do not load if layout is page
         */
        if (this.isMutationAction(action)) {
            return this.state.mutationActionUiLayout() !== CrudActionUiLayoutEnum.PAGE;
        }

        /**
         * Future actions like import/export/etc.
         * Default: do not load listing unless explicitly allowed later.
         */
        return false;
    }
    public shouldSkipListingLoadForActiveCrudAction(): boolean {
        const action = this.state.crudAction();

        if (!action) {
            return false;
        }

        /**
         * Page actions own the whole screen. Overlay actions keep the already
         * mounted listing visible. Neither should trigger a background listing
         * request while the action is active. closeMutationForm() clears the
         * action first, then refreshes the listing once.
         */
        return true;
    }
    /**
     * Clears the action plus BOTH record key readings in one call — the live
     * secondary one and the parked primary one.
     */
    public clearCrudActionAndRecordKey(): void {
        // the overlay effect in the constructor owns closing the UI now
        this.state.clearCrudActionAndRecordKey();
    }
    public async closeCrudAction(refersh: boolean = true): Promise<void> {
        await this.url.navigateAwayFromCrudAction();
        this.clearCrudActionAndRecordKey();

        // as action if performed and listing needs to be refreshed as there might be some changes with data
        if(refersh){
            await this.loadListing();
        }   
    }

    /**
     * CRUD ACTION MUTATION 
     */
    public initMutationActionFromUrl(): void {
        if (this.state.mutationActionUiLayout() === CrudActionUiLayoutEnum.PAGE) {
            return;
        }

        /**
         * Defer so <app-crud-default-mutation-component> can render first.
         * Required for END_SIDE_BAR portal registration.
         */
        setTimeout(() => {
            this.openMutationOverlay();
        });
    }
    public isMutationActionActive(): boolean {
        const action = this.state.crudAction();
        return action === FoundationActionEnum.CREATE || action === FoundationActionEnum.UPDATE;
    }
    public isMutationCreate(): boolean {
        // helper
        return this.state.crudAction() === FoundationActionEnum.CREATE;
    }
    public isMutationUpdate(): boolean {
        // helper
        return this.state.crudAction() === FoundationActionEnum.UPDATE;
    }
    private isMutationAction(action: FoundationActionEnum | null): boolean {
        return action === FoundationActionEnum.CREATE || action === FoundationActionEnum.UPDATE;
    }
    public getMutationIcon(): string {
        return this.isMutationUpdate()
            ? `edit_document`
            : `add_circle`
    }
    /**
     * Returns an i18n KEY, not a label. Every caller pipes it through
     * `| transloco`, the same contract as the field `label` keys — that is what
     * keeps the title re-rendering on a language switch instead of freezing on
     * whatever language was active when the overlay opened.
     *
     * Create resolves to GL.COMMON.ADD_NEW ("Add New"), not GL.ACTION.CREATE
     * ("Add"): this heads the form itself, where the longer phrasing reads
     * better. GL.ACTION.CREATE stays the label for the action — the button that
     * opens this form and the create-route breadcrumb.
     */
    public getMutationTitle(): string {
        return this.isMutationUpdate()
            ? 'GL.ACTION.UPDATE'
            : 'GL.COMMON.ADD_NEW';
    }
    public getMutationFormComponent(): Type<any> {
        return this.state.mutationFormCustomComponent() ?? CrudDefaultMutationFormComponent;
    }
    public getMutationPageComponent(): Type<any> {
        return this.state.mutationPageCustomComponent() ?? CrudDefaultMutationPageComponent;
    }
    public toggleMutationEndDrawer(callback?: () => void): void {
        this.state.setMutationEndDrawerIsOpen(!this.state.mutationEndDrawerIsOpen());
        
        if(callback)
            callback();
    }
    public resolveMutationActionUiLayout(): void {
        // TODO: i need to set some logic here for colspan related things which is pending
        // after need to develop something like how src/app/base/crud/default/mutation/form can be take over by child
        // but remain things stay as it is with bottom sheet, dialoug and end side bar wrapper
        // in short Child takeover is pending

        const fields = this.state.mutationFieldObj();
        const fieldCount = Object.keys(fields).length;
        const first = fields[Object.keys(fields)[0]];

        // this is not realiable logic this just for trial need to redefine it, rely on manual setting in child module
        if((first?.colspan ?? 1) > 1 && this.bos.isLgAndUp()) {
            this.state.setMutationActionUiLayout(CrudActionUiLayoutEnum.DIALOG);
        } else if(this.bos.isMdAndDown() || fieldCount < 4) {
            this.state.setMutationActionUiLayout(CrudActionUiLayoutEnum.BOTTOM_SHEET);
        } else if(fieldCount > 4 && fieldCount < 12) {
            this.state.setMutationActionUiLayout(CrudActionUiLayoutEnum.END_SIDE_BAR);
        } else {
            this.state.setMutationActionUiLayout(CrudActionUiLayoutEnum.DIALOG);
        }
    }
    private openMutationOverlay(): void {
        const layout = this.state.mutationActionUiLayout();

        if (layout === CrudActionUiLayoutEnum.DIALOG) {
            if (this.activeMutationDialogRef) {
                return;
            }

            this.activeMutationDialogRef = this.mutationDialog.open(
                CrudDefaultMutationDialogComponent,
                {
                    panelClass: ['bfw-safe-area-p'],
                    injector: this.getComponentInjector(),
                    disableClose: true,
                },
            );

            this.activeMutationDialogRef.afterClosed().subscribe(() => {
                this.activeMutationDialogRef = null;
            });

            return;
        }
        else if (layout === CrudActionUiLayoutEnum.BOTTOM_SHEET) {
            if (this.activeMutationBottomSheetRef) {
                return;
            }

            this.activeMutationBottomSheetRef = this.mutationBottomSheet.open(
                CrudDefaultMutationBottomSheetComponent,
                {
                    injector: this.getComponentInjector(),
                    disableClose: true,
                },
            );

            this.activeMutationBottomSheetRef.afterDismissed().subscribe(() => {
                this.activeMutationBottomSheetRef = null;
            });

            return;
        }
        else if (layout === CrudActionUiLayoutEnum.END_DRAWER) {
            this.state.setMutationEndDrawerIsOpen(true);
            return;
        }
        else if (layout === CrudActionUiLayoutEnum.END_SIDE_BAR) {
            if(!this.paLayout) return;

            this.paLayout.state.setEndSideBarIsOpen(true);

            queueMicrotask(() => {
                this.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.MUTATION);
            });
            return;
        }
    }
    private closeMutationOverlay(): void {
        if (this.activeMutationDialogRef) {
            this.activeMutationDialogRef.close();
            this.activeMutationDialogRef = null;
        }
        else if (this.activeMutationBottomSheetRef) {
            this.activeMutationBottomSheetRef.dismiss();
            this.activeMutationBottomSheetRef = null;
        }
        else if(this.state.mutationActionUiLayout() === CrudActionUiLayoutEnum.END_DRAWER) {
            this.state.setMutationEndDrawerIsOpen(false);
        }
        else if (this.state.mutationActionUiLayout() === CrudActionUiLayoutEnum.END_SIDE_BAR) {
            if(this.paLayout){
                this.paLayout.state.setEndSideBarIsOpen(false);
            }
        }
    }
    public async closeMutationAction(): Promise<void> {
        await this.closeCrudAction();
    }
    public addEndDrawerOnCloseCallBack(): void {
        /**
         * perform required actions when end-side-bar close by registering callback
         * list all call back process this could be as per crud action wise or common
         */
        this.state.addMutationEndDrawerOnCloseCallback('on_mutation_close', () => {
            if(this.state.crudAction() !== null)
                this.closeMutationAction();
        });
        
        // add more call back
    }
    
    /**
     * CRUD ACTION SEARCH FILTER
     */
    public openSearchFilterForm(): void {
        if(this.paLayout) {
            this.paLayout.toogleEndSideBarAndSwitchTab(CrudEndSideBarTabEnum.FILTER)
        }
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ CHILD CONFIGURATION ████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * This methos needs to be called in child component with ngOnInit or similar. 
     * It is similar to ngOnInit after setting all states like primary key, unique key, listing fields, mutation fields etc. 
     * Because this method will prepare search filter fields state based on default view option fields.
     * Also apply breadcrumb if breadcrumb alias is set in route data. 
     */
    public defaultInit(): void {
        // register end-side-bar close callback
        this.addEndSideBarOnCloseCallBack();
        this.addEndDrawerOnCloseCallBack();
    }
    public setFieldObj(
        listing: CrudStateListingFieldObjType,
        searchFilter: CrudStateSearchFilterFieldObjType,
        mutation: CrudStateMutationFieldObjType,
        listOperation?: CrudStateListOperationFieldObjType,
        viewOption?: CrudStateViewOptionFieldObjType,
    ): void {
        // set field object
        this.state.setListingFieldObj(listing);
        this.state.setSearchFilterFieldObj(searchFilter);
        this.state.setMutationFieldObj(mutation);

        if(listOperation){
            // use complete new field object
            // no need to process for options and default values as its already included
            this.state.setListOperationFieldObj(listOperation);
        } else {
            // use default field object
            this.state.setListOperationFieldObj(this.state.DEFAULT_LIST_OPERATION_FIELD_OBJ);
            this.state.initListOperationFieldObj(); // process for options and default values
        }

        if(viewOption) {
            // use complete new field object
            // no need to process for options and default values as its already included
            this.state.setViewOptionFieldObj(viewOption);
        } else {
            // use default field object
            this.state.setViewOptionFieldObj(this.state.DEFAULT_VIEW_OPTION_FIELD_OBJ);
            this.state.initViewOptionFieldObj(); // process for options and default values
        }

        // resolve mutation form wrapper automatically, must keep this call here as it need MutationFieldObj
        this.resolveMutationActionUiLayout();
    }
    /**
     * DATA LOAD FROM API 
     * sync from child component
     */
    public registerFind(find: (input: CrudFindInputType, type: CrudDataLoadTypeEnum) => Promise<boolean>): void {
        this.find = find;
    }
    public registerCreate() {

    }
    public registerUpdate() {
        
    }
    public registerSoftDelete() {
        
    }
    public registerDelete() {
        
    }
    public registerRestore() {
        
    }
    public registerActive() {
        
    }
    
    
    

    // ████████████████████████████████████████████████████████████████████
    // ███ DATA LOAD ██████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public prepareFindInput(input: Partial<CrudFindInputType> = {}): CrudFindInputType {
        const sfIn = input.SEARCH_FILTER_INPUT ?? {};
        const voIn = input.VIEW_OPTION_INPUT ?? {};
        const loIn = input.LIST_OPERATION_INPUT ?? {};
        let skip = input.SKIP ?? 0;

        // TODO we have issue here rows_per_page = 5 when new load
        // it's not taking value from url
        
        // normalize current page and rows per page
        loIn.current_page = Number(loIn.current_page ?? this.state.getCurrentPageValue());
        loIn.rows_per_page = Number(loIn.rows_per_page ?? this.state.getRowsPerPageValue());
        
        // get rows per page options
        const rowsPerPageOptions = this.state.getRowsPerPageOption();

        // check valid current page
        if (!Number.isInteger(loIn.current_page) || loIn.current_page <= 0) {
            loIn.current_page = 1;
        }

        // check valid rows per page
        if (
            !Number.isInteger(loIn.rows_per_page) ||
            loIn.rows_per_page <= 0 ||
            !rowsPerPageOptions.includes(loIn.rows_per_page)
        ) {
            loIn.rows_per_page = this.state.getRowsPerPageDefault();
        }

        skip = this.state.getPageSkipIndex(loIn.current_page, loIn.rows_per_page);

        // keep selected rows in the same normalized input lifecycle.
        // if not provided explicitly, use current state selection.
        loIn.listing_selected_rows = loIn.listing_selected_rows
            ?? this.state.getListingSelectedRowsValue();

        // club all together as object with all validation process
        const out: CrudFindInputType = {
            SEARCH_FILTER_INPUT: sfIn,
            VIEW_OPTION_INPUT: voIn,
            LIST_OPERATION_INPUT: loIn,
            SKIP: skip,
        };

        return out;
    }
    public async loadListing(input: Partial<CrudFindInputType> = {}, type: CrudDataLoadTypeEnum = CrudDataLoadTypeEnum.ACTION): Promise<boolean> {
        // If action is active, skip normal/action reloads.
        // But allow INITIAL load so direct overlay mutation URLs can load background listing.
        if (
            type !== CrudDataLoadTypeEnum.INITIAL &&
            this.shouldSkipListingLoadForActiveCrudAction()
        ) {
            return false;
        }

        const findInput = this.prepareFindInput(input);

        this.gpbs.start();
        this.gpbs.stream = 20;

        try {
            // keep the 
            // main call to load data
            const resp = await this.find(findInput, type);
            this.gpbs.stream = 60;

            if(resp === true) {
                // apply quick search after data loaded, useful for direct URL load: ;qs=...
                if (this.state.getQuickSearchValue()) {
                    this.applyQuickSearch();
                }
                this.gpbs.stream = 80;

                this.gpbs.processing
                
                // ████ URL SYNC AFTER CHANGE █████████████████████████████
                this.url.syncUrlStateFromCrudState();
                
                this.gpbs.stream = 100;
                this.gpbs.stop();

                return true;
            }
            throw new Error(this.i18n.translate('GL.COMMON.DATA_LOADING_FAILED'));
        } catch (e: any | BfwApiSdkError) {
            // if any error then need yo switch to previous state data
            // like page number, per page rcord number etc

            // also need to develop fixed message place in main layour 
            // need to develop new module name like notify
            // module-notify
            
            this.log.error(`[FIND FAILED]`, e);
            const em: string = e.errors()[0];
            this.notify.error(em);

            this.gpbs.stream = 100;
            this.gpbs.stop();
            return false;
        }
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ LISTING OPERATION ██████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * RECORD SELECTION
     *
     * ⚠ DELIBERATELY KEY-FREE — reviewed as part of the primary -> secondary
     * key switch and left alone.
     *
     * SelectionModel holds row OBJECTS and compares them by reference. No key
     * of either kind is read here, so nothing in this block had to change and
     * nothing here can leak a primary key.
     *
     * The one place selection identity is serialised is the `lsr` matrix param,
     * and lsr's normalize_val already does the whole conversion: rows -> keys on
     * the way out, keys -> the CURRENT row objects on the way back in. That
     * re-match is what makes reference equality survive a refetch, where the
     * row objects are new instances.
     *
     * So: do not "fix" this to compare by key. Doing so duplicates identity
     * logic that lsr already owns, and the two copies drift the first time the
     * addressing key changes again.
     */
    public isRecordSelected(row: any): boolean {
        return this.state.getListingSelectedRowsValue().isSelected(row);
    }
    public isAllRowsSelected(): boolean {
        const numRows = this.state.listingDataSource().data.length;
        const selectedRowsCount = this.state.listingDataSource().data.filter((row) => this.state.getListingSelectedRowsValue().isSelected(row)).length;
        return numRows > 0 && selectedRowsCount === numRows;
    }
    public isPartiallyRowsSelected(): boolean {
        const numRows = this.state.listingDataSource().data.length;
        const selectedRowsCount = this.state.listingDataSource().data.filter((row) => this.state.getListingSelectedRowsValue().isSelected(row)).length;
        return selectedRowsCount > 0 && selectedRowsCount < numRows;
    }
    public toggleAllRows(): void {
        if (this.isAllRowsSelected()) {
            this.state.setListingSelectedRowsValue([]);
            return;
        }

        this.state.setListingSelectedRowsValue([
            ...this.state.listingDataSource().data,
        ]);
    }
    public toggleRowSelection(row: any): void {
        const selectedRows = this.state.getListingSelectedRowsValue().selected;

        const nextSelectedRows = this.state.getListingSelectedRowsValue().isSelected(row)
            ? selectedRows.filter((selectedRow) => selectedRow !== row)
            : [...selectedRows, row];

        this.state.setListingSelectedRowsValue(nextSelectedRows);
    }
    /**
     * PAGINATION
     */
    public async onPageChange(event: AppPaginationEvent): Promise<boolean> {
        
        const findInput: Partial<CrudFindInputType> = {
            LIST_OPERATION_INPUT: {
                current_page: event.pageIndex,
                rows_per_page: event.pageSize,
            },
        }
        
        const loaded = await this.loadListing(findInput, CrudDataLoadTypeEnum.ACTION);
        if (loaded) {
            /**
             * Page/page size change means current record selection is no longer fully visible
             * Clear it so old selected IDs are also removed from URL lsr
             */
            this.state.setListingSelectedRowsValue([]);
        }

        return loaded;
    }
    public getLastPage(totalRecords: number): number {
        const pageSize = Number(this.state.getRowsPerPageValue());

        if (!Number.isFinite(totalRecords) || totalRecords <= 0) {
            return 1;
        }

        if (!Number.isInteger(pageSize) || pageSize <= 0) {
            return 1;
        }

        return Math.max(1, Math.ceil(totalRecords / pageSize));
    }
    public normalizeFindInputAfterFind(
        input: CrudFindInputType,
        totalRecords: number
    ): CrudFindInputType {
        const lObj = input.LIST_OPERATION_INPUT ?? {};
        const currentPage = Number(lObj.current_page ?? 1);
        const lastPage = this.getLastPage(totalRecords);

        if (currentPage <= lastPage) {
            return input;
        }

        return this.prepareFindInput({
            ...input,
            LIST_OPERATION_INPUT: {
                ...lObj,
                current_page: lastPage,
            }
        });
    }
    /**
     * DRAG AND DROP COLUMNS
     */
    public dragAndDropColumn(event: CdkDragDrop<string[]>): void {
        const selectableColumn = CrudListingAdditionalColumnsEnum.RECORD_SELECT;

        const draggableColumns = this.state.getListingColumnPositionValue()
            .filter((column) => column !== selectableColumn);

        moveItemInArray(draggableColumns, event.previousIndex, event.currentIndex);

        this.state.setListingColumnPositionValue([
            selectableColumn,
            ...draggableColumns,
        ]);
    }
    /**
     * QUICK SEARCH 
     */
    public applyQuickSearch(): void {
        const dataSource = this.state.listingDataSource();

        const formattedFields = this.state.formattedListingFields();
        const allFields = formattedFields?.schema ?? {};

        dataSource.filterPredicate = (record: any, filter: string): boolean => {
            const searchTerms = String(filter ?? '').trim().toLowerCase();

            // Empty search => show all records
            if (!searchTerms) return true;

            const keys = Object.keys(allFields);
            for (let i = 0; i < keys.length; i++) {
                const fKey = keys[i];
                const fInfo = allFields[fKey];
                if (!fInfo) continue;

                const rawValue = record?.[fKey];
                const formattedValue = this.validation.formatCrudListingFieldValue(rawValue, fInfo, record);

                const cleanValue = String(formattedValue ?? '')
                    .replace(/<[^>]*>?/gm, '') // strip html if any
                    .toLowerCase();

                if (cleanValue.includes(searchTerms)) {
                    return true; // match found, stop early (same as .some())
                }
            }

            return false; // no fields matched
        };

        dataSource.filter = String(this.state.getQuickSearchValue() ?? '')
            .trim()
            .toLowerCase();
    }
    public async setQuickSearchKeyword(event: Event): Promise<void> {
        const value = (event.target as HTMLInputElement).value;
        
        // 1. Update the local variable
        this.state.setQuickSearchValue(value.trim().toLowerCase());

        // 2. Apply the filter to the MatTableDataSource
        this.applyQuickSearch();
    }
    public async clearQuickSearchKeyword(searchInput: HTMLInputElement): Promise<void> {
        this.state.setQuickSearchValue(null);
        searchInput.value = '';
        
        const dataSource = this.state.listingDataSource();
        if (dataSource) {
            dataSource.filter = '';
        }
    }
    public firstDefaultOption(option: Record<string, any> | null | undefined): { key: any; value: any } | null {
        const first = Object.entries(option ?? {})[0];

        if (!first) return null;

        return {
            key: first[0] === '' ? '' : this.utility.parseKey(first[0]),
            value: first[1],
        };
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ FORM OPERATION █████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████

    public multiSelectOptionValues(finfo: any): any[] {
        if (!finfo?.option) return [];

        if (this.utility.isArray(finfo.option)) {
            return finfo.option;
        }

        return Object.keys(finfo.option).map((key) => this.utility.parseKey(key));
    }
    public multiSelectOptionCount(finfo: any): number {
        return this.multiSelectOptionValues(finfo).length;
    }
    public multiSelectChange(finfo: any, value: any[]): void {
        const options = this.multiSelectOptionValues(finfo);

        const current = finfo.value ?? finfo.default ?? [];
        const currentReal = Array.isArray(current)
            ? current.filter((v) => v !== this.ALL_VALUE)
            : [];

        const incoming = Array.isArray(value) ? value : [];
        const incomingReal = incoming.filter((v) => v !== this.ALL_VALUE);

        const total = options.length;
        const wasAllSelected = total > 0 && currentReal.length === total;
        const hasAllValue = incoming.includes(this.ALL_VALUE);

        /**
         * CASE 1:
         * User clicked "All"
         * Before: not all selected
         * Incoming contains ALL_VALUE
         */
        if (!wasAllSelected && hasAllValue) {
            finfo.value = [...options];
            return;
        }

        /**
         * CASE 2:
         * User clicked "Deselect"
         * Before: all selected
         * Incoming no longer contains ALL_VALUE,
         * but all real options are still there.
         */
        if (wasAllSelected && !hasAllValue && incomingReal.length === total) {
            finfo.value = [];
            return;
        }

        /**
         * CASE 3:
         * User clicked normal option while all was selected.
         * Incoming may still contain ALL_VALUE, so remove it only.
         */
        finfo.value = incomingReal;
    }
    public multiSelectValue(finfo: any): any[] {
        const selected = finfo.value ?? finfo.default ?? [];

        if (!Array.isArray(selected)) return [];

        const total = this.multiSelectOptionCount(finfo);

        if (total > 0 && selected.length === total) {
            return [...selected, this.ALL_VALUE];
        }

        return selected;
    }
    public checkboxChange(finfo: any, value: any, checked: boolean): void {
        const current = finfo.value ?? finfo.default ?? [];

        let next: any[];

        if (checked) {
            next = current.includes(value)
                ? current
                : [...current, value];
        } else {
            next = current.filter((v: any) => v !== value);
        }

        this.multiSelectChange(finfo, next);
    }
    public switchMeta(finfo: any): {
        onValue: string | number | boolean;
        offValue: string | number | boolean;
        onLabel: string;
        offLabel: string;
    } {
        const option = finfo?.option as CrudFieldSwitchOptionType | null | undefined;

        return {
            onValue: option?.on ?? true,
            offValue: option?.off ?? false,
            // i18n KEYS — the switch template pipes them through `| transloco`
            onLabel: 'GL.FIELD.SWITCH.ON',
            offLabel: 'GL.FIELD.SWITCH.OFF',
        };
    }
    public switchChange(finfo: any, checked: boolean): void {
        const meta = this.switchMeta(finfo);

        finfo.value = checked ? meta.onValue : meta.offValue;
    }
    public clear(finfo: any): void {
        finfo.value = null;
        //finfo.default = null;
    }
    /**
     * Reveal state is per field key and intentionally NOT stored on finfo:
     * finfo travels to the URL and the API, a UI-only toggle has no business there.
     */
    private readonly revealedPasswords = new Set<string>();

    public isPasswordRevealed(fkey: string): boolean {
        return this.revealedPasswords.has(fkey);
    }
    public togglePasswordReveal(fkey: string): void {
        if (this.revealedPasswords.has(fkey)) {
            this.revealedPasswords.delete(fkey);
            return;
        }
        this.revealedPasswords.add(fkey);
    }
    public sliderChange(finfo: any, value: number | null): void {
        finfo.value = value ?? null;
    }
    public colorChange(finfo: any, value: string | null): void {
        finfo.value = value && value.length > 0 ? value : null;
    }
    /**
     * Accepts 'f00', '#F00', 'ff0000', '#FF0000' and settles them all on
     * '#ff0000'. null when the text is not a hex color, so callers can tell
     * 'nothing usable' apart from a real value.
     */
    private normalizeColorText(value: unknown): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        const hex = String(value).trim().replace(/^#/, '').toLowerCase();

        if (/^[0-9a-f]{3}$/.test(hex)) {
            return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
        }

        if (/^[0-9a-f]{6}$/.test(hex)) {
            return `#${hex}`;
        }

        return null;
    }
    /**
     * Commits text typed into the color field. Bound to (change), so it runs on
     * blur/Enter rather than per keystroke — angular then never rewrites [value]
     * while the caret is sitting in the input, which is what sends the caret to
     * the end mid-edit.
     *
     * Text that is not a hex color is kept verbatim rather than discarded: the
     * COLOR rule in validation.ts is what decides it is wrong, and url.ts already
     * falls back to fi.default when it does. Once a form schema calls
     * setCrudFormFieldValueAngularValidation(), the same rule lights up the
     * inline mat-error below.
     */
    public colorTextChange(finfo: any, text: string | null): void {
        const raw = (text ?? '').trim();

        if (!raw) {
            finfo.value = null;
            return;
        }

        finfo.value = this.normalizeColorText(raw) ?? raw;
    }
    /**
     * The native swatch accepts nothing but a full '#rrggbb' — anything else and
     * it silently shows black. Since finfo.value may hold text the user is still
     * getting wrong, the swatch reads through here instead of off finfo directly.
     */
    public colorSwatchValue(finfo: any): string {
        return this.normalizeColorText(finfo?.value)
            ?? this.normalizeColorText(finfo?.default)
            ?? '#000000';
    }
    public flagMeta(finfo: any): {
        isSet: boolean;
        labelKey: string | null;   // null = show the datetime itself
        display: string;
    } {
        const raw = finfo?.value ?? finfo?.default ?? null;
        const isSet = raw !== null && raw !== undefined && raw !== '';
        const fl = finfo?.flag_label as CrudFieldFlagLabelType | undefined;

        if (!isSet) {
            return { isSet: false, labelKey: fl?.is_null || 'GL.FIELD.FLAG.NOT_SET', display: '' };
        }

        const key = fl?.is_datetime ?? '';

        return {
            isSet: true,
            // empty is_datetime means: show the actual date time instead of a label
            labelKey: key.length > 0 ? key : null,
            display: this.datetime.dateTimeDisplayValue(finfo),
        };
    }

    public flagChange(finfo: any, checked: boolean): void {
        if (!checked) {
            finfo.value = null;
            return;
        }
        // stamp "now"; the picker lets the user adjust it
        this.datetime.dateTimeChange(finfo, new Date());
    }
    
    // ████████████████████████████████████████████████████████████████████
    // ███ FIND OPERATION █████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    
    /**
     * SUBMIT SEARCH FILTER FORM 
     */
    public async submitSearchFilterForm(): Promise<void> {

    }


    // ████████████████████████████████████████████████████████████████████
    // ███ MUTATION OPERATION █████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * SUBMIT MUTATION FORM
     */
    public async submitMutationForm(): Promise<void> {

    }
}
