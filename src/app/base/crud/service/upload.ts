// file: src/app/base/crud/service/upload.ts
import { inject, Type } from "@angular/core";
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { submit } from "@angular/forms/signals";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { BREAKPOINT_WIDTH } from "@libs/breakpoint/const";
import { CrudUploadDialogComponent } from "src/app/base/crud/component/upload/dialog/component";
import { CrudUploadFormComponent } from "src/app/base/crud/component/upload/form/component";
import { BfwApiSdkError } from "@bfw/api-sdk/core";
import { CrudRecordType } from "@base/crud/type";
import { CrudRootService } from "./root";
import { CrudActionService } from "./action";
import { CrudListingService } from "./listing";

export class CrudUploadService {
    // ████████████████████████████████████████████████████████████████████
    // ███ DEPENDENCIES ███████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public readonly uploadDialog = inject(MatDialog);

    private activeUploadDialogRef: MatDialogRef<CrudUploadDialogComponent> | null = null;

    constructor(
        private readonly root: CrudRootService,
        private readonly action: CrudActionService,
        private readonly listing: CrudListingService,
    ) {}

    // ████████████████████████████████████████████████████████████████████
    // ███ UPLOAD OPERATION ███████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public async initUploadActionFromUrl(
        value: string | number | null = this.action.getCrudActionRecordIndex(),
    ): Promise<void> {
        if (!this.action.ensureActionPermitted(this.root.state.action.hasUpload())) {
            return;
        }

        if (value === null) {
            this.root.notify.error(this.action.getUploadFormMessage('key_missing'));
            return;
        }

        // scan the loaded rows on the column this module addresses by
        let row: CrudRecordType | null =
            this.root.state.listing.findListingDataSourceByIndexColumn(value);

        /**
         * Fast path covers the normal click-the-menu-item flow with zero
         * extra api calls - the row is already loaded, the same one value
         * itself came from. Falls back to a fresh fetch (same helper
         * CrudMutationService uses for UPDATE) for a direct deep link
         * (listing may still be loading) or if Display Fields ever leaves
         * the row incomplete for this purpose.
         */
        if (!row) {
            row = await this.action.findOneByActionRecordIndexColumn(
                this.root.state.upload.uploadFieldObj(),
            );
        }

        this.root.state.upload.setUploadRecord(row);
        this.root.state.upload.setUploadFormValues(row ?? {});

        setTimeout(() => {
            this.openUploadOverlay();
        });
    }
    public isUploadActionActive(): boolean {
        return this.root.state.crudAction() === FoundationActionEnum.UPLOAD;
    }
    public getUploadIcon(): string {
        return 'upload';
    }
    public getUploadTitle(): string {
        return 'GL.ACTION.UPLOAD';
    }
    public getUploadFormComponent(): Type<any> {
        return this.root.state.upload.uploadFormCustomComponent() ?? CrudUploadFormComponent;
    }
    public openUploadOverlay(): void {
        if (this.activeUploadDialogRef) {
            return;
        }

        const size = this.root.state.upload.uploadActionUiSize();

        this.activeUploadDialogRef = this.uploadDialog.open(
            CrudUploadDialogComponent,
            {
                panelClass: ['bfw-safe-area-p'],
                injector: this.root.getComponentInjector(),
                disableClose: true,
                width: BREAKPOINT_WIDTH[size],
                maxWidth: 'calc(100vw - 2rem)',
            },
        );

        this.activeUploadDialogRef.afterClosed().subscribe(() => {
            this.activeUploadDialogRef = null;
        });
    }
    public closeUploadOverlay(): void {
        if (this.activeUploadDialogRef) {
            this.activeUploadDialogRef.close();
            this.activeUploadDialogRef = null;
        }
    }
    public async closeUploadAction(): Promise<void> {
        await this.action.closeCrudAction(
            this.root.state.listing.shouldReloadListingAfterAction(FoundationActionEnum.UPLOAD),
        );
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ EXECUTION ██████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public async submitUploadForm(): Promise<void> {
        if (this.root.state.upload.uploadFormProcessing()) {
            return;
        }

        if (!this.isUploadActionActive()) {
            this.root.notify.error('No CRUD upload action is active.');
            return;
        }

        if (!this.action.ensureActionPermitted(this.root.state.action.hasUpload())) {
            return;
        }

        const value = this.action.getCrudActionRecordIndex();

        if (value === null) {
            this.root.notify.error(this.action.getUploadFormMessage('key_missing'));
            return;
        }

        const uploadForm = this.root.state.upload.uploadForm;

        const succeeded = await submit(uploadForm, {
            action: async (field) => {
                this.root.state.upload.setUploadFormProcessing(true);
                this.root.gpbs.start();
                this.root.gpbs.stream = 20;

                try {
                    const values = field().value();
                    const changedFileFields = this.root.state.upload.changedUploadFileFields();

                    /**
                     * Nothing picked anywhere. The save button is disabled for this
                     * case (CrudUploadState.anyFileSelected), so this is a backstop,
                     * not the normal path - it must fail, not report success for
                     * doing nothing.
                     */
                    if (changedFileFields.length === 0) {
                        const message = this.action.getUploadFormMessage('select_required');
                        this.root.notify.error(message);
                        return { kind: 'server', message };
                    }

                    this.root.gpbs.stream = 50;

                    for (const fkey of changedFileFields) {
                        const result = await this.action.runUpload(value, { [fkey]: values[fkey] });

                        if (result.success) {
                            this.patchListingFileField(fkey, result.data);
                            continue;
                        }

                        if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
                            return Object.entries(result.fieldErrors).map(([key, message]) => ({
                                fieldTree: Object.prototype.hasOwnProperty.call(values, key)
                                    ? (field as any)[key]
                                    : field,
                                kind: 'server',
                                message,
                            }));
                        }

                        const message = result.message ?? this.action.getUploadFormMessage('failed');
                        this.root.notify.error(message);
                        return { kind: 'server', message };
                    }

                    this.root.gpbs.stream = 80;
                    return undefined;
                } catch (error: unknown) {
                    this.root.log.error('[UPLOAD FAILED]', error);

                    const fallbackMessage = this.action.getUploadFormMessage('failed');
                    const message = error instanceof BfwApiSdkError
                        ? error.errors()[0] ?? fallbackMessage
                        : error instanceof Error
                            ? error.message
                            : fallbackMessage;

                    this.root.notify.error(message);

                    return { kind: 'server', message };
                } finally {
                    this.root.gpbs.stream = 100;
                    this.root.gpbs.stop();
                    this.root.state.upload.setUploadFormProcessing(false);
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

        this.root.notify.success(this.action.getUploadFormMessage('success'));
        this.root.state.upload.resetUploadForm();
        await this.closeUploadAction();
    }

    public async uploadDelete(fkey: string): Promise<void> {
        if (!this.action.ensureActionPermitted(this.root.state.action.hasUploadDelete())) {
            return;
        }

        const value = this.action.getCrudActionRecordIndex();
        if (value === null) {
            this.root.notify.error(this.action.getUploadFormMessage('key_missing'));
            return;
        }

        const confirmed = await this.action.confirmRecordAction(FoundationActionEnum.UPLOAD_DELETE);
        if (!confirmed) return;

        this.root.state.upload.setUploadFormProcessing(true);

        try {
            const result = await this.action.runUploadDelete(value, fkey);

            if (!result.success) {
                this.root.notify.error(result.message ?? this.action.getUploadFormMessage('delete_failed'));
                return;
            }

            this.patchListingFileField(fkey, null);
            this.clearUploadField(fkey);
            this.root.notify.success(result.message ?? this.action.getUploadFormMessage('delete_success'));
        } catch (error: unknown) {
            this.root.log.error('[UPLOAD DELETE FAILED]', error);
            this.root.notify.error(this.action.getUploadFormMessage('delete_failed'));
        } finally {
            this.root.state.upload.setUploadFormProcessing(false);
        }
    }

    /**
     * Patches the FILE field's listing cell(s) directly — same fr_field
     * pairing clearUploadField() uses for the dialog's own cache, same
     * resolved-row-wins precedence resolveActionProcessingRecord() uses
     * server-side, so this keys on exactly the row runUpload/runUploadDelete
     * acted on.
     */
    private patchListingFileField(
        fkey: string,
        data: Record<string, unknown> | null | undefined,
    ): void {
        const finfo = this.root.state.upload.uploadFieldObj()[fkey];
        if (!finfo) return;

        const row = this.root.state.upload.uploadRecord();
        const index = (row ? this.root.state.getRecordIndexColumnValue(row) : null)
            ?? this.action.getCrudActionRecordIndex();

        if (index === null) return;

        this.root.state.listing.patchListingData(index, {
            [fkey]: data?.['file_name'] ?? null,
            ...(finfo.fr_field ? { [finfo.fr_field]: data?.['access_url'] ?? null } : {}),
        });
    }
    /**
     * Clears only THIS field's value and its slice of the cached row, so
     * both [value] and the template's fr_field lookup go back to "fresh".
     * Mirrors, without calling (this sub-service only holds CrudRootService,
     * not the full CrudService that owns onCrudFieldValueChange), what that
     * method's syncUploadFormValue closure already does for a normal edit.
     */
    private clearUploadField(fkey: string): void {
        const fieldObj = this.root.state.upload.uploadFieldObj();
        const finfo = fieldObj[fkey];
        if (!finfo) return;

        finfo.value = null;
        this.root.state.upload._uploadFieldObj.set({ ...fieldObj });

        const fieldTree = (this.root.state.upload.uploadForm as any)?.[fkey];
        if (typeof fieldTree === 'function') {
            fieldTree().value.set(null);
        }

        const row = this.root.state.upload.uploadRecord();
        if (row) {
            this.root.state.upload.setUploadRecord({
                ...row,
                [fkey]: null,
                ...(finfo.fr_field ? { [finfo.fr_field]: null } : {}),
            });
        }
    }
}
