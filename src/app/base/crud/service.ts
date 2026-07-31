// file: ./src/app/base/crud/service.ts
import { inject, Injector, Service, signal, Type } from "@angular/core";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { BreakpointObserverService } from "@libs/breakpoint/service";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignatureService } from "@libs/signature/service";
import { PrivateAreaLayoutService } from "@area/private/service";
import { BreadcrumbService } from "xng-breadcrumb";
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { CrudFieldSlotPortalKeyPrefixEnum, CrudFieldUiTypeEnum, CrudListingAdditionalColumnsEnum, CrudDataLoadTypeEnum, CrudActionUiLayoutEnum, CrudEndSideBarTabEnum, CrudActionEnum } from "@base/crud/enum";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { AppPaginationEvent } from "@base/pagination/type";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { CrudUrl } from "@base/crud/url";
import { CrudUtility } from "@base/crud/utility";
import { CrudValidation } from "@base/crud/validation";
import { NotifyService } from "@base/notify/service";
import { CrudFieldSwitchOptionType, CrudFindInputType, CrudStateListingFieldObjType, CrudStateMutationFieldObjType, CrudStateSearchFilterFieldObjType } from "@base/crud/type";
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
    public readonly ALL_VALUE = '__ALL__';

    public readonly localText = {
        listing: {
            select_all: 'Select all',
            select_record: 'Select record',
            loading: 'Loading...',
            no_data: 'No data found.',
        },
        module_action: {

        },
        pagination: {

        },
        quick_search: {
            label: 'Quick search',
            placeholder: "Type to search" ,
            clear_search: 'Clear search',
            open_quick_search: "Open quick search",
        },
        record_action: {

        },
        search_filter: {
            open_label: 'Open search filter',
            tab_name: 'Filter',
            
        },
        selected_record_action: {
            label: 'Bulk action',    
        },
        mutation_action: {
            create: 'Add New',
            update: 'Update',
            quick_update: 'Quick Update',
        }

    };

    public readonly PrivateAreaLayoutSlotEnum = PrivateAreaLayoutSlotEnum;
    public readonly CrudFieldUiTypeEnum = CrudFieldUiTypeEnum;
    public readonly CrudFieldSlotPortalKeyPrefixEnum = CrudFieldSlotPortalKeyPrefixEnum;
    public readonly CrudListingAdditionalColumnsEnum = CrudListingAdditionalColumnsEnum;
    public readonly CrudActionUiLayoutEnum = CrudActionUiLayoutEnum;
    public readonly CrudEndSideBarTabEnum = CrudEndSideBarTabEnum;
    public readonly CrudActionEnum = CrudActionEnum;

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

    // ████████████████████████████████████████████████████████████████████
    // ███ API SYNC ███████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private find!: (input: CrudFindInputType, type: CrudDataLoadTypeEnum) => Promise<boolean>;

    // ████████████████████████████████████████████████████████████████████
    // ███ SIGNAL FORM ████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private readonly formModel = signal<any>({
        
    });

    public readonly form = form(this.formModel, (sp) => {
        
    });

    // ████████████████████████████████████████████████████████████████████
    // ███ GENERAL ████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████

    constructor() {
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
        this.paLayout.state.addEndSideBarOnClose('on_mutation_close', () => {
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
    public getCrudActionRecordId(): string | number | null {
        const ids = this.state.crudActionRecordId();

        if (Array.isArray(ids)) {
            return ids[0] ?? null;
        }

        return ids ?? null;
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
        const action = this.url.getCrudActionFromRoute();

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
        const action = this.state.crudAction() ?? this.url.getCrudActionFromRoute();

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
    public initCrudActionFromUrl(): void {
        const action = this.url.getCrudActionFromRoute();

        if (!action) {
            this.clearCrudActionAndRecordId();
            return;
        }

        this.state.setCrudAction(action);
        this.state.setCrudActionRecordId(this.url.getCrudActionRecordIdFromRoute());

        if (this.isMutationActionActive()) {
            this.initMutationActionFromUrl();
            return;
        }

        /**
         * Future:
         * if (this.isImportActionActive()) this.initImportActionFromUrl();
         * if (this.isExportActionActive()) this.initExportActionFromUrl();
         */
    }
    
    public clearCrudActionAndRecordId(): void {
        this.state.clearCrudActionAndRecordId();

        // as we clear action from state we must have to clear any ui overlay to match state and ui
        this.closeMutationOverlay();
    }
    public async closeCrudAction(refersh: boolean = true): Promise<void> {
        await this.url.navigateAwayFromCrudAction();
        this.clearCrudActionAndRecordId();

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
        return action === CrudActionEnum.CREATE || action === CrudActionEnum.UPDATE;
    }
    public isMutationCreate(): boolean {
        // helper
        return this.state.crudAction() === CrudActionEnum.CREATE;
    }
    public isMutationUpdate(): boolean {
        // helper
        return this.state.crudAction() === CrudActionEnum.UPDATE;
    }
    private isMutationAction(action: CrudActionEnum | null): boolean {
        return action === CrudActionEnum.CREATE || action === CrudActionEnum.UPDATE;
    }
    public getMutationIcon(): string {
        return this.isMutationUpdate()
            ? `edit_document`
            : `add_circle`
    }
    public getMutationTitle(): string {
        return this.isMutationUpdate()
            ? this.localText.mutation_action.update
            : this.localText.mutation_action.create;
    }
    public getMutationFormComponent(): Type<any> {
        return this.state.mutationFormCustomComponent() ?? CrudDefaultMutationFormComponent;
    }
    public getMutationPageComponent(): Type<any> {
        return this.state.mutationPageCustomComponent() ?? CrudDefaultMutationPageComponent;
    }
    public toggleMutationEndDrawer(callback?: () => void): void {
        this.state.setMutationEndDrawerOpen(!this.state.mutationEndDrawerOpen());
        
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
            this.state.setMutationEndDrawerOpen(true);
            return;
        }
        else if (layout === CrudActionUiLayoutEnum.END_SIDE_BAR) {
            if(!this.paLayout) return;

            this.paLayout.state.setEndSideBarOpen(true);

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
            this.state.setMutationEndDrawerOpen(false);
        }
        else if (this.state.mutationActionUiLayout() === CrudActionUiLayoutEnum.END_SIDE_BAR) {
            if(this.paLayout){
                this.paLayout.state.setEndSideBarOpen(false);
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
        this.state.addMutationEndDrawerOnClose('on_mutation_close', () => {
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
     * Because this method will prepare search filter fields state based on default view option fields and also apply breadcrumb if breadcrumb alias is set in route data. 
     */
    public init(): void {
        // register end-side-bar close callback
        this.addEndSideBarOnCloseCallBack();
        this.addEndDrawerOnCloseCallBack();

        this.url.initUrlSync();

        this.url.enableUrlSync(true);
    }
    public setFieldObj(
        listing: CrudStateListingFieldObjType,
        search: CrudStateSearchFilterFieldObjType,
        mutation: CrudStateMutationFieldObjType,
    ): void {
        // set field object
        this.state.setListingFieldObj(listing);
        this.state.setSearchFilterFieldObj(search);
        this.state.setMutationFieldObj(mutation);

        // process some default field object with options and default values
        this.state.initListOperationFieldObj();
        this.state.initViewOptionFieldObj();

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
            throw new Error('Data loading failed.');
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
            onLabel: 'On',
            offLabel: 'Off',
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
