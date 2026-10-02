// file: libs/src/foundation/field/enum.ts

/**
 * Default API FIELD (column) names.
 *
 * ⚠ these name COLUMNS, never url params. What a record-scoped route declares
 * is FoundationRouteDefaultParamEnum.INDEX in ../route/enum.ts - the param
 * name and the column name are independent, because what travels in the url is
 * whatever the module passed to setPrimaryKey() / setSecondaryKey().
 */
export enum FoundationFieldDefaultNameEnum {
    ID = 'id',
    KEYID = 'keyid',
    URL_SLUG = 'url_slug',
    IS_MAIN = 'is_main',
    RECORD_POSITION = 'record_position',
    ACTIVE = 'active',
    CREATED = 'created',
    UPDATED = 'updated',
    DELETED = 'deleted',
    EMAIL = 'email',
    MOBILE_CC = 'mobile_cc',
    MOBILE = 'mobile',
    WHATSAPP_CC = 'whatsapp_cc',
    WHATSAPP = 'whatsapp',
    USERNAME = 'username',
    TITLE = 'title',
    NAME = 'name',
    DESCRIPTION = 'desc',
    NOTE = 'note',
    FIRST_NAME = 'fname',
    LAST_NAME = 'lname',
}