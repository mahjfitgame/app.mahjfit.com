// file: src/app/base/form-fields/autosuggest/type.ts
import { ElementRef, OutputEmitterRef, Signal, WritableSignal } from '@angular/core';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatChipGrid } from '@angular/material/chips';
import type {
    FormFieldOptionLoaderType,
    FormFieldOptionTemplateType,
} from '@base/form-fields/type';

/**
 * █████████████████████████████████████████████████████████████████████
 * █ RESULT █████████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * The options are NOT held by the field: they are fetched while the user types.
 */

/** ONE option row */
export interface FormFieldAutosuggestOptionItemType {
    /** unique identifier for this option row */
    key: string | number;

    /**
     * label: string
     * NOT the row text - template.option() draws the row. This is the plain text
     * the input shows once the row is picked (mat-autocomplete [displayWith]),
     * so it must stay a flat string with no markup in it.
     */
    label: string;

    /** anything else: image, code, score … reaches template.option() as-is */
    [extra: string]: any;
}

/** MANY option rows: option key => item. This is what a flat loader returns */
export interface FormFieldAutosuggestOptionRecordType {
    [key: string | number]: FormFieldAutosuggestOptionItemType;
}

/** ONE group: its own heading data, plus the rows underneath it */
export interface FormFieldAutosuggestOptionGroupItemType {
    /** unique identifier for this group */
    key: string | number;

    /** heading text, or an i18n key - template.group() decides how to use it */
    label: string;

    /** material icon name for the heading. Optional: a group with no icon omits it */
    icon?: string;

    /**
     * the rows in this group.
     *
     * The Map arm is here for the reason FormFieldAutosuggestResultType gives for the
     * outer bag, and it applies just as much INSIDE a group: integer-like object keys
     * iterate ascending, so { 42:…, 7:… } comes back 7, 42 and the server's ranking is
     * gone. entry() reads either shape.
     */
    option: FormFieldAutosuggestOptionRecordType
    | Map<string | number, FormFieldAutosuggestOptionItemType>;

    /** anything else the heading wants: colour, badge … reaches template.group() as-is */
    [extra: string]: any;
}

/** MANY groups: group key => group. This is what a grouped loader returns */
export interface FormFieldAutosuggestOptionGroupType {
    [key: string | number]: FormFieldAutosuggestOptionGroupItemType;
}

/**
 * what a loader resolves to.
 *
 * The Map arm is not decoration: a plain object with numeric keys iterates them
 * ASCENDING, so { 42:…, 7:… } comes back 7, 42 and a ranked search result loses
 * its ranking. Return a Map whenever the keys are numeric AND order carries meaning.
 */
export type FormFieldAutosuggestResultType =
    | FormFieldAutosuggestOptionRecordType
    | FormFieldAutosuggestOptionGroupType
    | Map<
        string | number,
        FormFieldAutosuggestOptionItemType | FormFieldAutosuggestOptionGroupItemType
    >;

/**
 * The [option] seed as DATA: key => label, or key => item.
 *
 * Looser than FormFieldAutosuggestOptionRecordType above on purpose - this is a SEED, so
 * a caller may hand over the plain key => label bag a SELECT holds, not only full rows.
 */
export type FormFieldAutosuggestOptionSourceType = Record<string | number, any>;

/**
 * Everything [option] accepts: the seed, or a SIGNAL holding it.
 *
 * ⚠ Signal<T> and not `() => T`. The two are one shape to typescript, so the name is the
 * contract: this is READ, inside a computed, and must never be i/o. The searching this
 * control does is [optionLoader]'s job and stays there.
 *
 * The signal arm exists because CRUD binds this input from the same finfo.option a
 * SELECT reads - CrudFieldOptionType - so a field declaring a signal bag and later
 * switched to AUTOSUGGEST must not silently seed with nothing: spreading a function
 * yields no keys at all, and nothing would report it.
 *
 * Unwrapped in exactly one place - seed() in state.ts.
 */
export type FormFieldAutosuggestOptionType =
    | FormFieldAutosuggestOptionSourceType
    | Signal<FormFieldAutosuggestOptionSourceType>;

/**
 * █████████████████████████████████████████████████████████████████████
 * █ MODE B - hand over the api calls, keep nothing █████████████████████
 * █████████████████████████████████████████████████████████████████████
 */

/**
 * optionLoader: ({ query, abortSignal, dependentFieldValue }) => result
 *
 * The ONE thing that differs per field: the api call, and the flattening of its
 * response into key => item. Debounce, minimum length, caching, cancellation, the
 * resource and its idle handling all live in state.ts.
 */
export type FormFieldAutosuggestOptionLoaderType =
    FormFieldOptionLoaderType<FormFieldAutosuggestResultType>;

/**
 * what a valueLoader resolves to: option key => label, or key => the whole option row.
 *
 * The bare label is the short form and stays enough to NAME a value. Answer with the
 * item instead and the row is also seeded into the panel's cache, so a value the form
 * opened on comes back as a real suggestion the moment it is deselected - no second
 * request for something the server has already sent. Only the item form can do that:
 * template.option() draws the row, and a bare label is not a row.
 *
 * A GROUPED field - one whose [template.group] is set - answers in ITS panel's shape
 * instead: groupKey => { label, icon, option }, the same thing its option loader
 * returns. Everything in that cache is read as a group, so a flat row filed among them
 * is a row walked for an .option it has not got.
 */
export type FormFieldAutosuggestValueLoaderResultType = Record<
    string | number,
    string | number | boolean | FormFieldAutosuggestOptionItemType
>;

/**
 * valueLoader: (key[]) => key => label
 *
 * Names keys nothing has rendered yet - a form opened on a saved record, a value
 * restored from a URL. Asked at most once per unknown key per mount. May be sync: a
 * static map needs no request.
 *
 * ALWAYS an array, single select included, where it is one key long - so one
 * `where id IN (…)` serves both modes and turning [multiselect] on is not a change to
 * the loader. It holds only the keys still missing a label, never the whole value.
 */
export type FormFieldAutosuggestValueLoaderType = (
    key: any[],
) => FormFieldAutosuggestValueLoaderResultType | Promise<FormFieldAutosuggestValueLoaderResultType>;

/**
 * What (customSelection) emits: the trailing icon on a row the user typed themselves was
 * clicked, and this is the caller's chance to do something real with that text - usually
 * save it and get an id back.
 *
 * An OUTPUT and not a callback input on purpose: a handler bound in a template is read
 * at event time, so it always sees the caller's current state - CRUD rebuilds its field
 * objects, and a function captured once would go on answering with a stale one.
 */
export interface FormFieldAutosuggestCustomAddType {
    /** the typed text - this row's key, and the field's value while it holds it */
    key: any;

    /** the row itself: { label, custom: true } */
    item: any;

    /** the group the user chose to save under (grouped fields only, null for flat) */
    groupKey: any;

    /**
     * Hand back what the save produced, in the [valueLoader] shape - groups included, as
     * `{ 4: { label: 'Africa', icon: 'public', option: { 91: { label: 'Atlantis' } } } }`.
     * A promise is fine, and so is nothing: a caller with no record to give just passes
     * whatever its handler returned.
     *
     * What it does with a record is the whole point of the row: the record is filed in
     * the panel, the typed placeholder is dropped, and the field's VALUE swaps the text
     * for the real key - so from here on the field submits an id like any other pick.
     */
    keep: (
        record: FormFieldAutosuggestValueLoaderResultType
            | void
            | Promise<FormFieldAutosuggestValueLoaderResultType | void>,
    ) => void;
}


/**
 * █████████████████████████████████████████████████████████████████████
 * █ MARKUP █████████████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████████████
 * Both members return a real HTML string EVERY time - there is no fallback behind
 * them and no per-row branch in the loop, so returning '' renders an empty row and
 * that is the template's bug, not the control's.
 *
 * Rendered through Angular's sanitizer: style with class (tailwind works), NOT with
 * a style attribute; <script>, <style>, <svg> and on* handlers are stripped. The
 * template interpolates api data, so the template owns its own escaping.
 */
export type FormFieldAutosuggestTemplateType = FormFieldOptionTemplateType;

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
export interface FormFieldAutosuggestConfigType {
    /** the picked KEY. Writable: onClear() resets it */
    value: WritableSignal<any>;

    // ── mode B
    optionLoader: Signal<FormFieldAutosuggestOptionLoaderType | null>;
    valueLoader: Signal<FormFieldAutosuggestValueLoaderType | null>;
    minLength: Signal<number>;
    debounce: Signal<number>;

    /**
     * Optional related-field context. It is passed to optionLoader and is also part
     * of the control's cache scope.
     */
    dependentFieldValue: Signal<any>;

    /** free text mode changes what [value] even is - see state.coldValue */
    requireSelection: Signal<boolean>;

    /** true → chip grid, value is any[], input name gets [] appended */
    multiselect: Signal<boolean>;

    /** how many chips multiselect may hold. 0 = no limit (default), single select ignores it */
    maxSelection: Signal<number>;

    /**
     * true -> the typed text can be picked as a value of its own, from a 'Use "…"' row
     * at the bottom of the panel. Its KEY is the text itself, so the value can hold
     * both server ids and free strings - the caller's api has to be ready for that.
     */
    customValue: Signal<boolean>;

    /** the control's own output, so state.ts can fire it from the row's trailing icon */
    customAdd: OutputEmitterRef<FormFieldAutosuggestCustomAddType>;

    // ── rendering
    template: Signal<FormFieldAutosuggestTemplateType>;
    option: Signal<FormFieldAutosuggestOptionType>;
    optionDefault: Signal<Record<string | number, any>>;

    /** the NATIVE input element - used to write a late label in when the value was a cold key */
    inputEl: Signal<ElementRef<HTMLInputElement> | undefined>;

    /** the autocomplete trigger, used to open the panel for the group picker */
    triggerEl: Signal<MatAutocompleteTrigger | undefined>;

    /**
     * the caller's [error] flag. Not read for its OWN display - the template reads
     * error() straight for that - only so state.ts can drive mat-chip-grid's error
     * state by hand. See chipGrid below for why that has to happen manually.
     */
    error: Signal<string>;

    /** The caller's explicit disabled state. */
    disabled: Signal<boolean>;

    /**
     * multiselect only: the live mat-chip-grid instance.
     *
     * mat-chip-grid only calls its own updateErrorState() from ngDoCheck(), and only
     * `if (this.ngControl)` - and it cannot safely be GIVEN one: MatChipGrid.disabled
     * reads `this.ngControl ? this.ngControl.disabled : this._disabled`, so a standalone
     * ngModel attached only to fake an NgControl (the trick the single-select box and
     * <mat-select> use for the same problem) would silently override the real
     * [disabled] input the moment one exists. updateErrorState() is called directly
     * instead, with no ngControl at all - see state.ts.
     */
    chipGrid: Signal<MatChipGrid | undefined>;
}

/** one normalized row, key already parsed back to its own type */
export interface FormFieldAutosuggestEntryType {
    key: any;
    item: any;
}

/** one normalized group, rows already normalized and their labels already learned */
export interface FormFieldAutosuggestGroupEntryType {
    key: any;
    item: FormFieldAutosuggestOptionGroupItemType;
    option: FormFieldAutosuggestEntryType[];
}
