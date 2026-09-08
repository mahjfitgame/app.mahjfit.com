// file: src/app/base/crud/state/mutation.ts

import { Injector, signal, Type } from "@angular/core";
import { disabled, FieldTree, form, validate } from "@angular/forms/signals";
import {
    CrudEndDrawerOnCloseType,
    CrudFormFieldInfoType,
    CrudMutationFormErrorType,
    CrudMutationStateType,
    CrudStateMutationFieldObjType,
} from "@base/crud/type";
import { CrudActionUiLayoutEnum, CrudFieldUiTypeEnum } from "@base/crud/enum";
import { UiSizeEnum } from "@libs/breakpoint/enum";
import { CrudValidation } from "../validation";
import { CrudRootState } from "./root";
import { CrudActionState } from "./action";

export class CrudMutationState implements CrudMutationStateType {
    constructor(
        private readonly root: CrudRootState,
        private readonly action: CrudActionState,
        private readonly crudInjector: Injector,
        private readonly validation: CrudValidation,
    ) {}

    // ███████████████████████████████████████████████████████████████████
    // ████ MUTATION █████████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _mutationActionUiLayout = signal<CrudActionUiLayoutEnum>(CrudActionUiLayoutEnum.END_SIDE_BAR);
    public readonly mutationActionUiLayout = this._mutationActionUiLayout.asReadonly();

    private readonly _mutationActionUiSize = signal<UiSizeEnum>(UiSizeEnum.SM);
    public readonly mutationActionUiSize = this._mutationActionUiSize.asReadonly();

    private readonly _mutationFormCustomComponent = signal<Type<any> | null>(null);
    public readonly mutationFormCustomComponent = this._mutationFormCustomComponent.asReadonly();

    private readonly _mutationPageCustomComponent = signal<Type<any> | null>(null);
    public readonly mutationPageCustomComponent = this._mutationPageCustomComponent.asReadonly();

    private readonly _mutationEndDrawerIsOpen = signal<boolean>(false);
    public readonly mutationEndDrawerIsOpen = this._mutationEndDrawerIsOpen.asReadonly();

    private readonly _mutationEndDrawerOnCloseCallback = signal<CrudEndDrawerOnCloseType | null>(null);
    public readonly mutationEndDrawerOnCloseCallback = this._mutationEndDrawerOnCloseCallback.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setMutationActionUiLayout(type: CrudActionUiLayoutEnum): void {
        this._mutationActionUiLayout.set(type);
    }
    public setMutationActionUiSize(size: UiSizeEnum): void {
        this._mutationActionUiSize.set(size);
    }
    public setMutationFormCustomComponent(component: Type<any> | null): void {
        this._mutationFormCustomComponent.set(component);
    }
    public setMutationPageCustomComponent(component: Type<any> | null): void {
        this._mutationPageCustomComponent.set(component);
    }
    public setMutationEndDrawerIsOpen(open: boolean): void {
        this._mutationEndDrawerIsOpen.set(open);
    }
    public setMutationEndDrawerOnCloseCallback(onClose: CrudEndDrawerOnCloseType): void {
        this._mutationEndDrawerOnCloseCallback.set(onClose);
    }
    public addMutationEndDrawerOnCloseCallback(key: string, fn: (() => void)): void {
        this._mutationEndDrawerOnCloseCallback.update(onClose => {
            // if onClose is null/undefined, fall back to an empty object
            return {
                ...(onClose ?? {}),
                [key]: fn
            };
        });
    }
    public removeMutationEndDrawerOnCloseCallback(key: keyof CrudEndDrawerOnCloseType): void {
        this._mutationEndDrawerOnCloseCallback.update(onClose => {
            // if it's already null/undefined, there's nothing to remove
            if (!onClose) return onClose;

            // create a shallow copy to maintain immutability
            const updated = { ...onClose };
            delete updated[key];

            return updated;
        });
    }
    public runMutationEndDrawerOnCloseCallBack(): void {
        for (const key in this.mutationEndDrawerOnCloseCallback()) {
            this.mutationEndDrawerOnCloseCallback()?.[key]?.();
        }
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ MUTATION FORM ████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // form signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly _mutationFieldObj = signal<CrudStateMutationFieldObjType>({});
    public readonly mutationFieldObj = this._mutationFieldObj.asReadonly();

    public readonly _mutationFormError = signal<CrudMutationFormErrorType>({});
    public readonly mutationFormError = this._mutationFormError.asReadonly();

    public readonly _mutationFormModel = signal<Record<string, any>>({});
    public readonly mutationFormModel = this._mutationFormModel.asReadonly();

    private mutationFormResetModel: Record<string, any> = {};

    public readonly _mutationFormProcessing = signal(false);
    public readonly mutationFormProcessing = this._mutationFormProcessing.asReadonly();

    public mutationForm!: FieldTree<Record<string, any>>;

    // form method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setMutationFieldObj(finfo: CrudStateMutationFieldObjType): void {
        this._mutationFieldObj.set(finfo);

        // init mutation signal form and its model
        this.initMutationForm();
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
    public setMutationFormError(error: CrudMutationFormErrorType): void {
        this._mutationFormError.set(error);
    }
    public updateMutationFormError(
        error: Partial<CrudMutationFormErrorType>,
    ): void {
        this._mutationFormError.update((current) => ({
            ...current,
            ...error,
        }));
    }
    public clearMutationFormError(): void {
        this._mutationFormError.set({});
    }
    public setMutationFormModel(input: Record<string, any>): void {
        this._mutationFormModel.set(input);
    }
    public updateMutationFormModel(input: Partial<Record<string, any>>): void {
        this._mutationFormModel.update(current => ({
            ...current,
            ...input
        }));
    }
    public clearMutationFormModel(): void {
        this._mutationFormModel.set({ ...this.mutationFormResetModel });
    }
    public setMutationFormProcessing(processing: boolean): void {
        this._mutationFormProcessing.set(processing);
    }
    private buildMutationFormModel(
        input: Record<string, any> = {},
    ): Record<string, any> {
        const model: Record<string, any> = {};
        const fieldObj = this.mutationFieldObj();

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

        this._mutationFieldObj.set({ ...fieldObj });

        return model;
    }
    public setMutationFormValues(input: Record<string, any> = {}): void {
        const model = this.buildMutationFormModel(input);

        this.mutationFormResetModel = { ...model };
        this.clearMutationFormError();
        this.mutationForm().reset(model);
    }
    private initMutationForm(): void {
        const model = this.buildMutationFormModel();

        this.mutationFormResetModel = { ...model };
        this.setMutationFormModel(model);

        const formFieldObj = Object.fromEntries(
            Object.keys(model).map((key) => [key, this.mutationFieldObj()[key]]),
        ) as CrudStateMutationFieldObjType;

        // create only after the model and field configuration are available.
        this.mutationForm = form(
            // model
            this._mutationFormModel,
            // schema
            (sp) => {
                disabled(sp, { when: () => this.mutationFormProcessing() });
                this.validation.setCrudSignalFormValidation(sp, formFieldObj);

                // Optional developer-controlled errors. Submission errors
                // returned by create/update remain a separate Angular feature.
                for (const key of Object.keys(model)) {
                    validate((sp as any)[key], () => {
                        const message = this.mutationFormError()[key];
                        return message
                            ? { kind: 'mf_error', message }
                            : null;
                    });
                }
            },
            // options
            {
                injector: this.crudInjector,
            }
        );
    }
    public resetMutationForm(): void {
        this.setMutationFormValues(this.mutationFormResetModel);
    }
}
