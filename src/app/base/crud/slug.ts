import { CrudActionEnum } from "@base/crud/enum";

// file: ./src/app/module/shared/geo/country/slug.ts
export const SLUG_CRUD = 'crud' as const;
export const SLUG_CRUD_CREATE = CrudActionEnum.CREATE as const;
export const SLUG_CRUD_UPDATE = `${CrudActionEnum.UPDATE}/:id` as const;