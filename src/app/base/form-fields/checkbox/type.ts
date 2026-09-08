// file: src/app/base/form-fields/checkbox/type.ts
import { Signal, WritableSignal } from '@angular/core';
import type {
    FormFieldCollectionOptionConfigType,
    FormFieldOptionEntryType,
    FormFieldOptionGroupEntryType,
    FormFieldOptionGroupItemType,
    FormFieldOptionGroupType,
    FormFieldOptionItemType,
    FormFieldOptionRecordType,
    FormFieldOptionSourceType,
    FormFieldOptionTemplateType,
    FormFieldOptionType,
    FormFieldOptionValueType,
} from '@base/form-fields/type';

/**
 * █████████████████████████████████████████████████████████████████████
 * █ OPTIONS ███████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * The options ARE held by the field. The shapes deliberately mirror
 * @base/form-fields/radio/type - a bag written for one drops into the other unchanged.
 */

/** ONE option row. The common case is not this at all - it is a bare label, `{ 1: 'Asia' }` */
export type FormFieldCheckboxOptionItemType = FormFieldOptionItemType;

/** what one key maps to: its label, or the whole row */
export type FormFieldCheckboxOptionValueType = FormFieldOptionValueType;

/** flat bag: key => label. The shape almost every field holds */
export type FormFieldCheckboxOptionRecordType = FormFieldOptionRecordType;

/** ONE group: its own heading data, plus the rows underneath it */
export type FormFieldCheckboxOptionGroupItemType = FormFieldOptionGroupItemType;

/** MANY groups: group key => group */
export type FormFieldCheckboxOptionGroupType = FormFieldOptionGroupType;

/**
 * The option DATA. Which shape it is is told apart by SHAPE, never by a discriminator: an
 * array is an array, a bag whose first value carries its own [option] is grouped, and
 * anything else is flat. An ARRAY entry is its own key.
 */
export type FormFieldCheckboxOptionSourceType = FormFieldOptionSourceType;

/**
 * Everything [option] accepts: the data, or a SIGNAL holding it.
 *
 * ⚠ Signal<T> and not `() => T`. Both are one shape to typescript, so the name is the
 * contract: this is READ, in a computed, and must never be i/o.
 *
 *     [option]="state.optionRegion.value"     // the signal, NOT called
 */
export type FormFieldCheckboxOptionType = FormFieldOptionType;

/**
 * █████████████████████████████████████████████████████████████████████
 * █ MARKUP ████████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * OPTIONAL: a field that declares none keeps the plain "{{ label | transloco }}" row.
 *
 * Rendered through Angular's sanitizer: style with class (tailwind works), NOT with a
 * style attribute; <script>, <style>, <svg> and on* handlers are stripped.
 */
export type FormFieldCheckboxTemplateType = FormFieldOptionTemplateType;

/**
 * █████████████████████████████████████████████████████████████████████
 * █ INTERNAL ██████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * The component's whole input surface, handed to state.ts once from its constructor.
 * Accessors, not values, so everything stays live.
 */
export interface FormFieldCheckboxConfigType extends FormFieldCollectionOptionConfigType {
    /** the picked KEYS, always an array. Writable: toggleAll() replaces it wholesale */
    value: WritableSignal<any[]>;

    /** the All / Deselect row. Hidden automatically once maxSelection caps the field */
    selectAll: Signal<boolean>;
    /** 0 = no limit */
    maxSelection: Signal<number>;
}

/** one normalized row, key already parsed back to its own type */
export type FormFieldCheckboxEntryType = FormFieldOptionEntryType;

/** one normalized group, its rows already normalized */
export type FormFieldCheckboxGroupEntryType = FormFieldOptionGroupEntryType;
