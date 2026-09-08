// file: src/app/base/crud/service/mutation.ts
import { inject, Type } from "@angular/core";
import { MatBottomSheet, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { submit } from "@angular/forms/signals";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { CrudActionUiLayoutEnum, CrudEndSideBarTabEnum, CrudFieldNormalizeModeEnum, CrudFieldUiTypeEnum } from "@base/crud/enum";
import { UiSizeEnum } from "@libs/breakpoint/enum";
import { UI_WIDTH } from "@libs/breakpoint/const";
import { CrudDefaultMutationBottomSheetComponent } from "@base/crud/default/mutation/bottom-sheet/component";
import { CrudDefaultMutationDialogComponent } from "@base/crud/default/mutation/dialog/component";
import { CrudDefaultMutationFormComponent } from "@base/crud/default/mutation/form/component";
import { CrudDefaultMutationPageComponent } from "@base/crud/default/mutation/page/component";
import { BfwApiSdkError } from "@bfw/api-sdk/core";
import {
    CrudCreateHandlerType,
    CrudFormFieldInfoType,
    CrudMutationFieldErrorType,
    CrudMutationInputType,
    CrudMutationFormInputOptionsType,
} from "@base/crud/type";
import { CrudRootService } from "./root";
import { CrudActionService } from "./action";
import { CrudListingService } from "./listing";

export class CrudMutationService {

    // ████████████████████████████████████████████████████████████████████
    // ███ DEPENDENCIES ███████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public readonly mutationDialog = inject(MatDialog);
    public readonly mutationBottomSheet = inject(MatBottomSheet);

    private activeMutationDialogRef: MatDialogRef<CrudDefaultMutationDialogComponent> | null = null;
    private activeMutationBottomSheetRef: MatBottomSheetRef<CrudDefaultMutationBottomSheetComponent> | null = null;

    constructor(
        private readonly root: CrudRootService,
        private readonly action: CrudActionService,
        private readonly listing: CrudListingService,
    ) {}

    // ████████████████████████████████████████████████████████████████████
    // ███ SLOT FIELD █████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public getMutationFieldSlotPortalKey(key: string): string {
        return `${this.root.CrudFieldSlotPortalKeyPrefixEnum.MUTATION}${key}`;
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ MUTATION OPERATION █████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public async initMutationActionFromUrl(
        keyid: string | number | null = this.action.getCrudActionRecordSecondaryKeyValue(),
    ): Promise<void> {
        if (
            (this.isMutationCreate() && !this.action.ensureActionPermitted(this.root.state.action.hasCreate()))
            || (this.isMutationUpdate() && !this.action.ensureActionPermitted(this.root.state.action.hasUpdate()))
            || (this.isMutationDuplicate() && !this.action.ensureActionPermitted(this.root.state.action.hasDuplicate()))
        ) {
            return;
        }

        if (!await this.loadMutationFormFieldValues(keyid)) {
            return;
        }

        if (this.root.state.mutation.mutationActionUiLayout() === CrudActionUiLayoutEnum.PAGE) {
            return;
        }

        /**
         * Defer so <app-crud-default-mutation-component> can render first.
         * Required for END_SIDE_BAR portal registration.
         */
        setTimeout(() => {
            this.openMutationOverlay();
        });
    }
    public isMutationActionActive(): boolean {
        return this.action.isMutationActionType(this.root.state.crudAction());
    }
    public isMutationCreate(): boolean {
        return this.root.state.crudAction() === FoundationActionEnum.CREATE;
    }
    public isMutationUpdate(): boolean {
        return this.root.state.crudAction() === FoundationActionEnum.UPDATE;
    }
    public isMutationDuplicate(): boolean {
        return this.root.state.crudAction() === FoundationActionEnum.DUPLICATE;
    }
    public getMutationIcon(): string {
        switch (this.root.state.crudAction()) {
            case FoundationActionEnum.UPDATE:
                return 'edit_document';
            case FoundationActionEnum.DUPLICATE:
                return 'content_copy';
            default:
                return 'add_circle';
        }
    }
    public getMutationTitle(): string {
        switch (this.root.state.crudAction()) {
            case FoundationActionEnum.UPDATE:
                return 'GL.ACTION.UPDATE';
            case FoundationActionEnum.DUPLICATE:
                return 'GL.ACTION.DUPLICATE';
            default:
                return 'GL.COMMON.ADD_NEW';
        }
    }
    public getMutationFormComponent(): Type<any> {
        return this.root.state.mutation.mutationFormCustomComponent() ?? CrudDefaultMutationFormComponent;
    }
    public getMutationPageComponent(): Type<any> {
        return this.root.state.mutation.mutationPageCustomComponent() ?? CrudDefaultMutationPageComponent;
    }
    public toggleMutationEndDrawer(callback?: () => void): void {
        this.root.state.mutation.setMutationEndDrawerIsOpen(!this.root.state.mutation.mutationEndDrawerIsOpen());

        if (callback)
            callback();
    }
    public resolveMutationActionUiLayout(): void {
        // after need to develop something like how src/app/base/crud/default/mutation/form can be take over by child
        // but remain things stay as it is with bottom sheet, dialoug and end side bar wrapper
        // in short Child takeover is pending

        const fields = this.root.state.mutation.mutationFieldObj();
        const fieldCount = Object.keys(fields).length;
        const columnCount = Math.max(1, ...Object.values(fields).map((field) => field.colspan ?? 1));

        if (columnCount > 1 && this.root.bos.isLgAndUp()) {
            this.root.state.mutation.setMutationActionUiLayout(CrudActionUiLayoutEnum.DIALOG);
        } else if (this.root.bos.isMdAndDown() || fieldCount < 4) {
            this.root.state.mutation.setMutationActionUiLayout(CrudActionUiLayoutEnum.BOTTOM_SHEET);
        } else if (fieldCount > 4 && fieldCount < 12) {
            this.root.state.mutation.setMutationActionUiLayout(CrudActionUiLayoutEnum.END_SIDE_BAR);
        } else {
            this.root.state.mutation.setMutationActionUiLayout(CrudActionUiLayoutEnum.DIALOG);
        }
    }
    public openMutationOverlay(): void {
        const layout = this.root.state.mutation.mutationActionUiLayout();

        if (layout === CrudActionUiLayoutEnum.DIALOG) {
            if (this.activeMutationDialogRef) {
                return;
            }

            const size = this.root.state.mutation.mutationActionUiSize();
            const fullscreen = size === UiSizeEnum.FULL;

            this.activeMutationDialogRef = this.mutationDialog.open(
                CrudDefaultMutationDialogComponent,
                {
                    panelClass: [
                        'bfw-safe-area-p',
                        ...(fullscreen ? ['tw:[--mat-dialog-container-shape:0px]'] : []),
                    ],
                    injector: this.root.getComponentInjector(),
                    disableClose: true,
                    width: UI_WIDTH[size],
                    maxWidth: fullscreen ? '100vw' : 'calc(100vw - 2rem)',
                    height: fullscreen ? '100dvh' : undefined,
                    maxHeight: fullscreen ? '100dvh' : undefined,
                },
            );

            this.activeMutationDialogRef.afterClosed().subscribe(() => {
                this.activeMutationDialogRef = null;
            });

            return;
        }
        else if (layout === CrudActionUiLayoutEnum.BOTTOM_SHEET) {
            if (this.activeMutationBottomSheetRef) {
                return;
            }

            this.activeMutationBottomSheetRef = this.mutationBottomSheet.open(
                CrudDefaultMutationBottomSheetComponent,
                {
                    injector: this.root.getComponentInjector(),
                    disableClose: true,
                },
            );

            this.activeMutationBottomSheetRef.afterDismissed().subscribe(() => {
                this.activeMutationBottomSheetRef = null;
            });

            return;
        }
        else if (layout === CrudActionUiLayoutEnum.END_DRAWER) {
            this.root.state.mutation.setMutationEndDrawerIsOpen(true);
            return;
        }
        else if (layout === CrudActionUiLayoutEnum.END_SIDE_BAR) {
            if (!this.root.paLayout) return;

            this.root.paLayout.state.setEndSideBarIsOpen(true);

            // same thing can be done using 3 different way but behaviour will be different in case of timing
            // setTimeout(() => {
            //     this.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.MUTATION);
            // }, 100);

            queueMicrotask(() => {
                this.root.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.MUTATION);
            });

            // afterNextRender(() => {
            //     this.paLayout.switchEndSideBarTab(CrudEndSideBarTabEnum.MUTATION);
            // }, { injector: this.getComponentInjector() });

            return;
        }
    }
    public closeMutationOverlay(): void {
        if (this.activeMutationDialogRef) {
            this.activeMutationDialogRef.close();
            this.activeMutationDialogRef = null;
        }
        else if (this.activeMutationBottomSheetRef) {
            this.activeMutationBottomSheetRef.dismiss();
            this.activeMutationBottomSheetRef = null;
        }
        else if (this.root.state.mutation.mutationActionUiLayout() === CrudActionUiLayoutEnum.END_DRAWER) {
            this.root.state.mutation.setMutationEndDrawerIsOpen(false);
        }
        else if (this.root.state.mutation.mutationActionUiLayout() === CrudActionUiLayoutEnum.END_SIDE_BAR) {
            if (this.root.paLayout) {
                this.root.paLayout.state.setEndSideBarIsOpen(false);
            }
        }
    }
    public async closeMutationAction(): Promise<void> {
        await this.action.closeCrudAction();
    }
    public addEndDrawerOnCloseCallBack(): void {
        /**
         * perform required actions when end-side-bar close by registering callback
         * list all call back process this could be as per crud action wise or common
         */
        this.root.state.mutation.addMutationEndDrawerOnCloseCallback('on_mutation_close', () => {
            if (
                this.isMutationActionActive() &&
                this.root.state.mutation.mutationActionUiLayout() === CrudActionUiLayoutEnum.END_DRAWER
            ) {
                void this.closeMutationAction();
            }
        });

        // add more call back
    }
    private async loadMutationFormFieldValues(
        keyid: string | number | null,
    ): Promise<boolean> {
        // this method is called only for update to fill up the form with existing values from database using api
        if (this.isMutationCreate()) {
            this.root.state.mutation.setMutationFormValues();
            return true;
        }

        if (keyid === null) {
            this.root.notify.error(this.action.getMutationFormMessage('key_missing'));
            return false;
        }

        this.root.state.mutation.setMutationFormProcessing(true);

        try {
            const record = await this.root.findOneBySecondaryKey(
                keyid,
                this.root.state.mutation.mutationFieldObj(),
            );

            if (!record) {
                this.root.notify.error(this.action.getMutationFormMessage('failed'));
                return false;
            }

            // Ignore a response for a record that is no longer the active route.
            if (
                (
                    !this.isMutationUpdate()
                    && !this.isMutationDuplicate()
                )
                || this.action.getCrudActionRecordSecondaryKeyValue() !== keyid
            ) {
                return false;
            }

            const keyField = this.root.state.secondaryKey();

            if (
                keyField
                && Object.prototype.hasOwnProperty.call(
                    this.root.state.mutation.mutationFieldObj(),
                    keyField,
                )
                && String(record[keyField]) !== String(keyid)
            ) {
                this.root.notify.error(
                    this.action.getMutationFormMessage('key_mismatch'),
                );
                return false;
            }

            const mutationValues = this.normalizeMutationFormLoadValues(record);

            if (this.isMutationDuplicate()) {
                const mutationFieldObj = this.root.state.mutation.mutationFieldObj();
                const identityFields = [
                    this.root.state.primaryKey(),
                    this.root.state.secondaryKey(),
                ];

                for (const fieldName of identityFields) {
                    if (
                        fieldName
                        && Object.prototype.hasOwnProperty.call(mutationFieldObj, fieldName)
                    ) {
                        mutationValues[fieldName] = null;
                    }
                }
            }

            this.root.state.mutation.setMutationFormValues(mutationValues);
            return true;
        } catch (error: unknown) {
            this.root.log.error('[UPDATE MUTATION FORM LOAD FAILED]', error);

            const fallbackMessage = this.action.getMutationFormMessage('failed');
            const message = error instanceof BfwApiSdkError
                ? error.errors()[0] ?? fallbackMessage
                : error instanceof Error
                    ? error.message
                    : fallbackMessage;

            this.root.notify.error(message);
            return false;
        } finally {
            this.root.state.mutation.setMutationFormProcessing(false);
        }
    }
    /**
     * Build a module API input from the dynamic mutation field definition.
     * Field-type and custom normalizers use the same CTOS path as the rest of CRUD.
     */
    public mutationFormInputValues<TOutput extends object = CrudMutationInputType>(
        input: CrudMutationInputType = {
            ...this.root.state.mutation.mutationForm().value(),
        },
        options: CrudMutationFormInputOptionsType = {},
    ): TOutput {
        const exclude = new Set(options.exclude ?? []);
        const output: CrudMutationInputType = {};
        const fieldObj = this.root.state.mutation.mutationFieldObj();
        const context = this.root.state.getCrudModuleContext();

        for (const [key, fieldInfo] of Object.entries(fieldObj)) {
            if (
                fieldInfo.type === CrudFieldUiTypeEnum.NONE
                || exclude.has(key)
                || !Object.prototype.hasOwnProperty.call(input, key)
            ) {
                continue;
            }

            const result = this.root.validation.normalizeAndValidateCrudFormFieldValue(
                input[key],
                fieldInfo,
                input,
                undefined,
                context,
            );

            if (!result.valid) {
                this.root.log.error('[MUTATION SUBMIT] invalid field value coerced to default', { key, raw: input[key] });
            }

            const value = result.value instanceof Date
                ? result.value.toISOString()
                : result.value;

            if (options.omitEmpty && this.shouldOmitMutationFormValue(value, fieldInfo)) {
                continue;
            }

            output[key] = value;
        }

        return output as TOutput;
    }
    private normalizeMutationFormLoadValues(
        input: CrudMutationInputType,
    ): CrudMutationInputType {
        const output: CrudMutationInputType = {};
        const fieldObj = this.root.state.mutation.mutationFieldObj();
        const context = this.root.state.getCrudModuleContext();

        for (const [key, fieldInfo] of Object.entries(fieldObj)) {
            if (
                fieldInfo.type === CrudFieldUiTypeEnum.NONE
                || !Object.prototype.hasOwnProperty.call(input, key)
            ) {
                continue;
            }

            // A present null is an explicit server value, not a missing value
            // that should fall back to the field's previous/default state.
            if (input[key] === null || input[key] === undefined) {
                output[key] = null;
                continue;
            }

            const result = this.root.validation.normalizeAndValidateCrudFormFieldValue(
                input[key],
                fieldInfo,
                input,
                CrudFieldNormalizeModeEnum.STOC,
                context,
            );

            if (result.valid) {
                output[key] = result.value;
            } else {
                output[key] = this.root.validation.normalizeCrudFormFieldValue(
                    input[key],
                    fieldInfo,
                    input,
                    CrudFieldNormalizeModeEnum.STOC,
                    context,
                );
            }
        }

        return output;
    }
    private shouldOmitMutationFormValue(
        value: unknown,
        fieldInfo: CrudFormFieldInfoType,
    ): boolean {
        switch (fieldInfo.type) {
            // Empty values for these types represent an explicit state/clear action.
            case CrudFieldUiTypeEnum.FLAG:
            case CrudFieldUiTypeEnum.MULTISELECT:
            case CrudFieldUiTypeEnum.BUTTON_MULTISELECT:
            case CrudFieldUiTypeEnum.MULTISELECTAUTOSUGGEST:
            case CrudFieldUiTypeEnum.CHECKBOX:
            case CrudFieldUiTypeEnum.ARRAY:
            case CrudFieldUiTypeEnum.JSON:
                return false;

            default:
                return value === null || value === undefined || value === '';
        }
    }
    public mutationFormFieldErrors(
        error: unknown,
    ): CrudMutationFieldErrorType | undefined {
        if (!(error instanceof BfwApiSdkError)) {
            return undefined;
        }

        const fields = Object.entries(this.root.state.mutation.mutationFieldObj())
            .filter(([, fieldInfo]) =>
                fieldInfo.type !== CrudFieldUiTypeEnum.NONE
                && fieldInfo.type !== CrudFieldUiTypeEnum.HIDDEN,
            )
            .map(([key]) => ({
                key,
                search: this.mutationErrorSearchText(key),
            }))
            // Match currency_name before the shorter name field.
            .sort((a, b) => b.search.length - a.search.length);
        const fieldErrors: CrudMutationFieldErrorType = {};

        for (const message of error.errors()) {
            const searchMessage = ` ${this.mutationErrorSearchText(message)} `;
            const field = fields.find(({ search }) =>
                searchMessage.includes(` ${search} `),
            );

            if (field) {
                fieldErrors[field.key] = message;
            }
        }

        return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
    }
    private mutationErrorSearchText(value: string): string {
        return value
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ EXECUTION ██████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public async submitMutationForm(): Promise<void> {
        if (this.root.state.mutation.mutationFormProcessing()) {
            return;
        }

        if (!this.isMutationActionActive()) {
            this.root.notify.error('No CRUD mutation action is active.');
            return;
        }

        const mutationForm = this.root.state.mutation.mutationForm;
        const isUpdate = this.isMutationUpdate();
        const isDuplicate = this.isMutationDuplicate();
        let handler: CrudCreateHandlerType;

        if (isUpdate) {
            if (!this.action.ensureActionPermitted(this.root.state.action.hasUpdate())) return;

            const keyid = this.action.getCrudActionRecordSecondaryKeyValue();

            if (keyid === null) {
                this.root.notify.error(
                    this.action.getMutationFormMessage('key_missing'),
                );
                return;
            }

            handler = async (input: CrudMutationInputType) => {
                const keyField = this.root.state.secondaryKey();

                if (
                    keyField
                    && Object.prototype.hasOwnProperty.call(
                        this.root.state.mutation.mutationFieldObj(),
                        keyField,
                    )
                    && String(input[keyField]) !== String(keyid)
                ) {
                    return {
                        success: false,
                        message: this.action.getMutationFormMessage('key_mismatch'),
                    };
                }

                return this.action.runUpdate(keyid, input);
            };
        } else {
            const permitted = isDuplicate
                ? this.root.state.action.hasDuplicate()
                : this.root.state.action.hasCreate();

            if (!this.action.ensureActionPermitted(permitted)) return;

            handler = (input) => this.action.runCreate(input);
        }

        let successMessage: string | undefined;

        const succeeded = await submit(mutationForm, {
            action: async (field) => {
                this.root.state.mutation.setMutationFormProcessing(true);
                this.root.gpbs.start();
                this.root.gpbs.stream = 20;

                try {
                    const input: CrudMutationInputType = { ...field().value() };
                    const result = await handler(input);

                    this.root.gpbs.stream = 80;

                    if (result.success) {
                        successMessage = result.message;
                        return undefined;
                    }

                    if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
                        const values = field().value();

                        return Object.entries(result.fieldErrors).map(([key, message]) => ({
                            fieldTree: Object.prototype.hasOwnProperty.call(values, key)
                                ? (field as any)[key]
                                : field,
                            kind: 'server',
                            message,
                        }));
                    }

                    const message = result.message
                        ?? this.action.getMutationFormMessage('failed');
                    this.root.notify.error(message);

                    return {
                        kind: 'server',
                        message,
                    };
                } catch (error: unknown) {
                    this.root.log.error('[MUTATION FAILED]', error);

                    const fallbackMessage = this.action.getMutationFormMessage('failed');
                    const message = error instanceof BfwApiSdkError
                        ? error.errors()[0] ?? fallbackMessage
                        : error instanceof Error
                            ? error.message
                            : fallbackMessage;

                    this.root.notify.error(message);

                    return {
                        kind: 'server',
                        message,
                    };
                } finally {
                    this.root.gpbs.stream = 100;
                    this.root.gpbs.stop();
                    this.root.state.mutation.setMutationFormProcessing(false);
                }
            },
            onInvalid: (field) => {
                field().errorSummary()[0]?.fieldTree().focusBoundControl();
            },
            ignoreValidators: 'none',
        });

        if (!succeeded) {
            return;
        }

        this.root.notify.success(
            successMessage
                ?? this.action.getMutationFormMessage('success'),
        );
        this.root.state.mutation.resetMutationForm();
        await this.closeMutationAction();
    }
}
