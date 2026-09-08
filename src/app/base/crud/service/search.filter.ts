// file: src/app/base/crud/service/search.filter.ts
import { CrudSearchFilterInputType } from "@base/crud/type";
import { CrudRootService } from "./root";
import { CrudActionService } from "./action";

export class CrudSearchFilterService {
    constructor(
        private readonly root: CrudRootService,
        private readonly action: CrudActionService,
    ) {}

    // ████████████████████████████████████████████████████████████████████
    // ███ SLOT FIELD █████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public getFilterFieldSlotPortalKey(key: string): string {
        return `${this.root.CrudFieldSlotPortalKeyPrefixEnum.FILTER}${key}`;
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ HELPER  ████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /** Current normalized-looking values from the child search field object. */
    public searchFilterInputValues(): CrudSearchFilterInputType {
        return this.root.formFieldInputValues(
            this.root.state.searchFilter.searchFilterFieldObj(),
            true,
        );
    }
}
