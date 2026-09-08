// file: ./src/app/base/crud/const.ts
import { RecordSortDirectionEnum } from "@bfw/api-sdk/graphql/libs/crud.enum";

export const CRUD_STATE_STORE_KEY = 'crud' as const;
export const CRUD_I18N_KEY = 'app.base.crud' as const;

export const CRUD_RECORD_SORT_DIRECTION_OPTION: Record<RecordSortDirectionEnum, string> = {
    [RecordSortDirectionEnum.ASC]: RecordSortDirectionEnum.ASC,
    [RecordSortDirectionEnum.DESC]: RecordSortDirectionEnum.DESC,
};

/** id of the one element ngx-print extracts and prints for View/Print. */
export const CRUD_PRINT_SECTION_ID = 'crud-print-section' as const;
