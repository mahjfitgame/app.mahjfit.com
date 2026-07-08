// file: ./src/app/base/crud/provider.ts
import { Provider } from "@angular/core";
import { CrudUtility } from "@base/crud/utility";
import { CrudValidation } from "@base/crud/validation";
import { CrudUrl } from "@base/crud/url";
import { CrudService } from "@base/crud/service";
import { CrudState } from "@base/crud/state";
import { CrudDefaultService } from "@base/crud/default/service";

export const CRUD_HELPER_PROVIDER: Provider[] = [
    CrudDefaultService,
    CrudState,
    CrudUtility,
    CrudValidation,
    CrudUrl,
];
export const CRUD_PROVIDER: Provider[] = [
    ...CRUD_HELPER_PROVIDER,
    CrudService,
];
