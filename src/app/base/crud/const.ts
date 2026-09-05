// file: ./src/app/base/crud/const.ts
import { CrudFieldSwitchOptionType } from "@base/crud/type";

export const CRUD_STATE_STORE_KEY = 'crud' as const;
export const CRUD_I18N_KEY = 'app.base.crud' as const;

export const CRUD_RECYCLE_BIN_STATUS: CrudFieldSwitchOptionType = {
    on: 1,
    off: 0,
} as const;