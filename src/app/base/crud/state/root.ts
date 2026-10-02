// file: src/app/base/crud/state/root.ts

import { computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { CrudActionRecordIndexType, CrudModuleActionRouteType, CrudRecordTargetType, CrudRecordType, CrudSlotFieldPortalType, CrudSlotFieldsType, CrudUniqueKeyType } from "@base/crud/type";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation/module/type";
import { CRUD_STATE_STORE_KEY } from "../const";
import { UrlService } from "@libs/url/service";
import { CrudRoute } from "@base/crud/route";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { FoundationRouteDefaultParamEnum } from "@libs/foundation/route/enum";
import { CrudValidation } from "../validation";

export abstract class CrudRootState extends SignalStateService implements FoundationModuleStateType {
    // ████ DEPENDENCIES ████████████████████████████████████████████████
    protected readonly crudInjector = inject(Injector);

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);
    public readonly url = inject(UrlService);
    public readonly route = inject(CrudRoute);
    
    public readonly validation = inject(CrudValidation);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████
    public override readonly storeKey = CRUD_STATE_STORE_KEY;

    // ████ LISTENERS ███████████████████████████████████████████████████
    public override onActivate(): void {
        /*
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }
        });
        this.registerDeactivationCleanup(() => registerEffect.destroy());
        */
    }
    public override onDeactivate(): void {
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ moduleRoute ██████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _moduleRoute = signal<CrudModuleActionRouteType | null>(null);
    public readonly moduleRoute = this._moduleRoute.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setModuleRoute(moduleRoute: CrudModuleActionRouteType): void {
        if (!moduleRoute?.registryKey) {
            throw new Error('CrudState: [moduleRoute] is not valid.');
        }

        this._moduleRoute.set(moduleRoute);
    }
    public getModuleRoute(): CrudModuleActionRouteType {
        const moduleRoute = this.moduleRoute();

        if (!moduleRoute) {
            throw new Error('CrudState: [moduleRoute] is not set.');
        }

        return moduleRoute;
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ _slotFields ██████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _slotFields = signal<CrudSlotFieldsType | null>(null);
    public readonly slotFields = this._slotFields.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
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

    // ███████████████████████████████████████████████████████████████████
    // ████ crudAction ███████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly crudActionFromRoute = computed<FoundationActionEnum | null>(() => {
        const firstPath = this.url.state.activatedRouteFirstSegment();

        return firstPath && this.route.isCrudActionValue(firstPath) ? firstPath : null;
    });

    private readonly _crudAction = linkedSignal<FoundationActionEnum | null>(
        () => this.crudActionFromRoute(),
    );
    public readonly crudAction = this._crudAction.asReadonly();

    /**
     * The ':index' segment, parsed into the comma-separated multi-record shape.
     *
     * ONE chain where there were two. The pk and sk readings existed so a
     * shape classifier could route a url value to one finder or the other;
     * with a single addressing column there is nothing to classify and nothing
     * to route, so there is nothing for two chains to drift apart over.
     */
    private readonly crudActionRecordIndexFromRoute = computed<CrudActionRecordIndexType>(
        () => this.route.toCrudActionRecordIndex(
            this.url.state.routeParams()[FoundationRouteDefaultParamEnum.INDEX] ?? null,
        ),
    );

    private readonly _crudActionRecordIndex = linkedSignal<CrudActionRecordIndexType>(
        () => this.crudActionRecordIndexFromRoute(),
    );
    public readonly crudActionRecordIndex = this._crudActionRecordIndex.asReadonly();

    /**
     * The ROW the menu item was clicked on, straight off listingDataSource -
     * no re-fetch, no re-derivation. Set by the record-action menu at click
     * time (before the routerLink navigates), read by whichever dialog/sheet
     * the action opens (upload title, mutation title, view, ...) for anything
     * it needs off the record - labelField() first, more later. Cleared
     * alongside the action itself, so it never outlives the action it was
     * captured for.
     */
    private readonly _actionListingRecord = signal<CrudRecordType | null>(null);
    public readonly actionListingRecord = this._actionListingRecord.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setCrudAction(action: FoundationActionEnum | null): void {
        this._crudAction.set(action);
    }
    public clearCrudAction(): void {
        this._crudAction.set(null);
    }
    public setCrudActionRecordIndex(index: CrudActionRecordIndexType): void {
        this._crudActionRecordIndex.set(index);
    }
    public clearCrudActionRecordIndex(): void {
        this._crudActionRecordIndex.set(null);
    }
    public setActionListingRecord(record: CrudRecordType | null): void {
        this._actionListingRecord.set(record);
    }
    public clearActionListingRecord(): void {
        this._actionListingRecord.set(null);
    }
    public clearCrudActionAndRecordIndex(): void {
        this.clearCrudAction();
        this.clearCrudActionRecordIndex();
        this.clearActionListingRecord();
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ standard field  ██████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _primaryKey = signal<string | null>(null);
    public readonly primaryKey = this._primaryKey.asReadonly();

    private readonly _secondaryKey = signal<string | null>(null);
    public readonly secondaryKey = this._secondaryKey.asReadonly();

    private readonly _uniqueKey = signal<CrudUniqueKeyType | null>(null);
    public readonly uniqueKey = this._uniqueKey.asReadonly();

    private readonly _urlSlugField = signal<string | null>(null);
    public readonly urlSlugField = this._urlSlugField.asReadonly();

    private readonly _isMainField = signal<string | null>(null);
    public readonly isMainField = this._isMainField.asReadonly();

    /**
     * Column whose value scopes is_main's uniqueness group — the entity's
     * @MarkAsMainField({ ref_group_relation_field }). null means the whole table
     * is one group and the api ignores the value.
     */
    private readonly _isMainFieldRefGroupRelationField = signal<string | null>(null);
    public readonly isMainFieldRefGroupRelationField = this._isMainFieldRefGroupRelationField.asReadonly();

    private readonly _recordPositionField = signal<string | null>(null);
    public readonly recordPositionField = this._recordPositionField.asReadonly();

    private readonly _activeField = signal<string | null>(null);
    public readonly activeField = this._activeField.asReadonly();

    private readonly _deletedField = signal<string | null>(null);
    public readonly deletedField = this._deletedField.asReadonly();

    private readonly _labelField = signal<string | null>(null);
    public readonly labelField = this._labelField.asReadonly();

    /**
     * The COLUMN this module ADDRESSES records by.
     *
     * Any column that is unique in the table and exists on the sdk's DTOs:
     * keyid, id, url_slug, a short code. The framework never restricts it — it
     * hands the name to the child's findRecordsBy() and to every record
     * mutation's where clause.
     *
     * ⚠ DECLARED LAST, after every other column above, because it NAMES one of
     * them (or any other unique column). setIndexColumn() sits last in the
     * child's standard-fields block for the same reason.
     *
     * ⚠ CHOOSE A NOT NULL COLUMN. A row whose index column is null cannot be
     * addressed — no url can point at it and no where can name it. The listing
     * shows no record menu and no checkbox for such a row rather than
     * half-working (see CrudListingState.indexedListingRows).
     *
     * ⚠ ADDRESSING ONLY. It decides what travels in the record route param,
     * what the row menu emits, which column the listing matches on, and the
     * where key for the seven record mutations. It does NOT decide everything a
     * child queries with: the target carries pk, sk AND the row, because upload
     * keys on UploadInputDto.ref_id — the entity primary key — whatever
     * addresses the record.
     *
     * Falls back to secondaryKey() so a module that never sets it behaves
     * exactly as it did before this existed.
     */
    private readonly _indexColumn = signal<string | null>(null);
    public readonly indexColumn = computed<string | null>(
        () => this._indexColumn() ?? this.secondaryKey(),
    );

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setPrimaryKey(key: string): void {
        this._primaryKey.set(key);
    }
    public setSecondaryKey(key: string): void {
        this._secondaryKey.set(key);
    }
    public setUniqueKey(arr: CrudUniqueKeyType | null): void {
        this._uniqueKey.set(arr);
    }
    public setUrlSlugField(field: string | null): void {
        this._urlSlugField.set(field);
    }
    public setIsMainField(field: string | null): void {
        this._isMainField.set(field);
    }
    public setIsMainFieldRefGroupRelationField(field: string | null): void {
        this._isMainFieldRefGroupRelationField.set(field);
    }
    public setRecordPositionField(field: string | null): void {
        this._recordPositionField.set(field);
    }
    public setActiveField(field: string | null): void {
        this._activeField.set(field);
    }
    public setDeletedField(field: string | null): void {
        this._deletedField.set(field);
    }
    public setLabelField(field: string | null): void {
        this._labelField.set(field);
    }
    public setIndexColumn(field: string | null): void {
        this._indexColumn.set(field);

        /**
         * ⚠ this check is only meaningful because crudInit() calls this LAST,
         * after every other column setter (see CrudChildServiceType). By now
         * primaryKey and secondaryKey are set, so a null here genuinely means
         * "this module can address no record at all" rather than "not
         * configured yet".
         *
         * Worth shouting about: hasRecordAction() and hasRecordSelectionAction()
         * both go false, so the listing silently loses its whole action column
         * AND its checkbox column with no other symptom.
         */
        if (!this.indexColumn()) {
            this.log.error(
                '[CRUD NO INDEX COLUMN] no record can be addressed - setIndexColumn() '
                + 'resolved null and no secondary key is set. The listing will show '
                + 'no record actions and no checkboxes.',
            );
        }
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ HELPER ███████████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    /**
     * The ONE row reader — every getter below is a wrapper that supplies its own
     * field name from state, so a caller passes only the row.
     */
    public getRecordFieldValue(row: any, field?: string | null): string | null {
        // no field name, nothing to read
        if (!field || field === '') {
            return null;
        }

        const value = field
            .split('.') // nested property paths, not only simple keys. smaple [user.id]
            .reduce((current, key) => current?.[key], row);

        if (value === null || value === undefined || value === '') {
            return null;
        }
        return String(value);
    }
    public getRecordPrimaryKeyValue(row: any, rowPkField?: string): string | null {
        // get primary key field name from state
        const pkf = this.primaryKey();

        // check for rowIdKey fields name, default to state
        if(!rowPkField && pkf) {
            rowPkField = pkf;
        }

        return this.getRecordFieldValue(row, rowPkField);
    }
    public getRecordSecondaryKeyValue(row: any, rowSkField?: string): string | null {
        // get secondary key field name from state
        const skf = this.secondaryKey();

        // check for rowIdKey fields name, default to state
        if(!rowSkField && skf) {
            rowSkField = skf;
        }

        return this.getRecordFieldValue(row, rowSkField);
    }
    /**
     * The index off ONE ROW — the value of indexColumn() — or null when this
     * row carries none.
     *
     * Third wrapper over getRecordFieldValue(), exactly like its two siblings
     * above; it just supplies indexColumn() as the field name. No branch: that
     * is the whole point of the config holding a COLUMN NAME rather than a
     * pk/sk flag.
     */
    public getRecordIndexColumnValue(row: any, rowIndexField?: string): string | null {
        return this.getRecordFieldValue(row, rowIndexField ?? this.indexColumn());
    }
    /**
     * The label off ONE ROW — labelField()'s value, or null when this row
     * carries none (or the module never set labelField() at all). Fourth
     * wrapper over getRecordFieldValue(), same shape as its siblings above.
     *
     * The shared consumer: upload/mutation/view titles all read this off
     * actionListingRecord() to name which record their dialog/sheet/page is
     * acting on ("personalised" per-record heading) - one wrapper here
     * instead of the same `row ? getRecordFieldValue(row, labelField()) :
     * null` repeated in each service.
     */
    public getRecordLabelFieldValue(row: any, rowLabelField?: string | null): string | null {
        return this.getRecordFieldValue(row, rowLabelField ?? this.labelField());
    }
    /** Does this row have an index? False means no url, no action, no selection. */
    public hasRecordIndex(row: any): boolean {
        return this.getRecordIndexColumnValue(row) !== null;
    }
    /**
     * BOTH key readings plus the row itself — what every record action hands a
     * child, so the child picks whichever its api keys on without a second fetch.
     *
     * This is the cheap path: the caller already HOLDS the row (a listing row
     * menu, a bulk selection), so nothing is looked up. The url-sourced path,
     * where only a string is in hand, goes through
     * CrudActionService.resolveActionProcessingRecords() instead.
     */
    public getRecordTarget(row: any): CrudRecordTargetType {
        return {
            index: this.getRecordIndexColumnValue(row),
            pk: this.getRecordPrimaryKeyValue(row),
            sk: this.getRecordSecondaryKeyValue(row),
            record: row ?? null,
        };
    }
    /** Value of the column that scopes is_main's uniqueness group, off ONE row. */
    public getIsMainFieldRefGroupRelationFieldValue(row: any, rowRefField?: string): string | null {
        // get ref group relation field name from state
        const rgf = this.isMainFieldRefGroupRelationField();

        // check for passed fields name, default to state
        if(!rowRefField && rgf) {
            rowRefField = rgf;
        }

        return this.getRecordFieldValue(row, rowRefField);
    }
}
