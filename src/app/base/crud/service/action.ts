// file: src/app/base/crud/service/action.ts
import { HttpStatusCode } from "@angular/common/http";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { CrudActionUiLayoutEnum, CrudDataLoadTypeEnum } from "@base/crud/enum";
import { BfwApiSdkError } from "@bfw/api-sdk/core";
import { ConfirmationDialogDataType } from "@base/confirmation-dialog/type";
import {
    CrudActiveHandlerType,
    CrudCreateHandlerType,
    CrudDeleteHandlerType,
    CrudFindHandlerType,
    CrudFindInputType,
    CrudInactiveHandlerType,
    CrudMutationInputType,
    CrudMutationResultType,
    CrudRecordActionType,
    CrudRecordKeyInputType,
    CrudRecordKeyType,
    CrudRestoreHandlerType,
    CrudSoftDeleteHandlerType,
    CrudUpdateHandlerType,
} from "@base/crud/type";
import { CrudRootService } from "./root";

/**
 * Crud-action lifecycle concern (mirrors CrudActionState in state/action.ts),
 * plus the layout decisions that only depend on state (not on the
 * mutation/view service instances), plus the row-level record-action
 * executors (active/inactive/soft-delete/restore/delete) — these need the
 * same ensureActionPermitted() gate as everything else here, so they moved
 * out of listing.ts to live next to it.
 */
export class CrudActionService {
    // ████████████████████████████████████████████████████████████████████
    // ███ API HANDLER ████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private findHandler: CrudFindHandlerType | null = null;
    private createHandler: CrudCreateHandlerType | null = null;
    private updateHandler: CrudUpdateHandlerType | null = null;
    private activeHandler: CrudActiveHandlerType | null = null;
    private inactiveHandler: CrudInactiveHandlerType | null = null;
    private softDeleteHandler: CrudSoftDeleteHandlerType | null = null;
    private restoreHandler: CrudRestoreHandlerType | null = null;
    private deleteHandler: CrudDeleteHandlerType | null = null;

    /**
     * Set once by CrudListingService's own constructor (registerAfterRecordActionSuccess).
     * A successful record action still needs to patch/remove the affected
     * listing rows and possibly reload — that's listing's job, not action's —
     * but action is constructed before listing exists, so listing wires this
     * callback into action instead of action holding a CrudListingService
     * reference (same register-a-handler idiom used everywhere else here).
     */
    private afterRecordActionSuccess: ((action: CrudRecordActionType, keyid: CrudRecordKeyInputType) => Promise<void>) | null = null;

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
    public getCrudActionRecordPrimaryKeyValue(): string | number | null {
        const keys = this.root.state.crudActionRecordPrimaryKey();

        if (Array.isArray(keys)) {
            return keys[0] ?? null;
        }

        return keys ?? null;
    }
    public getCrudActionRecordSecondaryKeyValue(): string | number | null {
        const keys = this.root.state.crudActionRecordSecondaryKey();

        if (Array.isArray(keys)) {
            return keys[0] ?? null;
        }

        return keys ?? null;
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
    public clearCrudActionAndRecordKey(): void {
        // the overlay effect in init.ts owns closing the UI now
        this.root.state.clearCrudActionAndRecordKey();
    }
    public async closeCrudAction(refresh: boolean = true): Promise<void> {
        await this.root.url.navigateAwayFromCrudAction();
        this.clearCrudActionAndRecordKey();

        // as action if performed and listing needs to be refreshed as there might be some changes with data
        if (refresh) {
            await this.runFind();
        }
    }
    public getMutationFormMessage(
        outcome: 'success' | 'failed' | 'key_missing' | 'key_mismatch',
    ): string {
        const moduleInfo = this.root.paLayout.state.moduleInfo();
        const moduleName = moduleInfo?.i18n?.title
            ? this.root.i18n.translate(moduleInfo.i18n.title)
            : moduleInfo?.title?.trim()
                || this.root.i18n.translate('GL.CRUD.RECORD');
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
    public registerActive(handler: CrudActiveHandlerType): void {
        this.activeHandler = handler;
    }
    public registerInactive(handler: CrudInactiveHandlerType): void {
        this.inactiveHandler = handler;
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
    /** Wired by CrudListingService's constructor — see afterRecordActionSuccess above. */
    public registerAfterRecordActionSuccess(
        callback: (action: CrudRecordActionType, keyid: CrudRecordKeyInputType) => Promise<void>,
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
        keyid: CrudRecordKeyType,
        input: CrudMutationInputType,
    ): Promise<CrudMutationResultType> {
        if (!this.updateHandler) {
            return {
                success: false,
                message: 'CRUD update handler is not registered.',
            };
        }

        return this.updateHandler(keyid, input);
    }
    public async runActive(keyid: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.root.state.action.hasActive())) return;

        await this.runRecordAction(
            FoundationActionEnum.ACTIVE,
            keyid,
            this.activeHandler,
        );
    }
    public async runInactive(keyid: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.root.state.action.hasInactive())) return;

        await this.runRecordAction(
            FoundationActionEnum.INACTIVE,
            keyid,
            this.inactiveHandler,
        );
    }
    public async runSoftDelete(keyid: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.root.state.action.hasSoftDelete())) return;

        await this.runRecordAction(
            FoundationActionEnum.SOFT_DELETE,
            keyid,
            this.softDeleteHandler,
        );
    }
    public async runRestore(keyid: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.root.state.action.hasRestore())) return;

        await this.runRecordAction(
            FoundationActionEnum.RESTORE,
            keyid,
            this.restoreHandler,
        );
    }
    public async runDelete(keyid: CrudRecordKeyInputType | null): Promise<void> {
        if (!this.ensureActionPermitted(this.root.state.action.hasDelete())) return;

        await this.runRecordAction(
            FoundationActionEnum.DELETE,
            keyid,
            this.deleteHandler,
        );
    }
    private async runRecordAction<T extends CrudRecordKeyInputType>(
        action: CrudRecordActionType,
        keyid: T | null,
        handler: ((keyid: T) => Promise<CrudMutationResultType>) | null,
    ): Promise<void> {
        if (keyid === null) {
            this.root.notify.error(
                this.root.i18n.translate('GL.CRUD.RECORD_ACTION.KEY_MISSING'),
            );
            return;
        }

        const bulkCount = Array.isArray(keyid) ? keyid.length : null;
        const keyids = Array.isArray(keyid) ? keyid : [keyid];

        if (
            keyids.length === 0 ||
            keyids.some((key) => String(key).trim() === '')
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

        if (!await this.confirmRecordAction(action, bulkCount)) {
            return;
        }

        try {
            const result = await handler(keyid);

            if (!result.success) {
                this.root.notify.error(
                    result.message
                        ?? this.getRecordActionMessage(action, 'FAILED', bulkCount),
                );
                return;
            }

            await this.afterRecordActionSuccess?.(action, keyid);
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

    // ████████████████████████████████████████████████████████████████████
    // ███ CRUD RECORD ACTION OPERATION ███████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private async confirmRecordAction(
        action: CrudRecordActionType,
        bulkCount: number | null = null,
    ): Promise<boolean> {
        return this.root.confirmationDialog.confirm(
            this.getRecordActionConfirmationData(action, bulkCount),
        );
    }
    private getRecordActionConfirmationData(
        action: CrudRecordActionType,
        bulkCount: number | null = null,
    ): ConfirmationDialogDataType {
        switch (action) {
            case FoundationActionEnum.ACTIVE:
                return {
                    icon: 'check_circle_unread',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.ACTIVE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.ACTIVE.CONFIRM_TITLE',
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
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.INACTIVE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.INACTIVE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.INACTIVE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                };

            case FoundationActionEnum.SOFT_DELETE:
                return {
                    icon: 'delete',
                    titleKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.SOFT_DELETE.CONFIRM_TITLE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.SOFT_DELETE.CONFIRM_TITLE',
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
                    messageKey: bulkCount === null
                        ? 'GL.CRUD.RECORD_ACTION.DELETE.CONFIRM_MESSAGE'
                        : 'GL.CRUD.SELECTED_RECORD_ACTION.DELETE.CONFIRM_MESSAGE',
                    confirmLabelKey: 'GL.ACTION.DELETE',
                    params: bulkCount === null ? undefined : { count: bulkCount },
                    danger: true,
                };
        }
    }
    private getRecordActionMessage(
        action: CrudRecordActionType,
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

        const moduleInfo = this.root.paLayout.state.moduleInfo();
        const moduleName = moduleInfo?.i18n?.title
            ? this.root.i18n.translate(moduleInfo.i18n.title)
            : moduleInfo?.title?.trim()
                || this.root.i18n.translate('GL.CRUD.RECORD');

        return this.root.i18n.translate(
            `GL.CRUD.RECORD_ACTION.${actionKey}.${outcome}`,
            { module: moduleName },
        );
    }
    private getRecordActionMessageKey(
        action: CrudRecordActionType,
    ): 'ACTIVE' | 'INACTIVE' | 'SOFT_DELETE' | 'RESTORE' | 'DELETE' {
        switch (action) {
            case FoundationActionEnum.ACTIVE:
                return 'ACTIVE';
            case FoundationActionEnum.INACTIVE:
                return 'INACTIVE';
            case FoundationActionEnum.SOFT_DELETE:
                return 'SOFT_DELETE';
            case FoundationActionEnum.RESTORE:
                return 'RESTORE';
            case FoundationActionEnum.DELETE:
                return 'DELETE';
        }
    }
}