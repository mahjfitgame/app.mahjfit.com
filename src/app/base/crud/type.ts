// file: ./src/app/base/crud/type.ts
import { CrudFieldUiTypeEnum, CrudFieldValidationEnum, CrudListOperationFieldsEnum, CrudViewOptionFieldsEnum, CrudFieldNormalizeModeEnum } from "@base/crud/enum";
import { Portal } from "@angular/cdk/portal";
import { SchemaPathTree } from "@angular/forms/signals";

export type CrudStateFormFieldUpdaterType = (key: string, patch: Partial<CrudFormFieldInfoType>) => void;

export type CrudListingFieldValueFormatterLookUpType = Record<
    CrudFieldUiTypeEnum, 
    (v: any, fi: CrudListingFieldInfoType, r: Record<string, any>) => any
>;
export type CrudFormFieldValueFormatterLookUpType = Record<
    CrudFieldUiTypeEnum, 
    (v: any, fi: CrudFormFieldInfoType, r: Record<string, any>) => any
>;
export type CrudFormFieldValueNormalizerLookUpType = Record<
    CrudFieldUiTypeEnum, 
    (v: any, fi: CrudFormFieldInfoType, r: Record<string, any>, mode: CrudFieldNormalizeModeEnum) => any
>;
export type CrudFormFieldValueValidatorLookUpType = Record<
    CrudFieldValidationEnum, 
    (v: any, finfo: CrudFormFieldInfoType, r?: Record<string, any>) => any
>;
export type CrudFormFieldValueAngularValidatorLookUpType<T> = Record<
    CrudFieldValidationEnum, 
    (
        sp: SchemaPathTree<T>,
        f: string,
        validationType: CrudFieldValidationEnum,
        rule: CrudFieldValidationInfoType,
        fi: CrudFormFieldInfoType
    ) => any
>;





export type CrudFieldOptionType =
    | Array<string | number | boolean>
    | Record<string, string | number | boolean>
    | null
    | undefined;
export interface CrudFieldSwitchOptionType extends Record<string, string | number | boolean> {
    // need to match CrudFieldOptionType
    on: string | number | boolean,
    off: string | number | boolean,
}
export interface CrudFieldValidationResultType {
    /**
     * valid: boolean;
     * Validation result
     */
    valid: boolean;

    /**
     * value: any;
     * Field value
     */
    value: any;

    /**
     * errors: string[];
     * Validation errors
     */
    errors: string[];
}
export interface CrudFieldValidationInfoType {
    /**
     * message: string;
     * Validation error message to show when validation fails 
     */
    message: string;

    /**
     * value: any;
     * 
     * If no appropriate value found then must set to null.
     * 
     * Value for validation, this is used to validate field value against it.
     * For example, if type is min_length and value is 5, then field value length should be at least 5 to pass validation. 
     * This value can be in array or object format depending on validation type, for example for type in [in, not_in] value should be an array of possible values, for type in [regex] value should be a string of regex pattern, for type in [custom_function] value should be a function that takes field value as argument and returns boolean.
     * 
     * If (type = fn) then value should be a function that takes field value as argument and returns boolean and this function will be used to validate field value.
     * value: (value, finfo, record) => boolean
     * If function is not supplied then field value will not be validated and will be considered as valid.
     * - fn((value: any, finfo: CrudFormFieldInfoType, record: any) => CrudFieldValidationResultType)
     * 
     * If (type=match) then value should be a string name of field that need to look up for value as argument
     * value: id (field name)
     */
    value: any | ((value: any, finfo: CrudFormFieldInfoType, record: any) => CrudFieldValidationResultType);
}
export type CrudFieldValidationType = Partial<Record<CrudFieldValidationEnum, CrudFieldValidationInfoType>>;

export interface CrudFieldFlagLabelType {
    /**
     * null: string;
     * Value to show when field value is null 
     */
    is_null: string;

    /**
     * datetime: string;
     * Value to show when field value is not null 
     */
    is_datetime: string;
}




export interface CrudFieldInfoType {
    /**
     * label: string;
     * Field label to show in UI
     */
    label: string;

    /**
     * type: CrudFieldUiTypeEnum;
     * This is used to show value of the field.
     * This types are based on UI component types. 
     * 
     * If [type = NONE], then will be consideed as fieldset or header and will generate header/label of layout 
     */
    type: CrudFieldUiTypeEnum,

    /**
     * mat_icon_prepend: string
     * Show material icon at the end of the filed
     */
    mat_icon_prepend?: string;

    /**
     * slot: boolean | string
     * If set to true, then slot name will be used as per field name prefixed as per type.
     * Otherwise provided string will be used as slot name.
     * Possible prefix types: CrudSlotFieldPortalKeyPrefixEnum
     */
    slot?: boolean | string;

    /**
     * select_option: CrudListingFieldSelectOptionType 
     * if [type = select | checkbo | radio kind of], it is static data and with speific type this filed is required to show value of that select option. 
     * This attribute requird to set if OPTION_RANGE validation is used in form validation attribute, and possible values for this option should be provided in this attribute.
     * if [type = switch] then option type must be CrudFieldSwitchOptionType
     */
    option?: CrudFieldOptionType;

    /**
     * fr_field: string
     * if [type = select | checkbo | radio kind of], then this filed will be checked to see if it has data from foreign relation. Then this filed is required to show value of that select option. 
     * pass the field relation name here such as [fr_user.id] or [fr_user.fr_device.id] etc
     */
    fr_field?: string;

    /**
     * flag_label: CrudListingFieldStatusLabelType
     * If [type = status], then this filed is required to show label of that status.
     */
    flag_label?: CrudFieldFlagLabelType,

    /**
     * default: any
     * Default value for field, this is used when creating new record or display some value when fields value is not set.
     */
    default?: any;

    /**
     * apply_enc: boolean;
     * If set to true then this filed will be encrypted using set algorithm before it is sent to UI.
     */
    apply_enc?: boolean;

    /**
     * skip: boolean;
     * If set to true field will be ignored and processed none, no effect on UI
     * This is used when some fileds are used for internally while in UI it has no effect or combined effect or dependent effect or etc
     */
    skip?: boolean;

    /**
     * need to set in each field info type due to different type
     */
    format_val?: any;
}
export interface CrudListingFieldInfoType extends CrudFieldInfoType {
    /**
     * sort: boolean
     * if [type = none] then this filed will be ignored 
     */
    sort: boolean;

    /**
     * format_val: (v: any, fi: CrudListingFieldInfoType, r: Record<string, any>) => any;
     * If set by passing call back function then this filed will be formatted using set algorithm after all default process before it is sent to UI.
     */
    format_val?: (v: any, fi: CrudListingFieldInfoType, r: Record<string, any>) => any;

    /**
     * sub: Record<string, CrudListingFieldInfoType>;
     * If field has [slot: true] then sub will be ingored and full control will be given to slot.
     */
    sub?: Record<string, Omit<CrudListingFieldInfoType, 'sub'>>;    
}
export interface CrudFormFieldInfoType extends CrudFieldInfoType {
    /**
     * matrix_param_name: string
     * This is used to show value in URL for this field.
     * Field name can be long so this matrix param is used to show in URL which is short and readable.
     * If [type != NONE], then this field is required and if not set then URL based state sync will be ignored for this field.
     * If value is set to null then also URL based state sync will be ignored for this field.
     */
    url_matrix_param: string | null;

    /**
     * IMPORTANT: THIS IS NOT IMPLEMENTED YET, THIS IS FOR FUTURE USE
     * colspan: number (from 1 to 12)
     * This is used to show field in same row with other fields in form. 
     * How many columns in a row/grid, each column will have field
     * 
     */
    colspan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; 

    /**
     * placeholder: string;
     * Field placeholder to show in UI 
     */
    placeholder?: string;

    /**
     * hint: string;
     * Field hint to show in UI 
     */
    hint?: string;

    /**
     * value: any
     * Value for field, this is used to show value in html element when value is available
     */
    value?: any;

    /**
     * option_default: Record<string | number, string>;
     * if [type = select], then this filed is required to show default value of that select option. 
     * This option is not availabe in [option] key
     */
    option_default?: [] | Record<string, string | number | boolean> | null;

    /**
     * mat_icon_append: string
     * Show material icon at the start of the filed
     */
    mat_icon_append?: string;

    /**
     * validation: CrudFieldValidationType
     * Validation to apply on field value, this is used in mutation form to validate field value before submit.
     */
    validation?: CrudFieldValidationType;

    /**
     * normalize_val: (v: any, fi: CrudFormFieldInfoType, r: Record<string, any>, mode: CrudFieldNormalizeModeEnum) => any;
     * If set by passing call back function then this filed will be normalized using set algorithm after all default process before it is sent to UI or server as per set mode.
     */
    normalize_val?: (v: any, fi: CrudFormFieldInfoType, r: Record<string, any>, mode: CrudFieldNormalizeModeEnum) => any;

    /**
     * format_val: (v: any, fi: CrudFormFieldInfoType, r: Record<string, any>) => any;
     * If set by passing call back function then this filed will be formatted using set algorithm after all default process before it is sent to UI.
     */
    format_val?: (v: any, fi: CrudFormFieldInfoType, r: Record<string, any>) => any;
}

export interface CrudStateListingFieldObjType {
    [key: string]: CrudListingFieldInfoType;
}
export interface CrudListingFormattedFieldObjType {
    schema: Record<string, any>;     // field_key => field_info (only for fields with type != none)
    labels: Record<string, string>;  // field_key => label (only for fields with type != none)
    sortable: Record<string, string> // field_key => label (only if sort: true and type != none)
    columns: Record<string, string>; // field_key => column name in schema (only first level of fields are considered as column, nested fields are ignored)
}
export interface CrudStateFormFieldObjType {
    [key: string]: CrudFormFieldInfoType;
}
export interface CrudStateSearchFilterFieldObjType extends CrudStateFormFieldObjType {
}
export interface CrudStateMutationFieldObjType extends CrudStateFormFieldObjType {
}

export type CrudStateViewOptionFieldObjType = Record<CrudViewOptionFieldsEnum, CrudFormFieldInfoType> & {
    view_option: CrudFormFieldInfoType; // this is just a label field
};

export type CrudStateListOperationFieldObjType = Record<CrudListOperationFieldsEnum, CrudFormFieldInfoType>;





export interface CrudStateListingDataType {
    [key: string]: any;
}





export type CrudUniqueKeyType = (string | string[])[];
export type CrudSlotFieldPortalType = Portal<any>;
export type CrudSlotFieldsType = Record<string, CrudSlotFieldPortalType>;
export type CrudActionRecordIdType = string | number | string[] | number[] | null;
export type CrudEndDrawerOnCloseType = Record<string, (() => void) | null> | null;

export type CrudSearchFilterInputType = Partial<Record<keyof CrudStateSearchFilterFieldObjType, any>>;
export type CrudViewOptionInputType = Partial<Record<CrudViewOptionFieldsEnum, any>>;
export type CrudListOperationInputType = Partial<Record<CrudListOperationFieldsEnum, any>>;

export interface CrudFindInputType {
    SEARCH_FILTER_INPUT: CrudSearchFilterInputType;
    VIEW_OPTION_INPUT: CrudViewOptionInputType;
    LIST_OPERATION_INPUT: CrudListOperationInputType;
    SKIP: number;
}

export type CrudFieldObj = Record<string, any>;
export type CrudFieldObjInput = CrudFieldObj | CrudFieldObj[] | null | undefined;