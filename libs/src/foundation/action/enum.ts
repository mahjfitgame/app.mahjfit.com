// file: libs/src/foundation/action/enum.ts

/**
 * @FoundationActionEnum
 * = te_authorisation_module_action.url_slug
 *
 * the complete fixed vocabulary, code owned (Rule 6)
 * an api may narrow this list for a user but can never add to it
 */
export enum FoundationActionEnum {
    // MODULE ACTION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    CREATE            = 'create',
    IMPORT            = 'import',
    EXPORT            = 'export',
    INSIGHT           = 'insight',

    // RECORD ACTION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    RECORD_POSITION   = 'record-position',
    UPDATE            = 'update',
    QUICK_UPDATE      = 'quick-update',
    VIEW              = 'view',
    PRINT             = 'print',
    SHARE             = 'share',
    DUPLICATE         = 'duplicate',
    ACTIVE            = 'active',
    INACTIVE          = 'inactive',
    SOFT_DELETE       = 'soft-delete',
    DELETE            = 'delete',
    RESTORE           = 'restore',
    MARK_AS_MAIN      = 'mark-as-main',
    UPLOAD            = 'upload',
    UPLOAD_DELETE     = 'upload-delete',
    FILE_RELOCATION   = 'file-relocation',
    SOFT_REMOVE       = 'soft-remove',
    REMOVE            = 'remove',
    RECOVER           = 'recover',
    SUB_MODULE        = 'sub-module',  
    // REPORT = 'report' — DROPPED, not in the vocabulary

    // LISTING ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    LISTING           = 'listing',
    COLUMN_POSITION   = 'column-position',
    QUICK_SEARCH      = 'quick-search',
    DISPLAY_FIELDS    = 'display-fields',
    SORT_FIELDS       = 'sort-fields',
    ALPHA_SORT        = 'alpha-sort',
    ADVANCE_SEARCH    = 'advance-search',
    BULK_ACTION       = 'bulk-action',
}
