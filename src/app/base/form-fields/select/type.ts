// file: src/app/base/form-fields/select/type.ts
import { ElementRef, Signal, WritableSignal } from '@angular/core';
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
 * The options ARE held by the field - that is the whole difference from AUTOSUGGEST,
 * where they are fetched while the user types. Everything below is a shape the caller
 * hands over whole.
 *
 * The shapes deliberately mirror @base/form-fields/autosuggest/type: a bag written for
 * one of the two controls drops into the other unchanged, and a field that outgrows a
 * static list becomes an autosuggest without its rows being rewritten.
 */

/**
 * ONE option row.
 *
 * The common case is not this at all - it is a bare label, `{ 1: 'Asia' }`. This is the
 * rich form, identical to FormFieldAutosuggestOptionItemType, for a row that carries
 * more than its name: an icon, a code, an image, whatever [template.option] draws.
 */
export type FormFieldSelectOptionItemType = FormFieldOptionItemType;

/** what one key maps to: its label, or the whole row */
export type FormFieldSelectOptionValueType = FormFieldOptionValueType;

/** flat bag: key => label. The shape almost every field holds */
export type FormFieldSelectOptionRecordType = FormFieldOptionRecordType;

/** ONE group: its own heading data, plus the rows underneath it */
export type FormFieldSelectOptionGroupItemType = FormFieldOptionGroupItemType;

/** MANY groups: group key => group. Rendered as <mat-optgroup> */
export type FormFieldSelectOptionGroupType = FormFieldOptionGroupType;

/**
 * The option DATA. Which shape it is is told apart by SHAPE, never by a discriminator:
 * an array is an array, a bag whose first value carries its own [option] is grouped, and
 * anything else is flat.
 *
 * An ARRAY entry is its own key: `['a','b']` renders two rows valued 'a' and 'b'. One
 * rule for the whole control - what goes in [value] is what template.option() is handed
 * as its key - which is worth knowing when wiring CRUD, whose inline SELECT block passes
 * the array INDEX to its template instead.
 */
export type FormFieldSelectOptionSourceType = FormFieldOptionSourceType;

/**
 * Everything [option] accepts: the data, or a SIGNAL holding it.
 *
 * ⚠ Signal<T> and not `() => T`. Both are one shape to typescript, so the name is the
 * contract: this is READ, in a computed, and must never be i/o. The caller owns the
 * loading; this control only ever looks.
 *
 * Hand over a resource()'s .value and the panel is live - bag() below reads it inside a
 * computed, so the rows appear the moment the request lands, with nothing pushed in:
 *
 *     [option]="state.optionCountry.value"     // the signal, NOT called
 *
 * A plain function works too and is read once, which is what a computed-but-fixed bag
 * wants. Unwrapped in exactly one place - bag() in state.ts - so the filter, the
 * selection maths and the trigger below it only ever see data.
 */
export type FormFieldSelectOptionType = FormFieldOptionType;

/**
 * █████████████████████████████████████████████████████████████████████
 * █ MARKUP ████████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * OPTIONAL here, unlike AUTOSUGGEST where it is the only renderer: a field that declares
 * none keeps the plain "{{ label | transloco }}" row. The branch that tests it reads a
 * field-level declaration, not per-row data, so it is loop-invariant however it looks.
 *
 * Rendered through Angular's sanitizer: style with class (tailwind works), NOT with a
 * style attribute; <script>, <style>, <svg> and on* handlers are stripped. The template
 * interpolates the caller's own data, so the template owns its own escaping.
 */
export type FormFieldSelectTemplateType = FormFieldOptionTemplateType;

/**
 * █████████████████████████████████████████████████████████████████████
 * █ INTERNAL ██████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * Nobody outside this folder builds one of these.
 */

/**
 * The component's whole input surface, handed to state.ts once from its constructor.
 *
 * Accessors, not values, so everything stays live. This exists because input() /
 * model() / viewChild() can only be declared on the component class, while every
 * computed() and effect() that reads them lives in state.ts - so the signals have to
 * cross that gap once, here.
 */
export interface FormFieldSelectConfigType extends FormFieldCollectionOptionConfigType {
    /** single: the picked KEY. multi: an array of them. Writable: clear() resets it */
    value: WritableSignal<any>;

    // ── options
    template: Signal<FormFieldSelectTemplateType | null>;

    // ── mode
    multiselect: Signal<boolean>;

    /** how many keys multiselect may hold. 0 = no limit (default), single select ignores it */
    maxSelection: Signal<number>;

    /** the All / Deselect row. multiselect only, and off whenever there is a ceiling */
    selectAll: Signal<boolean>;

    /** multiselect trigger: removable chips instead of a "n selected" count */
    chips: Signal<boolean>;

    /** a filter box pinned at the top of the open panel */
    searchable: Signal<boolean>;

    /** the filter box itself, so opening the panel can put the caret in it */
    searchEl: Signal<ElementRef<HTMLInputElement> | undefined>;
}

/** one normalized row, key already parsed back to its own type */
export type FormFieldSelectEntryType = FormFieldOptionEntryType;

/** one normalized group, its rows already normalized and filtered */
export type FormFieldSelectGroupEntryType = FormFieldOptionGroupEntryType;
