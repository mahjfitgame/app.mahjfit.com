// file: src/app/base/crud/service/entry.ts
import { effect, Service, untracked } from "@angular/core";
import { CrudActionUiLayoutEnum } from "@base/crud/enum";
import {
    CrudFieldObj,
    CrudFormFieldInfoType,
    CrudStateListingFieldObjType,
    CrudStateListOperationFieldObjType,
    CrudStateMutationFieldObjType,
    CrudStateSearchFilterFieldObjType,
    CrudStateViewFieldObjType,
    CrudStateViewOptionFieldObjType,
} from "@base/crud/type";
import { CrudRootService } from "./root";
import { CrudActionService } from "./action";
import { CrudSearchFilterService } from "./search.filter";
import { CrudListingService } from "./listing";
import { CrudMutationService } from "./mutation";
import { CrudViewService } from "./view";

@Service({ autoProvided: false })
export class CrudService extends CrudRootService {
    public readonly action: CrudActionService;
    public readonly searchFilter: CrudSearchFilterService;
    public readonly listing: CrudListingService;
    public readonly mutation: CrudMutationService;
    public readonly view: CrudViewService;

    constructor() {
        super();

        // load the crud translations first, before anything below can render a label.
        // constructor, not CrudComponent.ngOnInit - see I18nService.useModule() for why
        this.initI18n();

        this.action = new CrudActionService(this);
        this.searchFilter = new CrudSearchFilterService(this, this.action);
        this.listing = new CrudListingService(this, this.action, this.searchFilter);
        this.mutation = new CrudMutationService(this, this.action, this.listing);
        this.view = new CrudViewService(this, this.action, this.listing);

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
            const recordKey = this.action.getCrudActionRecordSecondaryKeyValue();

            untracked(() => {
                /**
                 * Route left the action URL. Was the
                 * `if (!action) clearCrudActionAndRecordKey()` branch.
                 */
                if (!action) {
                    this.mutation.closeMutationOverlay();
                    this.view.closeViewOverlay();
                    return;
                }

                if (this.mutation.isMutationActionActive()) {
                    this.view.closeViewOverlay();
                    void this.mutation.initMutationActionFromUrl(recordKey);
                    return;
                }

                if (this.view.isViewActionActive()) {
                    this.mutation.closeMutationOverlay();
                    void this.view.initViewActionFromUrl(recordKey);
                    return;
                }

                if (this.view.isPrintActionActive()) {
                    this.mutation.closeMutationOverlay();
                    this.view.closeViewOverlay();
                    void this.view.initPrintActionFromUrl(recordKey);
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

    /**
     * This methos needs to be called in child component with ngOnInit or similar.
     * It is similar to ngOnInit after setting all states like primary key, unique key, listing fields, mutation fields etc.
     * Because this method will prepare search filter fields state based on default view option fields.
     * Also apply breadcrumb if breadcrumb alias is set in route data.
     */
    public defaultInit(): void {
        // register end-side-bar close callback
        this.addEndSideBarOnCloseCallBack();
        this.mutation.addEndDrawerOnCloseCallBack();
        this.view.addViewEndDrawerOnCloseCallBack();
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

        if (listOperation) {
            // use complete new field object
            // no need to process for options and default values as its already included
            this.state.listing.setListOperationFieldObj(listOperation);
        } else {
            // use default field object
            this.state.listing.setListOperationFieldObj(this.state.listing.DEFAULT_LIST_OPERATION_FIELD_OBJ);
            this.state.listing.initListOperationFieldObj(); // process for options and default values
        }

        if (viewOption) {
            // use complete new field object
            // no need to process for options and default values as its already included
            this.state.listing.setViewOptionFieldObj(viewOption);
        } else {
            // use default field object
            this.state.listing.setViewOptionFieldObj(this.state.listing.DEFAULT_VIEW_OPTION_FIELD_OBJ);
            this.state.listing.initViewOptionFieldObj(); // process for options and default values
        }

        // resolve mutation form wrapper automatically, must keep this call here as it need MutationFieldObj
        this.mutation.resolveMutationActionUiLayout();
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ HELPER █████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public addEndSideBarOnCloseCallBack(): void {
        if (!this.paLayout) return;
        /**
         * perform required actions when end-side-bar close by registering callback
         * list all call back process this could be as per crud action wise or common
         */
        this.paLayout.state.addEndSideBarOnCloseCallback('on_mutation_close', () => {
            if (
                this.mutation.isMutationActionActive() &&
                this.state.mutation.mutationActionUiLayout() === CrudActionUiLayoutEnum.END_SIDE_BAR
            ) {
                void this.mutation.closeMutationAction();
            }
        });

        this.paLayout.state.addEndSideBarOnCloseCallback('on_view_close', () => {
            if (
                this.view.isViewActionActive() &&
                this.state.view.viewActionUiLayout() === CrudActionUiLayoutEnum.END_SIDE_BAR
            ) {
                void this.view.closeViewAction();
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
