// file: src/app/base/crud/sub/service.ts
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { CrudService } from "@base/crud/service";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { CrudFindInputType } from "@base/crud/type";

export interface CrudChildServiceType {
    crud: CrudService;

    conf: ConfService;
    log: LogService;

    PrivateAreaLayoutSlotEnum: typeof PrivateAreaLayoutSlotEnum;

    /**
     * Call to this method in the constructor at first
     */
    crudInit(): void;

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

    /**
     * Call to this method in the constructor
     */
    setPrimaryKey(): void;

    /**
     * Call to this method in the constructor, right after setPrimaryKey().
     *
     * The secondary key is what CRUD addresses records by — action urls, the
     * lsr selection param, the edit link. It must arrive with every find()
     * row, same as the primary key, or those all resolve to null.
     */
    setSecondaryKey(): void;

    /**
     * Call to this method in the constructor
     */
    setUniqueKey(): void;

    /**
     * Call to these methods in the constructor, right after setUniqueKey().
     *
     * Each one names a well-known column for CRUD (url slug, main flag, manual
     * sort position, active stamp, soft delete stamp). Defaults live in
     * FoundationFieldDefaultNameEnum; a module whose column is spelled
     * differently passes its own name, and one that has no such column passes
     * null.
     */
    setUrlSlugField(): void;

    setIsMainField(): void;

    setRecordPositionField(): void;

    setActiveField(): void;

    setDeletedField(): void;

    /**
     * Call to this method in the constructor
     */
    setFieldObj(): void;

    /**
     * Call to this method in constructor()
     * Must be after initisation of setFieldObj() as it requires field object to process
     * this is required to generate search form in ui and also handle its submit
     * call after initCrudStateFromUrl()
     */
    setSearchFormLayout(): void;
    

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

    /**
     * Call to this method in the constructor
     */
    setListingSelectedRowsInitialSource(): void;

    /**
     * Call to this method in the constructor
     */
    registerFind(): void;

    /**
     * Call to this method in the constructor
     */
    initCrudStateFromUrl(): void;

    /**
     * Call to this method in the constructor
     */
    initialLoad(): Promise<boolean>;

    /**
     * DEPENDENT CALLS AFTER DATA LOAD
     * All of those call which are dependent on data must be placed inside load() call chain
     * as data required await and constructor do not support await
     * due to await issue we have to call those methods inside load()
     */

    /** 
     * Call to this method in the load()
     * This must be called inside load() as it's dependent on data
     */
    syncCrudStateFromUrlState(): void;

    /**
     * Call to this method in the load()
     * This call must remain at last in load() call chain
     * This gives time to finish sync from url matrix params on initial load
     * This must be called inside load() as it's dependent on data
     */
    syncUrlStateFromCrudState(): void;

    /**
     * This method will be used to register the find
     */
    find(input: CrudFindInputType): Promise<boolean>;
}