// file: src/app/base/crud/type.ts

export enum CrudListOperationFieldsEnum {
    QUICK_SEARCH = 'quick_search',
    LISTING_COLUMN_POSITION = 'listing_column_position',
    ROWS_PER_PAGE = 'rows_per_page',
    CURRENT_PAGE = 'current_page',
    LISTING_SELECTED_ROWS = 'listing_selected_rows',
}

export enum CrudViewOptionFieldsEnum {
    DISPLAY_FIELDS = 'display_fields',
    SORT_FIELDS_AND_DIRECTION = 'sort_fields_and_direction',
    RBIN = 'rbin',
}

export enum CrudFieldSlotPortalKeyPrefixEnum {
    LISTING = 'listing.',
    MUTATION = 'mutation.',
    FILTER = 'filter.',
}

export enum CrudFieldUiTypeEnum {
    NONE = 'none',
    HIDDEN = 'hidden',
    TEXT = 'text',
    TEXTAREA = 'textarea', // text with multiple line
    SELECT = 'select', // used when field holds id of another data
    MULTISELECT = 'multiselect', // used when field holds id of another data
    RADIO = 'radio', // used when field holds id of another data
    CHECKBOX = 'checkbox', // used when field holds multiple value of another data
    NUMBER = 'number',
    FLAG = 'flag', // used when field holds 2 types of values: null or date time
    SWITCH = 'switch',
    DATE = 'date',
    TIME = 'time',
    DATETIME = 'datetime',
    PASSWORD = 'password', // text with password
    EMAIL = 'email', // text with email format
    URL = 'url', // text with http:// or https://
    TEL = 'tel', // numeric phone number
    SLIDER = 'slider', // number from given min to max range
    RANGE = 'range', // two numbers (from / to) on one slider, stored in two fields
    FILE = 'file',
    COLOR = 'color', // value is a 7-character string representing a lowercase 6-digit hexadecimal color value
    HTML = 'html',
    ARRAY = 'array',
    JSON = 'json',   
}

export enum CrudListingAdditionalColumnsEnum {
    RECORD_SELECT = 'rs',
    RECORD_ACTION = 'ra',
}

export enum CrudFieldValidationEnum {
    REQUIRED = 'required',
    MIN_LENGTH = 'min_length',
    MAX_LENGTH = 'max_length',
    MIN = 'min',
    MAX = 'max',
    PATTERN = 'pattern',
    EMAIL = 'email',
    DATE = 'date',
    TIME = 'time',
    DATETIME = 'datetime',
    URL = 'url',
    MATCH_FIELD = 'match_field',
    COLOR = 'color',
    DIGIT = 'digit', // whole numbers only
    DECIMAL = 'decimal', // allows floating point
    TEXT = 'text', 
    EXTENSION = 'extension', // for file type, validate file extension
    OPTION_RANGE = 'option_range', // validate if value is in range of options. [option] attribute should have possible values for this validation type. Required to be array or object
    FN = 'fn', // custom function validation
}

export enum CrudListingItemPerPageOptionEnum {
    FIVE = 5,
    TEN = 10,
    FIFTEEN = 15,
    TWENTY = 20,
    TWENTY_FIVE = 25,
    THIRTY = 30,
    FIFTY = 50,
    SEVENTY = 70,
    ONE_HUNDRED = 100,
    ONE_HUNDRED_FIFTY = 150,
    TWO_HUNDRED = 200,
}

/**
 * ctos = client to server
 * - incoming value may be encrypted
 * - decrypt first
 * - normalize to raw value
 *
 * stoc = server to client
 * - incoming value is raw DB/server value
 * - normalize first
 * - encrypt before sending to client
 */
export enum CrudFieldNormalizeModeEnum {
    CTOS = 'ctos',
    STOC = 'stoc',
}

export enum CrudDataLoadTypeEnum {
    INITIAL = 'initial',
    ACTION = 'action',
}

export enum CrudActionUiLayoutEnum {
    BOTTOM_SHEET = 'bottom_sheet',
    DIALOG = 'dialog',
    END_SIDE_BAR = 'end_side_bar',
    END_DRAWER = 'end_drawer',
    PAGE = 'page',
}

export enum CrudEndSideBarTabEnum {
    MUTATION = 'crud-mutation-tab',
    FILTER = 'crud-filter-tab',
}