// file: src/app/base/crud/service/action.ts
import { HttpStatusCode } from "@angular/common/http";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { CrudActionUiLayoutEnum, CrudDataLoadTypeEnum } from "@base/crud/enum";
import { BfwApiSdkError } from "@bfw/api-sdk/core";
import { ConfirmationDialogDataType } from "@base/confirmation-dialog/type";
import {
    CrudActiveHandlerType,
    CrudCreateHandlerType,
    CrudDeleteFrRelationHandlerType,
    CrudDeleteHandlerType,
    CrudFindHandlerType,
    CrudFindInputType,
    CrudInactiveHandlerType,
    CrudMarkAsMainHandlerType,
    CrudMutationInputType,
    CrudMutationResultType,
    CrudRecordKeyInputType,
    CrudRecordKeyType,
    CrudRecordTargetInputType,
    CrudRecordTargetType,
    CrudRecordType,
    CrudStateRecordFieldObjType,
    CrudRestoreHandlerType,
    CrudSoftDeleteHandlerType,
    CrudUpdateHandlerType,
    CrudUploadHandlerType,
    CrudUploadDeleteHandlerType,
} from "@base/crud/type";
import { CrudRootService } from "./root";

/**
 * Crud-action lifecycle concern (mirrors CrudActionState in state/action.ts),
 * plus the layout decisions that only depend on state (not on the
 * mutation/view service instances), plus the row-level record-action
 * executors (active/inactive/mark-as-main/soft-delete/restore/delete) — these
 * need the same ensureActionPermitted() gate as everything else here, so they
 * moved out of listing.ts to live next to it.
 */
export class CrudActionService {
    // ████████████████████████████████████████████████████████████████████
    // ███ API HANDLER ████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private findHandler: CrudFindHandlerType | null = null;
    private createHandler: CrudCreateHandlerType | null = null;
    private updateHandler: CrudUpdateHandlerType | null = null;
    private uploadHandler: CrudUploadHandlerType | null = null;
    private uploadDeleteHandler: CrudUploadDeleteHandlerType | null = null;
    private activeHandler: CrudActiveHandlerType | null = null;
    private inactiveHandler: CrudInactiveHandlerType | null = null;
    private markAsMainHandler: CrudMarkAsMainHandlerType | null = null;
    private softDeleteHandler: CrudSoftDeleteHandlerType | null = null;
    private restoreHandler: CrudRestoreHandlerType | null = null;
    private deleteHandler: CrudDeleteHandlerType | null = null;
    private deleteFrRelationHandler: CrudDeleteFrRelationHandlerType | null = null;

    /**
     * Set once by CrudListingService's own constructor (registerAfterRecordActionSuccess).
     * A successful record action still needs to patch/remove the affected
     * listing rows and possibly reload — that's listing's job, not action's —
     * but action is constructed before listing exists, so listing wires this
     * callback into action instead of action holding a CrudListingService
     * reference (same register-a-handler idiom used everywhere else here).
     */
    private afterRecordActionSuccess: ((action: FoundationActionEnum, targets: CrudRecordTargetInputType) => Promise<void>) | null = null;

    /**
     * Same idiom, for runFind(): assembling the actual find input (current
     * page/rows-per-page/selected-rows/search-filter/view-option values) is
     * listing's job, not action's — action only executes the already-built
     * request against the registered find handler.
     */
    private findInputPreparer: ((input: Partial<CrudFindInputType>) => CrudFindInputType) | null = null;
    /** Same idiom — reapplies the quick-search filter to the freshly loaded rows after a successful find. */
    private afterFindSuccess: (() => void) | null = null;

    constructor(
        private readonly root: CrudRootService,
    ) {}

    public isCrudActionActive(): boolean {
        return this.root.state.crudAction() !== null;
    }
    public ensureActionPermitted(permitted: boolean): boolean {
        if (permitted) {
            return true;
        }

        this.root.notify.error(
            this.root.i18n.translate('GL.MODULE.HTTP_STATUS.UNAUTHORIZED'),
        );
        return false;
    }
    /**
     * The value the current action's url addressed its record by — the FIRST
     * one for the comma-separated multi-record form.
     *
     * ONE accessor where there were four. The pk/sk pair plus the "whichever
     * the url carried" reader plus the kind reader existed so a shape
     * classifier could pick a finder; with a single addressing column there is
     * nothing to classify and nothing to pick.
     *
     * Answers null when the url carries no record value at all.
     */
    public getCrudActionRecordIndex(): string | number | null {
        const indexes = this.root.state.crudActionRecordIndex();

        return (Array.isArray(indexes) ? indexes[0] : indexes) ?? null;
    }
    /**
     * Load the record THIS ACTION's url addresses — the one place every
     * deep-link loader goes through.
     *
     * There is no fork left to make. The url carries whatever this module's
     * indexColumn() names, and the lookup queries that same column, so the
     * pk-or-sk dispatch this used to run has nothing left to decide.
     *
     * Answers null when the url carries no record value at all.
     */
    public async findOneByActionRecordIndexColumn(
        fieldObj: CrudStateRecordFieldObjType,
    ): Promise<CrudRecordType | null> {
        /**
         * ⚠ still the OLD accessor name — the two key signals collapse into one
         * in a later commit, and this becomes getCrudActionRecordIndex() then.
         */
        const index = this.getCrudActionRecordIndex();

        if (index === null) {
            return null;
        }

        return this.root.findOneByIndexColumn(
            this.root.state.indexColumn(),
            index,
            fieldObj,
        );
    }
    public async loadRecordForUrlAction(
        value: CrudRecordKeyType,
        fieldObj: CrudStateRecordFieldObjType,
        isActionActive: () => boolean,
        closeAction: () => Promise<void>,
        fastPathRecord: CrudRecordType | null = null,
    ): Promise<CrudRecordType | null> {
        try {
            const record = fastPathRecord
                ?? await this.findOneByActionRecordIndexColumn(fieldObj);

            if (!isActionActive() || this.getCrudActionRecordIndex() !== value) {
                return null;
            }

            if (!record) {
                this.root.notify.error(this.getRecordNotFoundMessage(value));
                await closeAction();
                return null;
            }

            return record;
        } catch (error: unknown) {
            this.root.log.error('[URL ACTION RECORD LOAD FAILED]', error);

            const fallbackMessage = this.getRecordNotFoundMessage(value);

            this.root.notify.error(
                error instanceof BfwApiSdkError
                    ? error.errors()[0] ?? fallbackMessage
                    : error instanceof Error
                        ? error.message
                        : fallbackMessage,
            );
            await closeAction();
            return null;
        }
    }
    /** Classifies CREATE/UPDATE/DUPLICATE — shared by shouldLoadListingOnRouteEnter here and CrudMutationService.isMutationActionActive(). */
    public isMutationActionType(action: FoundationActionEnum | null): boolean {
        return action === FoundationActionEnum.CREATE
            || action === FoundationActionEnum.UPDATE
            || action === FoundationActionEnum.DUPLICATE;
    }
    /** Live signal read. Should the listing DOM render right now? */
    public shouldShowListingDom(): boolean {
        /**
         * Normal route:
         * /country
         * /country;cp=1
         */
        if (!this.isCrudActionActive()) {
            return true;
        }

        const action = this.root.state.crudAction();

        /**
         * Mutation action:
         * /country/add
         * /country/update/:id
         *
         * Overlay modes keep listing visible.
         * Page mode hides listing.
         */
        if (this.isMutationActionType(action)) {
            return this.root.state.mutation.mutationActionUiLayout() !== CrudActionUiLayoutEnum.PAGE;
        }

        if (action === FoundationActionEnum.VIEW) {
            return this.root.state.view.viewActionUiLayout() !== CrudActionUiLayoutEnum.PAGE;
        }

        if (action === FoundationActionEnum.PRINT) {
            return false;
        }

        if (action === FoundationActionEnum.UPLOAD) {
            return true; // DIALOG-only, listing always stays mounted behind it
        }

        /**
         * Default future behavior:
         * import/export/insights can start as full-page actions.
         */
        return false;
    }
    public shouldLoadListingOnRouteEnter(): boolean {
        const action = this.root.route.readCrudActionFromRoute();

        /**
         * Normal listing route:
         * /country
         * /country;cp=1
         */
        if (!action) {
            return true;
        }

        /**
         * Mutation action route:
         * /country/create
         * /country/update/:id
         * but do not load if layout is page
         */
        if (this.isMutationActionType(action)) {
            return this.root.state.mutation.mutationActionUiLayout() !== CrudActionUiLayoutEnum.PAGE;
        }

        if (action === FoundationActionEnum.VIEW) {
            return this.root.state.view.viewActionUiLayout() !== CrudActionUiLayoutEnum.PAGE;
        }

        if (action === FoundationActionEnum.PRINT) {
            return false;
        }

        if (action === FoundationActionEnum.UPLOAD) {
            return true; // DIALOG-only, listing always stays mounted behind it
        }

        /**
         * Future actions like import/export/etc.
         * Default: do not load listing unless explicitly allowed later.
         */
        return false;
    }
    public shouldSkipListingLoadForActiveCrudAction(): boolean {
        const action = this.root.state.crudAction();

        if (!action) {
            return false;
        }

        /**
         * Page actions own the whole screen. Overlay actions keep the already
         * mounted listing visible. Neither should trigger a background listing
         * request while the action is active. closeMutationAction() clears the
         * action first, then refreshes the listing once.
         */
        return true;
    }
    /**
     * Clears the action plus BOTH record key readings in one call — the live
     * secondary one and the parked primary one.
     */
    public clearCrudActionAndRecordIndex(): void {
        // the overlay effect in init.ts owns closing the UI now
        this.root.state.clearCrudActionAndRecordIndex();
    }
    public async closeCrudAction(refresh: boolean = true): Promise<void> {
        await this.root.url.navigateAwayFromCrudAction();
        this.clearCrudActionAndRecordIndex();

        // as action if performed and listing needs to be refreshed as there might be some changes with data
        if (refresh) {
            await this.runFind();
        }
    }
    private getActionModuleName(): string {
        const moduleInfo = this.root.paLayout.state.moduleInfo();

        return moduleInfo?.i18n?.title
            ? this.root.i18n.translate(moduleInfo.i18n.title)
            : moduleInfo?.title?.trim()
                || this.root.i18n.translate('GL.CRUD.RECORD');
    }
    public getRecordNotFoundMessage(index: CrudRecordKeyType): string {
        return this.root.i18n.translate('GL.CRUD.RECORD_NOT_FOUND', {
            module: this.getActionModuleName(),
            index: String(index),
        });
    }
    public getMutationFormMessage(
        outcome: 'success' | 'failed' | 'key_missing' | 'key_mismatch',
    ): string {
        const moduleName = this.getActionModuleName();
        const action = this.root.state.crudAction() === FoundationActionEnum.UPDATE ? 'UPDATE' : 'CREATE';
        const result = outcome === 'success' ? 'SUCCESS' : 'FAILED';
        const messageKey = outcome === 'key_missing'
            ? 'UPDATE_KEY_MISSING'
            : outcome === 'key_mismatch'
                ? 'UPDATE_KEY_MISMATCH'
                : `${action}_${result}`;

        return this.root.i18n.translate(
            `GL.CRUD.MUTATION.${messageKey}`,
            { module: moduleName },
        );
    }
    public getUploadFormMessage(
        outcome: 'success' | 'failed' | 'key_missing' | 'delete_success' | 'delete_failed' | 'delete_orphan' | 'select_required',
    ): string {
        const moduleName = this.getActionModuleName();
        const messageKey = outcome === 'key_missing'
            ? 'KEY_MISSING'
            : outcome === 'success'
                ? 'SUCCESS'
                : outcome === 'delete_success'
                    ? 'DELETE_SUCCESS'
                    : outcome === 'delete_failed'
                        ? 'DELETE_FAILED'
                        : outcome === 'delete_orphan'
                            ? 'DELETE_ORPHAN'
                            : outcome === 'select_required'
                                ? 'SELECT_REQUIRED'
                                : 'FAILED';

        return this.root.i18n.translate(
            `GL.CRUD.UPLOAD.${messageKey}`,
            { module: moduleName },
        );
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ CRUD MODULE EXECUTOR REGISTRATION  █████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public registerFind(handler: CrudFindHandlerType): void {
        this.findHandler = handler;
    }
    public registerCreate(handler: CrudCreateHandlerType): void {
        this.createHandler = handler;
    }
    public registerUpdate(handler: CrudUpdateHandlerType): void {
        this.updateHandler = handler;
    }
    public registerUpload(handler: CrudUploadHandlerType): void {
        this.uploadHandler = handler;
    }
    public registerUploadDelete(handler: CrudUploadDeleteHandlerType): void {
        this.uploadDeleteHandler = handler;
    }
    public registerActive(handler: CrudActiveHandlerType): void {
        this.activeHandler = handler;
    }
    public registerInactive(handler: CrudInactiveHandlerType): void {
        this.inactiveHandler = handler;
    }
    public registerMarkAsMain(handler: CrudMarkAsMainHandlerType): void {
        this.markAsMainHandler = handler;
    }
    public registerSoftDelete(handler: CrudSoftDeleteHandlerType): void {
        this.softDeleteHandler = handler;
    }
    public registerRestore(handler: CrudRestoreHandlerType): void {
        this.restoreHandler = handler;
    }
    public registerDelete(handler: CrudDeleteHandlerType): void {
        this.deleteHandler = handler;
    }
    public registerDeleteFrRelation(handler: CrudDeleteFrRelationHandlerType): void {
        this.deleteFrRelationHandler = handler;
    }
    /** Wired by CrudListingService's constructor — see afterRecordActionSuccess above. */
    public registerAfterRecordActionSuccess(
        callback: (action: FoundationActionEnum, targets: CrudRecordTargetInputType) => Promise<void>,
    ): void {
        this.afterRecordActionSuccess = callback;
    }
    /** Wired by CrudListingService's constructor — see findInputPreparer above. */
    public registerFindInputPreparer(
        preparer: (input: Partial<CrudFindInputType>) => CrudFindInputType,
    ): void {
        this.findInputPreparer = preparer;
    }
    /** Wired by CrudListingService's constructor — see afterFindSuccess above. */
    public registerAfterFindSuccess(callback: () => void): void {
        this.afterFindSuccess = callback;
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ EXECUTION ██████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public async runFind(
        input: Partial<CrudFindInputType> = {},
        type: CrudDataLoadTypeEnum = CrudDataLoadTypeEnum.ACTION
    ): Promise<boolean> {
        if (!this.root.state.action.hasListing()) {
            return false;
        }

        // If action is active, skip normal/action reloads.
        // But allow INITIAL load so direct overlay mutation URLs can load background listing.
        if (
            type !== CrudDataLoadTypeEnum.INITIAL &&
            this.shouldSkipListingLoadForActiveCrudAction()
        ) {
            return false;
        }

        const findInput = this.findInputPreparer
            ? this.findInputPreparer(input)
            : (input as CrudFindInputType);

        if (!this.findHandler) {
            this.root.notify.error('CRUD find handler is not registered.');
            return false;
        }

        this.root.gpbs.start();
        this.root.gpbs.stream = 20;

        try {
            // keep the
            // main call to load data
            const resp = await this.findHandler(findInput, type);
            this.root.gpbs.stream = 60;

            if (resp === true) {
                // apply quick search after data loaded, useful for direct URL load: ;qs=...
                this.afterFindSuccess?.();

                this.root.gpbs.stream = 100;
                this.root.gpbs.stop();

                return true;
            }
            throw new Error(this.root.i18n.translate('GL.COMMON.DATA_LOADING_FAILED'));
        } catch (error: unknown | BfwApiSdkError) {
            // if any error then need yo switch to previous state data
            // like page number, per page rcord number etc

            // also need to develop fixed message place in main layour
            // need to develop new module name like notify
            // module-notify

            this.root.log.error('[FIND FAILED]', error);

            if (error instanceof BfwApiSdkError) {
                if (error.status !== HttpStatusCode.Unauthorized) {
                    this.root.notify.error(
                        error.errors()[0]
                        ?? this.root.i18n.translate('GL.COMMON.DATA_LOADING_FAILED'),
                    );
                }
            } else {
                this.root.notify.error(
                    error instanceof Error
                        ? error.message
                        : this.root.i18n.translate('GL.COMMON.DATA_LOADING_FAILED'),
                );
            }

            this.root.gpbs.stream = 100;
            this.root.gpbs.stop();

            return false;
        }
    }
    /**
     * Unlike the record actions below, create/update aren't gated by
     * ensureActionPermitted() here — that check needs the CREATE vs DUPLICATE
     * distinction and the record-secondary-key lookup that only
     * CrudMutationService.submitMutationForm() has, so it stays there. This
     * mirrors runRecordAction()'s own `if (!handler)` guard below instead of
     * exposing a separate "is it registered" check to the caller.
     */
    public async runCreate(input: CrudMutationInputType): Promise<CrudMutationResultType> {
        if (!this.createHandler) {
            return {
                success: false,
                message: 'CRUD create handler is not registered.',
            };
        }

        return this.createHandler(input);
    }
    public async runUpdate(
        value: CrudRecordKeyType,
        input: CrudMutationInputType,
    ): Promise<CrudMutationResultType> {
        if (!this.updateHandler) {
            return {
                success: false,
                message: 'CRUD update handler is not registered.',
            };
        }

        return this.updateHandler(this.resolveActionProcessingRecord(value), input);
    }
    public async runUpload(
        value: CrudRecordKeyType,
        input: CrudMutationInputType,
    ): Promise<CrudMutationResultType> {
        if (!this.uploadHandler) {
            return {
                success: false,
                message: 'CRUD upload handler is not registered.',
            };
        }

        return this.uploadHandler(this.resolveActionProcessingRecord(value), input);
    }
    public async runUploadDelete(
        value: CrudRecordKeyType,
        fkey: string,
    ): Promise<CrudMutationResultType> {
        if (!this.uploadDeleteHandler) {
            return {
                success: false,
                message: 'CRUD upload-delete handler is not registered.',
            };
        }

        /**
         * A scalar target, deliberately: this is the INTERACTIVE path (one
         * file, one open dialog). The array form of the handler is for
         * deleteRecordUploads() below, which clears a whole bulk selection in
         * one call.
         */
        return this.uploadDeleteHandler(this.resolveActionProcessingRecord(value), fkey);
    }
    private resolveActionProcessingRecord(index: CrudRecordKeyType): CrudRecordTargetType {
        // match the cached row on the same column everything else addresses by
        const cached = this.root.state.upload.uploadRecord();
        const cachedIndex = cached
            ? this.root.state.getRecordIndexColumnValue(cached)
            : null;

        const record = cached && cachedIndex === String(index)
            ? cached
            : this.root.state.listing.findListingDataSourceByIndexColumn(index);

        return {
            /**
             * ⚠ the url value falls back into `index` ONLY, because that is the
             * identifier the action was actually invoked with — carrying it
             * cannot mislabel it.
             *
             * pk and sk are read off the ROW and stay null when none resolved.
             * They name a SPECIFIC identifier, and dropping an index value into
             * either slot is exactly the mislabelling this whole change removes:
             * a child would write it straight into where: { keyid: ... },
             * matching nothing at best and the wrong row at worst.
             */
            index: this.root.state.getRecordIndexColumnValue(record) ?? index,
            pk: this.root.state.getRecordPrimaryKeyValue(record),
            sk: this.root.state.getRecordSecondaryKeyValue(record),
            record,
        };
    }
    public async runActive(sk: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.root.state.action.hasActive())) return;

        await this.runRecordAction(
            FoundationActionEnum.ACTIVE,
            sk,
            this.activeHandler,
        );
    }
    public async runInactive(sk: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.root.state.action.hasInactive())) return;

        await this.runRecordAction(
            FoundationActionEnum.INACTIVE,
            sk,
            this.inactiveHandler,
        );
    }
    /**
     * SINGLE record only — the api marks exactly one row main per group, so
     * sk is never an array here and the bulk (selected-records) menu does
     * not offer this action.
     *
     * markAsMainField and refGroupRelationFieldValue come from the menu: the
     * marker column the module declared with setIsMainField(), and THAT ROW's
     * value of the column declared with setIsMainFieldRefGroupRelationField().
     */
    public async runMarkAsMain(
        sk: CrudRecordKeyType | null,
        markAsMainField: string | null,
        refGroupRelationFieldValue: string | null = null,
    ): Promise<void> {
        if (!this.ensureActionPermitted(this.root.state.action.hasMarkAsMain())) return;

        // no declared marker column means there is nothing to mark
        if (!markAsMainField) {
            this.root.notify.error(
                this.getRecordActionMessage(
                    FoundationActionEnum.MARK_AS_MAIN,
                    'FAILED',
                    null,
                ),
            );
            return;
        }

        const handler = this.markAsMainHandler;

        await this.runRecordAction(
            FoundationActionEnum.MARK_AS_MAIN,
            sk,
            handler
                ? async (t: CrudRecordTargetInputType) => await handler(
                    Array.isArray(t) ? t[0] : t,
                    markAsMainField,
                    refGroupRelationFieldValue,
                )
                : null,
        );
    }
    public async runSoftDelete(sk: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.root.state.action.hasSoftDelete())) return;

        await this.runRecordAction(
            FoundationActionEnum.SOFT_DELETE,
            sk,
            this.softDeleteHandler,
        );
    }
    public async runRestore(sk: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.root.state.action.hasRestore())) return;

        await this.runRecordAction(
            FoundationActionEnum.RESTORE,
            sk,
            this.restoreHandler,
        );
    }
    public async runDelete(sk: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.root.state.action.hasDelete())) return;

        await this.runRecordAction(
            FoundationActionEnum.DELETE,
            sk,
            this.deleteHandler,
        );
    }
    private async runRecordAction(
        action: FoundationActionEnum,
        value: CrudRecordKeyInputType | null,
        handler: ((targets: CrudRecordTargetInputType) => Promise<CrudMutationResultType>) | null,
    ): Promise<void> {
        if (value === null) {
            this.root.notify.error(
                this.root.i18n.translate('GL.CRUD.RECORD_ACTION.KEY_MISSING'),
            );
            return;
        }

        const isBulk = Array.isArray(value);
        const bulkCount = isBulk ? value.length : null;
        const values = isBulk ? value : [value];

        if (
            values.length === 0 ||
            values.some((key) => String(key).trim() === '')
        ) {
            this.root.notify.error(
                this.root.i18n.translate('GL.CRUD.RECORD_ACTION.KEY_MISSING'),
            );
            return;
        }

        if (!handler) {
            this.root.notify.error(
                this.getRecordActionMessage(action, 'FAILED', bulkCount),
            );
            return;
        }

        if (!isBulk) {
            const row = this.root.state.listing.findListingDataSourceByIndexColumn(values[0]);
            if (row) {
                this.root.state.setActionListingRecord(row);
            }
        }

        if (!await this.confirmRecordAction(action, bulkCount)) {
            return;
        }

        /**
         * Resolve AFTER the guards above, so the blank-value and permission
         * checks still run against the raw input exactly as they did before —
         * resolution is the last thing between confirmation and the handler.
         *
         * Nothing to disambiguate here any more. The row menu, the bulk menu
         * and the url all carry this module's INDEX, so what arrives is always
         * the same kind of value and the resolver queries the same column for
         * it. That agreement is structural, not a convention to maintain.
         */
        const resolved = values.map((one) => this.resolveActionProcessingRecord(one));
        const targets: CrudRecordTargetInputType = isBulk ? resolved : resolved[0];

        try {
            /**
             * ⚠ BEFORE the handler, not after. The api's uploadDelete resolves
             * its target with repository.find({ where: { [ref_id_field]: ... } })
             * and THROWS when that finds nothing — so once the row is gone the
             * call can only fail and the file is stranded for good.
             *
             * ⚠ DEEPEST FIRST: fr relations, then this record's own files, then
             * (below) the record row. A child row must go before the parent it
             * keys on, or nothing can address it afterwards.
             *
             * Returning early leaves the records untouched, so a failure here
             * is recoverable — nothing is ever half-deleted.
             *
             * ⚠ RELOAD BEFORE GIVING UP. A partly-succeeded batch leaves rows
             * whose file is gone while the listing still caches the old
             * filename — the skip guard in deleteRecordUploads() would then
             * keep sending them, the api would answer affected: 0 for an
             * already-null column, and the delete would abort FOREVER.
             * Resyncing is what makes a retry possible.
             */
            if (action === FoundationActionEnum.DELETE) {
                if (!await this.runDeleteFrRelation(targets)) {
                    this.root.notify.error(
                        this.root.i18n.translate('GL.CRUD.RECORD_ACTION.DELETE.FR_RELATION_FAILED'),
                    );
                    return;
                }

                if (!await this.deleteRecordUploads(targets)) {
                    this.root.notify.error(this.getUploadFormMessage('delete_orphan'));
                    /**
                     * ⚠ RELOAD, unlike the fr-relation branch above, because
                     * THIS cleanup reads the listing to decide what to send. A
                     * partly-succeeded batch leaves rows whose file is gone
                     * while the cache still holds the old filename, so the
                     * skip guard in deleteRecordUploads() would resend them,
                     * the api would answer affected: 0 for an already-null
                     * column, and the delete would abort FOREVER. Resyncing is
                     * what makes a retry possible.
                     *
                     * ⚠ DELIBERATELY NOT gated on shouldReloadListingAfterAction().
                     * That config answers a different question — "after this
                     * action SUCCEEDS, is the local patch enough?" — and
                     * defaults to off, so honouring it here would disable this
                     * resync for every module and hand the deadlock straight
                     * back.
                     *
                     * ⚠ Accepted cost: when the cascade failed because the
                     * network is down, this find fails too and toasts its own
                     * error, so the user sees two. Both are true, it is an
                     * error path, and the alternatives are a silent-mode flag
                     * on runFind() or guessing whether the batch half-ran —
                     * which a thrown Promise.all cannot tell us.
                     */
                    await this.runFind({}, CrudDataLoadTypeEnum.ACTION);
                    return;
                }
            }

            // execute the actual action here
            const result = await handler(targets);

            if (!result.success) {
                this.root.notify.error(
                    result.message
                        ?? this.getRecordActionMessage(action, 'FAILED', bulkCount),
                );
                return;
            }

            await this.afterRecordActionSuccess?.(action, targets);
            this.root.notify.success(
                result.message
                    ?? this.getRecordActionMessage(action, 'SUCCESS', bulkCount),
            );
        } catch (error: unknown) {
            this.root.log.error('[CRUD RECORD ACTION FAILED]', error);

            const fallbackMessage = this.getRecordActionMessage(
                action,
                'FAILED',
                bulkCount,
            );
            const message = error instanceof BfwApiSdkError
                ? error.errors()[0] ?? fallbackMessage
                : error instanceof Error
                    ? error.message
                    : fallbackMessage;

            this.root.notify.error(message);
        }
    }

    /**
     * Clears the fr relations of the records about to be deleted.
     *
     * A thin executor, deliberately: it owns WHEN the cascade runs and what a
     * failure means, while the registered child owns WHAT to delete. That split
     * is why this file never imports another module's sdk.
     *
     * Answers true when no handler is registered — a module with no fr relation
     * has nothing to clear, which is the common case and not a failure.
     *
     * ⚠ A false answer ABORTS the delete (see runRecordAction). That is the
     * point: with no FK constraints in the api, nothing else stops a parent
     * from being deleted out from under its children.
     *
     * ⚠ `targets` is passed WHOLE, bulk included — the child issues one call
     * for the entire selection.
     */
    private async runDeleteFrRelation(
        targets: CrudRecordTargetInputType,
    ): Promise<boolean> {
        if (!this.deleteFrRelationHandler) return true;

        try {
            const result = await this.deleteFrRelationHandler(targets);

            if (!result.success) {
                this.root.log.error('[CRUD DELETE FR RELATION FAILED]', result.message);
            }

            return result.success;
        } catch (error: unknown) {
            this.root.log.error('[CRUD DELETE FR RELATION FAILED]', error);

            return false;
        }
    }
    private async deleteRecordUploads(
        targets: CrudRecordTargetInputType,
    ): Promise<boolean> {
        if (!this.uploadDeleteHandler) return true;
        if (!this.root.state.action.hasUploadDelete()) return true;

        const fkeys = this.root.state.upload.uploadableFileFkeys();

        if (fkeys.length === 0) return true;

        const list = Array.isArray(targets) ? targets : [targets];
        let allDeleted = true;

        for (const fkey of fkeys) {
            const batch = list.filter((target) =>
                target.pk !== null
                && !(target.record && fkey in target.record && !target.record[fkey]),
            );

            if (batch.length === 0) continue;

            try {
                const result = await this.uploadDeleteHandler(
                    batch.length === 1 ? batch[0] : batch,
                    fkey,
                );

                /**
                 * ⚠ STOP AT THE FIRST FAILED FIELD. The delete is aborted
                 * either way, so clearing the NEXT field would only widen the
                 * set of records left with a deleted file and an intact row.
                 */
                if (!result.success) { allDeleted = false; break; }
            } catch (error: unknown) {
                this.root.log.error('[CRUD DELETE RECORD UPLOADS FAILED]', fkey, error);
                allDeleted = false;
                break;
            }
        }

        return allDeleted;
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ CRUD RECORD ACTION OPERATION ███████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * Public because CrudUploadService.uploadDelete() reuses it for
     * UPLOAD_DELETE — upload never goes through runRecordAction() (it patches
     * the listing itself instead of the generic success/fail path), but its
     * confirmation dialog is still one of the FoundationActionEnum cases
     * getRecordActionConfirmationData() answers, so it shares this one entry
     * point rather than composing confirmationDialog.confirm(...) a second time.
     */
    public async confirmRecordAction(
        action: FoundationActionEnum,
        bulkCount: number | null = null,
    ): Promise<boolean> {
        return this.root.confirmationDialog.confirm(
            this.getRecordActionConfirmationData(action, bulkCount),
        );
    }
    private getRecordActionConfirmationData(
        action: FoundationActionEnum,
        bulkCount: number | null = null,
    ): ConfirmationDialogDataType {
        switch (action) {
            case FoundationActionEnum.ACTIVE:
                return {
                    icon: 'check_circle_unread',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.ACTIVE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.ACTIVE.CONFIRM_TITLE',
                    label: bulkCount === null
                        ? this.root.state.getRecordLabelFieldValue(this.root.state.actionListingRecord()) ?? undefined
                        : undefined,
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.ACTIVE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.ACTIVE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.ACTIVE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                };

            case FoundationActionEnum.INACTIVE:
                return {
                    icon: 'do_not_disturb_on',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.INACTIVE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.INACTIVE.CONFIRM_TITLE',
                    label: bulkCount === null
                        ? this.root.state.getRecordLabelFieldValue(this.root.state.actionListingRecord()) ?? undefined
                        : undefined,
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.INACTIVE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.INACTIVE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.INACTIVE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                };

            /**
             * Single-record only, so bulkCount is always null here and there is
             * no GL.CRUD.SELECTED_RECORD_ACTION.MARK_AS_MAIN key set to pick.
             */
            case FoundationActionEnum.MARK_AS_MAIN:
                return {
                    icon: 'flag',
                    titleKey: 'GL.CRUD.RECORD_ACTION.MARK_AS_MAIN.CONFIRM_TITLE',
                    label: this.root.state.getRecordLabelFieldValue(this.root.state.actionListingRecord()) ?? undefined,
                    messageKey: 'GL.CRUD.RECORD_ACTION.MARK_AS_MAIN.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.MARK_AS_MAIN',
                };

            case FoundationActionEnum.SOFT_DELETE:
                return {
                    icon: 'delete',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.SOFT_DELETE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.SOFT_DELETE.CONFIRM_TITLE',
                    label: bulkCount === null
                        ? this.root.state.getRecordLabelFieldValue(this.root.state.actionListingRecord()) ?? undefined
                        : undefined,
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.SOFT_DELETE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.SOFT_DELETE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.SOFT_DELETE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                };

            case FoundationActionEnum.RESTORE:
                return {
                    icon: 'restore_from_trash',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.RESTORE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.RESTORE.CONFIRM_TITLE',
                    label: bulkCount === null
                        ? this.root.state.getRecordLabelFieldValue(this.root.state.actionListingRecord()) ?? undefined
                        : undefined,
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.RESTORE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.RESTORE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.RESTORE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                };

            case FoundationActionEnum.DELETE:
                return {
                    icon: 'delete_forever',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.DELETE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.DELETE.CONFIRM_TITLE',
                    label: bulkCount === null
                        ? this.root.state.getRecordLabelFieldValue(this.root.state.actionListingRecord()) ?? undefined
                        : undefined,
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.DELETE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.DELETE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.DELETE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                    danger: true,
                };

            /**
             * Single-record only, same as MARK_AS_MAIN — upload always acts on
             * whichever record's upload dialog is open, so there is no bulk
             * variant and no GL.CRUD.SELECTED_RECORD_ACTION key set to pick.
             * Reached via CrudUploadService.uploadDelete() -> confirmRecordAction(),
             * never via runRecordAction().
             */
            case FoundationActionEnum.UPLOAD_DELETE:
                return {
                    icon: 'delete',
                    titleKey: 'GL.CRUD.UPLOAD.DELETE_CONFIRM_TITLE',
                    label: this.root.state.getRecordLabelFieldValue(this.root.state.actionListingRecord()) ?? undefined,
                    messageKey: 'GL.CRUD.UPLOAD.DELETE_CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.UPLOAD_DELETE',
                    danger: true,
                };

            default:
                // runRecordAction() only ever invokes this with one of the 6 cases
                // above (runActive/runInactive/runMarkAsMain/runSoftDelete/
                // runRestore/runDelete), and CrudUploadService.uploadDelete() only
                // ever invokes it with UPLOAD_DELETE — reaching here means a caller
                // passed something else, which is a bug, not a state to render a
                // dialog for.
                throw new Error(`getRecordActionConfirmationData: unsupported action "${action}"`);
        }
    }
    private getRecordActionMessage(
        action: FoundationActionEnum,
        outcome: 'SUCCESS' | 'FAILED',
        bulkCount: number | null = null,
    ): string {
        const actionKey = this.getRecordActionMessageKey(action);

        if (bulkCount !== null) {
            return this.root.i18n.translate(
                `GL.CRUD.SELECTED_RECORD_ACTION.${actionKey}.${outcome}`,
                { count: bulkCount },
            );
        }

        return this.root.i18n.translate(
            `GL.CRUD.RECORD_ACTION.${actionKey}.${outcome}`,
            { module: this.getActionModuleName() },
        );
    }
    private getRecordActionMessageKey(
        action: FoundationActionEnum,
    ): 'ACTIVE' | 'INACTIVE' | 'MARK_AS_MAIN' | 'SOFT_DELETE' | 'RESTORE' | 'DELETE' {
        switch (action) {
            case FoundationActionEnum.ACTIVE:
                return 'ACTIVE';
            case FoundationActionEnum.INACTIVE:
                return 'INACTIVE';
            case FoundationActionEnum.MARK_AS_MAIN:
                return 'MARK_AS_MAIN';
            case FoundationActionEnum.SOFT_DELETE:
                return 'SOFT_DELETE';
            case FoundationActionEnum.RESTORE:
                return 'RESTORE';
            case FoundationActionEnum.DELETE:
                return 'DELETE';

            default:
                throw new Error(`getRecordActionMessageKey: unsupported action "${action}"`);
        }
    }
}