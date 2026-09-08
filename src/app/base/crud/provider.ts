// file: src/app/base/crud/provider.ts
import { Provider } from "@angular/core";
import { CrudUtility } from "@base/crud/utility";
import { CrudValidation } from "@base/crud/validation";
import { CrudUrl } from "@base/crud/url";
import { CrudRoute } from "@base/crud/route";
import { CrudService } from "src/app/base/crud/service/entry";
import { CrudDefaultService } from "@base/crud/default/service";
import { CrudState } from "./state/entry";

export const CRUD_HELPER_PROVIDER: Provider[] = [
    CrudDefaultService,
    CrudRoute,
    CrudState,
    CrudUtility,
    CrudValidation,
    CrudUrl,
];
export const CRUD_PROVIDER: Provider[] = [
    ...CRUD_HELPER_PROVIDER,
    CrudService,
];
