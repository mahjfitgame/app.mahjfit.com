// file: src/app/base/crud/type.ts
import { Signal, WritableSignal } from "@angular/core";
import type { ScrollStrategy } from "@angular/cdk/overlay";
import { CrudDataLoadTypeEnum, CrudFieldUiTypeEnum, CrudFieldValidationEnum, CrudListOperationFieldsEnum, CrudViewOptionFieldsEnum, CrudFieldNormalizeModeEnum } from "@base/crud/enum";
import { Portal } from "@angular/cdk/portal";
import { FieldTree, SchemaPathTree } from "@angular/forms/signals";
import {
    FormFieldAutosuggestCustomAddType,
    FormFieldAutosuggestOptionGroupItemType,
    FormFieldAutosuggestOptionGroupType,
    FormFieldAutosuggestOptionItemType,
    FormFieldAutosuggestOptionRecordType,
    FormFieldAutosuggestResultType,
} from "@base/form-fields/autosuggest/type";
import type {
    FormFieldDatetimeEventType,
    FormFieldDatetimeFilterType,
    FormFieldDatetimeValueType,
} from "@base/form-fields/datetime/type";
import {
    FormFieldDatetimePickerModeEnum,
    FormFieldDatetimeStartViewEnum,
} from "@base/form-fields/datetime/enum";
import type { FormFieldFlagModeType } from "@base/form-fields/flag/type";
import type { FormFieldOptionLoaderType } from "@base/form-fields/type";
import type { FoundationModuleRouteType } from "@libs/foundation/module/type";
import { FoundationActionEnum } from "@libs/foundation/action/enum";

export type CrudStateFormFieldUpdaterType = (key: string, patch: Partial<CrudFormFieldInfoType>) => void;

export type CrudFieldValueFormatterType = (
    v: any,
    fi: CrudFieldInfoType,
    r: Record<string, any>,
) => any;
export type CrudFieldValueFormatterLookUpType = Record<
    CrudFieldUiTypeEnum, 
    CrudFieldValueFormatterType
>;
export type CrudFormFieldValueNormalizerLookUpType = Record<
    CrudFieldUiTypeEnum, 
    (v: any, fi: CrudFormFieldInfoType, r: Record<string, any>, mode: CrudFieldNormalizeModeEnum) => any
>;
export type CrudFormFieldValueValidatorLookUpType = Record<
    CrudFieldValidationEnum, 
    (v: any, finfo: CrudFormFieldInfoType, r?: Record<string, any>) => any
>;
export type CrudFormFieldValueAngularValidatorLookUpType = Record<
    CrudFieldValidationEnum, 
    <T>(
        sp: SchemaPathTree<T>,
        f: string,
        validationType: CrudFieldValidationEnum,
        rule: CrudFieldValidationInfoType,
        fi: CrudFormFieldInfoType
    ) => any
>;





/** flat option bag: key => label. The shape most fields hold */
export type CrudFieldOptionRecordType = Record<string, string | number | boolean>;

/**
 * ONE option group: its heading data plus the options under it.
 * Same shape CrudFieldAutosuggestOptionGroupItemType uses, deliberately, so a
 * grouped SELECT and a grouped AUTOSUGGEST read the same way.
 */
export interface CrudFieldOptionGroupItemType {
    /** unique identifier for this group */
    key?: string | number;

    /** heading text, or an i18n key */
    label: string;

    /** material icon name for the heading, optional */
    icon?: string;

    /** the options in this group */
    option: CrudFieldOptionRecordType;
}

/** MANY groups: group key => group. Rendered as <mat-optgroup> */
export type CrudFieldOptionGroupType = Record<string, CrudFieldOptionGroupItemType>;

/**
 * The option DATA, in every shape a field may hold it.
 *
 * This is what every READER works with - validation, the url round trip, the
 * listing formatters, the templates. Nothing downstream ever meets the signal
 * form below, because CrudUtility.resolveOption() unwraps it at the entry of
 * every helper that consumes it.
 */
export type CrudFieldOptionSourceType =
    | Array<string | number | boolean>
    | CrudFieldOptionRecordType
    | CrudFieldOptionGroupType
    | null
    | undefined;

/**
 * What a field DECLARES in [option]: the data, or a SIGNAL holding it.
 *
 * ⚠ Signal<T>, deliberately, and NOT `() => T`. The two are the same shape to
 * typescript, so the name is the whole contract: reading this must be a
 * MEMOISED READ and never i/o. Every reader below calls it - option_range on
 * each keystroke, the listing formatter once per cell - so a function that
 * fetched would place a request per read. A signal cannot: its value is already
 * there, and reading it a thousand times costs one lookup each.
 *
 * The signal form is for options a field cannot know when it is declared. A
 * resource()'s .value is exactly this type:
 *
 *     option: this.optionCountry.value       // the signal, NOT called
 *
 * ⚠ NOT called. A resource loads from an effect, so at declaration time its
 * value is still the defaultValue - `option: r.value()` would freeze that empty
 * bag forever. Handing the signal over instead lets each reader take the value
 * when IT runs, and repaint when the load lands.
 *
 * ⚠ Every ui type takes the signal form EXCEPT SWITCH, which is data only. Its
 * [option] is a two-key { on, off } literal with no version worth loading, and
 * CrudUtility.isSwitchOptionType() is a TYPE PREDICATE whose callers read
 * .on / .off straight off the value - so it cannot resolve without lying about
 * what it narrowed. A signal there is simply not classified as a switch.
 */
export type CrudFieldOptionType =
    | CrudFieldOptionSourceType
    | Signal<CrudFieldOptionSourceType>;

/** Every result shape accepted from the universal option loader. */
export type CrudFieldOptionLoaderResultType =
    | CrudFieldOptionSourceType
    | FormFieldAutosuggestResultType;

/** CRUD name for the loader contract shared by every option-based control. */
export type CrudFieldOptionLoaderType = FormFieldOptionLoaderType<CrudFieldOptionLoaderResultType>;

export interface CrudFieldSwitchOptionType extends Record<string, string | number | boolean> {
    // need to match CrudFieldOptionSourceType
    on: string | number | boolean,
    off: string | number | boolean,
}

/**
 * What valueLoader resolves to: option key => label, or key => the whole option row.
 *
 * The label form is deliberately the same shape [option] already holds, so CRUD merges
 * it straight in and every field type that reads [option] benefits without knowing
 * about it.
 *
 * The row form is for AUTOSUGGEST, which names its values itself: answer with the item
 * and <app-form-field-autosuggest> also files it in its panel cache, so a value the
 * form opened on becomes a real suggestion again the moment it is deselected - with no
 * second request. Only that form can, because template.option() draws the row and a
 * bare label is not a row.
 */
export type CrudFieldValueLoaderResultType = Record<
    string | number,
    string | number | boolean | FormFieldAutosuggestOptionItemType
>;

/**
 * valueLoader: (value, finfo) => option
 * Loads the label(s) for a value the field was handed but cannot name.
 *
 * The problem it solves: a filter restored from the URL carries ";region=3" and
 * nothing else - no record, no relation, no label - so the control would show the
 * raw key. This is asked to name it, and the answer is stamped into [option].
 *
 * Returns several keys at once if it likes. May be sync: a static map needs no request.
 *
 * NOT consulted when the key can already be named - [option] holds it, or fr_field
 * named it off a loaded record - so it costs nothing behind a static option bag.
 *
 * [value] is ALWAYS an ARRAY, holding the keys that still need naming and nothing
 * else - one key long for AUTOSUGGEST, as many as the chips for MULTIAUTOSUGGEST. So
 * one `id IN (…)` serves both, and switching a field between those types is not a
 * change to its loader.
 */
export type CrudFieldValueLoaderType = (
    value: any[],
) => CrudFieldValueLoaderResultType | Promise<CrudFieldValueLoaderResultType>;

/**
 * The stable result every field dependency resolver returns.
 *
 * [dependentFieldValue] is context for the rendered control, never that control's own
 * [value]. [disabledByDependency] is kept separate from the field's explicit [disabled]
 * flag so the CRUD renderer can combine both without overwriting either declaration.
 */
export interface CrudFieldValueDependencyResultType<TValue = unknown> {
    dependentFieldValue: TValue;
    disabledByDependency?: boolean;
}

/**
 * A field owns the shape of its dependency logic. CRUD supplies the complete sibling
 * field object and consumes only the standard result above.
 */
export type CrudFieldValueDependencyType<TValue = unknown> = (
    ffObj: CrudFieldObj,
) => CrudFieldValueDependencyResultType<TValue>;

export interface CrudFieldOnChangeContextType {
    value: any;
    previousValue: any;
    fkey: string;
    finfo: CrudFormFieldInfoType;
    ffObj: CrudFieldObj;

    /** Set one dependent field's value. Its on_change is opt-in to prevent cycles. */
    setDependentFieldValue: (
        targetField: string,
        value: any,
        options?: { emitChange?: boolean },
    ) => void;

    /** Patch any declaration on a dependent field, not only its value. */
    patchDependentFieldInfo: (
        targetField: string,
        changes: Partial<CrudFormFieldInfoType>,
    ) => void;
}

/**
 * █████████████████████████████████████████████████████████████████████
 * █ SELECT ████████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * Used when [type = SELECT | MULTISELECT | BUTTON_SELECT | BUTTON_MULTISELECT]. Unlike
 * AUTOSUGGEST the options ARE held by the field, in [option] - everything below is only
 * about selection behaviour.
 *
 * CRUD does not draw this control either: <app-form-field-select> does, and it is
 * standalone. Every key here is optional and every default matches the control's own,
 * so a field that declares no `select:` bag at all behaves exactly as it did before.
 */
export interface CrudFieldSelectType {
    /** clearable: boolean (default true). Show a clear action when the field has a value. */
    clearable?: boolean;

    /**
     * max_selection: number (default 0)
     * How many keys the field may hold, 0 meaning no limit.
     *
     * MULTISELECT only - a plain SELECT holds one key and the form field template pins
     * it there. Setting one also removes the All row, because "take everything" and "at
     * most n" cannot both hold.
     */
    max_selection?: number;

    /**
     * select_all: boolean (default true)
     * The All / Deselect row at the top of a MULTISELECT panel, with its (n/total) count.
     */
    select_all?: boolean;

    /**
     * chips: boolean (default false)
     * MULTISELECT trigger: removable chips instead of a "n selected" count.
     */
    chips?: boolean;

    /**
     * searchable: boolean (default false)
     * A filter box pinned at the top of the open panel. For a long static [option] bag -
     * a field whose options are not static at all wants AUTOSUGGEST instead.
     */
    searchable?: boolean;

    /**
     * ⚠ There is deliberately NO `multiselect` flag here, for the reason
     * CrudFieldAutosuggestType gives below: one key or many is the field's TYPE, because
     * that is what the value normalizer, the URL round trip and the listing formatter all
     * switch on. A flag buried in this bag could disagree with any of them; a type cannot.
     */
}

/**
 * █████████████████████████████████████████████████████████████████████
 * █ RADIO ██████████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * Used when [type = RADIO]. The options live in [option] as they always have; everything
 * below is only about how the group is laid out.
 *
 * CRUD does not draw this control either: <app-form-field-radio> does, and it is
 * standalone. Every key here is optional and every default matches the control's own, so
 * a field declaring no `radio:` bag at all behaves exactly as it did before.
 */
export interface CrudFieldRadioType {
    /**
     * columns: number (default 2)
     * How many rows sit side by side. 1 stacks them, which suits long labels.
     */
    columns?: number;

    /**
     * clearable: boolean (default false)
     * A × in the header row that unpicks the field. Off by default: an `option_default`
     * 'Any' row is the usual way to say "no choice", and both at once reads as noise.
     */
    clearable?: boolean;

    /**
     * ⚠ There is deliberately NO `multiselect` flag here, for the same reason SELECT's
     * bag gives above: many keys is CHECKBOX, and that is the field's TYPE, because that
     * is what the normalizer, the URL round trip and the listing formatter switch on.
     */
}

/**
 * █████████████████████████████████████████████████████████████████████
 * █ TEXTAREA ██████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * Used when [type = TEXTAREA]. CRUD does not draw this control either:
 * <app-form-field-textarea> does, and it is standalone. Every key is optional and
 * matches the control's own default, so a field declaring no `textarea:` bag behaves
 * exactly as CRUD's old inline block did - three rows, growing to eight.
 */
export interface CrudFieldTextareaType {
    /** min_rows: number (default 3) */
    min_rows?: number;

    /** max_rows: number (default 8) */
    max_rows?: number;
}

/**
 * █████████████████████████████████████████████████████████████████████
 * █ CHECKBOX ██████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * Used when [type = CHECKBOX]. CRUD does not draw this control either:
 * <app-form-field-checkbox> does, and it is standalone. The options live in [option]
 * as they always have; everything below is only about the All row and the selection
 * cap - both new, the old inline block had neither.
 */
export interface CrudFieldCheckboxType {
    /** columns: number (default 2). How many rows sit side by side */
    columns?: number;

    /**
     * select_all: boolean (default true)
     * The All / Deselect row at the top of the grid, with its (n/total) count.
     */
    select_all?: boolean;

    /**
     * max_selection: number (default 0, no limit)
     * How many keys the field may hold. Setting one also removes the All row, because
     * "take everything" and "at most n" cannot both hold.
     */
    max_selection?: number;
}

/**
 * █████████████████████████████████████████████████████████████████████
 * █ AUTOSUGGEST ███████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * Used only when [type = AUTOSUGGEST]. The options are NOT held by the field:
 * they are fetched while the user types.
 *
 * CRUD does not draw this control - <app-form-field-autosuggest> does, and it is
 * standalone: usable with no CRUD anywhere. So the shapes below are ALIASES of its
 * own, not copies. One definition, and a loader written for a hand-built form drops
 * into a CRUD field object unchanged.
 */

/** ONE option row: { label, …anything else template.option() wants } */
export type CrudFieldAutosuggestOptionItemType = FormFieldAutosuggestOptionItemType;

/** MANY option rows: option key => item. This is what a flat loader returns */
export type CrudFieldAutosuggestOptionRecordType = FormFieldAutosuggestOptionRecordType;

/** ONE group: its own heading data, plus the rows underneath it */
export type CrudFieldAutosuggestOptionGroupItemType = FormFieldAutosuggestOptionGroupItemType;

/** MANY groups: group key => group. This is what a grouped loader returns */
export type CrudFieldAutosuggestOptionGroupType = FormFieldAutosuggestOptionGroupType;

/**
 * what a loader resolves to.
 *
 * The Map arm is not decoration: a plain object with numeric keys iterates them
 * ASCENDING, so { 42:…, 7:… } comes back 7, 42 and a ranked search result loses
 * its ranking. Return a Map whenever the keys are numeric AND order carries meaning.
 */
export type CrudFieldAutosuggestResultType = FormFieldAutosuggestResultType;

/** @see FormFieldAutosuggestCustomAddType */
export type CrudFieldAutosuggestCustomAddType = FormFieldAutosuggestCustomAddType;

/**
 * on_custom_add: (event, fkey, finfo) => nothing, or a value_loader answer
 *
 * Named like the loaders beside it, so a module declares it as one arrow property.
 */
export type CrudFieldAutosuggestOnCustomAddType = (
    event: CrudFieldAutosuggestCustomAddType,
    fkey: string,
    finfo: CrudFormFieldInfoType,
) => void
    | CrudFieldValueLoaderResultType
    | Promise<void | CrudFieldValueLoaderResultType>;

export interface CrudFieldAutosuggestType {
    /** shorter than this and nothing is fetched. Default 2 */
    min_length?: number;

    /** quiet time in ms before a search goes out. Default 300 */
    debounce?: number;

    /**
     * require_selection: boolean (default true)
     * true  -> only a picked option can become the value ([requireSelection])
     * false -> free text is committed as the value when nothing is picked
     */
    require_selection?: boolean;

    /**
     * max_selection: number (default 0)
     * How many chips the field may hold, 0 meaning no limit.
     *
     * MULTIAUTOSUGGEST only. A plain AUTOSUGGEST holds one key and the form field
     * template pins it there, so this is not read for that type.
     *
     * At the limit the input stops accepting text and says why; the chips stay
     * removable, which is the way back.
     */
    max_selection?: number;

    /**
     * custom_value: boolean (default false)
     * true -> the user's own text can be picked as a value, from a 'Use "…"' row at
     * the bottom of the panel. Its key IS that text, so the field's value can hold
     * server ids and free strings side by side - only turn it on where the api and
     * the [value_loader] behind it accept both.
     */
    custom_value?: boolean;

    /**
     * on_custom_add: (event, fkey, finfo) => nothing, or a value_loader answer
     *
     * Fired by the trailing icon on a row the user typed themselves - the module's
     * chance to SAVE that value: create the record and RETURN it, in the same shape
     * [value_loader] answers in (a promise is fine).
     *
     * What comes back is filed in the panel, the typed placeholder is dropped, and the
     * field's VALUE swaps the text for the real key - so from that point the field
     * submits an id like any other pick. Return nothing and the typed row is left alone.
     *
     * Read at event time, exactly like [on_change], so [finfo] is the field object as it
     * stands now and not one captured when the control was drawn.
     */
    on_custom_add?: CrudFieldAutosuggestOnCustomAddType;

    /**
     * ⚠ There is deliberately NO `multiselect` flag here. One key or many is the
     * field's TYPE - AUTOSUGGEST or MULTIAUTOSUGGEST - because that is what the value
     * normalizer, the URL round trip and the listing formatter all switch on. A flag
     * buried in this bag could disagree with any of them; a type cannot.
     */
}

/**
 * Markup builders for a field's option list. Both members return a real HTML
 * string EVERY time - there is no fallback behind them and no per-row branch in
 * the loop, so returning '' renders an empty row and that is the template's bug,
 * not the control's.
 *
 * Rendered through Angular's sanitizer: style with class (tailwind works), NOT
 * with a style attribute; <script>, <style>, <svg> and on* handlers are stripped.
 * The template interpolates api data, so the template owns its own escaping.
 */
export interface CrudFieldTemplateType {
    /**
     * option: (item, key, finfo) => string
     * One option row.
     *  - AUTOSUGGEST : item is CrudFieldAutosuggestOptionItemType, key is the result key
     *  - SELECT / MULTISELECT (option as Record) : item is the label, key is the option key
     *  - SELECT / MULTISELECT (option as Array)  : item is the entry, key is its index
     */
    option: (item: any, key: any, finfo: any) => string;

    /**
     * group: (group, key, finfo) => string
     * One group heading, receiving CrudFieldAutosuggestOptionGroupItemType. Its
     * PRESENCE is what declares the result grouped - nothing sniffs the payload
     * shape. Set it only when the loader returns group key => group.
     */
    group?: (group: any, key: any, finfo: any) => string;
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

/** FLAG display metadata plus options used by editable FLAG controls. */
export interface CrudFieldFlagType {
    /** Translation keys used only to display the null and date-time states. */
    label?: CrudFieldFlagLabelType;

    /** Allow a selected date-time to become an on-but-empty value (`''`). */
    clearable?: boolean;

    /** Picker and configured value format used while the flag is switched on. */
    mode?: FormFieldFlagModeType;
}

export interface CrudFieldRangeType {
    /**
     * from: string;
     * Field key holding the lower value
     */
    from: string;

    /**
     * to: string;
     * Field key holding the upper value
     */
    to: string;
}

/**
 * Owl v22 options shared by DATE, TIME, DATETIME and DATETIME_RANGE fields.
 * pickerType and selectMode are deliberately absent: the field type fixes both.
 */
export interface CrudFieldDatetimeType {
    readonly_input?: boolean;
    clearable?: boolean;
    range_separator?: string;
    filter?: FormFieldDatetimeFilterType;

    picker_mode?: FormFieldDatetimePickerModeEnum;
    start_view?: FormFieldDatetimeStartViewEnum;
    start_at?: FormFieldDatetimeValueType;
    end_at?: FormFieldDatetimeValueType;

    show_calendar_weeks?: boolean;
    year_only?: boolean;
    multiyear_only?: boolean;
    first_day_of_week?: number;
    hide_other_months?: boolean;

    hour12_timer?: boolean;
    show_seconds_timer?: boolean;
    step_hour?: number;
    step_minute?: number;
    step_second?: number;

    opened?: boolean;
    backdrop_class?: string | string[];
    panel_class?: string | string[];
    scroll_strategy?: ScrollStrategy;

    on_input?: (
        event: FormFieldDatetimeEventType,
        fkey: string,
        finfo: CrudFormFieldInfoType,
    ) => void;
    on_before_open?: (fkey: string, finfo: CrudFormFieldInfoType) => void;
    on_after_open?: (fkey: string, finfo: CrudFormFieldInfoType) => void;
    on_after_close?: (fkey: string, finfo: CrudFormFieldInfoType) => void;
    on_year_selected?: (value: Date, fkey: string, finfo: CrudFormFieldInfoType) => void;
    on_month_selected?: (value: Date, fkey: string, finfo: CrudFormFieldInfoType) => void;
    on_date_selected?: (value: Date, fkey: string, finfo: CrudFormFieldInfoType) => void;
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
     * mat_icon_append: string
     * Show material icon at the end of the field.
     */
    mat_icon_append?: string;

    /**
     * slot: boolean | string
     * If set to true, then slot name will be used as per field name prefixed as per type.
     * Otherwise provided string will be used as slot name.
     * Possible prefix types: CrudSlotFieldPortalKeyPrefixEnum
     */
    slot?: boolean | string;

    /**
     * select_option: CrudFieldOptionType 
     * if [type = select | checkbo | radio kind of], it is static data and with speific type this filed is required to show value of that select option. 
     * This attribute requird to set if OPTION_RANGE validation is used in form validation attribute, and possible values for this option should be provided in this attribute.
     * if [type = switch] then option type must be CrudFieldSwitchOptionType
     */
    option?: CrudFieldOptionType;

    /**
     * template: CrudFieldTemplateType
     * Custom markup for the option rows / group headings of this field.
     * REQUIRED when [type = AUTOSUGGEST] - that control has no built-in row
     * rendering at all, so a missing template is a TypeError on first render.
     * Optional everywhere else, where a field with no template keeps the plain
     * "{{ value | transloco }}" row.
     */
    template?: CrudFieldTemplateType;

    /**
     * fr_field: string
     * if [type = select | checkbo | radio kind of], then this filed will be checked to see if it has data from foreign relation. Then this filed is required to show value of that select option. 
     * pass the field relation name here such as [fr_user.id] or [fr_user.fr_device.id] etc
     */
    fr_field?: string;

    /** FLAG labels and editable-control options. */
    flag?: CrudFieldFlagType;

    /**
     * range_field: CrudFieldRangeType
     * Used when [type = RANGE | DATETIME_RANGE].
     * Names the two sibling field keys this one control writes into.
     * Both keys keep their own url_matrix_param, validation and value, so the URL
     * and the API still see two independent fields. The key that is not rendering
     * the control must set [skip: true] so it does not draw a second control.
     */
    range_field?: CrudFieldRangeType,

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

    /** Optional final display formatter shared by listing and read-only views. */
    format_val?: CrudFieldValueFormatterType;

    /** Responsive grid column count for editable and read-only field layouts. */
    colspan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}
export interface CrudListingFieldInfoType extends CrudFieldInfoType {
    /**
     * sort: boolean
     * if [type = none] then this filed will be ignored 
     */
    sort: boolean;

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
     * disabled: boolean;
     * Prevents user interaction with the rendered form control.
     */
    disabled?: boolean;

    /**
     * value: any
     * Value for field, this is used to show value in html element when value is available
     */
    value?: any;

    /**
     * value_loader: CrudFieldValueLoaderType
     * Names a [value] the field cannot name on its own - typically one restored
     * from a URL matrix param, where the key travels without its label.
     *
     * Not tied to any one ui type: anything that reads [option] - SELECT,
     * MULTISELECT, BUTTON_SELECT, BUTTON_MULTISELECT, RADIO, CHECKBOX,
     * AUTOSUGGEST - is named by the same hook.
     * CRUD calls it during URL restore, only when the key is not already known,
     * and merges the result into [option].
     */
    value_loader?: CrudFieldValueLoaderType;

    /**
     * Universal option callback for SELECT, MULTISELECT, BUTTON_SELECT,
     * BUTTON_MULTISELECT, RADIO, CHECKBOX and AUTOSUGGEST. Collection controls load
     * once on creation; AUTOSUGGEST supplies [query] and retains its own minimum length,
     * debounce and cache behavior.
     *
     * If [value_dependency] exists, its value is supplied in the callback context and
     * scopes/retriggers loading as appropriate for the rendered control.
     */
    option_loader?: CrudFieldOptionLoaderType;

    /** Optional developer-defined context supplied to any rendered form-field control. */
    value_dependency?: CrudFieldValueDependencyType;

    /**
     * on_change: (context) => void
     *
     * Fired when the USER changes this field's value - a pick, a chip removed, the
     * clear button. [value] is the whole value as the field now holds it: the array of
     * keys for MULTISELECTAUTOSUGGEST, the single key for AUTOSUGGEST.
     *
     * Not fired for a value the CODE set - a URL restore, a record loading into the
     * form - because those go through the state updater rather than through the
     * control's own output. This is "the user changed it", not "it changed".
     *
     * Wired for every field type that can be typed in or picked from. Not wired where
     * there is nothing to fire: NONE and HIDDEN take no input, FILE / HTML / ARRAY /
     * JSON are still empty blocks.
     *
     * RANGE fires on its two SUB-fields ([range_field].from / .to), each with its own
     * key, because that is where a range keeps its values.
     */
    on_change?: (context: CrudFieldOnChangeContextType) => void | Promise<void>;

    /**
     * option_default: Record<string | number, string>;
     * if [type = select], then this filed is required to show default value of that select option. 
     * This option is not availabe in [option] key
     */
    option_default?: [] | Record<string, string | number | boolean> | null;

    /**
     * step: number
     * Increment between allowed values.
     * Used when [type = NUMBER | SLIDER | RANGE].
     * NUMBER falls back to 'any' when not set, SLIDER and RANGE fall back to 1.
     */
    step?: number;

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

    // FIELD SPECIFIC OPTIONS ----------

    /**
     * autosuggest: CrudFieldAutosuggestType
     * Everything [type = AUTOSUGGEST] needs beyond the keys every field already has.
     * The API callback lives in the field's top-level [option_loader]. Debounce,
     * minimum length, caching and cancellation remain internal to AUTOSUGGEST.
     *
     * [template.option] is REQUIRED alongside it: the control has no built-in row
     * rendering at all. [value_loader] is not autosuggest-specific but matters most
     * here, since a saved key arrives with no label and no [option] bag to find one in.
     */
    autosuggest?: CrudFieldAutosuggestType;

    /**
     * select: CrudFieldSelectType
     * Everything [type = SELECT | MULTISELECT | BUTTON_SELECT | BUTTON_MULTISELECT]
     * needs beyond the keys every field already has. Entirely optional: the options
     * themselves live in [option] as they always have.
     */
    select?: CrudFieldSelectType;

    /**
     * radio: CrudFieldRadioType
     * Everything [type = RADIO] needs beyond the keys every field already has.
     */
    radio?: CrudFieldRadioType;

    /**
     * textarea: CrudFieldTextareaType
     * Everything [type = TEXTAREA] needs beyond the keys every field already has.
     */
    textarea?: CrudFieldTextareaType;

    /**
     * checkbox: CrudFieldCheckboxType
     * Everything [type = CHECKBOX] needs beyond the keys every field already has.
     */
    checkbox?: CrudFieldCheckboxType;

    /** Owl picker options for DATE, TIME, DATETIME and DATETIME_RANGE. */
    datetime?: CrudFieldDatetimeType;

    
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
/** Fields required to read and render one record without form-only metadata. */
export type CrudStateRecordFieldObjType = Record<string, CrudFieldInfoType>;
export type CrudStateViewFieldObjType = CrudStateRecordFieldObjType;
export type CrudStateSearchFilterFieldObjType = CrudStateFormFieldObjType;
export interface CrudStateMutationFieldObjType extends CrudStateFormFieldObjType {
}
export type CrudStateViewOptionFieldObjType = Partial<Record<CrudViewOptionFieldsEnum, CrudFormFieldInfoType>> & {
    view_option: CrudFormFieldInfoType; // this is just a label field
};
export type CrudStateListOperationFieldObjType = Record<CrudListOperationFieldsEnum, CrudFormFieldInfoType>;
export type CrudStateListingSearchFieldObjType = CrudStateFormFieldObjType;




export interface CrudStateListingDataType {
    [key: string]: any;
}

export interface CrudModuleContextType {
    primaryKey: string | null;
    secondaryKey: string | null;
    uniqueKey: CrudUniqueKeyType | null;
    urlSlugField: string | null;
    isMainField: string | null;
    recordPositionField: string | null;
    activeField: string | null;
    deletedField: string | null;
    rows: readonly any[];
    getRecordPrimaryKeyValue: (
        row: any,
        rowPkField?: string,
    ) => string | null;
    getRecordSecondaryKeyValue: (
        row: any,
        rowSkField?: string,
    ) => string | null;
}



export type CrudUniqueKeyType = (string | string[])[];
export type CrudSlotFieldPortalType = Portal<any>;
export type CrudSlotFieldsType = Record<string, CrudSlotFieldPortalType>;
export type CrudActionRecordPrimaryKeyValueType = string | number | string[] | number[] | null;
export type CrudActionRecordSecondaryKeyValueType = string | number | string[] | number[] | null;

/**
 * The explicit route API every CRUD child supplies.
 *
 * FoundationModuleRoute owns the generic path construction; the child route
 * names the actions it exposes so CRUD and application callers never pass an
 * action enum or route-placeholder object.
 */
export interface CrudModuleActionRouteType extends FoundationModuleRouteType {
    absolutePathCreate(): string;
    absolutePathCreateArr(): string[];
    absolutePathUpdate(keyid: string | number): string;
    absolutePathUpdateArr(keyid: string | number): string[];
    absolutePathDuplicate(keyid: string | number): string;
    absolutePathDuplicateArr(keyid: string | number): string[];
    absolutePathView(keyid: string | number): string;
    absolutePathViewArr(keyid: string | number): string[];
    absolutePathPrint(keyid: string | number): string;
    absolutePathPrintArr(keyid: string | number): string[];
}
/** Record mutations that use the shared confirm/notify/listing-update flow. */
export type CrudRecordActionType = 
    FoundationActionEnum.ACTIVE
    | FoundationActionEnum.INACTIVE
    | FoundationActionEnum.SOFT_DELETE
    | FoundationActionEnum.RESTORE
    | FoundationActionEnum.DELETE;

export type CrudEndDrawerOnCloseType = Record<string, (() => void) | null> | null;

export type CrudSearchFilterInputType = Partial<Record<keyof CrudStateSearchFilterFieldObjType, any>>;
export type CrudViewOptionInputType = Partial<Record<CrudViewOptionFieldsEnum, any>>;
export type CrudListOperationInputType = Partial<Record<CrudListOperationFieldsEnum, any>>;

/** Normalized listing options produced from the shared view-option form. */
export interface CrudListingViewOptionResultType<
    TColumns extends object = object,
    TOrder extends object = object,
> {
    columns: TColumns;
    order: TOrder;
}

export interface CrudFindInputType {
    SEARCH_FILTER_INPUT: CrudSearchFilterInputType;
    VIEW_OPTION_INPUT: CrudViewOptionInputType;
    LIST_OPERATION_INPUT: CrudListOperationInputType;
    SKIP: number;
}

export type CrudFindHandlerType = (
    input: CrudFindInputType,
    type: CrudDataLoadTypeEnum,
) => Promise<boolean>;

export type CrudMutationInputType = Record<string, unknown>;
export type CrudMutationFieldErrorType = Record<string, string>;
export type CrudMutationFormErrorType = Partial<Record<string, string | null>>;

export interface CrudMutationFormInputOptionsType {
    exclude?: readonly string[];
    omitEmpty?: boolean;
}

export interface CrudMutationResultType {
    success: boolean;
    message?: string;
    fieldErrors?: CrudMutationFieldErrorType;
}

export type CrudCreateHandlerType = (
    input: CrudMutationInputType,
) => Promise<CrudMutationResultType>;

export type CrudUpdateHandlerType = (
    keyid: string | number,
    input: CrudMutationInputType,
) => Promise<CrudMutationResultType>;

export type CrudRecordKeyType = string | number;

export type CrudRecordKeyInputType =
    | CrudRecordKeyType
    | CrudRecordKeyType[];

export type CrudRecordType = Record<string, unknown>;

/**
 * Module-owned record lookup. CRUD normalizes scalar/array input into a
 * non-empty, de-duplicated key array and supplies the action's required
 * record-field schema before invoking the handler.
 */
export type CrudFindByKeyHandlerType = (
    keys: readonly CrudRecordKeyType[],
    fieldObj: CrudStateRecordFieldObjType,
) => Promise<CrudRecordType[]>;

export type CrudActiveHandlerType = (
    keyid: CrudRecordKeyInputType,
) => Promise<CrudMutationResultType>;

export type CrudInactiveHandlerType = (
    keyid: CrudRecordKeyInputType,
) => Promise<CrudMutationResultType>;

export type CrudSoftDeleteHandlerType = (
    keyid: CrudRecordKeyInputType,
) => Promise<CrudMutationResultType>;

export type CrudRestoreHandlerType = (
    keyid: CrudRecordKeyInputType,
) => Promise<CrudMutationResultType>;

export type CrudDeleteHandlerType = (
    keyid: CrudRecordKeyInputType,
) => Promise<CrudMutationResultType>;

export type CrudFieldObj = Record<string, any>;
export type CrudFieldObjInput = CrudFieldObj | CrudFieldObj[] | null | undefined;


/**
 * █████████████████████████████████████████████████████████████████████
 * █ CRUD STATE ████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 */

/** Runtime contract implemented by {@link CrudListingState}. */
export interface CrudListingStateType {
    _listingSearchFieldObj: WritableSignal<CrudStateListingSearchFieldObjType>;
    listingSearchFieldObj: Signal<CrudStateListingSearchFieldObjType>;

    _listingSearchFormError: WritableSignal<Record<string, any>>;
    listingSearchFormError: Signal<Record<string, any>>;

    _listingSearchFormModel: WritableSignal<Record<string, any>>;
    listingSearchFormModel: Signal<Record<string, any>>;

    _listingSearchFormProcessing: WritableSignal<boolean>;
    listingSearchFormProcessing: Signal<boolean>;

    listingSearchForm: FieldTree<Record<string, any>>;

    setListingSearchFieldObj(fieldObj: CrudStateListingSearchFieldObjType): void;
    setListingSearchFormError(error: Record<string, any>): void;
    updateListingSearchFormError(error: Partial<Record<string, any>>): void;
    clearListingSearchFormError(): void;
    setListingSearchFormModel(input: Record<string, any>): void;
    updateListingSearchFormModel(input: Partial<Record<string, any>>): void;
    clearListingSearchFormModel(): void;
    setListingSearchFormProcessing(processing: boolean): void;
    resetListingSearchForm(): void;
}

/** Runtime contract implemented by {@link CrudMutationState}. */
export interface CrudMutationStateType {
    _mutationFieldObj: WritableSignal<CrudStateMutationFieldObjType>;
    mutationFieldObj: Signal<CrudStateMutationFieldObjType>;

    _mutationFormError: WritableSignal<CrudMutationFormErrorType>;
    mutationFormError: Signal<CrudMutationFormErrorType>;

    _mutationFormModel: WritableSignal<Record<string, any>>;
    mutationFormModel: Signal<Record<string, any>>;

    _mutationFormProcessing: WritableSignal<boolean>;
    mutationFormProcessing: Signal<boolean>;

    mutationForm: FieldTree<Record<string, any>>;

    setMutationFieldObj(fieldObj: CrudStateMutationFieldObjType): void;
    setMutationFormError(error: CrudMutationFormErrorType): void;
    updateMutationFormError(error: Partial<CrudMutationFormErrorType>): void;
    clearMutationFormError(): void;
    setMutationFormModel(input: Record<string, any>): void;
    updateMutationFormModel(input: Partial<Record<string, any>>): void;
    clearMutationFormModel(): void;
    setMutationFormProcessing(processing: boolean): void;
    setMutationFormValues(input?: Record<string, any>): void;
    resetMutationForm(): void;
}

/** Runtime contract implemented by {@link CrudSearchFilterState}. */
export interface CrudSearchFilterStateType {
    _searchFilterFieldObj: WritableSignal<CrudStateSearchFilterFieldObjType>;
    searchFilterFieldObj: Signal<CrudStateSearchFilterFieldObjType>;

    setSearchFilterFieldObj(fieldObj: CrudStateSearchFilterFieldObjType): void;
    updateSearchFilterFieldObj(
        key: string,
        updates: Partial<CrudFormFieldInfoType>,
    ): void;
}

/** Runtime contract implemented by {@link CrudViewState}. */
export interface CrudViewStateType {
    _viewFieldObj: WritableSignal<CrudStateViewFieldObjType>;
    viewFieldObj: Signal<CrudStateViewFieldObjType>;

    setViewFieldObj(fieldObj: CrudStateViewFieldObjType): void;
    updateViewFieldObj(
        key: string,
        updates: Partial<CrudFieldInfoType>,
    ): void;
}
