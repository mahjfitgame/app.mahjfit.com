// file: src/app/base/crud/state/upload.ts

import { computed, Injector, signal, Type } from "@angular/core";
import { disabled, FieldTree, form, validate } from "@angular/forms/signals";
import {
    CrudMutationFormErrorType,
    CrudRecordType,
    CrudUploadStateType,
    CrudStateMutationFieldObjType,
} from "@base/crud/type";
import { CrudFieldUiTypeEnum } from "@base/crud/enum";
import { BreakpointSizeEnum } from "@libs/breakpoint/enum";
import { CrudValidation } from "../validation";
import { CrudRootState } from "./root";
import { CrudActionState } from "./action";

export class CrudUploadState implements CrudUploadStateType {
    constructor(
        private readonly root: CrudRootState,
        private readonly action: CrudActionState,
        private readonly crudInjector: Injector,
        private readonly validation: CrudValidation,
    ) {}

    // ███████████████████████████████████████████████████████████████████
    // ████ UPLOAD (config) ██████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _uploadActionUiSize = signal<BreakpointSizeEnum>(BreakpointSizeEnum.SM);
    public readonly uploadActionUiSize = this._uploadActionUiSize.asReadonly();

    private readonly _uploadFormCustomComponent = signal<Type<any> | null>(null);
    public readonly uploadFormCustomComponent = this._uploadFormCustomComponent.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setUploadActionUiSize(size: BreakpointSizeEnum): void {
        this._uploadActionUiSize.set(size);
    }
    public setUploadFormCustomComponent(component: Type<any> | null): void {
        this._uploadFormCustomComponent.set(component);
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ UPLOAD FORM ██████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // form signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly _uploadFieldObj = signal<CrudStateMutationFieldObjType>({});
    public readonly uploadFieldObj = this._uploadFieldObj.asReadonly();

    public readonly _uploadFormError = signal<CrudMutationFormErrorType>({});
    public readonly uploadFormError = this._uploadFormError.asReadonly();

    public readonly _uploadFormModel = signal<Record<string, any>>({});
    public readonly uploadFormModel = this._uploadFormModel.asReadonly();

    private uploadFormResetModel: Record<string, any> = {};

    public readonly _uploadFormProcessing = signal(false);
    public readonly uploadFormProcessing = this._uploadFormProcessing.asReadonly();

    public uploadForm!: FieldTree<Record<string, any>>;

    // form method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setUploadFieldObj(finfo: CrudStateMutationFieldObjType): void {
        this._uploadFieldObj.set(finfo);

        // init upload signal form and its model
        this.initUploadForm();
    }
    public setUploadFormError(error: CrudMutationFormErrorType): void {
        this._uploadFormError.set(error);
    }
    public updateUploadFormError(
        error: Partial<CrudMutationFormErrorType>,
    ): void {
        this._uploadFormError.update((current) => ({
            ...current,
            ...error,
        }));
    }
    public clearUploadFormError(): void {
        this._uploadFormError.set({});
    }
    public setUploadFormModel(input: Record<string, any>): void {
        this._uploadFormModel.set(input);
    }
    public updateUploadFormModel(input: Partial<Record<string, any>>): void {
        this._uploadFormModel.update(current => ({
            ...current,
            ...input
        }));
    }
    public clearUploadFormModel(): void {
        this._uploadFormModel.set({ ...this.uploadFormResetModel });
    }
    public setUploadFormProcessing(processing: boolean): void {
        this._uploadFormProcessing.set(processing);
    }
    private buildUploadFormModel(
        input: Record<string, any> = {},
    ): Record<string, any> {
        const model: Record<string, any> = {};
        const fieldObj = this.uploadFieldObj();

        for (const [key, finfo] of Object.entries(fieldObj)) {
            // NONE is layout-only. HIDDEN remains part of the submitted model.
            if (finfo.type === CrudFieldUiTypeEnum.NONE) {
                continue;
            }

            const value = Object.prototype.hasOwnProperty.call(input, key)
                ? input[key]
                : finfo.default ?? null;

            model[key] = value;
            finfo.value = value;
        }

        this._uploadFieldObj.set({ ...fieldObj });

        return model;
    }
    public setUploadFormValues(input: Record<string, any> = {}): void {
        const model = this.buildUploadFormModel(input);

        this.uploadFormResetModel = { ...model };
        this.clearUploadFormError();
        this.uploadForm().reset(model);
    }
    private initUploadForm(): void {
        const model = this.buildUploadFormModel();

        this.uploadFormResetModel = { ...model };
        this.setUploadFormModel(model);

        const formFieldObj = Object.fromEntries(
            Object.keys(model).map((key) => [key, this.uploadFieldObj()[key]]),
        ) as CrudStateMutationFieldObjType;

        // create only after the model and field configuration are available.
        this.uploadForm = form(
            this._uploadFormModel,
            (sp) => {
                disabled(sp, { when: () => this.uploadFormProcessing() });
                this.validation.setCrudSignalFormValidation(sp, formFieldObj);

                for (const key of Object.keys(model)) {
                    validate((sp as any)[key], () => {
                        const message = this.uploadFormError()[key];
                        return message
                            ? { kind: 'uf_error', message }
                            : null;
                    });
                }
            },
            {
                injector: this.crudInjector,
            }
        );
    }
    public resetUploadForm(): void {
        this.setUploadFormValues(this.uploadFormResetModel);
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ UPLOAD RECORD ███████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly _uploadRecord = signal<CrudRecordType | null>(null);
    public readonly uploadRecord = this._uploadRecord.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setUploadRecord(record: CrudRecordType | null): void {
        this._uploadRecord.set(record);
    }

    /** at least one FILE field is actually wired (fr_field set) to read/preview an existing file */
    public readonly hasUploadableField = computed<boolean>(() =>
        Object.values(this.uploadFieldObj()).some(
            (finfo) => finfo.type === CrudFieldUiTypeEnum.FILE && !!finfo.fr_field,
        ),
    );

    /**
     * fkeys whose FILE field carries a freshly-picked file (a File / File[], not the
     * persisted filename string sitting untouched). CrudUploadService.submitUploadForm()
     * reuses this same list so the save button and the actual upload loop never disagree
     * on what counts as "changed".
     */
    public readonly changedUploadFileFields = computed<string[]>(() => {
        const fieldObj = this.uploadFieldObj();
        const model = this.uploadFormModel();

        return Object.keys(fieldObj).filter((fkey) => {
            if (fieldObj[fkey].type !== CrudFieldUiTypeEnum.FILE) return false;

            const value = model[fkey];
            return value instanceof File
                || (Array.isArray(value) && value.length > 0 && value.every((item) => item instanceof File));
        });
    });

    /**
     * Gates the save button: with nothing picked there is nothing to upload, and
     * letting submit run anyway used to skip silently and still show a success message.
     */
    public readonly anyFileSelected = computed<boolean>(() => this.changedUploadFileFields().length > 0);
}
