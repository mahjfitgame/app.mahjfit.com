// file: src/app/base/crud/state/listing.ts

import { computed, Injector, linkedSignal, Signal, signal } from "@angular/core";
import { FieldTree, form, validate } from "@angular/forms/signals";
import { SelectionModel } from "@angular/cdk/collections";
import { MatTableDataSource } from "@angular/material/table";
import { CrudFieldOptionType, CrudFormFieldInfoType, CrudListingFormattedFieldObjType, CrudListingStateType, CrudListingViewOptionResultType, CrudModuleContextType, CrudStateFormFieldObjType, CrudStateListingDataType, CrudStateListingFieldObjType, CrudStateListingSearchFieldObjType, CrudStateListOperationFieldObjType, CrudStateViewOptionFieldObjType, CrudViewOptionInputType } from "@base/crud/type";
import { CrudFieldNormalizeModeEnum, CrudFieldUiTypeEnum, CrudListingAdditionalColumnsEnum, CrudListingItemPerPageOptionEnum, CrudListingSearchFormGroupKeyEnum, CrudListOperationFieldsEnum, CrudViewOptionFieldsEnum } from "@base/crud/enum";
import { CRUD_RECORD_SORT_DIRECTION_OPTION } from "@base/crud/const";
import { RecordSortDirectionEnum, RecordSortNullPositionEnum } from "@bfw/api-sdk/graphql/libs/crud.enum";
import { CrudValidation } from "../validation";
import { CrudRootState } from "./root";
import { CrudSearchFilterState } from "./search.filter";
import { CrudActionState } from "./action";

export class CrudListingState implements CrudListingStateType {
    constructor(
        private readonly root: CrudRootState,
        private readonly action: CrudActionState,
        private readonly crudInjector: Injector,
        private readonly validation: CrudValidation,
        private readonly searchFilter: CrudSearchFilterState,
    ) {}

    public readonly DEFAULT_LIST_OPERATION_FIELD_OBJ: CrudStateListOperationFieldObjType = {
        quick_search: {
            label: 'CRUD.LIST_OPERATION.QUICK_SEARCH.LABEL',
            type: CrudFieldUiTypeEnum.TEXT,
            url_matrix_param: 'qs',
            placeholder: 'CRUD.LIST_OPERATION.QUICK_SEARCH.PLACEHOLDER',
            hint: 'CRUD.LIST_OPERATION.QUICK_SEARCH.HINT',
            mat_icon_prepend: 'search',
            mat_icon_append: 'close',
            value: null,
            default: null,
            validation: {
                max_length: {
                    message: 'CRUD.LIST_OPERATION.QUICK_SEARCH.VALIDATION.MAX_LENGTH',
                    value: 30
                }
            }
        },
        current_page: {
            label: 'CRUD.LIST_OPERATION.CURRENT_PAGE.LABEL',
            type: CrudFieldUiTypeEnum.NUMBER,
            url_matrix_param: 'cp',
            value: null,
            default: null,
            validation: {
                min: {
                    message: 'CRUD.LIST_OPERATION.CURRENT_PAGE.VALIDATION.MIN',
                    value: 1
                }
            }
        },
        rows_per_page: {
            label: 'CRUD.LIST_OPERATION.ROWS_PER_PAGE.LABEL',
            type: CrudFieldUiTypeEnum.SELECT,
            url_matrix_param: 'rpp',
            value: null,
            default: null,
            option: null, // will be filled dynamically at initialization
            validation: {
                digit: {
                    message: 'CRUD.LIST_OPERATION.ROWS_PER_PAGE.VALIDATION.DIGIT',
                    value: null
                }
            }
        },
        listing_selected_rows: {
            label: 'CRUD.LIST_OPERATION.LISTING_SELECTED_ROWS.LABEL',
            type: CrudFieldUiTypeEnum.ARRAY,
            url_matrix_param: 'lsr',
            value: null,
            default: null,
            option: null, // will be filled dynamically at initialization
            apply_enc: false,
            /**
             * ▼ PARKED — PRIMARY KEY VARIANT, kept verbatim ▼
             *
             * This is the normalize_val that shipped while lsr carried the
             * PRIMARY key behind an encId/descId alias. It pairs with
             * apply_enc: true and is preserved exactly as it ran.
             * 
             * apply_enc: true is not needed here, it is just for security reason
             *
             * To go back to primary-key addressing: uncomment this block,
             * comment the live one below, and set apply_enc back to true.
             *
             * Line comments, not a block comment — the body contains its own
             * block comments, so a wrapping block comment would close early.
             */
            // normalize_val: (v: any, fi: CrudFormFieldInfoType, r: Record<string, any>, mode: CrudFieldNormalizeModeEnum) => {
            //     const toArray = (value: any): any[] => {
            //         /**
            //          * Because the default ARRAY normalizer runs before normalize_val,
            //          * SelectionModel can arrive here as [SelectionModel].
            //          */
            //         if (
            //             Array.isArray(value) &&
            //             value.length === 1 &&
            //             value[0]?.selected &&
            //             Array.isArray(value[0].selected)
            //         ) {
            //             return value[0].selected;
            //         }
            //
            //         if (value?.selected && Array.isArray(value.selected)) {
            //             return value.selected;
            //         }
            //
            //         if (Array.isArray(value)) {
            //             return value.flatMap((item) => String(item).split(','));
            //         }
            //
            //         return String(value ?? '').split(',');
            //     };
            //
            //     const primaryKey = this.root?.primaryKey?.() ?? undefined;
            //
            //     const listingData = this.listingData?.();
            //     const hasListingDataLoaded = listingData !== null && listingData !== undefined;
            //     const dataSource = this.listingDataSource?.();
            //     const rows = Array.isArray(dataSource?.data) ? dataSource.data : [];
            //     const loadedRowIds = new Set(
            //         rows
            //             .map((row: any) => this.root.getRecordPrimaryKeyValue(row, primaryKey))
            //             .filter((id: any) => id !== null && id !== undefined && String(id).trim().length > 0)
            //             .map((id: any) => String(id).trim()),
            //     );
            //
            //     /**
            //      * State -> URL:
            //      * Runtime value is SelectionModel rows.
            //      * Return raw IDs; apply_enc=true will encrypt them after normalize_val.
            //      *
            //      * On first browser load / pasted URL, listingData is still null, so keep
            //      * primitive pending IDs until the API response arrives. Once listing data
            //      * is available, primitive pending IDs are allowed only when they still
            //      * exist in the loaded rows. This removes stale/tampered lsr values from
            //      * the next URL sync.
            //      */
            //     if (mode === CrudFieldNormalizeModeEnum.STOC) {
            //         const selectedItems = toArray(v);
            //
            //         const ids = selectedItems
            //             .map((item) => {
            //                 /**
            //                  * If it is a row object, convert to row ID.
            //                  */
            //                 if (item && typeof item === 'object') {
            //                     return this.root.getRecordPrimaryKeyValue(item, primaryKey);
            //                 }
            //
            //                 /**
            //                  * If rows are not loaded yet, keep primitive pending IDs so
            //                  * initial URL hydration can resolve them after API data arrives.
            //                  */
            //                 const pendingId = String(item ?? '').trim();
            //
            //                 return !hasListingDataLoaded || loadedRowIds.has(pendingId)
            //                     ? pendingId
            //                     : null;
            //             })
            //             .map((id) => String(id ?? '').trim())
            //             .filter((id) => id.length > 0);
            //
            //         const uniqueIds = [...new Set(ids)];
            //
            //         return uniqueIds.length > 0 ? uniqueIds : null;
            //     }
            //
            //     /**
            //      * URL -> State:
            //      * After CTOS decrypt, value is usually real row IDs.
            //      * If listing data is not loaded yet, unresolved aliases/IDs are kept
            //      * temporarily. This preserves real IDs when someone copy-pastes a URL
            //      * and opens it in a new browser load. Once listing data is loaded, keep
            //      * only IDs that match listing data so suspicious URL values are dropped
            //      * and then removed from the URL by STOC sync.
            //      */
            //     const idsOrAliases = toArray(v)
            //         .map((item) => String(item ?? '').trim())
            //         .filter((item) => item.length > 0);
            //
            //     const uniqueIdsOrAliases = [...new Set(idsOrAliases)];
            //
            //     if (uniqueIdsOrAliases.length === 0) {
            //         return new SelectionModel<any>(true, []);
            //     }
            //
            //     if (!hasListingDataLoaded) {
            //         return new SelectionModel<any>(true, uniqueIdsOrAliases);
            //     }
            //
            //     const selectedRows = uniqueIdsOrAliases
            //         .map((idOrAlias) => rows.find((row: any) => {
            //             const rowId = this.root.getRecordPrimaryKeyValue(row, primaryKey);
            //             return rowId !== null &&
            //                 rowId !== undefined &&
            //                 String(rowId).trim() === idOrAlias;
            //         }))
            //         .filter((row) => !!row);
            //
            //     return new SelectionModel<any>(true, selectedRows);
            // },
            /**
             * SECONDARY KEY variant. Same shape and same guard rails as the
             * parked one above; the only difference is which key identifies a
             * row, and that no alias round trip is involved any more.
             */
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

                const secondaryKey = this.root?.secondaryKey?.() ?? undefined;

                const listingData = this.listingData?.();
                const hasListingDataLoaded = listingData !== null && listingData !== undefined;
                const dataSource = this.listingDataSource?.();
                const rows = Array.isArray(dataSource?.data) ? dataSource.data : [];
                const loadedRowKeys = new Set(
                    rows
                        .map((row: any) => this.root.getRecordSecondaryKeyValue(row, secondaryKey))
                        .filter((key: any) => key !== null && key !== undefined && String(key).trim().length > 0)
                        .map((key: any) => String(key).trim()),
                );

                /**
                 * State -> URL:
                 * Runtime value is SelectionModel rows.
                 * Return raw SECONDARY keys. apply_enc is false, so what this
                 * returns is literally what lands in the URL — no encId pass
                 * runs after this any more.
                 *
                 * On first browser load / pasted URL, listingData is still null, so keep
                 * primitive pending keys until the API response arrives. Once listing data
                 * is available, primitive pending keys are allowed only when they still
                 * exist in the loaded rows. This removes stale/tampered lsr values from
                 * the next URL sync.
                 */
                if (mode === CrudFieldNormalizeModeEnum.STOC) {
                    const selectedItems = toArray(v);

                    const keys = selectedItems
                        .map((item) => {
                            /**
                             * If it is a row object, convert to row secondary key.
                             */
                            if (item && typeof item === 'object') {
                                return this.root.getRecordSecondaryKeyValue(item, secondaryKey);
                            }

                            /**
                             * If rows are not loaded yet, keep primitive pending keys so
                             * initial URL hydration can resolve them after API data arrives.
                             */
                            const pendingKey = String(item ?? '').trim();

                            return !hasListingDataLoaded || loadedRowKeys.has(pendingKey)
                                ? pendingKey
                                : null;
                        })
                        .map((key) => String(key ?? '').trim())
                        .filter((key) => key.length > 0);

                    const uniqueKeys = [...new Set(keys)];

                    return uniqueKeys.length > 0 ? uniqueKeys : null;
                }

                /**
                 * URL -> State:
                 * With apply_enc false the value arrives as plain secondary keys,
                 * no decrypt step in front of it.
                 * If listing data is not loaded yet, unresolved keys are kept
                 * temporarily. This preserves real keys when someone copy-pastes a URL
                 * and opens it in a new browser load. Once listing data is loaded, keep
                 * only keys that match listing data so suspicious URL values are dropped
                 * and then removed from the URL by STOC sync.
                 */
                const urlKeys = toArray(v)
                    .map((item) => String(item ?? '').trim())
                    .filter((item) => item.length > 0);

                const uniqueUrlKeys = [...new Set(urlKeys)];

                if (uniqueUrlKeys.length === 0) {
                    return new SelectionModel<any>(true, []);
                }

                if (!hasListingDataLoaded) {
                    return new SelectionModel<any>(true, uniqueUrlKeys);
                }

                const selectedRows = uniqueUrlKeys
                    .map((urlKey) => rows.find((row: any) => {
                        const rowKey = this.root.getRecordSecondaryKeyValue(row, secondaryKey);
                        return rowKey !== null &&
                            rowKey !== undefined &&
                            String(rowKey).trim() === urlKey;
                    }))
                    .filter((row) => !!row);

                return new SelectionModel<any>(true, selectedRows);
            },
        },
        listing_column_position: {
            label: 'CRUD.LIST_OPERATION.LISTING_COLUMN_POSITION.LABEL',
            type: CrudFieldUiTypeEnum.MULTISELECT,
            url_matrix_param: 'lcp',
            value: null,
            default: null,
            option: null, // will be filled dynamically at initialization
            validation: {
                option_range: {
                    message: 'CRUD.LIST_OPERATION.LISTING_COLUMN_POSITION.VALIDATION.OPTION_RANGE',
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

                if (!this.action.hasRecordAction()) {
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

                if (this.action.hasRecordSelectionAction()) {
                    return [
                        selectColumn,
                        ...nextColumns,
                    ];
                }

                return nextColumns;
            },
        }
    };

    public readonly DEFAULT_VIEW_OPTION_FIELD_OBJ: CrudStateViewOptionFieldObjType = {
        view_option: {
            label: 'CRUD.VIEW_OPTION.VIEW_OPTION.LABEL',
            type: CrudFieldUiTypeEnum.NONE,
            url_matrix_param: null,
            mat_icon_append: 'view_carousel',
        },
        display_fields: {
            label: 'CRUD.VIEW_OPTION.DISPLAY_FIELDS.LABEL',
            type: CrudFieldUiTypeEnum.MULTISELECT,
            placeholder: 'CRUD.VIEW_OPTION.DISPLAY_FIELDS.PLACEHOLDER',
            hint: 'CRUD.VIEW_OPTION.DISPLAY_FIELDS.HINT',
            url_matrix_param: 'df',
            value: null,
            default: null,
            option: null, // will be filled dynamically at initialization, initViewOptionFieldObj()
            validation: {
                option_range: {
                    message: 'CRUD.VIEW_OPTION.DISPLAY_FIELDS.VALIDATION.OPTION_RANGE',
                    value: null
                },
            }
        },
        sort_fields: {
            label: 'CRUD.VIEW_OPTION.SORT_FIELDS.LABEL',
            type: CrudFieldUiTypeEnum.SELECT,
            url_matrix_param: 'sf',
            placeholder: 'CRUD.VIEW_OPTION.SORT_FIELDS.PLACEHOLDER',
            hint: 'CRUD.VIEW_OPTION.SORT_FIELDS.HINT',
            value: null,
            default: null,
            option: null, // will be filled dynamically at initialization, initViewOptionFieldObj()
            validation: {
                option_range: {
                    message: 'CRUD.VIEW_OPTION.SORT_FIELDS.VALIDATION.OPTION_RANGE',
                    value: null
                },
            }
        },
        sort_direction: {
            label: 'CRUD.VIEW_OPTION.SORT_DIRECTION.LABEL',
            type: CrudFieldUiTypeEnum.BUTTON_SELECT,
            url_matrix_param: 'sd',
            hint: 'CRUD.VIEW_OPTION.SORT_DIRECTION.HINT',
            value: RecordSortDirectionEnum.DESC,
            default: RecordSortDirectionEnum.DESC,
            option: CRUD_RECORD_SORT_DIRECTION_OPTION,
            select: {
                clearable: false,
            },
            validation: {
                option_range: {
                    message: 'CRUD.VIEW_OPTION.SORT_DIRECTION.VALIDATION.OPTION_RANGE',
                    value: null
                },
            }
        },
    };
    // ███████████████████████████████████████████████████████████████████
    // ████ LISTING  █████████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _listingFieldObj = signal<CrudStateListingFieldObjType>({});
    public readonly listingFieldObj = this._listingFieldObj.asReadonly();

    private readonly _listingData = signal<CrudStateListingDataType | null>(null);
    public readonly listingData = this._listingData.asReadonly();

    private readonly _listingDataSource = signal<MatTableDataSource<any>>(new MatTableDataSource<any>([]));
    public readonly listingDataSource = this._listingDataSource.asReadonly();

    private readonly _totalRecords = signal<number>(0);
    public readonly totalRecords = this._totalRecords.asReadonly();

    private readonly _reloadListingAfterRecordAction = signal(false);
    public readonly reloadListingAfterRecordAction = this._reloadListingAfterRecordAction.asReadonly();

    // Using a computed or linkedSignal if the fields ever change dynamically
    public formattedListingFields = linkedSignal(() => this.formatListingFieldObj(this.listingFieldObj() ?? {}));
    public pageSkipIndex = computed(() => this.getStatePageSkipIndex());
    public readonly rowSelectionSummary = computed(() => {
        const rows = this.listingDataSource().data;
        const selection = this.getListingSelectedRowsValue();
        const selectedCount = rows.filter((row) => selection.isSelected(row)).length;
        return { numRows: rows.length, selectedCount };
    });

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setListingFieldObj(finfo: CrudStateListingFieldObjType): void {
        this._listingFieldObj.set(finfo);
    }
    public setListingData(data: CrudStateListingDataType): void {
        this._listingData.set(data);
    }
    public setListingDataSource<T>(rows?: T[]): void {
        this._listingDataSource.set(new MatTableDataSource<T>(rows ?? []));
    }
    public setTotalRecords(total: number): void {
        this._totalRecords.set(total);
    }
    public setReloadListingAfterRecordAction(reload: boolean): void {
        this._reloadListingAfterRecordAction.set(reload);
    }

    public patchListingData(
        keyid: string | number,
        patch: Record<string, unknown>,
    ): boolean {
        let patched = false;

        const rows = this._listingDataSource().data.map((row) => {
            if (this.root.getRecordSecondaryKeyValue(row) !== String(keyid)) {
                return row;
            }

            patched = true;
            return { ...row, ...patch };
        });

        if (patched) {
            this.updateListingData(rows);
        }

        return patched;
    }

    public removeListingData(keyid: string | number): boolean {
        const currentRows = this._listingDataSource().data;
        const rows = currentRows.filter(
            (row) => this.root.getRecordSecondaryKeyValue(row) !== String(keyid),
        );

        if (rows.length === currentRows.length) {
            return false;
        }

        this.updateListingData(
            rows,
            Math.max(0, this._totalRecords() - 1),
        );

        return true;
    }
    public getPageSkipIndex(page: number, pageSize: number): number {
        return (page - 1) * pageSize;
    }
    private getStatePageSkipIndex(): number {
        return this.getPageSkipIndex(this.getCurrentPageValue(), this.getRowsPerPageValue());
    }
    private updateListingData(
        rows: any[],
        total: number = this._totalRecords(),
    ): void {
        const listingData = this._listingData();

        if (listingData) {
            this._listingData.set({
                ...listingData,
                rows,
                total,
            });
        }

        // Retain the table source instance, its filter predicate, and subscriptions.
        this._listingDataSource().data = rows;
        this._totalRecords.set(total);
    }
    private formatListingFieldObj(finfo: CrudStateListingFieldObjType): CrudListingFormattedFieldObjType {
        const result: CrudListingFormattedFieldObjType = {
            schema: {}, // field_key => field_info
            labels: {}, // field_key => label
            sortable: {}, // field_key => label (but only where sort is true)
            columns: {} // field_key => label (but only 1st level of fields as columns)
        };

        // add record selection columns — i18n KEY, resolved by `| transloco`
        // at every render site the same way field labels are
        result.columns[CrudListingAdditionalColumnsEnum.RECORD_SELECT] = 'GL.FIELD.COMMON.SELECT';
        // 1. Capture Top-Level Columns immediately
        // This only iterates the root keys once, making it very fast.
        const keys = Object.keys(finfo);
        const len = keys.length;
        for(let i = 0; i < len; i++) {
            const key = keys[i];
            const val = finfo[key];
            result.columns[key] = val.label;
        }
        // add record action column
        result.columns[CrudListingAdditionalColumnsEnum.RECORD_ACTION] = 'GL.FIELD.COMMON.ACTION';


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

    // ███ LIST OPERATION FIELD OBJ █████████████████████████████████████████████████
    
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _listOperationFieldObj = signal<CrudStateListOperationFieldObjType>({} as any);
    public readonly listOperationFieldObj = this._listOperationFieldObj.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
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
        if(!option) {
            option = this.formattedListingFields().columns;
        }

        this.updateListOperationFieldObj(CrudListOperationFieldsEnum.LISTING_COLUMN_POSITION, {
            option: option
        });
    }
    public setListingColumnPositionDefault(def?: string[]): void {
        if(!def || def.length === 0) {
            let columns: string[] = [];
            const moduleColumns = this.formattedListingFields().columns;

            // check the bulk action permission
            if (!this.action.hasRecordSelectionAction()) {
                delete moduleColumns[CrudListingAdditionalColumnsEnum.RECORD_SELECT];
            }

            // check the record action permission
            if (!this.action.hasRecordAction()) {
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
        if (!this.action.hasRecordSelectionAction()) {
            value = value?.filter(column => column !== CrudListingAdditionalColumnsEnum.RECORD_SELECT) ?? value;
        }

        // check the record action permission
        if (!this.action.hasRecordAction()) {
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
    /**
     * field_key => column name in schema - the same Record that
     * setListingColumnPositionOption() writes from formattedListingFields().columns.
     *
     * ⚠ Was declared number[]. It has never held one: nothing calls this yet, so the
     * cast was inert, but the first caller would have been handed an "array" that is
     * an object and read length as undefined.
     */
    public getListingColumnPositionOption(): Record<string, string> {
        const finfo = this.listOperationFieldObj();
        return finfo.listing_column_position?.option as Record<string, string>;
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
        if(!option) {
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
        if(!def) {
            def = this.root.conf.numOfRecordsPerPage ?? CrudListingItemPerPageOptionEnum.TWENTY_FIVE;
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

    // ███ VIEW OPTION FIELD OBJ ██████████████████████████████████████████████
    
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _viewOptionFieldObj = signal<CrudStateViewOptionFieldObjType>({} as any);
    public readonly viewOptionFieldObj = this._viewOptionFieldObj.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setViewOptionFieldObj(finfo: CrudStateViewOptionFieldObjType): void {
        const permittedFieldObj = { ...finfo };

        if (!this.action.hasDisplayFields()) {
            delete permittedFieldObj[CrudViewOptionFieldsEnum.DISPLAY_FIELDS];
        }

        if (!this.action.hasSortFields()) {
            delete permittedFieldObj[CrudViewOptionFieldsEnum.SORT_FIELDS];
            delete permittedFieldObj[CrudViewOptionFieldsEnum.SORT_DIRECTION];
        }

        // ALPHA_SORT has no view-option field yet. Apply its permission here
        // when that field is introduced.
        this._viewOptionFieldObj.set(permittedFieldObj);
        this.action.setHasViewOption(
            Object.values(permittedFieldObj).some(
                (fieldInfo) =>
                    fieldInfo.type !== CrudFieldUiTypeEnum.NONE
                    && fieldInfo.type !== CrudFieldUiTypeEnum.HIDDEN,
            ),
        );
    }
    public initViewOptionFieldObj(): void {
        if (this.action.hasDisplayFields()) {
            this.setDisplayFieldsOption();
            this.setDisplayFieldsDefault();
            this.setDisplayFieldsValue(this.getDisplayFieldsDefault());
        }

        if (this.action.hasSortFields()) {
            this.setSortFieldsOption();
            this.setSortFieldsDefault();
            this.setSortFieldsValue(this.getSortFieldsDefault());
            this.setSortDirectionValue(this.getSortDirectionDefault());
        }
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
        if(!option) {
            option = this.formattedListingFields().labels;
        }

        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.DISPLAY_FIELDS, {
            option: option
        });
    }
    public setDisplayFieldsDefault(def?: string[]): void {
        if(!def || def.length === 0) {
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
        return finfo.display_fields?.url_matrix_param ?? null;
    }
    public getDisplayFieldsOption(): Record<string, string> {
        const finfo = this.viewOptionFieldObj();
        return finfo.display_fields?.option as Record<string, string>;
    }
    public getDisplayFieldsDefault(): string[] | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.display_fields?.default
            ?? Object.keys(this.formattedListingFields().labels);
    }
    public getDisplayFieldsValue(): string[] | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.display_fields?.value;
    }

    // SORT_FIELDS
    public setSortFieldsOption(option?: CrudFieldOptionType): void {
        if(!option) {
            option = this.formattedListingFields().sortable;
        }
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.SORT_FIELDS, {
            option: option
        });
    }
    public setSortFieldsDefault(def?: string | null): void {
        if(!def) {
            const field = Object.keys(this.formattedListingFields().sortable);
            def = field.includes('created') ? 'created' : (field[0] ?? null);
        }
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.SORT_FIELDS, {
            default: def
        });
    }
    public setSortFieldsValue(value: string | null): void {
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.SORT_FIELDS, {
            value: value
        });
    }
    public getSortFieldsUrlMatrixParam(): string | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_fields?.url_matrix_param ?? null;
    }
    public getSortFieldsOption(): Record<string, string> {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_fields?.option as Record<string, string>;
    }
    public getSortFieldsDefault(): string | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_fields?.default;
    }
    public getSortFieldsValue(): string | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_fields?.value;
    }

    // SORT_DIRECTION
    public setSortDirectionValue(value: RecordSortDirectionEnum): void {
        this.updateViewOptionFieldObj(CrudViewOptionFieldsEnum.SORT_DIRECTION, {
            value: value
        });
    }
    public getSortDirectionUrlMatrixParam(): string | null {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_direction?.url_matrix_param ?? null;
    }
    public getSortDirectionOption(): Record<RecordSortDirectionEnum, string> {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_direction?.option as Record<RecordSortDirectionEnum, string>;
    }
    public getSortDirectionDefault(): RecordSortDirectionEnum {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_direction?.default as RecordSortDirectionEnum;
    }
    public getSortDirectionValue(): RecordSortDirectionEnum {
        const finfo = this.viewOptionFieldObj();
        return finfo.sort_direction?.value as RecordSortDirectionEnum;
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ LISTING SEARCH FORM ██████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // form ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // need a logic to get from child or auto generate from mutationFieldObj()
    // take reference from: src/app/module/shared/preboarding/signup/state.ts
    
    private readonly _listingSearchFormLayoutOrder = signal<CrudListingSearchFormGroupKeyEnum[]>([
        CrudListingSearchFormGroupKeyEnum.VIEW_OPTION, 
        CrudListingSearchFormGroupKeyEnum.SEARCH_FILTER
    ]);
    public readonly listingSearchFormLayoutOrder = this._listingSearchFormLayoutOrder.asReadonly();
    
    /**
     * The complete search form: viewOptionFieldObj() + searchFilterFieldObj()
     * merged into one field obj. Default order is view option first, a child
     * flips it with setSearchFormFieldObj() when it wants search filter first.
     */
    public readonly listingSearchFormLayout = computed<CrudStateFormFieldObjType[]>(() => {
        const groups: Record<CrudListingSearchFormGroupKeyEnum, CrudStateFormFieldObjType> = {
            view_option: this.viewOptionFieldObj(),
            search_filter: this.searchFilter.searchFilterFieldObj(),
        };
        return this.listingSearchFormLayoutOrder().map((key) => groups[key]);
    });
    
    // this signal required to build using listingSearchFormLayout, but have no strong idea how to do it, so adding it here randomly
    public readonly _listingSearchFieldObj = signal<CrudStateListingSearchFieldObjType>({} as any);
    public readonly listingSearchFieldObj = this._listingSearchFieldObj.asReadonly();
    
    public readonly _listingSearchFormError = signal<Record<string, any>>({});
    public readonly listingSearchFormError = this._listingSearchFormError.asReadonly();

    public readonly _listingSearchFormModel = signal<Record<string, any>>({});
    public readonly listingSearchFormModel = this._listingSearchFormModel.asReadonly();

    public readonly _listingSearchFormProcessing = signal(false);
    public readonly listingSearchFormProcessing = this._listingSearchFormProcessing.asReadonly();

    public listingSearchForm!: FieldTree<Record<string, any>>;

    // form method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setListingSearchFormLayoutOrder(order: CrudListingSearchFormGroupKeyEnum[]): void {
        this._listingSearchFormLayoutOrder.set(order);
    }
    public setListingSearchFormError(error: Record<string, any>): void {
        this._listingSearchFormError.set(error);
    }
    public updateListingSearchFormError(error: Partial<Record<string, any>>): void {
        this._listingSearchFormError.update(current => ({
            ...current,
            ...error
        }));
    }
    public clearListingSearchFormError(): void {
        this._listingSearchFormError.set({
            // TODO: need some logic as we object is generated dynamic
        });
    }
    public setListingSearchFormModel(input: Record<string, any>): void {
        this._listingSearchFormModel.set(input);
    }
    public updateListingSearchFormModel(input: Partial<Record<string, any>>): void {
        this._listingSearchFormModel.update(current => ({
            ...current,
            ...input
        }));
    }
    public clearListingSearchFormModel(): void {
        this._listingSearchFormModel.set({
            // TODO: need some logic as we object is generated dynamic
        });
    }
    public setListingSearchFormProcessing(processing: boolean): void {
        this._listingSearchFormProcessing.set(processing);
    }
    private initListingSearchForm(): void {
        const model: Record<string, any> = {};
        const errors: Record<string, string | null> = {};

        for (const [key, finfo] of Object.entries(this.listingSearchFieldObj())) {
            if (
                finfo.type === CrudFieldUiTypeEnum.NONE ||
                finfo.type === CrudFieldUiTypeEnum.HIDDEN
            ) {
                continue;
            }

            // Same precedence currently used by the form-field templates.
            model[key] = finfo.value ?? finfo.default ?? null;
            errors[key] = null;
        }

        // set processed values in dedicated signals
        this.setListingSearchFormModel(model);
        this.setListingSearchFormError(errors);

        // create only after the model and field configuration are available.
        this.listingSearchForm = form(
            // model
            this._listingSearchFormModel,
            // schema
            (sp) => {
                const fieldObj = this.listingSearchFieldObj();

                this.validation.setCrudSignalFormValidation(sp, fieldObj);

                // attach _listingSearch/server errors to their respective fields.
                for (const key of Object.keys(model)) {
                    validate((sp as any)[key], () => {
                        const message = this._listingSearchFormError()[key];

                        return message
                            ? { kind: 'mf_error', message }
                            : null;
                    });
                }
            },
            // options
            {
                injector: this.crudInjector
            }
        );
    }
    public initListingSearchFieldObj(): void {
        // THIS IS FOR TEMPORARY PURPOSE, FOR PROTOTYPE
        // NEED TO FIND OUT BEST WAY TO DO IT
        // we need some logic here to get full form obejct accordingly listingSearchFormLayout()
        // at thi smoment its not clear how to do it
        const tmp =  {
            ...this.listingSearchFormLayout()[0],
            ...this.listingSearchFormLayout()[1],
        } as CrudStateListingSearchFieldObjType;
        this.setListingSearchFieldObj(tmp);
    }
    public setListingSearchFieldObj(finfo: CrudStateListingSearchFieldObjType): void {
        this._listingSearchFieldObj.set(finfo);

        // init _listingSearch signal form, its model, and error store
        this.initListingSearchForm();
    }
    public updateListingSearchFieldObj(
        key: any,
        updates: Partial<CrudFormFieldInfoType>
    ): void {
        this._listingSearchFieldObj.update((finfo) => {
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
    public resetListingSearchForm(): void {
        const fieldObj = this.listingSearchFieldObj();
        const model: Record<string, any> = {};

        for (const [key, finfo] of Object.entries(fieldObj)) {
            if (finfo.type === CrudFieldUiTypeEnum.NONE) continue;

            const value = finfo.default ?? null;
            finfo.value = value;
            model[key] = value;
        }

        this._listingSearchFieldObj.set({ ...fieldObj });
        this.clearListingSearchFormError();
        this.setListingSearchFormModel(model);
        this.listingSearchForm().reset(model);
    }
    public getListingSearchFormViewOption<
        TColumns extends object,
        TOrder extends object,
    >(
        voIn: CrudViewOptionInputType,
        defaultSortField: Extract<keyof TOrder, string>,
    ): CrudListingViewOptionResultType<TColumns, TOrder> {
        const listingSearchObj = this.listingSearchFieldObj();
        const listingFieldSchema = this.formattedListingFields().schema;

        const sortFieldOption = listingSearchObj[CrudViewOptionFieldsEnum.SORT_FIELDS]?.option;
        const availableSortFields = sortFieldOption && typeof sortFieldOption === 'object'
            ? sortFieldOption as Record<string, unknown>
            : {};
        const requestedSortField = String(voIn.sort_fields ?? '');
        const sortField = requestedSortField in availableSortFields
            ? requestedSortField
            : defaultSortField;

        const displayFieldOption = listingSearchObj[CrudViewOptionFieldsEnum.DISPLAY_FIELDS]?.option;
        const availableColumns = Object.keys(
            displayFieldOption && typeof displayFieldOption === 'object'
                ? displayFieldOption
                : listingFieldSchema,
        );
        const selectedColumns = new Set<string>(
            (Array.isArray(voIn.display_fields)
                ? voIn.display_fields
                : availableColumns
            ).map(String),
        );
        selectedColumns.add(sortField);

        const columns = {} as TColumns;
        const dynamicColumns = columns as Record<string, any>;

        for (const fkey of availableColumns) {
            if (!selectedColumns.has(fkey)) continue;

            dynamicColumns[fkey] = true;

            const frField = listingFieldSchema[fkey]?.fr_field;

            if (typeof frField === 'string' && frField.includes('.')) {
                const [relation, relationField] = frField.split('.', 2);

                dynamicColumns[relation] = {
                    ...(dynamicColumns[relation] ?? {}),
                    id: true,
                    [relationField]: true,
                };
            }
        }

        const direction = voIn.sort_direction === RecordSortDirectionEnum.ASC
            ? RecordSortDirectionEnum.ASC
            : RecordSortDirectionEnum.DESC;
        const order = {
            [sortField]: {
                direction,
                nulls: RecordSortNullPositionEnum.LAST, // keep always last
            },
        } as TOrder;

        return {
            columns,
            order,
        };
    }


    // ███████████████████████████████████████████████████████████████████
    // ████ HELPER ███████████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
}
