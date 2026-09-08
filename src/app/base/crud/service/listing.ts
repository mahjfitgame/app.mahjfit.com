// file: src/app/base/crud/service/listing.ts
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { AppPaginationEvent } from "@base/pagination/type";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { CrudDataLoadTypeEnum } from "@base/crud/enum";
import {
    CrudFindInputType,
    CrudRecordActionType,
    CrudRecordKeyInputType,
    CrudViewOptionInputType,
} from "@base/crud/type";
import { CrudRootService } from "./root";
import { CrudActionService } from "./action";
import { CrudSearchFilterService } from "./search.filter";

export class CrudListingService {

    constructor(
        private readonly root: CrudRootService,
        private readonly action: CrudActionService,
        private readonly searchFilter: CrudSearchFilterService,
    ) {
        // action executes active/inactive/soft-delete/restore/delete but the
        // listing-row patch/reload after a successful one is listing's job —
        // see CrudActionService.afterRecordActionSuccess for why this is a
        // registered callback instead of a constructor dependency.
        this.action.registerAfterRecordActionSuccess(
            (action, keyid) => this.updateListingAfterRecordAction(action, keyid),
        );
        // same idiom — runFind() needs listing's pagination/search-filter/
        // view-option assembly before it can call the registered find handler,
        // and needs the quick-search filter reapplied after a successful load.
        this.action.registerFindInputPreparer((input) => this.prepareFindInput(input));
        this.action.registerAfterFindSuccess(() => {
            if (this.root.state.listing.getQuickSearchValue()) {
                this.applyQuickSearch();
            }
        });
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ SLOT FIELD █████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public getListingFieldSlotPortalKey(key: string): string {
        return `${this.root.CrudFieldSlotPortalKeyPrefixEnum.LISTING}${key}`;
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ EXECUTION ██████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public async submitListingSearchForm(): Promise<void> {
        if (
            !this.root.state.action.hasAdvanceSearch()
            && !this.root.state.action.hasViewOption()
        ) {
            return;
        }

        const formState = this.root.state.listing.listingSearchForm();

        if (formState.invalid()) {
            formState.errorSummary()[0]?.fieldTree().focusBoundControl();
            return;
        }

        if (this.root.state.listing.listingSearchFormProcessing()) return;

        this.root.state.listing.setListingSearchFormProcessing(true);

        try {
              const loaded = await this.action.runFind({
                SEARCH_FILTER_INPUT: this.searchFilter.searchFilterInputValues(),
                VIEW_OPTION_INPUT: this.viewOptionInputValues(),
                LIST_OPERATION_INPUT: {
                    current_page: 1,
                    listing_selected_rows: [],
                },
            });
            // close the end-side-bar when user data load finish
            if (loaded) {
                this.root.paLayout.state.setEndSideBarIsOpen(false);
            }
        } finally {
            this.root.state.listing.setListingSearchFormProcessing(false);
        }
    }
    
    // ████████████████████████████████████████████████████████████████████
    // ███ LISTING OPERATION ██████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /** Registered into CrudActionService.afterRecordActionSuccess — see this.action.registerAfterRecordActionSuccess() in the constructor above. */
    private async updateListingAfterRecordAction(
        action: CrudRecordActionType,
        keyid: CrudRecordKeyInputType,
    ): Promise<void> {
        const activeField = this.root.state.activeField();
        const deletedField = this.root.state.deletedField();
        const keyids = Array.isArray(keyid) ? keyid : [keyid];
        const actionTimestamp = new Date().toISOString();

        for (const recordKey of keyids) {
            if (action === FoundationActionEnum.ACTIVE && activeField) {
                this.root.state.listing.patchListingData(recordKey, {
                    [activeField]: null,
                });
            }

            if (action === FoundationActionEnum.INACTIVE && activeField) {
                this.root.state.listing.patchListingData(recordKey, {
                    [activeField]: actionTimestamp,
                });
            }

            if (action === FoundationActionEnum.SOFT_DELETE && deletedField) {
                this.root.state.listing.patchListingData(recordKey, {
                    [deletedField]: actionTimestamp,
                });
            }

            if (action === FoundationActionEnum.RESTORE && deletedField) {
                this.root.state.listing.patchListingData(recordKey, {
                    [deletedField]: null,
                });
            }

            if (action === FoundationActionEnum.DELETE) {
                this.root.state.listing.removeListingData(recordKey);
            }
        }

        this.root.state.listing.setListingSelectedRowsValue([]);

        if (this.root.state.listing.reloadListingAfterRecordAction()) {
            await this.action.runFind({}, CrudDataLoadTypeEnum.ACTION);
        }
    }
    public getSelectedRecordKeyValues(): string[] | null {
        const selectedRows = this.root.state.listing
            .getListingSelectedRowsValue<Record<string, any>>()
            .selected;
        const keys = selectedRows.map((row) => {
            const key = this.root.state.getRecordSecondaryKeyValue(row)?.trim();

            return key || null;
        });

        if (keys.length === 0 || keys.some((key) => key === null)) {
            return null;
        }

        return [...new Set(keys as string[])];
    }
    public isRecordSelected(row: any): boolean {
        return this.root.state.listing.getListingSelectedRowsValue().isSelected(row);
    }
    public isAllRowsSelected(): boolean {
        const { numRows, selectedCount } = this.root.state.listing.rowSelectionSummary();
        return numRows > 0 && selectedCount === numRows;
    }
    public isPartiallyRowsSelected(): boolean {
        const { numRows, selectedCount } = this.root.state.listing.rowSelectionSummary();
        return selectedCount > 0 && selectedCount < numRows;
    }
    public toggleAllRows(): void {
        if (!this.root.state.action.hasBulkAction()) return;

        if (this.isAllRowsSelected()) {
            this.root.state.listing.setListingSelectedRowsValue([]);
            return;
        }

        this.root.state.listing.setListingSelectedRowsValue([
            ...this.root.state.listing.listingDataSource().data,
        ]);
    }
    public toggleRowSelection(row: any): void {
        if (!this.root.state.action.hasBulkAction()) return;

        const selectedRows = this.root.state.listing.getListingSelectedRowsValue().selected;

        const nextSelectedRows = this.root.state.listing.getListingSelectedRowsValue().isSelected(row)
            ? selectedRows.filter((selectedRow) => selectedRow !== row)
            : [...selectedRows, row];

        this.root.state.listing.setListingSelectedRowsValue(nextSelectedRows);
    }
    public async onPageChange(event: AppPaginationEvent): Promise<boolean> {

        const findInput: Partial<CrudFindInputType> = {
            LIST_OPERATION_INPUT: {
                current_page: event.pageIndex,
                rows_per_page: event.pageSize,
            },
        }

        const loaded = await this.action.runFind(findInput, CrudDataLoadTypeEnum.ACTION);
        if (loaded) {
            /**
             * Page/page size change means current record selection is no longer fully visible
             * Clear it so old selected IDs are also removed from URL lsr
             */
            this.root.state.listing.setListingSelectedRowsValue([]);
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
        if (!this.root.state.action.hasColumnPosition()) return;

        const selectableColumn = this.root.CrudListingAdditionalColumnsEnum.RECORD_SELECT;

        const draggableColumns = this.root.state.listing.getListingColumnPositionValue()
            .filter((column) => column !== selectableColumn);

        moveItemInArray(draggableColumns, event.previousIndex, event.currentIndex);

        this.root.state.listing.setListingColumnPositionValue([
            selectableColumn,
            ...draggableColumns,
        ]);
    }
    public applyQuickSearch(): void {
        if (!this.root.state.action.hasQuickSearch()) return;

        const dataSource = this.root.state.listing.listingDataSource();

        const formattedFields = this.root.state.listing.formattedListingFields();
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
                const formattedValue = this.root.validation.formatCrudFieldValue(
                    rawValue,
                    fInfo,
                    record,
                    this.root.state.getCrudModuleContext(),
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

        dataSource.filter = String(this.root.state.listing.getQuickSearchValue() ?? '')
            .trim()
            .toLowerCase();
    }
    public async setQuickSearchKeyword(event: Event): Promise<void> {
        if (!this.root.state.action.hasQuickSearch()) return;

        const value = (event.target as HTMLInputElement).value;

        // 1. Update the local variable
        this.root.state.listing.setQuickSearchValue(value.trim().toLowerCase());

        // 2. Apply the filter to the MatTableDataSource
        this.applyQuickSearch();
    }
    public async clearQuickSearchKeyword(searchInput: HTMLInputElement): Promise<void> {
        if (!this.root.state.action.hasQuickSearch()) return;

        this.root.state.listing.setQuickSearchValue(null);
        searchInput.value = '';

        const dataSource = this.root.state.listing.listingDataSource();
        if (dataSource) {
            dataSource.filter = '';
        }
    }
    public openListingSearchForm(): void {
        if (
            !this.root.state.action.hasAdvanceSearch()
            && !this.root.state.action.hasViewOption()
        ) {
            return;
        }

        if (this.root.paLayout) {
            this.root.paLayout.toogleEndSideBarAndSwitchTab(this.root.CrudEndSideBarTabEnum.FILTER)
        }
    }
    public prepareFindInput(input: Partial<CrudFindInputType> = {}): CrudFindInputType {
        const sfIn = input.SEARCH_FILTER_INPUT ?? this.searchFilter.searchFilterInputValues();
        const voIn = input.VIEW_OPTION_INPUT ?? this.viewOptionInputValues();
        const loIn = input.LIST_OPERATION_INPUT ?? {};
        let skip = input.SKIP ?? 0;

        // normalize current page and rows per page
        loIn.current_page = Number(loIn.current_page ?? this.root.state.listing.getCurrentPageValue());
        loIn.rows_per_page = Number(loIn.rows_per_page ?? this.root.state.listing.getRowsPerPageValue());

        // get rows per page options
        const rowsPerPageOptions = this.root.state.listing.getRowsPerPageOption();

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
            loIn.rows_per_page = this.root.state.listing.getRowsPerPageDefault();
        }

        skip = this.root.state.listing.getPageSkipIndex(loIn.current_page, loIn.rows_per_page);

        // keep selected rows in the same normalized input lifecycle.
        // if not provided explicitly, use current state selection.
        loIn.listing_selected_rows = loIn.listing_selected_rows
            ?? this.root.state.listing.getListingSelectedRowsValue();

        // club all together as object with all validation process
        const out: CrudFindInputType = {
            SEARCH_FILTER_INPUT: sfIn,
            VIEW_OPTION_INPUT: voIn,
            LIST_OPERATION_INPUT: loIn,
            SKIP: skip,
        };

        return out;
    }

    /** Current view-option values, including defaults required by listing calls. */
    public viewOptionInputValues(): CrudViewOptionInputType {
        return this.root.formFieldInputValues(
            this.root.state.listing.viewOptionFieldObj(),
            false,
        ) as CrudViewOptionInputType;
    }
}
