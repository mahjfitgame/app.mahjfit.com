// file: src/app/base/crud/state/action.ts

import { computed, signal } from "@angular/core";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { FOUNDATION_MODULE_ACTION, FOUNDATION_RECORD_ACTION } from "@libs/foundation/action/const";
import { CrudRootState } from "./root";

/** Action availability for one feature-scoped CRUD module. */
export class CrudActionState {
    constructor(
        private readonly root: CrudRootState,
    ) {}

    // ███████████████████████████████████████████████████████████████████
    // ████ PERMITTED ACTIONS ████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    /**
     * definition().actions is what the module implements. nav().actions is
     * what the current access policy permits. Their intersection always wins.
     */
    private readonly permittedActions = computed<ReadonlySet<FoundationActionEnum>>(() => {
        const moduleRoute = this.root.moduleRoute();

        if (!moduleRoute) {
            return new Set<FoundationActionEnum>();
        }

        const registeredActions = moduleRoute.definition().actions;
        const permissionActions = moduleRoute.nav().actions;

        return new Set(
            registeredActions.filter((action) => permissionActions.includes(action)),
        );
    });

    private hasPermittedAction(action: FoundationActionEnum): boolean {
        return this.permittedActions().has(action);
    }

    // MODULE ACTION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly hasCreate = computed(() => this.hasPermittedAction(FoundationActionEnum.CREATE));
    public readonly hasImport = computed(() => this.hasPermittedAction(FoundationActionEnum.IMPORT));
    public readonly hasExport = computed(() => this.hasPermittedAction(FoundationActionEnum.EXPORT));
    public readonly hasInsight = computed(() => this.hasPermittedAction(FoundationActionEnum.INSIGHT));

    // RECORD ACTION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly hasRecordPosition = computed(() => this.hasPermittedAction(FoundationActionEnum.RECORD_POSITION));
    public readonly hasUpdate = computed(() => this.hasPermittedAction(FoundationActionEnum.UPDATE));
    public readonly hasQuickUpdate = computed(() => this.hasPermittedAction(FoundationActionEnum.QUICK_UPDATE));
    public readonly hasView = computed(() => this.hasPermittedAction(FoundationActionEnum.VIEW));
    public readonly hasSoftDelete = computed(() => this.hasPermittedAction(FoundationActionEnum.SOFT_DELETE));
    public readonly hasDelete = computed(() => this.hasPermittedAction(FoundationActionEnum.DELETE));
    public readonly hasRestore = computed(() => this.hasPermittedAction(FoundationActionEnum.RESTORE));
    public readonly hasDuplicate = computed(() => this.hasPermittedAction(FoundationActionEnum.DUPLICATE));
    public readonly hasActive = computed(() => this.hasPermittedAction(FoundationActionEnum.ACTIVE));
    public readonly hasInactive = computed(() => this.hasPermittedAction(FoundationActionEnum.INACTIVE));
    public readonly hasPrint = computed(() => this.hasPermittedAction(FoundationActionEnum.PRINT));
    public readonly hasShare = computed(() => this.hasPermittedAction(FoundationActionEnum.SHARE));
    public readonly hasMarkAsMain = computed(() => this.hasPermittedAction(FoundationActionEnum.MARK_AS_MAIN));
    public readonly hasUpload = computed(() => this.hasPermittedAction(FoundationActionEnum.UPLOAD));
    public readonly hasUploadDelete = computed(() => this.hasPermittedAction(FoundationActionEnum.UPLOAD_DELETE));
    public readonly hasFileRelocation = computed(() => this.hasPermittedAction(FoundationActionEnum.FILE_RELOCATION));
    public readonly hasSubModule = computed(() => this.hasPermittedAction(FoundationActionEnum.SUB_MODULE));
    public readonly hasSoftRemove = computed(() => this.hasPermittedAction(FoundationActionEnum.SOFT_REMOVE));
    public readonly hasRemove = computed(() => this.hasPermittedAction(FoundationActionEnum.REMOVE));
    public readonly hasRecover = computed(() => this.hasPermittedAction(FoundationActionEnum.RECOVER));

    // LISTING ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly hasListing = computed(() => this.hasPermittedAction(FoundationActionEnum.LISTING));
    public readonly hasColumnPosition = computed(() => this.hasPermittedAction(FoundationActionEnum.COLUMN_POSITION));
    public readonly hasQuickSearch = computed(() => this.hasPermittedAction(FoundationActionEnum.QUICK_SEARCH));
    public readonly hasDisplayFields = computed(() => this.hasPermittedAction(FoundationActionEnum.DISPLAY_FIELDS));
    public readonly hasSortFields = computed(() => this.hasPermittedAction(FoundationActionEnum.SORT_FIELDS));
    public readonly hasAlphaSort = computed(() => this.hasPermittedAction(FoundationActionEnum.ALPHA_SORT));
    public readonly hasAdvanceSearch = computed(() => this.hasPermittedAction(FoundationActionEnum.ADVANCE_SEARCH));
    public readonly hasBulkAction = computed(() => this.hasPermittedAction(FoundationActionEnum.BULK_ACTION));
    
    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // ADDITIONAL DEPENDENT ACTIONS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly hasRecordSelectionAction = computed(() =>
        Boolean(this.root.secondaryKey())
        && this.hasBulkAction()
        && (
            (
                Boolean(this.root.activeField())
                && (this.hasActive() || this.hasInactive())
            )
            || (
                Boolean(this.root.deletedField())
                && (
                    this.hasSoftDelete()
                    || this.hasRestore()
                    || this.hasDelete()
                )
            )
        )
    );

    public readonly hasRecordAction = computed(() =>
        Boolean(this.root.secondaryKey())
        && FOUNDATION_RECORD_ACTION.some((action) => this.hasPermittedAction(action))
    );

    public readonly hasModuleAction = computed(() =>
        FOUNDATION_MODULE_ACTION.some((action) => this.hasPermittedAction(action))
    );

    private readonly _hasViewOption = signal(false);
    public readonly hasViewOption = this._hasViewOption.asReadonly();
    public setHasViewOption(value: boolean): void {
        this._hasViewOption.set(value);
    }
}
