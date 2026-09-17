// file: ./src/app/base/crud/const.ts
import { CrudFieldFileShapeType } from "@base/crud/type";
import { RecordSortDirectionEnum } from "@bfw/api-sdk/graphql/libs/crud.enum";

export const CRUD_STATE_STORE_KEY = 'crud' as const;
export const CRUD_I18N_KEY = 'app.base.crud' as const;

/**
 * Layout of an upload access-url object (@bfw/api-sdk UploadFileAccessUrlDto),
 * which is what a FILE field's [fr_field] points at. Every FILE column reads
 * its url through these keys - change them here, once, if the api ever renames
 * a variant.
 */
export const CRUD_FIELD_FILE_SHAPE: CrudFieldFileShapeType = {
    thumb: 'thumb',
    direct: 'direct',
    secure: 'secure',
};

/**
 * How a long file name is shortened in a FILE download cell - characters kept
 * from the START and from the END of the name, before its extension.
 * 'invoice_2024_q4_final.pdf' -> 'invoice_20…final.pdf'
 */
export const CRUD_FIELD_FILE_NAME_TRUNCATE = {
    head: 10,
    tail: 5,
};

export const CRUD_RECORD_SORT_DIRECTION_OPTION: Record<RecordSortDirectionEnum, string> = {
    [RecordSortDirectionEnum.ASC]: RecordSortDirectionEnum.ASC,
    [RecordSortDirectionEnum.DESC]: RecordSortDirectionEnum.DESC,
};
