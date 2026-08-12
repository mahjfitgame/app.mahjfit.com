// file: src/app/module/shared/geo/country/slug.ts
import { CrudActionEnum } from "@base/crud/enum";

export const SLUG_CRUD = 'crud' as const;

// params slug
export const SLUG_CRUD_PARAM_ID: string = 'id' as const;

export const SLUG_CRUD_CREATE = CrudActionEnum.CREATE as const;
export const SLUG_CRUD_UPDATE = `${CrudActionEnum.UPDATE}/:${SLUG_CRUD_PARAM_ID}` as const;