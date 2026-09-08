// file: src/app/base/crud/service.ts
import { afterNextRender, effect, inject, Injector, Service, Type, untracked } from "@angular/core";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { BreakpointObserverService } from "@libs/breakpoint/service";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignatureService } from "@libs/signature/service";
import { PrivateAreaLayoutService } from "@area/private/service";
import { BreadcrumbService } from "xng-breadcrumb";
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { CrudFieldSlotPortalKeyPrefixEnum, CrudFieldUiTypeEnum, CrudListingAdditionalColumnsEnum, CrudDataLoadTypeEnum, CrudActionUiLayoutEnum, CrudEndSideBarTabEnum, CrudFieldNormalizeModeEnum } from "@base/crud/enum";
import { UiSizeEnum } from "@libs/breakpoint/enum";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { AppPaginationEvent } from "@base/pagination/type";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { CrudUrl } from "@base/crud/url";
import { CrudRoute } from "@base/crud/route";
import { CrudUtility } from "@base/crud/utility";
import { CrudValidation } from "@base/crud/validation";
import { NotifyService } from "@base/notify/service";
import {
    CrudActiveHandlerType,
    CrudCreateHandlerType,
    CrudDeleteHandlerType,
    CrudFieldObj,
    CrudFindByKeyHandlerType,
    CrudFindHandlerType,
    CrudFindInputType,
    CrudFormFieldInfoType,
    CrudInactiveHandlerType,
    CrudMutationFieldErrorType,
    CrudMutationInputType,
    CrudMutationFormInputOptionsType,
    CrudMutationResultType,
    CrudRecordKeyInputType,
    CrudRecordKeyType,
    CrudRecordType,
    CrudRestoreHandlerType,
    CrudSoftDeleteHandlerType,
    CrudStateListingFieldObjType,
    CrudStateListOperationFieldObjType,
    CrudStateMutationFieldObjType,
    CrudStateRecordFieldObjType,
    CrudStateSearchFilterFieldObjType,
    CrudStateFormFieldObjType,
    CrudStateViewOptionFieldObjType,
    CrudStateViewFieldObjType,
    CrudSearchFilterInputType,
    CrudViewOptionInputType,
    CrudUpdateHandlerType,
    CrudRecordActionType,
    CrudFieldInfoType,
} from "@base/crud/type";
import { NotifyBannerService } from "@base/notify-banner/service";
import { submit } from "@angular/forms/signals";
import { DateTimeService } from "@libs/date-time/service";
import { MatBottomSheet, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { CrudDefaultMutationBottomSheetComponent } from "@base/crud/default/mutation/bottom-sheet/component";
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CrudDefaultMutationDialogComponent } from "@base/crud/default/mutation/dialog/component";
import { CrudDefaultMutationFormComponent } from "@base/crud/default/mutation/form/component";
import { CrudDefaultMutationPageComponent } from "@base/crud/default/mutation/page/component";
import { CrudDefaultViewBottomSheetComponent } from "@base/crud/default/view/bottom-sheet/component";
import { CrudDefaultViewDialogComponent } from "@base/crud/default/view/dialog/component";
import { CrudDefaultViewPageComponent } from "@base/crud/default/view/page/component";
import { CrudDefaultViewRecordComponent } from "@base/crud/default/view/record/component";
import { I18nService } from "@base/internationalization/service";
import { CRUD_I18N_KEY, CRUD_PRINT_SECTION_ID } from "@base/crud/const";
import { UI_WIDTH } from "@libs/breakpoint/const";
import { NgxPrintService, PrintOptions } from "ngx-print";
import { CrudState } from "@base/crud/state/init";
import { BfwApiSdkError } from "@bfw/api-sdk/core";
import { HttpStatusCode } from "@angular/common/http";
import {
    FormFieldDatetimeModeEnum,
    FormFieldDatetimePickerModeEnum,
    FormFieldDatetimeStartViewEnum,
} from "@base/form-fields/datetime/enum";
import { FoundationFieldDefaultNameEnum } from "@libs/foundation/field/enum";
import { ConfirmationDialogService } from "@base/confirmation-dialog/service";
import { ConfirmationDialogDataType } from "@base/confirmation-dialog/type";

@Service({ autoProvided: false })
export class CrudService {
    
    // ████████████████████████████████████████████████████████████████████
    // ███ RAW VARIABLES ██████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public readonly PrivateAreaLayoutSlotEnum = PrivateAreaLayoutSlotEnum;
    public readonly CrudFieldUiTypeEnum = CrudFieldUiTypeEnum;
    public readonly CrudFieldSlotPortalKeyPrefixEnum = CrudFieldSlotPortalKeyPrefixEnum;
    public readonly CrudListingAdditionalColumnsEnum = CrudListingAdditionalColumnsEnum;
    public readonly CrudActionUiLayoutEnum = CrudActionUiLayoutEnum;
    public readonly UiSizeEnum = UiSizeEnum;
    public readonly CRUD_PRINT_SECTION_ID = CRUD_PRINT_SECTION_ID;
    public readonly CrudEndSideBarTabEnum = CrudEndSideBarTabEnum;
    public readonly CrudActionEnum = FoundationActionEnum;
    public readonly FormFieldDatetimeModeEnum = FormFieldDatetimeModeEnum;
    public readonly FormFieldDatetimePickerModeEnum = FormFieldDatetimePickerModeEnum;
    public readonly FormFieldDatetimeStartViewEnum = FormFieldDatetimeStartViewEnum;
    public readonly FoundationFieldDefaultNameEnum = FoundationFieldDefaultNameEnum;

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

    public readonly paLayout = inject(PrivateAreaLayoutService);
    public readonly confirmationDialog = inject(ConfirmationDialogService);
    public readonly mutationDialog = inject(MatDialog);
    public readonly mutationBottomSheet = inject(MatBottomSheet);
    public readonly ngxPrint = inject(NgxPrintService);
    
    private activeMutationDialogRef: MatDialogRef<CrudDefaultMutationDialogComponent> | null = null;
    private activeMutationBottomSheetRef: MatBottomSheetRef<CrudDefaultMutationBottomSheetComponent> | null = null;

    // View has independent overlays so its lifecycle never changes Mutation UI state.
    private activeViewDialogRef: MatDialogRef<CrudDefaultViewDialogComponent> | null = null;
    private activeViewBottomSheetRef: MatBottomSheetRef<CrudDefaultViewBottomSheetComponent> | null = null;
    
    public readonly state = inject(CrudState);
    public readonly utility = inject(CrudUtility);
    public readonly validation = inject(CrudValidation);
    public readonly url = inject(CrudUrl);
    public readonly route = inject(CrudRoute);

    // ████████████████████████████████████████████████████████████████████
    // ███ API ACCESS █████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private findByPrimaryKeyHandler: CrudFindByKeyHandlerType | null = null;
    private findBySecondaryKeyHandler: CrudFindByKeyHandlerType | null = null;
    private findHandler: CrudFindHandlerType | null = null;
    private createHandler: CrudCreateHandlerType | null = null;
    private updateHandler: CrudUpdateHandlerType | null = null;
    private activeHandler: CrudActiveHandlerType | null = null;
    private inactiveHandler: CrudInactiveHandlerType | null = null;
    private softDeleteHandler: CrudSoftDeleteHandlerType | null = null;
    private restoreHandler: CrudRestoreHandlerType | null = null;
    private deleteHandler: CrudDeleteHandlerType | null = null;
    

    // ████████████████████████████████████████████████████████████████████
    // ███ OTHER ██████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public readonly emptyOptionBag: Record<string, any> = Object.freeze({});


    constructor() {
        // load the crud translations first, before anything below can render a label.
        // constructor, not CrudComponent.ngOnInit - see I18nService.useModule() for why
        this.initI18n();

        /**
         * Overlay UI follows the action, which follows the route.
         * This is the UI half of the deleted initCrudActionFromUrl(); the
         * state half (setCrudAction / setCrudActionRecordSecondaryKey) is now
         * the linkedSignal's job. Branch order is unchanged from that method.
         *
         * Runs at tier 3 (effect flush, after NavigationEnd), which is what
         * makes reading the signal safe here and what guarantees
         * CrudComponent has already called setComponentInjector().
         */
        effect(() => {
            const action = this.state.crudAction();
            const recordKey = this.getCrudActionRecordSecondaryKeyValue();

            untracked(() => {
                /**
                 * Route left the action URL. Was the
                 * `if (!action) clearCrudActionAndRecordKey()` branch.
                 */
                if (!action) {
                    this.closeMutationOverlay();
                    this.closeViewOverlay();
                    return;
                }

                if (this.isMutationActionActive()) {
                    this.closeViewOverlay();
                    void this.initMutationActionFromUrl(recordKey);
                    return;
                }

                if (this.isViewActionActive()) {
                    this.closeMutationOverlay();
                    void this.initViewActionFromUrl(recordKey);
                    return;
                }

                if (this.isPrintActionActive()) {
                    this.closeMutationOverlay();
                    this.closeViewOverlay();
                    void this.initPrintActionFromUrl(recordKey);
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
        this.addViewEndDrawerOnCloseCallback();
    }
    public setFieldObj(
        listing: CrudStateListingFieldObjType,
        searchFilter: CrudStateSearchFilterFieldObjType,
        mutation: CrudStateMutationFieldObjType,
        view: CrudStateViewFieldObjType = {},
        listOperation?: CrudStateListOperationFieldObjType,
        viewOption?: CrudStateViewOptionFieldObjType,
    ): void {
        // set field object
        this.state.listing.setListingFieldObj(listing);
        this.state.searchFilter.setSearchFilterFieldObj(searchFilter);
        this.state.mutation.setMutationFieldObj(mutation);
        this.state.view.setViewFieldObj(view);

        if(listOperation){
            // use complete new field object
            // no need to process for options and default values as its already included
            this.state.listing.setListOperationFieldObj(listOperation);
        } else {
            // use default field object
            this.state.listing.setListOperationFieldObj(this.state.listing.DEFAULT_LIST_OPERATION_FIELD_OBJ);
            this.state.listing.initListOperationFieldObj(); // process for options and default values
        }

        if(viewOption) {
            // use complete new field object
            // no need to process for options and default values as its already included
            this.state.listing.setViewOptionFieldObj(viewOption);
        } else {
            // use default field object
            this.state.listing.setViewOptionFieldObj(this.state.listing.DEFAULT_VIEW_OPTION_FIELD_OBJ);
            this.state.listing.initViewOptionFieldObj(); // process for options and default values
        }

        // resolve mutation form wrapper automatically, must keep this call here as it need MutationFieldObj
        this.resolveMutationActionUiLayout();
    }

    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // CRUD MODULE EXECUTOR REGISTRATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public registerFindByPrimaryKey(handler: CrudFindByKeyHandlerType): void {
        this.findByPrimaryKeyHandler = handler;
    }
    public registerFindBySecondaryKey(handler: CrudFindByKeyHandlerType): void {
        this.findBySecondaryKeyHandler = handler;
    }
    public registerFind(handler: CrudFindHandlerType): void {
        this.findHandler = handler;
    }
    public registerCreate(handler: CrudCreateHandlerType): void {
        this.createHandler = handler;
    }
    public registerUpdate(handler: CrudUpdateHandlerType): void {
        this.updateHandler = handler;
    }
    public registerActive(handler: CrudActiveHandlerType): void {
        this.activeHandler = handler;
    }
    public registerInactive(handler: CrudInactiveHandlerType): void {
        this.inactiveHandler = handler;
    }
    public registerSoftDelete(handler: CrudSoftDeleteHandlerType): void {
        this.softDeleteHandler = handler;
    }
    public registerRestore(handler: CrudRestoreHandlerType): void {
        this.restoreHandler = handler;
    }
    public registerDelete(handler: CrudDeleteHandlerType): void {
        this.deleteHandler = handler;
    }

    /** Find zero or more records using this module's configured primary key. */
    public async findByPrimaryKey(
        input: CrudRecordKeyInputType,
        fieldObj: CrudStateRecordFieldObjType,
    ): Promise<CrudRecordType[]> {
        if (!this.findByPrimaryKeyHandler) {
            throw new Error('CRUD find-by-primary-key handler is not registered.');
        }

        const keys = this.normalizeRecordKeys(input);
        return keys.length > 0 ? this.findByPrimaryKeyHandler(keys, fieldObj) : [];
    }

    /** Find zero or more records using this module's configured secondary key. */
    public async findBySecondaryKey(
        input: CrudRecordKeyInputType,
        fieldObj: CrudStateRecordFieldObjType,
    ): Promise<CrudRecordType[]> {
        if (!this.findBySecondaryKeyHandler) {
            throw new Error('CRUD find-by-secondary-key handler is not registered.');
        }

        const keys = this.normalizeRecordKeys(input);
        return keys.length > 0 ? this.findBySecondaryKeyHandler(keys, fieldObj) : [];
    }

    public async findOneByPrimaryKey(
        key: CrudRecordKeyType,
        fieldObj: CrudStateRecordFieldObjType,
    ): Promise<CrudRecordType | null> {
        const records = await this.findByPrimaryKey(key, fieldObj);
        return records[0] ?? null;
    }

    public async findOneBySecondaryKey(
        key: CrudRecordKeyType,
        fieldObj: CrudStateRecordFieldObjType,
    ): Promise<CrudRecordType | null> {
        const records = await this.findBySecondaryKey(key, fieldObj);
        return records[0] ?? null;
    }

    private normalizeRecordKeys(
        input: CrudRecordKeyInputType,
    ): CrudRecordKeyType[] {
        const keys = Array.isArray(input) ? input : [input];
        const unique = new Map<string, CrudRecordKeyType>();

        for (const key of keys) {
            const normalized = String(key).trim();
            if (normalized.length > 0 && !unique.has(normalized)) {
                unique.set(normalized, key);
            }
        }

        return [...unique.values()];
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ SLOT FIELD █████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public getListingFieldSlotPortalKey(key: string): string {
        return `${this.CrudFieldSlotPortalKeyPrefixEnum.LISTING}${key}`;
    }
    public getMutationFieldSlotPortalKey(key: string): string {
        return `${this.CrudFieldSlotPortalKeyPrefixEnum.MUTATION}${key}`;
    }
    public getFilterFieldSlotPortalKey(key: string): string {
        return `${this.CrudFieldSlotPortalKeyPrefixEnum.FILTER}${key}`;
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ CRUD ACTION ████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public isCrudActionActive(): boolean {
        return this.state.crudAction() !== null;
    }
    private ensureActionPermitted(permitted: boolean): boolean {
        if (permitted) {
            return true;
        }

        this.notify.error(
            this.i18n.translate('GL.MODULE.HTTP_STATUS.UNAUTHORIZED'),
        );
        return false;
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
            return this.state.mutation.mutationActionUiLayout() !== CrudActionUiLayoutEnum.PAGE;
        }

        if (this.isViewActionActive()) {
            return this.state.view.viewActionUiLayout() !== CrudActionUiLayoutEnum.PAGE;
        }

        if (this.isPrintActionActive()) {
            return false;
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
            return this.state.mutation.mutationActionUiLayout() !== CrudActionUiLayoutEnum.PAGE;
        }

        if (action === FoundationActionEnum.VIEW) {
            return this.state.view.viewActionUiLayout() !== CrudActionUiLayoutEnum.PAGE;
        }

        if (action === FoundationActionEnum.PRINT) {
            return false;
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

    // ████████████████████████████████████████████████████████████████████
    // ███ EXECUTION ██████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████

    public async loadListing(
        input: Partial<CrudFindInputType> = {},
        type: CrudDataLoadTypeEnum = CrudDataLoadTypeEnum.ACTION
    ): Promise<boolean> {
        if (!this.state.action.hasListing()) {
            return false;
        }

        // If action is active, skip normal/action reloads.
        // But allow INITIAL load so direct overlay mutation URLs can load background listing.
        if (
            type !== CrudDataLoadTypeEnum.INITIAL &&
            this.shouldSkipListingLoadForActiveCrudAction()
        ) {
            return false;
        }

        const findInput = this.prepareFindInput(input);

        if (!this.findHandler) {
            this.notify.error('CRUD find handler is not registered.');
            return false;
        }

        this.gpbs.start();
        this.gpbs.stream = 20;

        try {
            // keep the 
            // main call to load data
            const resp = await this.findHandler(findInput, type);
            this.gpbs.stream = 60;

            if(resp === true) {
                // apply quick search after data loaded, useful for direct URL load: ;qs=...
                if (this.state.listing.getQuickSearchValue()) {
                    this.applyQuickSearch();
                }
                
                this.gpbs.stream = 100;
                this.gpbs.stop();

                return true;
            }
            throw new Error(this.i18n.translate('GL.COMMON.DATA_LOADING_FAILED'));
        } catch (error: unknown | BfwApiSdkError) {
            // if any error then need yo switch to previous state data
            // like page number, per page rcord number etc

            // also need to develop fixed message place in main layour 
            // need to develop new module name like notify
            // module-notify

            this.log.error('[FIND FAILED]', error);

            if (error instanceof BfwApiSdkError) {
                if (error.status !== HttpStatusCode.Unauthorized) {
                    this.notify.error(
                        error.errors()[0]
                        ?? this.i18n.translate('GL.COMMON.DATA_LOADING_FAILED'),
                    );
                }
            } else {
                this.notify.error(
                    error instanceof Error
                        ? error.message
                        : this.i18n.translate('GL.COMMON.DATA_LOADING_FAILED'),
                );
            }

            this.gpbs.stream = 100;
            this.gpbs.stop();

            return false;
        }
    }
    public async submitListingSearchForm(): Promise<void> {
        if (
            !this.state.action.hasAdvanceSearch()
            && !this.state.action.hasViewOption()
        ) {
            return;
        }

        const formState = this.state.listing.listingSearchForm();

        if (formState.invalid()) {
            formState.errorSummary()[0]?.fieldTree().focusBoundControl();
            return;
        }

        if (this.state.listing.listingSearchFormProcessing()) return;

        this.state.listing.setListingSearchFormProcessing(true);

        try {
              const loaded = await this.loadListing({
                SEARCH_FILTER_INPUT: this.searchFilterInputValues(),
                VIEW_OPTION_INPUT: this.viewOptionInputValues(),
                LIST_OPERATION_INPUT: {
                    current_page: 1,
                    listing_selected_rows: [],
                },
            });
            // close the end-side-bar when user data load finish
            if (loaded) {
                this.paLayout.state.setEndSideBarIsOpen(false);
            }
        } finally {
            this.state.listing.setListingSearchFormProcessing(false);
        }
    }
    public async submitMutationForm(): Promise<void> {
        if (this.state.mutation.mutationFormProcessing()) {
            return;
        }

        if (!this.isMutationActionActive()) {
            this.notify.error('No CRUD mutation action is active.');
            return;
        }

        const mutationForm = this.state.mutation.mutationForm;
        const isUpdate = this.isMutationUpdate();
        const isDuplicate = this.isMutationDuplicate();
        let handler: CrudCreateHandlerType;

        if (isUpdate) {
            if (!this.ensureActionPermitted(this.state.action.hasUpdate())) return;

            const update = this.updateHandler;

            if (!update) {
                this.notify.error('CRUD update handler is not registered.');
                return;
            }

            const keyid = this.getCrudActionRecordSecondaryKeyValue();

            if (keyid === null) {
                this.notify.error(
                    this.getMutationFormMessage('key_missing'),
                );
                return;
            }

            handler = async (input: CrudMutationInputType) => {
                const keyField = this.state.secondaryKey();

                if (
                    keyField
                    && Object.prototype.hasOwnProperty.call(
                        this.state.mutation.mutationFieldObj(),
                        keyField,
                    )
                    && String(input[keyField]) !== String(keyid)
                ) {
                    return {
                        success: false,
                        message: this.getMutationFormMessage('key_mismatch'),
                    };
                }

                return update(keyid, input);
            };
        } else {
            const permitted = isDuplicate
                ? this.state.action.hasDuplicate()
                : this.state.action.hasCreate();

            if (!this.ensureActionPermitted(permitted)) return;

            const create = this.createHandler;

            if (!create) {
                this.notify.error('CRUD create handler is not registered.');
                return;
            }

            handler = create;
        }

        let successMessage: string | undefined;

        const succeeded = await submit(mutationForm, {
            action: async (field) => {
                this.state.mutation.setMutationFormProcessing(true);
                this.gpbs.start();
                this.gpbs.stream = 20;

                try {
                    const input: CrudMutationInputType = { ...field().value() };
                    const result = await handler(input);

                    this.gpbs.stream = 80;

                    if (result.success) {
                        successMessage = result.message;
                        return undefined;
                    }

                    if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
                        const values = field().value();

                        return Object.entries(result.fieldErrors).map(([key, message]) => ({
                            fieldTree: Object.prototype.hasOwnProperty.call(values, key)
                                ? (field as any)[key]
                                : field,
                            kind: 'server',
                            message,
                        }));
                    }

                    const message = result.message
                        ?? this.getMutationFormMessage('failed');
                    this.notify.error(message);

                    return {
                        kind: 'server',
                        message,
                    };
                } catch (error: unknown) {
                    this.log.error('[MUTATION FAILED]', error);

                    const fallbackMessage = this.getMutationFormMessage('failed');
                    const message = error instanceof BfwApiSdkError
                        ? error.errors()[0] ?? fallbackMessage
                        : error instanceof Error
                            ? error.message
                            : fallbackMessage;

                    this.notify.error(message);

                    return {
                        kind: 'server',
                        message,
                    };
                } finally {
                    this.gpbs.stream = 100;
                    this.gpbs.stop();
                    this.state.mutation.setMutationFormProcessing(false);
                }
            },
            onInvalid: (field) => {
                field().errorSummary()[0]?.fieldTree().focusBoundControl();
            },
            ignoreValidators: 'none',
        });

        if (!succeeded) {
            return;
        }

        this.notify.success(
            successMessage
                ?? this.getMutationFormMessage('success'),
        );
        this.state.mutation.resetMutationForm();
        await this.closeMutationAction();
    }
    public async runActive(keyid: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.state.action.hasActive())) return;

        await this.runRecordAction(
            FoundationActionEnum.ACTIVE,
            keyid,
            this.activeHandler,
        );
    }
    public async runInactive(keyid: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.state.action.hasInactive())) return;

        await this.runRecordAction(
            FoundationActionEnum.INACTIVE,
            keyid,
            this.inactiveHandler,
        );
    }
    public async runSoftDelete(keyid: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.state.action.hasSoftDelete())) return;

        await this.runRecordAction(
            FoundationActionEnum.SOFT_DELETE,
            keyid,
            this.softDeleteHandler,
        );
    }
    public async runRestore(keyid: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.state.action.hasRestore())) return;

        await this.runRecordAction(
            FoundationActionEnum.RESTORE,
            keyid,
            this.restoreHandler,
        );
    }
    public async runDelete(keyid: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.state.action.hasDelete())) return;

        await this.runRecordAction(
            FoundationActionEnum.DELETE,
            keyid,
            this.deleteHandler,
        );
    }
    private async runRecordAction<T extends CrudRecordKeyInputType>(
        action: CrudRecordActionType,
        keyid: T | null,
        handler: ((keyid: T) => Promise<CrudMutationResultType>) | null,
    ): Promise<void> {
        if (keyid === null) {
            this.notify.error(
                this.i18n.translate('GL.CRUD.RECORD_ACTION.KEY_MISSING'),
            );
            return;
        }

        const bulkCount = Array.isArray(keyid) ? keyid.length : null;
        const keyids = Array.isArray(keyid) ? keyid : [keyid];

        if (
            keyids.length === 0 ||
            keyids.some((key) => String(key).trim() === '')
        ) {
            this.notify.error(
                this.i18n.translate('GL.CRUD.RECORD_ACTION.KEY_MISSING'),
            );
            return;
        }

        if (!handler) {
            this.notify.error(
                this.getRecordActionMessage(action, 'FAILED', bulkCount),
            );
            return;
        }

        if (!await this.confirmRecordAction(action, bulkCount)) {
            return;
        }

        try {
            const result = await handler(keyid);

            if (!result.success) {
                this.notify.error(
                    result.message
                        ?? this.getRecordActionMessage(action, 'FAILED', bulkCount),
                );
                return;
            }

            await this.updateListingAfterRecordAction(action, keyid);
            this.notify.success(
                result.message
                    ?? this.getRecordActionMessage(action, 'SUCCESS', bulkCount),
            );
        } catch (error: unknown) {
            this.log.error('[CRUD RECORD ACTION FAILED]', error);

            const fallbackMessage = this.getRecordActionMessage(
                action,
                'FAILED',
                bulkCount,
            );
            const message = error instanceof BfwApiSdkError
                ? error.errors()[0] ?? fallbackMessage
                : error instanceof Error
                    ? error.message
                    : fallbackMessage;

            this.notify.error(message);
        }
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ CRUD RECORD ACTION OPERATION ███████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private async confirmRecordAction(
        action: CrudRecordActionType,
        bulkCount: number | null = null,
    ): Promise<boolean> {
        return this.confirmationDialog.confirm(
            this.getRecordActionConfirmationData(action, bulkCount),
        );
    }
    private getRecordActionConfirmationData(
        action: CrudRecordActionType,
        bulkCount: number | null = null,
    ): ConfirmationDialogDataType {
        switch (action) {
            case FoundationActionEnum.ACTIVE:
                return {
                    icon: 'check_circle_unread',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.ACTIVE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.ACTIVE.CONFIRM_TITLE',
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.ACTIVE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.ACTIVE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.ACTIVE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                };

            case FoundationActionEnum.INACTIVE:
                return {
                    icon: 'do_not_disturb_on',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.INACTIVE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.INACTIVE.CONFIRM_TITLE',
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.INACTIVE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.INACTIVE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.INACTIVE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                };

            case FoundationActionEnum.SOFT_DELETE:
                return {
                    icon: 'delete',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.SOFT_DELETE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.SOFT_DELETE.CONFIRM_TITLE',
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.SOFT_DELETE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.SOFT_DELETE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.SOFT_DELETE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                };

            case FoundationActionEnum.RESTORE:
                return {
                    icon: 'restore_from_trash',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.RESTORE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.RESTORE.CONFIRM_TITLE',
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.RESTORE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.RESTORE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.RESTORE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                };

            case FoundationActionEnum.DELETE:
                return {
                    icon: 'delete_forever',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.DELETE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.DELETE.CONFIRM_TITLE',
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.DELETE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.DELETE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.DELETE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                    danger: true,
                };
        }
    }
    private getRecordActionMessage(
        action: CrudRecordActionType,
        outcome: 'SUCCESS' | 'FAILED',
        bulkCount: number | null = null,
    ): string {
        const actionKey = this.getRecordActionMessageKey(action);

        if (bulkCount !== null) {
            return this.i18n.translate(
                `GL.CRUD.SELECTED_RECORD_ACTION.${actionKey}.${outcome}`,
                { count: bulkCount },
            );
        }

        const moduleInfo = this.paLayout.state.moduleInfo();
        const moduleName = moduleInfo?.i18n?.title
            ? this.i18n.translate(moduleInfo.i18n.title)
            : moduleInfo?.title?.trim()
                || this.i18n.translate('GL.CRUD.RECORD');

        return this.i18n.translate(
            `GL.CRUD.RECORD_ACTION.${actionKey}.${outcome}`,
            { module: moduleName },
        );
    }
    private getRecordActionMessageKey(
        action: CrudRecordActionType,
    ): 'ACTIVE' | 'INACTIVE' | 'SOFT_DELETE' | 'RESTORE' | 'DELETE' {
        switch (action) {
            case FoundationActionEnum.ACTIVE:
                return 'ACTIVE';
            case FoundationActionEnum.INACTIVE:
                return 'INACTIVE';
            case FoundationActionEnum.SOFT_DELETE:
                return 'SOFT_DELETE';
            case FoundationActionEnum.RESTORE:
                return 'RESTORE';
            case FoundationActionEnum.DELETE:
                return 'DELETE';
        }
    }
    private async updateListingAfterRecordAction(
        action: CrudRecordActionType,
        keyid: CrudRecordKeyInputType,
    ): Promise<void> {
        const activeField = this.state.activeField();
        const deletedField = this.state.deletedField();
        const keyids = Array.isArray(keyid) ? keyid : [keyid];
        const actionTimestamp = new Date().toISOString();

        for (const recordKey of keyids) {
            if (action === FoundationActionEnum.ACTIVE && activeField) {
                this.state.listing.patchListingData(recordKey, {
                    [activeField]: null,
                });
            }

            if (action === FoundationActionEnum.INACTIVE && activeField) {
                this.state.listing.patchListingData(recordKey, {
                    [activeField]: actionTimestamp,
                });
            }

            if (action === FoundationActionEnum.SOFT_DELETE && deletedField) {
                this.state.listing.patchListingData(recordKey, {
                    [deletedField]: actionTimestamp,
                });
            }

            if (action === FoundationActionEnum.RESTORE && deletedField) {
                this.state.listing.patchListingData(recordKey, {
                    [deletedField]: null,
                });
            }

            if (action === FoundationActionEnum.DELETE) {
                this.state.listing.removeListingData(recordKey);
            }
        }

        this.state.listing.setListingSelectedRowsValue([]);

        if (this.state.listing.reloadListingAfterRecordAction()) {
            await this.loadListing({}, CrudDataLoadTypeEnum.ACTION);
        }
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ LISTING OPERATION ██████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public getSelectedRecordKeyValues(): string[] | null {
        const selectedRows = this.state.listing
            .getListingSelectedRowsValue<Record<string, any>>()
            .selected;
        const keys = selectedRows.map((row) => {
            const key = this.state.getRecordSecondaryKeyValue(row)?.trim();

            return key || null;
        });

        if (keys.length === 0 || keys.some((key) => key === null)) {
            return null;
        }

        return [...new Set(keys as string[])];
    }
    public isRecordSelected(row: any): boolean {
        return this.state.listing.getListingSelectedRowsValue().isSelected(row);
    }
    public isAllRowsSelected(): boolean {
        const numRows = this.state.listing.listingDataSource().data.length;
        const selectedRowsCount = this.state.listing.listingDataSource().data.filter((row) => this.state.listing.getListingSelectedRowsValue().isSelected(row)).length;
        return numRows > 0 && selectedRowsCount === numRows;
    }
    public isPartiallyRowsSelected(): boolean {
        const numRows = this.state.listing.listingDataSource().data.length;
        const selectedRowsCount = this.state.listing.listingDataSource().data.filter((row) => this.state.listing.getListingSelectedRowsValue().isSelected(row)).length;
        return selectedRowsCount > 0 && selectedRowsCount < numRows;
    }
    public toggleAllRows(): void {
        if (!this.state.action.hasBulkAction()) return;

        if (this.isAllRowsSelected()) {
            this.state.listing.setListingSelectedRowsValue([]);
            return;
        }

        this.state.listing.setListingSelectedRowsValue([
            ...this.state.listing.listingDataSource().data,
        ]);
    }
    public toggleRowSelection(row: any): void {
        if (!this.state.action.hasBulkAction()) return;

        const selectedRows = this.state.listing.getListingSelectedRowsValue().selected;

        const nextSelectedRows = this.state.listing.getListingSelectedRowsValue().isSelected(row)
            ? selectedRows.filter((selectedRow) => selectedRow !== row)
            : [...selectedRows, row];

        this.state.listing.setListingSelectedRowsValue(nextSelectedRows);
    }
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
            this.state.listing.setListingSelectedRowsValue([]);
        }

        return loaded;
    }
    public getLastPage(totalRecords: number, pageSize: number): number {
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
        const pageSize = Number(lObj.rows_per_page);
        const lastPage = this.getLastPage(totalRecords, pageSize);

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
    public dragAndDropColumn(event: CdkDragDrop<string[]>): void {
        if (!this.state.action.hasColumnPosition()) return;

        const selectableColumn = CrudListingAdditionalColumnsEnum.RECORD_SELECT;

        const draggableColumns = this.state.listing.getListingColumnPositionValue()
            .filter((column) => column !== selectableColumn);

        moveItemInArray(draggableColumns, event.previousIndex, event.currentIndex);

        this.state.listing.setListingColumnPositionValue([
            selectableColumn,
            ...draggableColumns,
        ]);
    }
    public applyQuickSearch(): void {
        if (!this.state.action.hasQuickSearch()) return;

        const dataSource = this.state.listing.listingDataSource();

        const formattedFields = this.state.listing.formattedListingFields();
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
                const formattedValue = this.validation.formatCrudFieldValue(
                    rawValue,
                    fInfo,
                    record,
                    this.state.getCrudModuleContext(),
                );

                const cleanValue = String(formattedValue ?? '')
                    .replace(/<[^>]*>?/gm, '') // strip html if any
                    .toLowerCase();

                if (cleanValue.includes(searchTerms)) {
                    return true; // match found, stop early (same as .some())
                }
            }

            return false; // no fields matched
        };

        dataSource.filter = String(this.state.listing.getQuickSearchValue() ?? '')
            .trim()
            .toLowerCase();
    }
    public async setQuickSearchKeyword(event: Event): Promise<void> {
        if (!this.state.action.hasQuickSearch()) return;

        const value = (event.target as HTMLInputElement).value;
        
        // 1. Update the local variable
        this.state.listing.setQuickSearchValue(value.trim().toLowerCase());

        // 2. Apply the filter to the MatTableDataSource
        this.applyQuickSearch();
    }
    public async clearQuickSearchKeyword(searchInput: HTMLInputElement): Promise<void> {
        if (!this.state.action.hasQuickSearch()) return;

        this.state.listing.setQuickSearchValue(null);
        searchInput.value = '';
        
        const dataSource = this.state.listing.listingDataSource();
        if (dataSource) {
            dataSource.filter = '';
        }
    }
    public prepareFindInput(input: Partial<CrudFindInputType> = {}): CrudFindInputType {
        const sfIn = input.SEARCH_FILTER_INPUT ?? this.searchFilterInputValues();
        const voIn = input.VIEW_OPTION_INPUT ?? this.viewOptionInputValues();
        const loIn = input.LIST_OPERATION_INPUT ?? {};
        let skip = input.SKIP ?? 0;

        // TODO we have issue here rows_per_page = 5 when new load
        // it's not taking value from url
        
        // normalize current page and rows per page
        loIn.current_page = Number(loIn.current_page ?? this.state.listing.getCurrentPageValue());
        loIn.rows_per_page = Number(loIn.rows_per_page ?? this.state.listing.getRowsPerPageValue());
        
        // get rows per page options
        const rowsPerPageOptions = this.state.listing.getRowsPerPageOption();

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
            loIn.rows_per_page = this.state.listing.getRowsPerPageDefault();
        }

        skip = this.state.listing.getPageSkipIndex(loIn.current_page, loIn.rows_per_page);

        // keep selected rows in the same normalized input lifecycle.
        // if not provided explicitly, use current state selection.
        loIn.listing_selected_rows = loIn.listing_selected_rows
            ?? this.state.listing.getListingSelectedRowsValue();

        // club all together as object with all validation process
        const out: CrudFindInputType = {
            SEARCH_FILTER_INPUT: sfIn,
            VIEW_OPTION_INPUT: voIn,
            LIST_OPERATION_INPUT: loIn,
            SKIP: skip,
        };

        return out;
    }
    

    // ████████████████████████████████████████████████████████████████████
    // ███ LISTING SEARCH OPERATION ███████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████

    public openListingSearchForm(): void {
        if (
            !this.state.action.hasAdvanceSearch()
            && !this.state.action.hasViewOption()
        ) {
            return;
        }

        if(this.paLayout) {
            this.paLayout.toogleEndSideBarAndSwitchTab(CrudEndSideBarTabEnum.FILTER)
        }
    }
    /** Current normalized-looking values from the child search field object. */
    public searchFilterInputValues(): CrudSearchFilterInputType {
        return this.formFieldInputValues(
            this.state.searchFilter.searchFilterFieldObj(),
            true,
        );
    }
    /** Current view-option values, including defaults required by listing calls. */
    public viewOptionInputValues(): CrudViewOptionInputType {
        return this.formFieldInputValues(
            this.state.listing.viewOptionFieldObj(),
            false,
        ) as CrudViewOptionInputType;
    }
    private formFieldInputValues(
        fieldObj: CrudStateFormFieldObjType,
        omitEmpty: boolean,
    ): Record<string, any> {
        const output: Record<string, any> = {};

        for (const [key, fieldInfo] of Object.entries(fieldObj)) {
            if (fieldInfo.type === CrudFieldUiTypeEnum.NONE) continue;

            const value = fieldInfo.value ?? fieldInfo.default ?? null;
            const preserveEmptyFlag = fieldInfo.type === CrudFieldUiTypeEnum.FLAG
                && fieldInfo.flag?.clearable === true;

            if (omitEmpty && !preserveEmptyFlag && this.utility.isValidationEmpty(value)) continue;

            output[key] = value instanceof Date ? value.toISOString() : value;
        }

        return output;
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ MUTATION OPERATION █████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public async initMutationActionFromUrl(
        keyid: string | number | null = this.getCrudActionRecordSecondaryKeyValue(),
    ): Promise<void> {
        if (
            (this.isMutationCreate() && !this.ensureActionPermitted(this.state.action.hasCreate()))
            || (this.isMutationUpdate() && !this.ensureActionPermitted(this.state.action.hasUpdate()))
            || (this.isMutationDuplicate() && !this.ensureActionPermitted(this.state.action.hasDuplicate()))
        ) {
            return;
        }

        if (!await this.loadMutationFormFieldValues(keyid)) {
            return;
        }

        if (this.state.mutation.mutationActionUiLayout() === CrudActionUiLayoutEnum.PAGE) {
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
    private isMutationAction(action: FoundationActionEnum | null): boolean {
        return action === FoundationActionEnum.CREATE
            || action === FoundationActionEnum.UPDATE
            || action === FoundationActionEnum.DUPLICATE;
    }
    public isMutationActionActive(): boolean {
        return this.isMutationAction(this.state.crudAction());
    }
    public isMutationCreate(): boolean {
        return this.state.crudAction() === FoundationActionEnum.CREATE;
    }
    public isMutationUpdate(): boolean {
        return this.state.crudAction() === FoundationActionEnum.UPDATE;
    }
    public isMutationDuplicate(): boolean {
        return this.state.crudAction() === FoundationActionEnum.DUPLICATE;
    }
    public getMutationIcon(): string {
        switch (this.state.crudAction()) {
            case FoundationActionEnum.UPDATE:
                return 'edit_document';
            case FoundationActionEnum.DUPLICATE:
                return 'content_copy';
            default:
                return 'add_circle';
        }
    }
    public getMutationTitle(): string {
        switch (this.state.crudAction()) {
            case FoundationActionEnum.UPDATE:
                return 'GL.ACTION.UPDATE';
            case FoundationActionEnum.DUPLICATE:
                return 'GL.ACTION.DUPLICATE';
            default:
                return 'GL.COMMON.ADD_NEW';
        }
    }
    public getMutationFormComponent(): Type<any> {
        return this.state.mutation.mutationFormCustomComponent() ?? CrudDefaultMutationFormComponent;
    }
    public getMutationPageComponent(): Type<any> {
        return this.state.mutation.mutationPageCustomComponent() ?? CrudDefaultMutationPageComponent;
    }
    public toggleMutationEndDrawer(callback?: () => void): void {
        this.state.mutation.setMutationEndDrawerIsOpen(!this.state.mutation.mutationEndDrawerIsOpen());
        
        if(callback)
            callback();
    }
    public resolveMutationActionUiLayout(): void {
        // after need to develop something like how src/app/base/crud/default/mutation/form can be take over by child
        // but remain things stay as it is with bottom sheet, dialoug and end side bar wrapper
        // in short Child takeover is pending

        const fields = this.state.mutation.mutationFieldObj();
        const fieldCount = Object.keys(fields).length;
        const columnCount = Object.values(fields).find((field) => field.colspan)?.colspan ?? 1;

        if(columnCount > 1 && this.bos.isLgAndUp()) {
            this.state.mutation.setMutationActionUiLayout(CrudActionUiLayoutEnum.DIALOG);
        } else if(this.bos.isMdAndDown() || fieldCount < 4) {
            this.state.mutation.setMutationActionUiLayout(CrudActionUiLayoutEnum.BOTTOM_SHEET);
        } else if(fieldCount > 4 && fieldCount < 12) {
            this.state.mutation.setMutationActionUiLayout(CrudActionUiLayoutEnum.END_SIDE_BAR);
        } else {
            this.state.mutation.setMutationActionUiLayout(CrudActionUiLayoutEnum.DIALOG);
        }
    }
    private openMutationOverlay(): void {
        const layout = this.state.mutation.mutationActionUiLayout();

        if (layout === CrudActionUiLayoutEnum.DIALOG) {
            if (this.activeMutationDialogRef) {
                return;
            }

            const size = this.state.mutation.mutationActionUiSize();
            const fullscreen = size === UiSizeEnum.FULL;

            this.activeMutationDialogRef = this.mutationDialog.open(
                CrudDefaultMutationDialogComponent,
                {
                    panelClass: [
                        'bfw-safe-area-p',
                        ...(fullscreen ? ['tw:[--mat-dialog-container-shape:0px]'] : []),
                    ],
                    injector: this.getComponentInjector(),
                    disableClose: true,
                    width: UI_WIDTH[size],
                    maxWidth: fullscreen ? '100vw' : 'calc(100vw - 2rem)',
                    height: fullscreen ? '100dvh' : undefined,
                    maxHeight: fullscreen ? '100dvh' : undefined,
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
            this.state.mutation.setMutationEndDrawerIsOpen(true);
            return;
        }
        else if (layout === CrudActionUiLayoutEnum.END_SIDE_BAR) {
            if(!this.paLayout) return;

            this.paLayout.state.setEndSideBarIsOpen(true);

            // same thing can be done using 3 different way but behaviour will be different in case of timing
            // setTimeout(() => {
            //     this.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.MUTATION);
            // }, 100);

            queueMicrotask(() => {
                this.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.MUTATION);
            });

            // afterNextRender(() => {
            //     this.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.MUTATION);
            // }, { injector: this.getComponentInjector() });

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
        else if(this.state.mutation.mutationActionUiLayout() === CrudActionUiLayoutEnum.END_DRAWER) {
            this.state.mutation.setMutationEndDrawerIsOpen(false);
        }
        else if (this.state.mutation.mutationActionUiLayout() === CrudActionUiLayoutEnum.END_SIDE_BAR) {
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
        this.state.mutation.addMutationEndDrawerOnCloseCallback('on_mutation_close', () => {
            if (
                this.isMutationActionActive() && 
                this.state.mutation.mutationActionUiLayout() === CrudActionUiLayoutEnum.END_DRAWER
            ) {
                void this.closeMutationAction();
            }
        });
        
        // add more call back
    }
    private async loadMutationFormFieldValues(
        keyid: string | number | null,
    ): Promise<boolean> {
        // this method is called only for update to fill up the form with existing values from database using api
        if (this.isMutationCreate()) {
            this.state.mutation.setMutationFormValues();
            return true;
        }

        if (keyid === null) {
            this.notify.error(this.getMutationFormMessage('key_missing'));
            return false;
        }

        this.state.mutation.setMutationFormProcessing(true);

        try {
            const record = await this.findOneBySecondaryKey(
                keyid,
                this.state.mutation.mutationFieldObj(),
            );

            if (!record) {
                this.notify.error(this.getMutationFormMessage('failed'));
                return false;
            }

            // Ignore a response for a record that is no longer the active route.
            if (
                (
                    !this.isMutationUpdate()
                    && !this.isMutationDuplicate()
                )
                || this.getCrudActionRecordSecondaryKeyValue() !== keyid
            ) {
                return false;
            }

            const keyField = this.state.secondaryKey();

            if (
                keyField
                && Object.prototype.hasOwnProperty.call(
                    this.state.mutation.mutationFieldObj(),
                    keyField,
                )
                && String(record[keyField]) !== String(keyid)
            ) {
                this.notify.error(
                    this.getMutationFormMessage('key_mismatch'),
                );
                return false;
            }

            const mutationValues = this.normalizeMutationFormLoadValues(record);

            if (this.isMutationDuplicate()) {
                const mutationFieldObj = this.state.mutation.mutationFieldObj();
                const identityFields = [
                    this.state.primaryKey(),
                    this.state.secondaryKey(),
                ];

                for (const fieldName of identityFields) {
                    if (
                        fieldName
                        && Object.prototype.hasOwnProperty.call(mutationFieldObj, fieldName)
                    ) {
                        mutationValues[fieldName] = null;
                    }
                }
            }

            this.state.mutation.setMutationFormValues(mutationValues);
            return true;
        } catch (error: unknown) {
            this.log.error('[UPDATE MUTATION FORM LOAD FAILED]', error);

            const fallbackMessage = this.getMutationFormMessage('failed');
            const message = error instanceof BfwApiSdkError
                ? error.errors()[0] ?? fallbackMessage
                : error instanceof Error
                    ? error.message
                    : fallbackMessage;

            this.notify.error(message);
            return false;
        } finally {
            this.state.mutation.setMutationFormProcessing(false);
        }
    }
    public getMutationFormMessage(
        outcome: 'success' | 'failed' | 'key_missing' | 'key_mismatch',
    ): string {
        const moduleInfo = this.paLayout.state.moduleInfo();
        const moduleName = moduleInfo?.i18n?.title
            ? this.i18n.translate(moduleInfo.i18n.title)
            : moduleInfo?.title?.trim()
                || this.i18n.translate('GL.CRUD.RECORD');
        const action = this.isMutationUpdate() ? 'UPDATE' : 'CREATE';
        const result = outcome === 'success' ? 'SUCCESS' : 'FAILED';
        const messageKey = outcome === 'key_missing'
            ? 'UPDATE_KEY_MISSING'
            : outcome === 'key_mismatch'
                ? 'UPDATE_KEY_MISMATCH'
                : `${action}_${result}`;

        return this.i18n.translate(
            `GL.CRUD.MUTATION.${messageKey}`,
            { module: moduleName },
        );
    }
    /**
     * Build a module API input from the dynamic mutation field definition.
     * Field-type and custom normalizers use the same CTOS path as the rest of CRUD.
     */
    public mutationFormInputValues<TOutput extends object = CrudMutationInputType>(
        input: CrudMutationInputType = {
            ...this.state.mutation.mutationForm().value(),
        },
        options: CrudMutationFormInputOptionsType = {},
    ): TOutput {
        const exclude = new Set(options.exclude ?? []);
        const output: CrudMutationInputType = {};
        const fieldObj = this.state.mutation.mutationFieldObj();
        const context = this.state.getCrudModuleContext();

        for (const [key, fieldInfo] of Object.entries(fieldObj)) {
            if (
                fieldInfo.type === CrudFieldUiTypeEnum.NONE
                || exclude.has(key)
                || !Object.prototype.hasOwnProperty.call(input, key)
            ) {
                continue;
            }

            const result = this.validation.normalizeAndValidateCrudFormFieldValue(
                input[key],
                fieldInfo,
                input,
                undefined,
                context,
            );
            const value = result.value instanceof Date
                ? result.value.toISOString()
                : result.value;

            if (options.omitEmpty && this.shouldOmitMutationFormValue(value, fieldInfo)) {
                continue;
            }

            output[key] = value;
        }

        return output as TOutput;
    }
    private normalizeMutationFormLoadValues(
        input: CrudMutationInputType,
    ): CrudMutationInputType {
        const output: CrudMutationInputType = {};
        const fieldObj = this.state.mutation.mutationFieldObj();
        const context = this.state.getCrudModuleContext();

        for (const [key, fieldInfo] of Object.entries(fieldObj)) {
            if (
                fieldInfo.type === CrudFieldUiTypeEnum.NONE
                || !Object.prototype.hasOwnProperty.call(input, key)
            ) {
                continue;
            }

            // A present null is an explicit server value, not a missing value
            // that should fall back to the field's previous/default state.
            if (input[key] === null || input[key] === undefined) {
                output[key] = null;
                continue;
            }

            output[key] = this.validation.normalizeAndValidateCrudFormFieldValue(
                input[key],
                fieldInfo,
                input,
                CrudFieldNormalizeModeEnum.STOC,
                context,
            ).value;
        }

        return output;
    }
    private shouldOmitMutationFormValue(
        value: unknown,
        fieldInfo: CrudFormFieldInfoType,
    ): boolean {
        switch (fieldInfo.type) {
            // Empty values for these types represent an explicit state/clear action.
            case CrudFieldUiTypeEnum.FLAG:
            case CrudFieldUiTypeEnum.MULTISELECT:
            case CrudFieldUiTypeEnum.BUTTON_MULTISELECT:
            case CrudFieldUiTypeEnum.MULTISELECTAUTOSUGGEST:
            case CrudFieldUiTypeEnum.CHECKBOX:
            case CrudFieldUiTypeEnum.ARRAY:
            case CrudFieldUiTypeEnum.JSON:
                return false;

            default:
                return value === null || value === undefined || value === '';
        }
    }
    public mutationFormFieldErrors(
        error: unknown,
    ): CrudMutationFieldErrorType | undefined {
        if (!(error instanceof BfwApiSdkError)) {
            return undefined;
        }

        const fields = Object.entries(this.state.mutation.mutationFieldObj())
            .filter(([, fieldInfo]) =>
                fieldInfo.type !== CrudFieldUiTypeEnum.NONE
                && fieldInfo.type !== CrudFieldUiTypeEnum.HIDDEN,
            )
            .map(([key]) => ({
                key,
                search: this.mutationErrorSearchText(key),
            }))
            // Match currency_name before the shorter name field.
            .sort((a, b) => b.search.length - a.search.length);
        const fieldErrors: CrudMutationFieldErrorType = {};

        for (const message of error.errors()) {
            const searchMessage = ` ${this.mutationErrorSearchText(message)} `;
            const field = fields.find(({ search }) =>
                searchMessage.includes(` ${search} `),
            );

            if (field) {
                fieldErrors[field.key] = message;
            }
        }

        return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
    }
    private mutationErrorSearchText(value: string): string {
        return value
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ VIEW RECORD OPERATION ██████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    // Action and component resolution ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public isViewActionActive(): boolean {
        return this.state.crudAction() === FoundationActionEnum.VIEW;
    }
    public getViewIcon(): string {
        return 'visibility';
    }
    public getViewTitle(): string {
        return this.isPrintActionActive() ? 'GL.ACTION.PRINT' : 'GL.ACTION.VIEW';
    }
    public getViewRecordComponent(): Type<any> {
        return this.state.view.viewRecordCustomComponent() ?? CrudDefaultViewRecordComponent;
    }
    public getViewPageComponent(): Type<any> {
        return this.state.view.viewPageCustomComponent() ?? CrudDefaultViewPageComponent;
    }
    public toggleViewEndDrawer(): void {
        this.state.view.setViewEndDrawerIsOpen(!this.state.view.viewEndDrawerIsOpen());
    }
    public async initViewActionFromUrl(
        keyid: string | number | null = this.getCrudActionRecordSecondaryKeyValue(),
    ): Promise<void> {
        if (!this.ensureActionPermitted(this.state.action.hasView())) {
            return;
        }

        if (keyid === null) {
            this.notify.error(this.i18n.translate('GL.CRUD.RECORD_ACTION.KEY_MISSING'));
            return;
        }

        this.state.view.setViewRecord(null);
        this.state.view.setViewRecordProcessing(true);

        try {
            const record = await this.findOneBySecondaryKey(
                keyid,
                this.state.view.viewFieldObj(),
            );

            // Ignore a response for a View route that is no longer active.
            if (
                !this.isViewActionActive()
                || this.getCrudActionRecordSecondaryKeyValue() !== keyid
            ) {
                return;
            }

            if (!record) {
                this.notify.error(this.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND'));
                await this.closeViewAction();
                return;
            }

            this.state.view.setViewRecord(record);

            if (this.state.view.viewActionUiLayout() !== CrudActionUiLayoutEnum.PAGE) {
                // Defer until the View host has registered an END_SIDE_BAR portal.
                setTimeout(() => this.openViewOverlay());
            }
        } catch (error: unknown) {
            this.log.error('[VIEW RECORD LOAD FAILED]', error);
            const message = error instanceof BfwApiSdkError
                ? error.errors()[0] ?? this.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND')
                : error instanceof Error
                    ? error.message
                    : this.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND');

            this.notify.error(message);
            await this.closeViewAction();
        } finally {
            this.state.view.setViewRecordProcessing(false);
        }
    }
    private openViewOverlay(): void {
        if (!this.isViewActionActive()) {
            return;
        }

        const layout = this.state.view.viewActionUiLayout();

        if (layout === CrudActionUiLayoutEnum.DIALOG) {
            if (this.activeViewDialogRef) {
                return;
            }

            const size = this.state.view.viewActionUiSize();
            const fullscreen = size === UiSizeEnum.FULL;

            this.activeViewDialogRef = this.mutationDialog.open(
                CrudDefaultViewDialogComponent,
                {
                    panelClass: [
                        'bfw-safe-area-p',
                        ...(fullscreen ? ['tw:[--mat-dialog-container-shape:0px]'] : []),
                    ],
                    injector: this.getComponentInjector(),
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
                    this.state.view.clearViewRecord();
                }
            });
            return;
        }

        if (layout === CrudActionUiLayoutEnum.BOTTOM_SHEET) {
            if (this.activeViewBottomSheetRef) {
                return;
            }

            this.activeViewBottomSheetRef = this.mutationBottomSheet.open(
                CrudDefaultViewBottomSheetComponent,
                {
                    injector: this.getComponentInjector(),
                    disableClose: true,
                },
            );
            this.activeViewBottomSheetRef.afterDismissed().subscribe(() => {
                this.activeViewBottomSheetRef = null;
                if (!this.isViewActionActive()) {
                    this.state.view.clearViewRecord();
                }
            });
            return;
        }

        if (layout === CrudActionUiLayoutEnum.END_DRAWER) {
            this.state.view.setViewEndDrawerIsOpen(true);
            return;
        }

        if (layout === CrudActionUiLayoutEnum.END_SIDE_BAR) {
            this.paLayout.state.setEndSideBarIsOpen(true);
            
            // same thing can be done using 3 different way but behaviour will be different in case of timing
            // setTimeout(() => {
            //     this.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.VIEW);
            // }, 100);

            queueMicrotask(() => {
                this.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.VIEW);
            });

            // afterNextRender(() => {
            //     this.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.VIEW);
            // }, { injector: this.getComponentInjector() });
        }
    }
    private closeViewOverlay(): void {
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

        this.state.view.setViewEndDrawerIsOpen(false);

        if (
            this.state.view.viewActionUiLayout() === CrudActionUiLayoutEnum.END_SIDE_BAR
            && this.paLayout
        ) {
            this.paLayout.state.setEndSideBarIsOpen(false);
        }

        if (!hasAnimatedOverlay) {
            this.state.view.clearViewRecord();
        }
    }
    public async closeViewAction(): Promise<void> {
        // PAGE-layout View and Print both tear the listing down while active
        // (unlike the overlay View layouts, which keep it mounted underneath),
        // so closing either needs a real reload or it renders empty. Print
        // always renders page-style regardless of viewActionUiLayout(), so it
        // is checked independently rather than folded into that setting.
        const listingWasHidden = this.isPrintActionActive()
            || this.state.view.viewActionUiLayout() === CrudActionUiLayoutEnum.PAGE;
        await this.closeCrudAction(listingWasHidden);
    }
    public addViewEndDrawerOnCloseCallback(): void {
        this.state.view.addViewEndDrawerOnCloseCallback('on_view_close', () => {
            if (this.isViewActionActive()) {
                void this.closeViewAction();
            }
        });
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ PRINT RECORD OPERATION █████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public isPrintActionActive(): boolean {
        return this.state.crudAction() === FoundationActionEnum.PRINT;
    }
    /** Used by the dedicated /print/:keyid route AND the inline Print button on View. */
    public printRecord(): void {
        this.ngxPrint.print(new PrintOptions({
            printSectionId: CRUD_PRINT_SECTION_ID,
            //printTitle: this.i18n.translate(this.getViewTitle()),
            useExistingCss: true,
            printMethod: 'iframe',
            printDelay: 200,
        }));
    }
    public async initPrintActionFromUrl(
        keyid: string | number | null = this.getCrudActionRecordSecondaryKeyValue(),
    ): Promise<void> {
        if (!this.ensureActionPermitted(this.state.action.hasPrint())) {
            return;
        }

        if (keyid === null) {
            this.notify.error(this.i18n.translate('GL.CRUD.RECORD_ACTION.KEY_MISSING'));
            return;
        }

        this.state.view.setViewRecord(null);
        this.state.view.setViewRecordProcessing(true);

        try {
            const record = await this.findOneBySecondaryKey(
                keyid,
                this.state.view.viewFieldObj(),
            );

            // Ignore a response for a Print route that is no longer active.
            if (
                !this.isPrintActionActive()
                || this.getCrudActionRecordSecondaryKeyValue() !== keyid
            ) {
                return;
            }

            if (!record) {
                this.notify.error(this.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND'));
                await this.closeViewAction();
                return;
            }

            this.state.view.setViewRecord(record);

            // Wait for the page host to actually render the loaded record before
            // printing — a setTimeout(0) macrotask is not guaranteed to run after
            // Angular has flushed this DOM update, afterNextRender() is.
            afterNextRender(() => {
                if (this.isPrintActionActive()) {
                    this.printRecord();
                }
            }, { injector: this.getComponentInjector() });
        } catch (error: unknown) {
            this.log.error('[PRINT RECORD LOAD FAILED]', error);
            const message = error instanceof BfwApiSdkError
                ? error.errors()[0] ?? this.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND')
                : error instanceof Error
                    ? error.message
                    : this.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND');

            this.notify.error(message);
            await this.closeViewAction();
        } finally {
            this.state.view.setViewRecordProcessing(false);
        }
    }
    public formatViewFieldValue(
        key: string,
        fieldInfo: CrudFieldInfoType,
        record: CrudRecordType,
    ): string {
        const value = record[key];

        if (fieldInfo.type === CrudFieldUiTypeEnum.PASSWORD) {
            return this.utility.isBlankValue(value) ? '—' : '••••••••';
        }

        if (fieldInfo.type === CrudFieldUiTypeEnum.JSON) {
            return this.utility.isBlankValue(value)
                ? String(fieldInfo.default ?? '—')
                : JSON.stringify(value, null, 2);
        }

        const formatted = this.validation.formatCrudFieldValue(
            value,
            fieldInfo,
            record,
            this.state.getCrudModuleContext(),
        );

        if (this.utility.isBlankValue(formatted)) {
            return String(fieldInfo.default ?? '—');
        }

        if (Array.isArray(formatted)) {
            return formatted.join(', ');
        }

        return typeof formatted === 'object'
            ? JSON.stringify(formatted, null, 2)
            : String(formatted);
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ HELPER █████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public addEndSideBarOnCloseCallBack(): void {
        if(!this.paLayout) return;
        /**
         * perform required actions when end-side-bar close by registering callback
         * list all call back process this could be as per crud action wise or common
         */
        this.paLayout.state.addEndSideBarOnCloseCallback('on_mutation_close', () => {
            if (
                this.isMutationActionActive() && 
                this.state.mutation.mutationActionUiLayout() === CrudActionUiLayoutEnum.END_SIDE_BAR
            ) {
                void this.closeMutationAction();
            }
        });

        this.paLayout.state.addEndSideBarOnCloseCallback('on_view_close', () => {
            if (
                this.isViewActionActive() && 
                this.state.view.viewActionUiLayout() === CrudActionUiLayoutEnum.END_SIDE_BAR
            ) {
                void this.closeViewAction();
            }
        });
        
        // add more call back
    }
    /** One change path for every CRUD-rendered form control. */
    public onCrudFieldValueChange(
        ffObj: CrudFieldObj,
        fkey: string,
        finfo: CrudFormFieldInfoType,
        value: any,
    ): void {
        const previousValue = finfo.value;

        const syncMutationFormValue = (
            field: string,
            fieldValue: any,
            markAsDirty = false,
        ): void => {
            if (!Object.is(ffObj, this.state.mutation.mutationFieldObj())) return;

            const fieldTree = (this.state.mutation.mutationForm as any)?.[field];
            if (typeof fieldTree !== 'function') return;

            const fieldState = fieldTree();
            fieldState.value.set(fieldValue);

            if (markAsDirty) {
                fieldState.markAsDirty();
            }
        };

        const syncListingSearchFormValue = (
            field: string,
            fieldValue: any,
            markAsDirty = false,
        ): void => {
            const belongsToSearchForm = this.state.listing
                .listingSearchFormLayout()
                .some((fieldObj) => Object.is(ffObj, fieldObj));

            if (!belongsToSearchForm) return;

            const fieldTree = (this.state.listing.listingSearchForm as any)?.[field];
            if (typeof fieldTree !== 'function') return;

            const fieldState = fieldTree();
            fieldState.value.set(fieldValue);

            if (markAsDirty) {
                fieldState.markAsDirty();
            }
        };

        const syncFormValue = (
            field: string,
            fieldValue: any,
            markAsDirty = false,
        ): void => {
            syncMutationFormValue(field, fieldValue, markAsDirty);
            syncListingSearchFormValue(field, fieldValue, markAsDirty);
        };

        finfo.value = value;
        syncFormValue(fkey, value, true);

        const patchDependentFieldInfo = (
            targetField: string,
            changes: Partial<CrudFormFieldInfoType>,
        ): void => {
            const dependentField = ffObj[targetField] as CrudFormFieldInfoType | undefined;

            if (!dependentField) return;

            Object.assign(dependentField, changes);
        };

        const setDependentFieldValue = (
            targetField: string,
            dependentValue: any,
            options?: { emitChange?: boolean },
        ): void => {
            const dependentField = ffObj[targetField] as CrudFormFieldInfoType | undefined;

            if (!dependentField) return;

            if (options?.emitChange) {
                this.onCrudFieldValueChange(
                    ffObj,
                    targetField,
                    dependentField,
                    dependentValue,
                );
                return;
            }

            dependentField.value = dependentValue;
            syncFormValue(targetField, dependentValue);
        };

        void finfo.on_change?.({
            value,
            previousValue,
            fkey,
            finfo,
            ffObj,
            setDependentFieldValue,
            patchDependentFieldInfo,
        });
    }
}