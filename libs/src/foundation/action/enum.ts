// file: libs/src/foundation/action/enum.ts

import { FoundationFieldDefaultNameEnum } from "../field/enum";

/**
 * @FoundationActionEnum
 * = te_authorisation_module_action.url_slug
 *
 * the complete fixed vocabulary, code owned (Rule 6)
 * an api may narrow this list for a user but can never add to it
 */
export enum FoundationActionEnum {
    // CARRIED OVER FROM CrudActionEnum ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    CREATE            = 'create',
    UPDATE            = 'update',
    SOFT_DELETE       = 'soft-delete',
    DELETE            = 'delete',
    RESTORE           = 'restore',
    MARK_AS_MAIN      = 'mark-as-main',
    RECORD_POSITION   = 'record-position',
    UPLOAD            = 'upload',
    UPLOAD_DELETE     = 'upload-delete',
    FILE_RELOCATION   = 'file-relocation',
    IMPORT            = 'import',
    EXPORT            = 'export',

    // REALIGNED TO THE VOCABULARY ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    ACTIVE_INACTIVE   = 'active-inactive',   // was INACTIVE = 'inactive'
    INSIGHT           = 'insight',           // was INSIGHTS = 'insights'
    // REPORT = 'report' — DROPPED, not in the vocabulary

    // NEW ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    RECOVER           = 'recover',
    ADVANCE_SEARCH    = 'advance-search',
    LISTING           = 'listing',
    AUTO_SUGGEST      = 'auto-suggest',
    VIEW              = 'view',
    QUICK_SEARCH      = 'quick-search',
    BULK_ACTION       = 'bulk-action',
    COLUMN_POSITION   = 'column-position',
    DISPLAY_FIELDS    = 'display-fields',
    SORTING           = 'sorting',
    RECYCLE_BIN       = 'recycle-bin',
    QUICK_UPDATE      = 'quick-update',
    PRINT             = 'print',
    SHARE             = 'share',
    DUPLICATE         = 'duplicate',
    ALPHA_SORT        = 'alpha-sort',
}


// ACTION ROUTE SLUGS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬


// derived from the vocabulary so the two can never drift

export enum FoundationActionSlugEnum {
    // static segment only
    CREATE          = FoundationActionEnum.CREATE,
    UPLOAD          = FoundationActionEnum.UPLOAD,
    IMPORT          = FoundationActionEnum.IMPORT,
    EXPORT          = FoundationActionEnum.EXPORT,
    INSIGHT         = FoundationActionEnum.INSIGHT,

    // record scoped
    UPDATE          = `${FoundationActionEnum.UPDATE}/:${FoundationFieldDefaultNameEnum.KEYID}`,
    VIEW            = `${FoundationActionEnum.VIEW}/:${FoundationFieldDefaultNameEnum.KEYID}`,
    UPLOAD_DELETE   = `${FoundationActionEnum.UPLOAD_DELETE}/:${FoundationFieldDefaultNameEnum.KEYID}`,
    FILE_RELOCATION = `${FoundationActionEnum.FILE_RELOCATION}/:${FoundationFieldDefaultNameEnum.KEYID}`,
    PRINT           = `${FoundationActionEnum.PRINT}/:${FoundationFieldDefaultNameEnum.KEYID}`,
    SHARE           = `${FoundationActionEnum.SHARE}/:${FoundationFieldDefaultNameEnum.KEYID}`,
    DUPLICATE       = `${FoundationActionEnum.DUPLICATE}/:${FoundationFieldDefaultNameEnum.KEYID}`,
}