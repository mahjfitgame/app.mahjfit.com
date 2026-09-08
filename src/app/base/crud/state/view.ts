import { signal, Type } from '@angular/core';
import { CrudActionUiLayoutEnum } from '@base/crud/enum';
import { UiSizeEnum } from '@libs/breakpoint/enum';
import {
    CrudEndDrawerOnCloseType,
    CrudFieldInfoType,
    CrudRecordType,
    CrudViewStateType,
    CrudStateViewFieldObjType,
} from '@base/crud/type';
import { CrudActionState } from './action';
import { CrudRootState } from './root';

/** Read-only record state, kept independent from mutation form state. */
export class CrudViewState implements CrudViewStateType {
    constructor(
        private readonly root: CrudRootState,
        private readonly action: CrudActionState,
    ) {}

    // ███████████████████████████████████████████████████████████████████
    // ████ VIEW FIELD OBJ ███████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly _viewFieldObj = signal<CrudStateViewFieldObjType>({});
    public readonly viewFieldObj = this._viewFieldObj.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setViewFieldObj(fields: CrudStateViewFieldObjType): void {
        // Modules can derive this object from MUTATION_FIELD_OBJ. Clone each
        // definition so View-specific runtime edits never affect Mutation.
        this._viewFieldObj.set(
            Object.fromEntries(
                Object.entries(fields).map(([key, field]) => [key, { ...field }]),
            ),
        );
    }
    public updateViewFieldObj(
        key: string,
        updates: Partial<CrudFieldInfoType>,
    ): void {
        this._viewFieldObj.update((fields) => {
            const field = fields[key];

            if (!field) {
                return fields;
            }

            return {
                ...fields,
                [key]: {
                    ...field,
                    ...updates,
                },
            };
        });
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ VIEW  ████████████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _viewActionUiLayout = signal<CrudActionUiLayoutEnum>(CrudActionUiLayoutEnum.BOTTOM_SHEET);
    public readonly viewActionUiLayout = this._viewActionUiLayout.asReadonly();

    private readonly _viewActionUiSize = signal<UiSizeEnum>(UiSizeEnum.SM);
    public readonly viewActionUiSize = this._viewActionUiSize.asReadonly();

    private readonly _viewRecordCustomComponent = signal<Type<any> | null>(null);
    public readonly viewRecordCustomComponent = this._viewRecordCustomComponent.asReadonly();

    private readonly _viewPageCustomComponent = signal<Type<any> | null>(null);
    public readonly viewPageCustomComponent = this._viewPageCustomComponent.asReadonly();

    private readonly _viewRecord = signal<CrudRecordType | null>(null);
    public readonly viewRecord = this._viewRecord.asReadonly();

    private readonly _viewRecordProcessing = signal(false);
    public readonly viewRecordProcessing = this._viewRecordProcessing.asReadonly();

    private readonly _viewEndDrawerIsOpen = signal(false);
    public readonly viewEndDrawerIsOpen = this._viewEndDrawerIsOpen.asReadonly();

    private readonly _viewEndDrawerOnCloseCallBack = signal<CrudEndDrawerOnCloseType | null>(null);
    public readonly viewEndDrawerOnCloseCallBack = this._viewEndDrawerOnCloseCallBack.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setViewActionUiLayout(layout: CrudActionUiLayoutEnum): void {
        this._viewActionUiLayout.set(layout);
    }
    public setViewActionUiSize(size: UiSizeEnum): void {
        this._viewActionUiSize.set(size);
    }
    public setViewRecordCustomComponent(component: Type<any> | null): void {
        this._viewRecordCustomComponent.set(component);
    }
    public setViewPageCustomComponent(component: Type<any> | null): void {
        this._viewPageCustomComponent.set(component);
    }
    public setViewRecord(record: CrudRecordType | null): void {
        this._viewRecord.set(record);
    }
    public setViewRecordProcessing(processing: boolean): void {
        this._viewRecordProcessing.set(processing);
    }
    public setViewEndDrawerIsOpen(open: boolean): void {
        this._viewEndDrawerIsOpen.set(open);
    }
    public addViewEndDrawerOnCloseCallBack(key: string, callback: () => void): void {
        this._viewEndDrawerOnCloseCallBack.update((current) => ({
            ...(current ?? {}),
            [key]: callback,
        }));
    }
    public runViewEndDrawerOnCloseCallback(): void {
        for (const callback of Object.values(this.viewEndDrawerOnCloseCallBack() ?? {})) {
            callback?.();
        }
    }
    public clearViewRecord(): void {
        this._viewRecord.set(null);
        this._viewRecordProcessing.set(false);
    }
}
