// file: src/app/base/crud/child/type/service.ts
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { CrudService } from "src/app/base/crud/service/entry";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import {
    CrudFindInputType,
    CrudListingViewOptionResultType,
    CrudListOperationInputType,
    CrudMutationInputType,
    CrudMutationResultType,
    CrudRecordKeyInputType,
    CrudRecordType,
    CrudStateRecordFieldObjType,
    CrudSearchFilterInputType,
    CrudViewOptionInputType,
} from "@base/crud/type";
import { CrudDataLoadTypeEnum } from "@base/crud/enum";
import { BfwApiSdkResponse } from "@bfw/api-sdk/core";
import { I18nService } from "src/app/base/internationalization/service";

export interface CrudChildServiceType {
    PrivateAreaLayoutSlotEnum: typeof PrivateAreaLayoutSlotEnum;

    conf: ConfService;
    log: LogService;
    i18n: I18nService;

    crud: CrudService;

    // ████ CONFIGURATION METHODS IN CHILD CONSTRUCTOR █████████████
    /** Call to this method in the constructor at first */
    crudInit(): void;

    /**
     * Set the child module's static route class in CRUD root state. Must run
     * before URL initialization, action checks, or CRUD action URL generation.
     */
    setModuleRoute(): void;

    /**
     * Call to this method in the constructor
     * OR
     * included in crudInit()
     */
    initUrlSync(): void;

    /**
     * Call to this method in the constructor
     * This method will be used to enable/disable URL sync in module 
     * This has to set just after initUrlSync()
     * As initUrlSync() by default enable url sync
     * to stop it we need to disable just after initUrlSync()
     * OR 
     * included in crudInit()
     */
    enableUrlSync(flag: boolean): void;

    // standard fields of module
    setPrimaryKey(): void;
    setSecondaryKey(): void;
    setUniqueKey(): void;
    setUrlSlugField(): void;
    setIsMainField(): void;
    setRecordPositionField(): void;
    setActiveField(): void;
    setDeletedField(): void;

    /** Configure whether a successful record action reloads the listing. */
    setReloadListingAfterRecordAction(): void;

    /** Set the child module's field object to perform actions. */
    setFieldObj(): void;

    /**
     * Call to this method in the constructor
     * Must be after initFieldObj() as it requires field object to process
     * 
     * by default crud module auto detect the suitable wrapper using inbuilt logic
     * this is optional, let this module provide specific CrudActionUiLayoutEnum mutation layout type
     * genereally this is not required but override is possible as needed in this method
     */
    setMutationActionUiLayout(): void;

    /**
     * Set the mutation wrapper size independently from its layout type.
     * Defaults to UiSizeEnum.SM when the child does not override it.
     */
    setMutationActionUiSize(): void;

    /**
     * Call to this method in the constructor
     * Must be after initFieldObj() as it requires field object to process
     * set mutation form custom component in case when module required full control over mutation form
     */
    setMutationFormCustomComponent(): void;

    /**
     * Call to this method in the constructor
     * Must be after initFieldObj() as it requires field object to process
     * set mutation page custom component in case when module required to override default crud mutation page
     */
    setMutationPageCustomComponent(): void;

    /** Configure module's independent read-only View layout. */
    setViewActionUiLayout(): void;

    /** Configure the View wrapper size independently from Mutation. */
    setViewActionUiSize(): void;

    /** Optionally replace the default read-only record component. */
    setViewRecordCustomComponent(): void;

    /** Optionally replace the default full-page View component. */
    setViewPageCustomComponent(): void;

    /** Call to this method in the constructor */
    setListingSelectedRowsInitialSource(): void;

    // Register this module's standard api operation methods for abstract CRUD service.
    registerFindByPrimaryKey(): void;
    registerFindBySecondaryKey(): void;
    registerFind(): void;
    registerCreate(): void;
    registerUpdate(): void;
    registerActive(): void;
    registerInactive(): void;
    registerSoftDelete(): void;
    registerRestore(): void;
    registerDelete(): void;

    /** Sync CRUD state from URL matrix params */
    initCrudStateFromUrl(): void;

    /**
     * Call to this method in constructor()
     * Must be after initisation of setFieldObj() as it requires field object to process
     * this is required to generate search form in ui and also handle its submit
     * call after initCrudStateFromUrl()
     */
    listingSearchFormLayout(): void;

    /** On module init, load the initial listing data */
    initialListingLoad(): Promise<boolean>;

    // ████ INTERAL METHODS ███████████████████
    findByPrimaryKey(input: CrudRecordKeyInputType, fieldObj: CrudStateRecordFieldObjType): Promise<CrudRecordType[]>;
    findBySecondaryKey(input: CrudRecordKeyInputType, fieldObj: CrudStateRecordFieldObjType): Promise<CrudRecordType[]>;
    
    find(input: CrudFindInputType, type?: CrudDataLoadTypeEnum): Promise<boolean>;
    loadListingData(
        searchFilterInput: CrudSearchFilterInputType,
        viewOptionInput: CrudViewOptionInputType,
        listOperationInput: CrudListOperationInputType,
        skip: number,
    ): Promise<BfwApiSdkResponse<any>>;
    getListingSearchFilter(input: CrudSearchFilterInputType): object[];
    getListingViewOption(input: CrudViewOptionInputType): CrudListingViewOptionResultType;
    

    create(input: CrudMutationInputType): Promise<CrudMutationResultType>;
    update(keyid: string | number,  input: CrudMutationInputType): Promise<CrudMutationResultType>;

    active(keyid: CrudRecordKeyInputType): Promise<CrudMutationResultType>;
    inactive(keyid: CrudRecordKeyInputType): Promise<CrudMutationResultType>;

    softDelete(keyid: CrudRecordKeyInputType): Promise<CrudMutationResultType>;
    restore(keyid: CrudRecordKeyInputType): Promise<CrudMutationResultType>;
    delete(keyid: CrudRecordKeyInputType): Promise<CrudMutationResultType>;
}
