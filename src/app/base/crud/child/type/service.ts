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
    CrudRecordKeyType,
    CrudRecordTargetInputType,
    CrudRecordTargetType,
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
    /**
     * Names the column that scopes the marker column's uniqueness group — the
     * entity's @MarkAsMainField({ ref_group_relation_field }). Call right after
     * setIsMainField(); pass null when the marker is table-wide.
     */
    setIsMainFieldRefGroupRelationField(): void;
    setRecordPositionField(): void;
    setActiveField(): void;
    setDeletedField(): void;
    /** Used to display record connectivity with various process flows */
    setLabelField(): void;
    /**
     * The COLUMN this module ADDRESSES records by — what travels in the record
     * route param, what the row menu emits, what the listing matches on, and
     * the where key for the seven record mutations.
     *
     * ⚠ CALL LAST, after every other column setter above. It names one of them
     * (or any other unique column), so it reads as their conclusion — and the
     * state setter's "can address nothing" check only holds once the rest are
     * in.
     *
     * ⚠ PICK A NOT NULL COLUMN. A row whose index is null gets no url, no ⋮
     * menu and no checkbox — it cannot be named in any where clause.
     *
     * Not optional, like everything else here — a module happy with the default
     * still states so, so the choice is visible in the constructor.
     */
    setIndexColumn(): void;

    /**
     * Optional. Opt individual actions into a full listing refetch on top of
     * their local patch — call state's setReloadListingAfterAction() here,
     * once per action that needs it. Omit entirely for the default (local
     * patch only, everywhere).
     */
    setReloadListingAfterAction?(): void;

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
     * Configure the Upload dialog's size independently from Mutation's.
     * Defaults to UiSizeEnum.SM when the child does not override it.
     */
    setUploadActionUiSize(): void;

    /**
     * Optionally replace the default Upload form body component (the one
     * rendering UPLOAD_FIELD_OBJ) when a module needs full control over it.
     * There is deliberately no setUploadPageCustomComponent() counterpart -
     * Upload has one fixed UI mode (DIALOG), never a PAGE mode.
     */
    setUploadFormCustomComponent(): void;

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
    /**
     * Register the by-COLUMN record lookup — normally reached with
     * CrudState.indexColumn(), but the handler takes whatever column CRUD
     * passes and must not assume which.
     *
     * ONE registration, not the find-by-primary/find-by-secondary pair this
     * replaced: findRecordsBy() already took a column name, so that pair was
     * two wrappers choosing which column to hand it.
     */
    registerFindByIndexColumn(): void;
    registerFind(): void;
    registerCreate(): void;
    registerUpdate(): void;
    /**
     * upload is a per-entity opt-in in the api, same precedent as
     * registerMarkAsMain(): a module whose entity has no upload-capable field
     * leaves this and upload() below INERT and keeps UPLOAD out of its route
     * actions - which keeps hasUpload() false and the menu item hidden.
     */
    registerUpload(): void;
    /**
     * Same per-entity opt-in stance as registerUpload() - a module whose
     * entity has no upload-delete-capable field leaves this and
     * uploadDelete() below INERT.
     */
    registerUploadDelete(): void;
    registerActive(): void;
    registerInactive(): void;
    /**
     * markAsMain is a per-entity opt-in in the api, not a universal operation:
     * a module whose entity has no markAsMain method leaves this and
     * markAsMain() below INERT (register nothing) and keeps MARK_AS_MAIN out of
     * its route actions — the same way setIsMainField() is declared by children
     * whose entity has no is_main column.
     */
    registerMarkAsMain(): void;
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
    /**
     * The by-COLUMN lookup registerFindByIndexColumn() hands to CRUD. It puts
     * `field` straight into the where clause rather than mapping it, so any
     * unique column on the entity works.
     */
    findRecordsBy(field: string | null, input: CrudRecordKeyInputType, fieldObj: CrudStateRecordFieldObjType): Promise<CrudRecordType[]>;

    /**
     * Expands any RELATION-shaped fr_field (a dotted path, or a FILE
     * field's flat access-url object) into its GraphQL sub-selection.
     * Spread into findRecordsBy()'s row selection,
     * and into any other query (e.g. loadListingData()) that selects the
     * same object field - one function instead of a hand-written selection
     * duplicated per query.
     *
     * A module whose entity has no relation/FILE fields needing this
     * implements it INERT (`return {};`) - same precedent as registerMarkAsMain().
     */
    getForeignRelationSelection(fieldObj: CrudStateRecordFieldObjType): Record<string, any>;

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

    /**
     * ONE SHAPE FOR EVERY RECORD MUTATION: the resolved target, never a bare
     * key. CrudActionService resolves the row once — from the clicked listing
     * row, the bulk selection, or a url lookup — and hands over BOTH key
     * readings plus the record itself, so a child posts whichever its api keys
     * on with no second fetch.
     *
     * Which one to read is the CHILD's call. Today: t.sk for update/active/
     * inactive/markAsMain/softDelete/restore/delete, because their where
     * clauses key on the `keyid` column; t.pk for upload, because
     * UploadInputDto.ref_id is the entity primary key. Those are defaults, not
     * constraints.
     *
     * ⚠ pk and sk are BOTH NULLABLE — they are read off the ROW, so an
     * unresolved record reaches the child as null. Guard it and refuse with
     * your own message rather than posting the literal "null".
     *
     * ⚠ the five bulk-capable actions take CrudRecordTargetInputType (scalar OR
     * array) and must keep deriving isBulk with Array.isArray(). A bulk action
     * on ONE row is still bulk, and the arity drives both the message set and
     * the `deleted: { nulls: true }` clause.
     */
    update(target: CrudRecordTargetType, input: CrudMutationInputType): Promise<CrudMutationResultType>;
    upload(target: CrudRecordTargetType, input: CrudMutationInputType): Promise<CrudMutationResultType>;
    uploadDelete(target: CrudRecordTargetType, fkey: string): Promise<CrudMutationResultType>;

    active(targets: CrudRecordTargetInputType): Promise<CrudMutationResultType>;
    inactive(targets: CrudRecordTargetInputType): Promise<CrudMutationResultType>;

    /**
     * SINGLE record only — one row is main per group, so never an array.
     * markAsMain is per-COLUMN in the api: markAsMainField says which marker
     * column to set, refGroupRelationFieldValue carries the clicked row's group
     * value (null when the marker declares no group relation field).
     */
    markAsMain(
        target: CrudRecordTargetType,
        markAsMainField: string,
        refGroupRelationFieldValue: string | null,
    ): Promise<CrudMutationResultType>;

    softDelete(targets: CrudRecordTargetInputType): Promise<CrudMutationResultType>;
    restore(targets: CrudRecordTargetInputType): Promise<CrudMutationResultType>;
    delete(targets: CrudRecordTargetInputType): Promise<CrudMutationResultType>;
}
