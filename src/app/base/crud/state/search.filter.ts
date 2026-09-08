// file: src/app/base/crud/state/search.filter.ts

import { signal } from "@angular/core";
import { CrudFormFieldInfoType, CrudSearchFilterStateType, CrudStateSearchFilterFieldObjType } from "@base/crud/type";
import { CrudActionState } from "./action";
import { CrudRootState } from "./root";

export class CrudSearchFilterState implements CrudSearchFilterStateType {
    constructor(
        private readonly root: CrudRootState,
        private readonly action: CrudActionState,
    ) {}

    // ███████████████████████████████████████████████████████████████████
    // ████ SEARCH FILTER ████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly _searchFilterFieldObj = signal<CrudStateSearchFilterFieldObjType>({} as any);
    public readonly searchFilterFieldObj = this._searchFilterFieldObj.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setSearchFilterFieldObj(finfo: CrudStateSearchFilterFieldObjType): void {
        this._searchFilterFieldObj.set(
            this.action.hasAdvanceSearch() ? finfo : {},
        );
    }
    public updateSearchFilterFieldObj(
        key: string,
        updates: Partial<CrudFormFieldInfoType>
    ): void {
        this._searchFilterFieldObj.update((finfo) => {
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
}
