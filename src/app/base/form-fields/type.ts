import type { Signal, WritableSignal } from '@angular/core';

/** Context supplied to a field's complete-list or query-driven option loader. */
export interface FormFieldOptionLoaderContextType {
    /** Search text supplied by query-driven controls such as autosuggest. */
    query?: string;
    dependentFieldValue?: unknown;
    abortSignal: AbortSignal;
}

/** Option loader shared by every option-based form control. */
export type FormFieldOptionLoaderType<TOptionSource> = (
    context: FormFieldOptionLoaderContextType,
) => Promise<TOptionSource>;

/** Pending loader work shared by complete-list option controls. */
export interface FormFieldOptionRequestType<TOptionSource> {
    loader: FormFieldOptionLoaderType<TOptionSource>;
    dependentFieldValue?: unknown;
}

/** Keys supported by option records and maps. */
export type FormFieldOptionKeyType = string | number;

/** A primitive option label/value. */
export type FormFieldOptionPrimitiveType = string | number | boolean;

/** One rich option row used by checkbox, radio and select controls. */
export interface FormFieldOptionItemType {
    /** The containing record or map key remains authoritative. */
    key?: FormFieldOptionKeyType;
    label: string;
    [extra: string]: any;
}

/** What one option key maps to. */
export type FormFieldOptionValueType =
    | FormFieldOptionPrimitiveType
    | FormFieldOptionItemType;

/** A flat key-to-option collection. */
export type FormFieldOptionRecordType = Record<
    FormFieldOptionKeyType,
    FormFieldOptionValueType
>;

/** One option group and its child rows. */
export interface FormFieldOptionGroupItemType {
    key?: FormFieldOptionKeyType;
    label: string;
    icon?: string;
    option:
        | FormFieldOptionRecordType
        | Map<FormFieldOptionKeyType, FormFieldOptionValueType>;
    [extra: string]: any;
}

/** A key-to-group collection. */
export type FormFieldOptionGroupType = Record<
    FormFieldOptionKeyType,
    FormFieldOptionGroupItemType
>;

/** Option data accepted by checkbox, radio and select controls. */
export type FormFieldOptionSourceType =
    | FormFieldOptionPrimitiveType[]
    | FormFieldOptionRecordType
    | FormFieldOptionGroupType
    | Map<
        FormFieldOptionKeyType,
        FormFieldOptionValueType | FormFieldOptionGroupItemType
    >
    | null;

/** Direct option data or a signal that supplies it. */
export type FormFieldOptionType =
    | FormFieldOptionSourceType
    | Signal<FormFieldOptionSourceType>;

/** Shared option-loading inputs for checkbox, radio and select state. */
export interface FormFieldCollectionOptionConfigType {
    option: WritableSignal<FormFieldOptionType>;
    optionLoader: Signal<FormFieldOptionLoaderType<FormFieldOptionSourceType> | null>;
    dependentFieldValue: Signal<any>;
    disabledByDependency: Signal<boolean>;
    optionDefault: Signal<Record<FormFieldOptionKeyType, any>>;
}

/** Optional HTML renderers shared by option-based controls. */
export interface FormFieldOptionTemplateType {
    option: (item: any, key: any) => string;
    group?: (group: any, key: any) => string;
}

/** One normalized option row. */
export interface FormFieldOptionEntryType {
    key: any;
    label: string;
    item: any;
}

/** One normalized option group. */
export interface FormFieldOptionGroupEntryType {
    key: any;
    item: FormFieldOptionGroupItemType;
    option: FormFieldOptionEntryType[];
}
