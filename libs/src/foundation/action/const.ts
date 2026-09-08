// file: libs/src/foundation/action/const.ts
import { FoundationFieldDefaultNameEnum } from '../field/enum';
import { FoundationActionEnum } from './enum';
import { FoundationActionRouteConfigType } from './type';

/**
 * @FOUNDATION_ACTION_ROUTE_CONFIG
 * the SINGLE source of truth for "is this action routable, and if so what does
 * its route look like" — replaces what used to be three hand synced places
 * (FoundationActionRoute.routable[], .slugOf()'s if-chain, .routesFor()'s
 * if-chain + one xRoutes() method per action) plus the separate
 * FoundationActionSlugEnum.
 *
 * ⚠ absent from this record = not routable = LISTING STATE carried in matrix
 * params on the module's own route (listing, quick-search, column-position, ...)
 * or a record mutation with no url surface of its own (soft-delete, delete, ...)
 *
 * ⚠ `slug` is DERIVED from FoundationActionEnum + FoundationFieldDefaultNameEnum,
 * never a hand typed literal. that is what FoundationActionSlugEnum used to
 * guarantee — rename FoundationActionEnum.UPDATE and every consumer here moves
 * with it, no literal string left behind to drift
 */
/**
 * @FOUNDATION_MODULE_ACTION / @FOUNDATION_RECORD_ACTION / @FOUNDATION_LISTING_ACTION
 *
 * Single source of truth for "which category does this action belong to",
 * mirroring the MODULE ACTION / RECORD ACTION / LISTING groupings already
 * declared as section comments on FoundationActionEnum. Consumers that need
 * "does this permission set include ANY action from this category" (e.g.
 * CrudActionState's aggregate hasModuleAction/hasRecordAction gates) should
 * derive from these lists instead of hand-maintaining their own OR-chain,
 * so a new action added to the enum is automatically picked up everywhere
 * it belongs without a second file to remember to update.
 */
export const FOUNDATION_MODULE_ACTION: FoundationActionEnum[] = [
    FoundationActionEnum.CREATE,
    FoundationActionEnum.IMPORT,
    FoundationActionEnum.EXPORT,
    FoundationActionEnum.INSIGHT,
];

export const FOUNDATION_RECORD_ACTION: FoundationActionEnum[] = [
    FoundationActionEnum.RECORD_POSITION,
    FoundationActionEnum.UPDATE,
    FoundationActionEnum.QUICK_UPDATE,
    FoundationActionEnum.VIEW,
    FoundationActionEnum.PRINT,
    FoundationActionEnum.SHARE,
    FoundationActionEnum.DUPLICATE,
    FoundationActionEnum.ACTIVE,
    FoundationActionEnum.INACTIVE,
    FoundationActionEnum.SOFT_DELETE,
    FoundationActionEnum.DELETE,
    FoundationActionEnum.RESTORE,
    FoundationActionEnum.MARK_AS_MAIN,
    FoundationActionEnum.UPLOAD,
    FoundationActionEnum.UPLOAD_DELETE,
    FoundationActionEnum.FILE_RELOCATION,
    FoundationActionEnum.SOFT_REMOVE,
    FoundationActionEnum.REMOVE,
    FoundationActionEnum.RECOVER,
    FoundationActionEnum.SUB_MODULE,
];

export const FOUNDATION_LISTING_ACTION: FoundationActionEnum[] = [
    FoundationActionEnum.LISTING,
    FoundationActionEnum.COLUMN_POSITION,
    FoundationActionEnum.QUICK_SEARCH,
    FoundationActionEnum.DISPLAY_FIELDS,
    FoundationActionEnum.SORT_FIELDS,
    FoundationActionEnum.ALPHA_SORT,
    FoundationActionEnum.ADVANCE_SEARCH,
    FoundationActionEnum.BULK_ACTION,
];

export const FOUNDATION_ACTION_ROUTE_CONFIG: Partial<Record<FoundationActionEnum, FoundationActionRouteConfigType>> = {
    [FoundationActionEnum.CREATE]:          { slug: FoundationActionEnum.CREATE,                                                          labelKey: 'GL.ACTION.CREATE',          aliasSuffix: 'Create' },
    [FoundationActionEnum.UPDATE]:          { slug: `${FoundationActionEnum.UPDATE}/:${FoundationFieldDefaultNameEnum.KEYID}`,             labelKey: 'GL.ACTION.UPDATE',          aliasSuffix: 'Update' },
    [FoundationActionEnum.VIEW]:            { slug: `${FoundationActionEnum.VIEW}/:${FoundationFieldDefaultNameEnum.KEYID}`,               labelKey: 'GL.ACTION.VIEW',            aliasSuffix: 'View' },
    [FoundationActionEnum.UPLOAD]:          { slug: FoundationActionEnum.UPLOAD,                                                          labelKey: 'GL.ACTION.UPLOAD',          aliasSuffix: 'Upload' },
    [FoundationActionEnum.UPLOAD_DELETE]:   { slug: `${FoundationActionEnum.UPLOAD_DELETE}/:${FoundationFieldDefaultNameEnum.KEYID}`,      labelKey: 'GL.ACTION.UPLOAD_DELETE',   aliasSuffix: 'UploadDelete' },
    [FoundationActionEnum.FILE_RELOCATION]: { slug: `${FoundationActionEnum.FILE_RELOCATION}/:${FoundationFieldDefaultNameEnum.KEYID}`,    labelKey: 'GL.ACTION.FILE_RELOCATION', aliasSuffix: 'FileRelocation' },
    [FoundationActionEnum.IMPORT]:          { slug: FoundationActionEnum.IMPORT,                                                          labelKey: 'GL.ACTION.IMPORT',          aliasSuffix: 'Import' },
    [FoundationActionEnum.EXPORT]:          { slug: FoundationActionEnum.EXPORT,                                                          labelKey: 'GL.ACTION.EXPORT',          aliasSuffix: 'Export' },
    [FoundationActionEnum.INSIGHT]:         { slug: FoundationActionEnum.INSIGHT,                                                         labelKey: 'GL.ACTION.INSIGHT',         aliasSuffix: 'Insight' },
    [FoundationActionEnum.PRINT]:           { slug: `${FoundationActionEnum.PRINT}/:${FoundationFieldDefaultNameEnum.KEYID}`,              labelKey: 'GL.ACTION.PRINT',           aliasSuffix: 'Print' },
    [FoundationActionEnum.SHARE]:           { slug: `${FoundationActionEnum.SHARE}/:${FoundationFieldDefaultNameEnum.KEYID}`,              labelKey: 'GL.ACTION.SHARE',           aliasSuffix: 'Share' },
    [FoundationActionEnum.DUPLICATE]:       { slug: `${FoundationActionEnum.DUPLICATE}/:${FoundationFieldDefaultNameEnum.KEYID}`,          labelKey: 'GL.ACTION.DUPLICATE',       aliasSuffix: 'Duplicate' },
};
