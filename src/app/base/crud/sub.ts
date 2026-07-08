import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { CrudService } from "@base/crud/service";
import { CrudFindInputType, CrudStateListingFieldObjType, CrudStateMutationFieldObjType, CrudStateSearchFilterFieldObjType } from "@base/crud/type";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { CrudDataLoadTypeEnum } from "@base/crud/enum";

export interface CrudSubType {
    crud: CrudService;

    conf: ConfService;
    log: LogService;

    PrivateAreaLayoutSlotEnum: typeof PrivateAreaLayoutSlotEnum;

    LISTING_FIELD_OBJ: CrudStateListingFieldObjType;
    SEARCH_QUERY_FIELD_OBJ: CrudStateSearchFilterFieldObjType;
    MUTATION_FIELD_OBJ: CrudStateMutationFieldObjType;

    /**
     * Call to this method in the constructor
     * Priority: 1
     */
    setModuleInfo(): void;

    /**
     * Call to this method in the constructor
     * Priority: 2
     */
    alterBreadcrumb(): void;

    /**
     * Call to this method in the constructor, otherwise included in crudInit()
     * Priority: Use if required (3)
     */
    initUrlSync(): void;

    /**
     * Call to this method in the constructor
     * This method will be used to enable/disable URL sync in module 
     * This has to set just after initUrlSync()
     * As initUrlSync() by default enable url sync, to stop it we need to disable just after initUrlSync()
     * Otherwise included in crudInit()
     * Priority: Use if required (4)
     */
    enableUrlSync(flag: boolean): void;
    
    /**
     * Call to this method in the constructor at first
     * Priority: 5
     */
    crudInit(): void;

    /**
     * Call to this method in the constructor
     * Priority: 6
     */
    setPrimaryKey(): void;

    /**
     * Call to this method in the constructor
     * Priority: 7
     */
    setUniqueKey(): void;

    /**
     * Call to this method in the constructor
     * Priority: 8
     */
    initFieldObj(): void;

    /**
     * Call to this method in the constructor
     * Priority: 9
     * Must be after initFieldObj() as it requires field object to process
     * 
     * by default crud module auto detect the suitable wrapper using inbuilt logic
     * this is optional, let this module provide specific CrudActionUiLayoutEnum mutation layout type
     * genereally this is not required but override is possible as needed in this method
     */
    setMutationActionUiLayout(): void;

    /**
     * Call to this method in the constructor
     * Priority: 10
     * Must be after initFieldObj() as it requires field object to process
     * 
     * set mutation form custom component in case when module required full control over mutation form
     */
    setMutationFormCustomComponent(): void;

    /**
     * Call to this method in the constructor
     * Priority: 11
     * Must be after initFieldObj() as it requires field object to process
     * 
     * set mutation page custom component in case when module required to override default crud mutation page
     */
    setMutationPageCustomComponent(): void;

    /**
     * Call to this method in the constructor
     * Priority: 12
     */
    setListingSelectedRowsInitialSource(): void;

    /**
     * Call to this method in the constructor
     * Priority: 13
     */
    registerFind(): void;

    /**
     * Call to this method in the constructor
     * Priority: 14
     */
    initCrudStateFromUrl(): void;

    /**
     * Call to this method in the constructor
     * Priority: 15
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
     * Priority: INSIDE load() 1
     */
    syncCrudStateFromUrlState(): void;

    /**
     * Call to this method in the load()
     * This call must remain at last in load() call chain
     * This gives time to finish sync from url matrix params on initial load
     * This must be called inside load() as it's dependent on data
     * Priority: INSIDE load() 2
     */
    syncUrlStateFromCrudState(): void;

    /**
     * This method will be used to register the find
     */
    find(input: CrudFindInputType): Promise<boolean>;
}