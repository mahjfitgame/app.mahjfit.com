// file: ./src/app/base/crud/state.ts

import { computed, effect, inject, linkedSignal, Service, signal, Type } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { CrudActionRecordIdType, CrudEndDrawerOnCloseType, CrudFieldOptionType, CrudFieldSwitchOptionType, CrudFormFieldInfoType, CrudListingFormattedFieldObjType, CrudSlotFieldPortalType, CrudSlotFieldsType, CrudStateListingDataType, CrudStateListingFieldObjType, CrudStateListOperationFieldObjType, CrudStateMutationFieldObjType, CrudStateSearchFilterFieldObjType, CrudStateViewOptionFieldObjType, CrudUniqueKeyType } from "@base/crud/type";
import { CrudActionEnum, CrudActionUiLayoutEnum, CrudFieldNormalizeModeEnum, CrudFieldUiTypeEnum, CrudListingAdditionalColumnsEnum, CrudListingItemPerPageOptionEnum, CrudListOperationFieldsEnum, CrudViewOptionFieldsEnum } from "@base/crud/enum";
import { SelectionModel } from "@angular/cdk/collections";
import { MatTableDataSource } from "@angular/material/table";
import { CRUD_RECYCLE_BIN_STATUS } from "@base/crud/const";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation-module/type/state";
import { CRUD_STATE_STORE_KEY } from "./const";
@Service({ autoProvided: false })
export class CrudState extends SignalStateService implements FoundationModuleStateType {
    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████
    public override readonly storeKey = CRUD_STATE_STORE_KEY;

    // ████ CRUD OBJECTS ████████████████████████████████████████████████
    private readonly DEF_LIST_OPERATION_FIELD_OBJ: CrudStateListOperationFieldObjType = {
        quick_search: {
            label: 'Quick search',
            type: CrudFieldUiTypeEnum.TEXT,
            url_matrix_param: 'qs',
            placeholder: 'Type to search',
            hint: 'Quick search across listed records.',
            mat_icon_prepend: 'search',
            mat_icon_append: 'close',
            value: null,
            default: null,
            validation: {
                max_length: {
                    message: 'Search text is too long.',
                    value: 30
                }
            }
        },
        current_page: {
            label: 'Current page',
            type: CrudFieldUiTypeEnum.NUMBER,
            url_matrix_param: 'cp',
            value: null,
            default: null,
            validation: {
                min: {
                    message: 'Current page must be greater than zero.',
                    value: 1
                }
            }
        },
        rows_per_page: {
            label: 'Rows per page',
            type: CrudFieldUiTypeEnum.SELECT,
            url_matrix_param: 'rpp',
            value: null,
            default: null,
            option: null, // will be filled dynamically at initialization
            validation: {
                digit: {
                    message: 'Rows per page must be a number.',
                    value: null
                }
            }
        },
        listing_selected_rows: {
            label: 'Selected rows',
            type: CrudFieldUiTypeEnum.ARRAY,
            url_matrix_param: 'lsr',
            value: null,
            default: null,
            option: null, // will be filled dynamically at initialization
            apply_enc: true,
            normalize_val: (v: any, fi: CrudFormFieldInfoType, r: Record<string, any>, mode: CrudFieldNormalizeModeEnum) => {
                const toArray = (value: any): any[] => {
                    /**
                     * Because the default ARRAY normalizer runs before normalize_val,
                     * SelectionModel can arrive here as [SelectionModel].
                     */
                    if (
                        Array.isArray(value) &&
                        value.length === 1 &&
                        value[0]?.selected &&
                        Array.isArray(value[0].selected)
                    ) {
                        return value[0].selected;
                    }

                    if (value?.selected && Array.isArray(value.selected)) {
                        return value.selected;
                    }

                    if (Array.isArray(value)) {
                        return value.flatMap((item) => String(item).split(','));
                    }

                    return String(value ?? '').split(',');
                };

                const primaryKey = this?.primaryKey?.() ?? undefined;

                const listingData = this.listingData?.();
                const hasListingDataLoaded = listingData !== null && listingData !== undefined;
                const dataSource = this.listingDataSource?.();
                const rows = Array.isArray(dataSource?.data) ? dataSource.data : [];
                const loadedRowIds = new Set(
                    rows
                        .map((row: any) => this.getRecordId(row, primaryKey))
                        .filter((id: any) => id !== null && id !== undefined && String(id).trim().length > 0)
                        .map((id: any) => String(id).trim()),
                );

                /**
                 * State -> URL:
                 * Runtime value is SelectionModel rows.
                 * Return raw IDs; apply_enc=true will encrypt them after normalize_val.
                 *
                 * On first browser load / pasted URL, listingData is still null, so keep
                 * primitive pending IDs until the API response arrives. Once listing data
                 * is available, primitive pending IDs are allowed only when they still
                 * exist in the loaded rows. This removes stale/tampered lsr values from
                 * the next URL sync.
                 */
                if (mode === CrudFieldNormalizeModeEnum.STOC) {
                    const selectedItems = toArray(v);

                    const ids = selectedItems
                        .map((item) => {
                            /**
                             * If it is a row object, convert to row ID.
                             */
                            if (item && typeof item === 'object') {
                                return this.getRecordId(item, primaryKey);
                            }

                            /**
                             * If rows are not loaded yet, keep primitive pending IDs so
                             * initial URL hydration can resolve them after API data arrives.
                             */
                            const pendingId = String(item ?? '').trim();

                            return !hasListingDataLoaded || loadedRowIds.has(pendingId)
                                ? pendingId
                                : null;
                        })
                        .map((id) => String(id ?? '').trim())
                        .filter((id) => id.length > 0);

                    const uniqueIds = [...new Set(ids)];

                    return uniqueIds.length > 0 ? uniqueIds : null;
                }

                /**
                 * URL -> State:
                 * After CTOS decrypt, value is usually real row IDs.
                 * If listing data is not loaded yet, unresolved aliases/IDs are kept
                 * temporarily. This preserves real IDs when someone copy-pastes a URL
                 * and opens it in a new browser load. Once listing data is loaded, keep
                 * only IDs that match listing data so suspicious URL values are dropped
                 * and then removed from the URL by STOC sync.
                 */
                const idsOrAliases = toArray(v)
                    .map((item) => String(item ?? '').trim())
                    .filter((item) => item.length > 0);

                const uniqueIdsOrAliases = [...new Set(idsOrAliases)];

                if (uniqueIdsOrAliases.length === 0) {
                    return new SelectionModel<any>(true, []);
                }

                if (!hasListingDataLoaded) {
                    return new SelectionModel<any>(true, uniqueIdsOrAliases);
                }

                const selectedRows = uniqueIdsOrAliases
                    .map((idOrAlias) => rows.find((row: any) => {
                        const rowId = this.getRecordId(row, primaryKey);
                        return rowId !== null &&
                            rowId !== undefined &&
                            String(rowId).trim() === idOrAlias;
                    }))
                    .filter((row) => !!row);

                return new SelectionModel<any>(true, selectedRows);
            },
        },
        listing_column_position: {
            label: 'Column position',
            type: CrudFieldUiTypeEnum.MULTISELECT,
            url_matrix_param: 'lcp',
            value: null,
            default: null,
            option: null, // will be filled dynamically at initialization
            validation: {
                option_range: {
                    message: 'Invalid column selection.',
                    value: null
                }
            },
            normalize_val: (v: any, fi: CrudFormFieldInfoType, r: Record<string, any>, mode: CrudFieldNormalizeModeEnum) => {
                const selectColumn = CrudListingAdditionalColumnsEnum.RECORD_SELECT;
                const actionColumn = CrudListingAdditionalColumnsEnum.RECORD_ACTION;

                const columns = Array.isArray(v)
                    ? v.flatMap((item) => String(item).split(','))
                    : String(v ?? '').split(',');

                const normalized = columns
                    .map((column) => column.trim())
                    .filter((column) => column.length > 0)
                    .filter((column) => column !== selectColumn);

                const uniqueColumns = [...new Set(normalized)];

                /**
                 * State -> URL:
                 * URL should never contain `rs`.
                 */
                if (mode === CrudFieldNormalizeModeEnum.STOC) {
                    return uniqueColumns.length > 0 ? uniqueColumns : null;
                }

                /**
                 * URL -> State:
                 * URL does not contain `rs`, but runtime table columns need it.
                 */
                const currentColumns = this.getListingColumnPositionValue()
                    ?? this.getListingColumnPositionDefault()
                    ?? [];

                let availableColumns = currentColumns
                    .filter((column: any) => column !== selectColumn);

                if (!this.grantRecordActionColumn()) {
                    availableColumns = availableColumns
                        .filter((column: any) => column !== actionColumn);
                }

                const orderedColumns = uniqueColumns
                    .filter((column) => availableColumns.includes(column));

                const missingColumns = availableColumns
                    .filter((column: any) => !orderedColumns.includes(column));

                const nextColumns = [
                    ...orderedColumns,
                    ...missingColumns,
                ];

                if (this.grantRecordSelectionColumn()) {
                    return [
                        selectColumn,
                        ...nextColumns,
                    ];
                }

                return nextColumns;
            },
        }
    };

    private readonly DEF_VIEW_OPTION_FIELD_OBJ: CrudStateViewOptionFieldObjType = {
        view_option: {
            label: 'View Option',
            type: CrudFieldUiTypeEnum.NONE,
            url_matrix_param: null,
            mat_icon_append: 'view_carousel',
        },
        display_fields: {
            label: 'Display Fields',
            type: CrudFieldUiTypeEnum.MULTISELECT,
            placeholder: 'Select fields to display on screen',
            hint: 'Show/Hide fields in data layout.',
            url_matrix_param: 'df',
            value: null,
            default: null,
            option: null, // will be filled dynamically at initialization,
            validation: {
                option_range: {
                    message: 'Invalid field selection.',
                    value: null
                },
            }
        },
        sort_fields_and_direction: {
            label: 'Sort fields and direction',
            type: CrudFieldUiTypeEnum.MULTISELECT,
            url_matrix_param: 'sfad',
            placeholder: 'Select fields and direction to sort',
            hint: 'Sort field and direction to refine your data.',
            value: null,
            default: null,
            option: null, // will be filled dynamically at initialization
            validation: {
                option_range: {
                    message: 'Invalid sort field.',
                    value: null
                },
            }
        },
        rbin: {
            label: 'Recycle bin',
            type: CrudFieldUiTypeEnum.SWITCH,
            url_matrix_param: 'rb',
            placeholder: 'Show record in recycle bin',
            hint: 'Click to view recycle bin records.',
            value: null,
            default: null,
            option: null, // will be filled dynamically at initialization
        },
    };

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a


    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████
    private readonly _slotFields = signal<CrudSlotFieldsType | null>(null);
    public readonly slotFields = this._slotFields.asReadonly();

    private readonly _primaryKey = signal<string | null>(null);
    public readonly primaryKey = this._primaryKey.asReadonly();

    private readonly _uniqueKey = signal<CrudUniqueKeyType | null>(null);
    public readonly uniqueKey = this._uniqueKey.asReadonly();

    private readonly _crudAction = signal<CrudActionEnum | null>(null);
    public readonly crudAction = this._crudAction.asReadonly();

    private readonly _crudActionRecordId = signal<CrudActionRecordIdType>(null);
    public readonly crudActionRecordId = this._crudActionRecordId.asReadonly();

    private readonly _listingFieldObj = signal<CrudStateListingFieldObjType>({});
    public readonly listingFieldObj = this._listingFieldObj.asReadonly();

    private readonly _searchFilterFieldObj = signal<CrudStateSearchFilterFieldObjType>({});
    public readonly searchFilterFieldObj = this._searchFilterFieldObj.asReadonly();

    private readonly _mutationFieldObj = signal<CrudStateMutationFieldObjType>({});
    public readonly mutationFieldObj = this._mutationFieldObj.asReadonly();

    private readonly _viewOptionFieldObj = signal<CrudStateViewOptionFieldObjType>(this.DEF_VIEW_OPTION_FIELD_OBJ);
    public readonly viewOptionFieldObj = this._viewOptionFieldObj.asReadonly();

    private readonly _listOperationFieldObj = signal<CrudStateListOperationFieldObjType>(this.DEF_LIST_OPERATION_FIELD_OBJ);
    public readonly listOperationFieldObj = this._listOperationFieldObj.asReadonly();

    private readonly _listingData = signal<CrudStateListingDataType | null>(null);
    public readonly listingData = this._listingData.asReadonly();

    private readonly _listingDataSource = signal<MatTableDataSource<any>>(new MatTableDataSource<any>([]));
    public readonly listingDataSource = this._listingDataSource.asReadonly();

    private readonly _totalRecords = signal<number>(0);
    public readonly totalRecords = this._totalRecords.asReadonly();

    private readonly _mutationActionUiLayout = signal<CrudActionUiLayoutEnum>(CrudActionUiLayoutEnum.END_SIDE_BAR);
    public readonly mutationActionUiLayout = this._mutationActionUiLayout.asReadonly();

    private readonly _mutationFormCustomComponent = signal<Type<any> | null>(null);
    public readonly mutationFormCustomComponent = this._mutationFormCustomComponent.asReadonly();

    private readonly _mutationPageCustomComponent = signal<Type<any> | null>(null);
    public readonly mutationPageCustomComponent = this._mutationPageCustomComponent.asReadonly();

    private readonly _mutationEndDrawerOpen = signal<boolean>(false);
    public readonly mutationEndDrawerOpen = this._mutationEndDrawerOpen.asReadonly();

    private readonly _mutationEndDrawerOnClose = signal<CrudEndDrawerOnCloseType | null>(null);
    public readonly mutationEndDrawerOnClose = this._mutationEndDrawerOnClose.asReadonly();

    // Using a computed or linkedSignal if the fields ever change dynamically
    public formattedListingFields = linkedSignal(() => this.formatListingFieldObj(this.listingFieldObj() ?? {}));
    public pageSkipIndex = computed(() => this.getStatePageSkipIndex());


    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    public readonly debugState = computed(() => ({

    }));

    constructor() {
        super();

        // have to call in child as signal state fileds must be initialized, can call in parent constructor will create error
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████
    public override onActivate(): void {
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }


        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
    }
    public override onDeactivate(): void {

    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████


    // ███ SLOT FIELDS ██████████████████████████████████████████████████
    public setSlotFields(slotFields: CrudSlotFieldsType): void {
        this._slotFields.set(slotFields);
    }
    public addSlotField(key: string, portal: CrudSlotFieldPortalType): void {
        this._slotFields.update((current) => {
            return {
                ...(current ?? {}),
                [key]: portal,
            };
        })
    }
    public getSlotField(key: string): CrudSlotFieldPortalType | null {
        return this.slotFields()?.[key] ?? null;
    }
    public removeSlotField(key: string): void {
        this._slotFields.update(fields => {
            // if it's already null/undefined, there's nothing to remove
            if (!fields) return fields;

            // create a shallow copy to maintain immutability
            const updated = { ...fields };
            delete updated[key];

            return updated;
        });
    }
    public clearSlotFields(): void {
        this._slotFields.set(null);
    }


    // ███ PRIMARY KEY ████████████████████████████████████████████████████
    public setPrimaryKey(key: string): void {
        this._primaryKey.set(key);
    }



    // ███ UNIQUE KEY █████████████████████████████████████████████████████
    public setUniqueKey(arr: CrudUniqueKeyType | null): void {
        this._uniqueKey.set(arr);
    }



    // ███ CRUD ACTION █████████████████████████████████████████████████████
    public setCrudAction(action: CrudActionEnum | null): void {
        this._crudAction.set(action);
    }

    public setCrudActionRecordId(id: CrudActionRecordIdType): void {
        this._crudActionRecordId.set(id);
    }

    public clearCrudAction(): void {
        this._crudAction.set(null);
    }

    public clearCrudActionRecordId(): void {
        this._crudActionRecordId.set(null);
    }

    public clearCrudActionAndRecordId(): void {
        this.clearCrudAction();
        this.clearCrudActionRecordId();
    }



    // ███ LISTING FIELD OBJ ██████████████████████████████████████████████████
    public setListingFieldObj(finfo: CrudStateListingFieldObjType): void {
        this._listingFieldObj.set(finfo);
    }

    private formatListingFieldObj(finfo: CrudStateListingFieldObjType): CrudListingFormattedFieldObjType {
        const result: CrudListingFormattedFieldObjType = {
            schema: {}, // field_key => field_info
            labels: {}, // field_key => label
            sortable: {}, // field_key => label (but only where sort is true)
            columns: {} // field_key => label (but only 1st level of fields as columns)
        };

        // add record selection columns
        result.columns[CrudListingAdditionalColumnsEnum.RECORD_SELECT] = 'Select';
        // 1. Capture Top-Level Columns immediately
        // This only iterates the root keys once, making it very fast.
        const keys = Object.keys(finfo);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            const val = finfo[key];
            result.columns[key] = val.label;
        }
        // add record action column
        result.columns[CrudListingAdditionalColumnsEnum.RECORD_ACTION] = 'Action';


        // 2. Define recursive traversal for flattened maps
        const traverse = (obj: any) => {
            const keys = Object.keys(obj);
            const len = keys.length;
            for (let i = 0; i < len; i++) {
                const key = keys[i];
                const val = obj[key];

                // 3. Process fields that have a valid UI type
                if (val.type && val.type !== CrudFieldUiTypeEnum.NONE) {

                    // Schema Map: field_key => field_info
                    result.schema[key] = val;

                    // Labels Map: field_key => label
                    result.labels[key] = val.label;

                    // Sortable Map: field_key => label
                    if (val.sort === true) {
                        result.sortable[key] = val.label;
                    }
                }

                // 4. Recurse into sub-fields if they exist
                if (val.sub) {
                    traverse(val.sub);
                }
            }
        };

        // Start recursion
        traverse(finfo);

        return result;
    }


    // ███ SEARCH FILTER FIELD OBJ ████████████████████████████████████████████
    public setSearchFilterFieldObj(finfo: CrudStateSearchFilterFieldObjType): void {
        this._searchFilterFieldObj.set(finfo);
    }

    public updateSearchFilterFieldObj(
        key: any,
        updates: Partial<CrudFormFieldInfoType>
    ): void {
        this._searchFilterFieldObj.update((finfo) => {
            // if the main object is empty, or the specific key is missing, return unchanged state
            if (!finfo || !(key in finfo)) {
                return finfo;
            }

            return {
                ...finfo,
                [key]: {
                    ...finfo[key],
                    ...updates
                }
            };
        });
    }




    // ███ MUTATION FIELD OBJ █████████████████████████████████████████████████
    public setMutationFieldObj(finfo: CrudStateMutationFieldObjType): void {
        this._mutationFieldObj.set(finfo);
    }

    public updateMutationFieldObj(
        key: any,
        updates: Partial<CrudFormFieldInfoType>
    ): void {
        this._mutationFieldObj.update((finfo) => {
            // if the main object is empty, or the specific key is missing, return unchanged state
            if (!finfo || !(key in finfo)) {
                return finfo;
            }

            return {
                ...finfo,
                [key]: {
                    ...finfo[key],
                    ...updates
                }
            };
        });
    }


    // ███ VIEW OPTION FIELD OBJ ██████████████████████████████████████████████
    public setViewOptionFieldObj(finfo: CrudStateViewOptionFieldObjType): void {
        this._viewOptionFieldObj.set(finfo);
    }

    public initViewOptionFieldObj(): void {
        // DISPLAY_FIELDS
        this.setDisplayFieldsOption();
        this.setDisplayFieldsDefault();
        const def = this.getDisplayFieldsDefault();
        this.setDisplayFieldsValue(def);

        // SORT_FIELDS_AND_DIRECTION
        this.setSortFieldsAndDirectionOption();
        this.setSortFieldsAndDirectionDefault();
        const def2 = this.getSortFieldsAndDirectionDefault();
        this.setSortFieldsAndDirectionValue(def2);

        // RBIN
        this.setRbinOption();
        this.setRbinDefault();
        const def3 = this.getRbinDefault();
        this.setRbinValue(def3);
    }

    public updateViewOptionFieldObj(
        key: CrudViewOptionFieldsEnum,
        updates: Partial<CrudFormFieldInfoType>
    ): void {
        this._viewOptionFieldObj.update((finfo) => {
            // if the main object is empty, or the specific key is missing, return unchanged state
            if (!finfo || !(key in finfo)) {
                return finfo;
            }

            return {
                ...finfo,
                [key]: {
                    ...finfo[key],
                    ...updates
                }
            };
        });
    }

    // DISPLAY_FIELDS
    public setDisplayFieldsOption(option?: CrudFieldOptionType): void {
        if (!option) {
            option = this.formattedListingFields().labels;
        }

        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.DISPLAY_FIELDS, {
            option: option
        });
    }
    public setDisplayFieldsDefault(def?: string[]): void {
        if (!def || def.length === 0) {
            def = Object.keys(this.formattedListingFields().labels);
        }
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.DISPLAY_FIELDS, {
            default: def
        });
    }
    public setDisplayFieldsValue(value: string[] | null): void {
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.DISPLAY_FIELDS, {
            value: value
        });
    }
    public getDisplayFieldsUrlMatrixParam(): string | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.display_fields?.url_matrix_param;
    }
    public getDisplayFieldsOption(): Record<string, string> {
        const finfo = this.viewOptionFieldObj();
        return finfo.display_fields?.option as Record<string, string>;
    }
    public getDisplayFieldsDefault(): string[] | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.display_fields?.default;
    }
    public getDisplayFieldsValue(): string[] | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.display_fields?.value;
    }

    // SORT_FIELDS_AND_DIRECTION
    public setSortFieldsAndDirectionOption(option?: CrudFieldOptionType): void {
        // TODO: here need to update the logic as we need to allow multiple fields with 2 direction
        // this is just temporary logic
        if (!option) {
            option = this.formattedListingFields().sortable;
        }
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.SORT_FIELDS_AND_DIRECTION, {
            option: option
        });
    }
    public setSortFieldsAndDirectionDefault(def?: string[]): void {
        if (!def || def.length === 0) {
            def = Object.keys(this.formattedListingFields().sortable);
        }
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.SORT_FIELDS_AND_DIRECTION, {
            default: def
        });
    }
    public setSortFieldsAndDirectionValue(value: string[] | null): void {
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.SORT_FIELDS_AND_DIRECTION, {
            value: value
        });
    }
    public getSortFieldsAndDirectionUrlMatrixParam(): string | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_fields_and_direction?.url_matrix_param;
    }
    public getSortFieldsAndDirectionOption(): Record<string, string> {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_fields_and_direction?.option as Record<string, string>;
    }
    public getSortFieldsAndDirectionDefault(): string[] | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_fields_and_direction?.default;
    }
    public getSortFieldsAndDirectionValue(): string[] | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_fields_and_direction?.value;
    }


    // RBIN
    public setRbinOption(option?: CrudFieldSwitchOptionType): void {
        if (!option) {
            option = CRUD_RECYCLE_BIN_STATUS;
        }
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.RBIN, {
            option: option
        });
    }
    public setRbinDefault(def: number = CRUD_RECYCLE_BIN_STATUS.off as number): void {
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.RBIN, {
            default: def
        });
    }
    public setRbinValue(value: number): void {
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.RBIN, {
            value: value
        });
    }
    public getRbinUrlMatrixParam(): string | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.rbin?.url_matrix_param;
    }
    public getRbinDefault(): number {
        const finfo = this.viewOptionFieldObj();
        return finfo.rbin?.default;
    }
    public getRbinValue(): number {
        const finfo = this.viewOptionFieldObj();
        return finfo.rbin?.value;
    }



    // ███ LIST OPERATION FIELD OBJ █████████████████████████████████████████████████
    public setListOperationFieldObj(finfo: CrudStateListOperationFieldObjType): void {
        this._listOperationFieldObj.set(finfo);
    }

    public initListOperationFieldObj(): void {
        // QUICK_SEARCH
        this.setQuickSearchOption();
        this.setQuickSearchDefault();
        this.setQuickSearchValue(null);

        // LISTING_COLUMN_POSITION
        this.setListingColumnPositionOption();
        this.setListingColumnPositionDefault();
        const def = this.getListingColumnPositionDefault();
        this.setListingColumnPositionValue(def);

        // ROWS_PER_PAGE
        this.setRowsPerPageOption();
        this.setRowsPerPageDefault();
        const def2 = this.getRowsPerPageDefault();
        this.setRowsPerPageValue(def2);

        // CURRENT_PAGE
        this.setCurrentPageDefault();
        const def3 = this.getCurrentPageDefault();
        this.setCurrentPageValue(def3);

        // LISTING_SELECTED_ROWS
        this.setListingSelectedRowsValue();
    }

    public updateListOperationFieldObj(
        key: CrudListOperationFieldsEnum,
        updates: Partial<CrudFormFieldInfoType>
    ): void {
        this._listOperationFieldObj.update((finfo) => {
            // if the main object is empty, or the specific key is missing, return unchanged state
            if (!finfo || !(key in finfo)) {
                return finfo;
            }

            return {
                ...finfo,
                [key]: {
                    ...finfo[key],
                    ...updates
                }
            };
        });
    }


    // QUICK_SEARCH
    public setQuickSearchOption(option: CrudFieldOptionType = {}): void {
        const key = CrudListOperationFieldsEnum.QUICK_SEARCH;


        // not in use just for reference of how to update specific field in state
        // with new option without losing other properties of that field

        // There are 2 different behaviour to update state for specific field

        /**
         * ONLY UPDATE SPECIFIC
         * VERY PRECISE
         */
        /*
        // To perform that "Very Precise" update (where you keep sibling properties like field but replace static),
        // you must retrieve the existing object from the [first layer] before calling the update method.
        const currentField = this.listOperationFields()[key]; // Get the current state
        this.updateListOperationField(key, {
            option: {
                // to keep copy existing option other properties need to pass otherwise they will be lost
                // if you will not pass [...currentField?.option] entire [option] will be replaced
                // so, use as per desire behaviour
                ...currentField?.option,
                static: option // replace the 'static' property only not entire [option]
            }
        });
        */

        /**
         * UPDATE ENTIRE OPTION
         * THIS IS OUR USE CASE FO NOW
        */
        this.updateListOperationFieldObj(key, {
            option: option
        });
    }
    public setQuickSearchDefault(def: string | null = null): void {
        // not in use just for reference of how to update specific field in state
        // with new option without losing other properties of that field

        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.QUICK_SEARCH, {
            default: def
        });
    }
    public setQuickSearchValue(value: string | null): void {
        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.QUICK_SEARCH, {
            value: value
        });
    }
    public getUrlMatrixParam(): string | null {
        const finfo = this.listOperationFieldObj();
        return finfo.quick_search?.url_matrix_param;
    }
    public getQuickSearchValue(): string | null {
        const finfo = this.listOperationFieldObj();
        return finfo.quick_search?.value;
    }


    // LISTING_COLUMN_POSITION
    public setListingColumnPositionOption(option?: CrudFieldOptionType): void {
        // set default options
        if (!option) {
            option = this.formattedListingFields().columns;
        }

        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.LISTING_COLUMN_POSITION, {
            option: option
        });
    }
    public setListingColumnPositionDefault(def?: string[]): void {
        if (!def || def.length === 0) {
            let columns: string[] = [];
            const moduleColumns = this.formattedListingFields().columns;

            // check the bulk action permission
            if (!this.grantRecordSelectionColumn()) {
                delete moduleColumns[CrudListingAdditionalColumnsEnum.RECORD_SELECT];
            }

            // check the record action permission
            if (!this.grantRecordActionColumn()) {
                delete moduleColumns[CrudListingAdditionalColumnsEnum.RECORD_ACTION];
            }

            // as object is ready get all keys for options of column position
            columns.push(...Object.keys(moduleColumns));
            def = columns;
        }

        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.LISTING_COLUMN_POSITION, {
            default: def
        });
    }
    public setListingColumnPositionValue(value: string[] | null): void {
        // check the bulk action permission
        if (!this.grantRecordSelectionColumn()) {
            value = value?.filter(column => column !== CrudListingAdditionalColumnsEnum.RECORD_SELECT) ?? value;
        }

        // check the record action permission
        if (!this.grantRecordActionColumn()) {
            value = value?.filter(column => column !== CrudListingAdditionalColumnsEnum.RECORD_ACTION) ?? value;
        }

        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.LISTING_COLUMN_POSITION, {
            value: value
        });
    }
    public getListingColumnPositionUrlMatrixParam(): string | null {
        const finfo = this.listOperationFieldObj();
        return finfo.listing_column_position?.url_matrix_param;
    }
    public getListingColumnPositionOption(): number[] {
        const finfo = this.listOperationFieldObj();
        return finfo.listing_column_position?.option as number[];
    }
    public getListingColumnPositionDefault(): string[] | null {
        const finfo = this.listOperationFieldObj();
        return finfo.listing_column_position?.default;
    }
    public getListingColumnPositionValue(): string[] {
        const finfo = this.listOperationFieldObj();
        return finfo.listing_column_position?.value;
    }


    // ROWS_PER_PAGE
    public setRowsPerPageOption(option?: object): void {
        if (!option) {
            option = CrudListingItemPerPageOptionEnum;

            // This creates the clean { "KEY": value } object from enum
            option = Object.fromEntries(
                Object.entries(option).filter(([key, val]) => typeof val === 'number')
            );
        }

        // convert object to array with all possible page numbers
        const arr = Object.values(option);

        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.ROWS_PER_PAGE, {
            option: arr
        });
    }
    public setRowsPerPageDefault(def?: number): void {
        if (!def) {
            def = this.conf.numOfRecordsPerPage ?? CrudListingItemPerPageOptionEnum.TWENTY_FIVE;
        }
        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.ROWS_PER_PAGE, {
            default: Number(def)
        });
    }
    public setRowsPerPageValue(value: number): void {
        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.ROWS_PER_PAGE, {
            value: Number(value)
        });
    }
    public getRowsPerPageUrlMatrixParam(): string | null {
        const finfo = this.listOperationFieldObj();
        return finfo.rows_per_page?.url_matrix_param as string;
    }
    public getRowsPerPageOption(): number[] {
        const finfo = this.listOperationFieldObj();
        return finfo.rows_per_page?.option as number[];
    }
    public getRowsPerPageDefault(): number {
        const finfo = this.listOperationFieldObj();
        return finfo.rows_per_page?.default as number;
    }
    public getRowsPerPageValue(): number {
        const finfo = this.listOperationFieldObj();
        return finfo.rows_per_page?.value as number;
    }


    // CURRENT_PAGE [no need to option and default method implementation]
    public setCurrentPageDefault(def: number = 1): void {
        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.CURRENT_PAGE, {
            default: Number(def)
        });
    }
    public setCurrentPageValue(value: number): void {
        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.CURRENT_PAGE, {
            value: Number(value)
        });
    }
    public getCurrentPageUrlMatrixParam(): string | null {
        const finfo = this.listOperationFieldObj();
        return finfo.current_page?.url_matrix_param as string;
    }
    public getCurrentPageDefault(): number {
        const finfo = this.listOperationFieldObj();
        return finfo.current_page?.default as number;
    }
    public getCurrentPageValue(): number {
        const finfo = this.listOperationFieldObj();
        return finfo.current_page?.value as number;
    }


    // LISTING_SELECTED_ROWS [no need to option and default method implementation]
    public setListingSelectedRowsValue<T>(rows?: T[]): void {
        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.LISTING_SELECTED_ROWS, {
            value: new SelectionModel<T>(true, rows ?? [])
        });
    }
    public getListingSelectedRowsUrlMatrixParam(): string | null {
        const finfo = this.listOperationFieldObj();
        return finfo.listing_selected_rows?.url_matrix_param as string;
    }
    public getListingSelectedRowsValue<T>(): SelectionModel<T> {
        const finfo = this.listOperationFieldObj();
        return finfo.listing_selected_rows?.value as SelectionModel<T>;
    }


    // ███ LISTING DATA ██████████████████████████████████████████████████████
    public setListingData(data: CrudStateListingDataType): void {
        this._listingData.set(data);
    }


    // ███ LISTING DATA SOURCE ███████████████████████████████████████████████
    public setListingDataSource<T>(rows?: T[]): void {
        this._listingDataSource.set(new MatTableDataSource<T>(rows ?? []));
    }



    // ████ TOTAL RECORDS ███████████████████████████████████████████████████
    public setTotalRecords(total: number): void {
        this._totalRecords.set(total);
    }


    // ███ MUTATION ACTION █████████████████████████████████████████████████
    public setMutationActionUiLayout(type: CrudActionUiLayoutEnum): void {
        this._mutationActionUiLayout.set(type);
    }

    public setMutationFormCustomComponent(component: Type<any> | null): void {
        this._mutationFormCustomComponent.set(component);
    }

    public setMutationPageCustomComponent(component: Type<any> | null): void {
        this._mutationPageCustomComponent.set(component);
    }

    public setMutationEndDrawerOpen(open: boolean): void {
        this._mutationEndDrawerOpen.set(open);
    }

    public setMutationEndDrawerOnClose(onClose: CrudEndDrawerOnCloseType): void {
        this._mutationEndDrawerOnClose.set(onClose);
    }
    public addMutationEndDrawerOnClose(key: string, fn: (() => void)): void {
        this._mutationEndDrawerOnClose.update(onClose => {
            // if onClose is null/undefined, fall back to an empty object
            return {
                ...(onClose ?? {}),
                [key]: fn
            };
        });
    }
    public removeMutationEndDrawerOnClose(key: keyof CrudEndDrawerOnCloseType): void {
        this._mutationEndDrawerOnClose.update(onClose => {
            // if it's already null/undefined, there's nothing to remove
            if (!onClose) return onClose;

            // create a shallow copy to maintain immutability
            const updated = { ...onClose };
            delete updated[key];

            return updated;
        });
    }
    public runMutationEndDrawerOnCloseCallBack(): void {
        for (const key in this.mutationEndDrawerOnClose()) {
            this.mutationEndDrawerOnClose()?.[key]?.();
        }
    }



    // ██████████████████████████████████████████████████████████████████████████



    // ████ COMPUTED AND LINKEDSIGNAL FIELDS ████████████████████████████████████
    public getPageSkipIndex(page: number, pageSize: number): number {
        return (page - 1) * pageSize;
    }
    private getStatePageSkipIndex(): number {
        return this.getPageSkipIndex(this.getCurrentPageValue(), this.getRowsPerPageValue());
    }

    // ████ ACCESS PERMISSION ███████████████████████████████████████████████████
    public grantRecordSelectionColumn(): boolean {
        if (this.primaryKey()) {
            // TODO: need to check user permissions and draft logic here
            return true;
        }
        return false;
    }

    public grantRecordActionColumn(): boolean {
        if (this.primaryKey()) {
            // TODO: need to check user permissions and draft logic here
            return true;
        }
        return false;
    }

    // ████ HELPER ███████████████████████████████████████████████████
    public getRecordId(row: any, rowIdField?: string): string | null {
        // get primary key field name from state
        const pkf = this.primaryKey();

        // check for rowIdKey fields name, default to state
        if (!rowIdField && pkf) {
            rowIdField = pkf;
        }

        // if still no id, then return null
        if ((!rowIdField || rowIdField === '') && (!pkf || pkf === '')) {
            return null;
        }

        const value = (rowIdField as string)
            .split('.') // nested property paths, not only simple keys. smaple [user.id]
            .reduce((current, key) => current?.[key], row);

        if (value === null || value === undefined || value === '') {
            return null;
        }
        return String(value);
    }


    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
