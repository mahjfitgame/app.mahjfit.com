// file: src/app/base/form-fields/autosuggest/component.ts
import { Component, ElementRef, inject, input, model, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatChipGrid, MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldAutosuggestService } from '@base/form-fields/autosuggest/service';
import { FormFieldAutosuggestState } from '@base/form-fields/autosuggest/state';
import {
    FormFieldAutosuggestCustomAddType,
    FormFieldAutosuggestOptionLoaderType,
    FormFieldAutosuggestOptionType,
    FormFieldAutosuggestTemplateType,
    FormFieldAutosuggestValueLoaderType,
} from '@base/form-fields/autosuggest/type';

@Component({
    selector: 'app-form-field-autosuggest',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        FormsModule,
        TranslocoModule,
        MatFormFieldModule,
        MatInputModule,
        // exports MatOptionModule -> mat-option + mat-optgroup come with it
        MatAutocompleteModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatChipsModule,
        MatTooltipModule,
        MatRadioModule,
    ],
    providers: [
        // service injects state, so both are provided here and both die with the field
        FormFieldAutosuggestState,
        FormFieldAutosuggestService,
    ],
})
export class FormFieldAutosuggestComponent {
    /**
     * This class declares ONLY what the framework will not let state.ts hold:
     * input(), model() and viewChild() have to sit on the component. Every computed(),
     * every effect() and every other signal lives below, and reaches these through
     * bind() in the constructor.
     *
     * service.state is how the template reads state, matching every other module here.
     */
    public readonly service = inject(FormFieldAutosuggestService);

    // ████ VALUE █████████████████████████████████████████████████████████
    /**
     * the KEY, never the text. Two-way: mat-autocomplete writes the picked key through
     * ngModel and the parent's own property follows.
     */
    public readonly value = model<any>(null);

    // ████ MODE B - hand over the api calls, keep nothing █████████████████
    /** ({ query, abortSignal, dependentFieldValue }) => key => item */
    public readonly optionLoader = input<FormFieldAutosuggestOptionLoaderType | null>(null);

    /** (value) => key => label, for a key nothing has rendered yet */
    public readonly valueLoader = input<FormFieldAutosuggestValueLoaderType | null>(null);

    /** shorter than this and nothing is fetched */
    public readonly minLength = input<number>(2);

    /** quiet time in ms before a search goes out */
    public readonly debounce = input<number>(300);

    /** Optional context supplied by a parent or otherwise related field. */
    public readonly dependentFieldValue = input<any>(null);

    // ████ RENDERING █████████████████████████████████████████████████████
    /** REQUIRED: this control has no built-in row rendering at all */
    public readonly template = input.required<FormFieldAutosuggestTemplateType>();

    /**
     * key => label seed, so a saved key can be named before any search has run.
     * Takes a SIGNAL too - see FormFieldAutosuggestOptionType for why.
     */
    public readonly option = input<FormFieldAutosuggestOptionType>({});

    /**
     * the 'Any' / 'None' row, and a second label seed.
     *
     * Its FIRST value is the only caller string this control pipes through transloco
     * itself - see the template. A literal survives that untouched.
     */
    public readonly optionDefault = input<Record<string | number, any>>({});

    /** true -> only a picked option becomes the value; false -> free text is kept */
    public readonly requireSelection = input<boolean>(true);

    /** true → chip grid with removable chips, value becomes any[] */
    public readonly multiselect = input<boolean>(false);

    /**
     * how many chips [multiselect] may hold. Ignored entirely in single select.
     *
     * 0 = no limit, and that is the default: [multiselect] on its own means "pick as
     * many as you like", and a field that needs a ceiling names it.
     */
    public readonly maxSelection = input<number>(0);

    /**
     * true → the user's own text can become a value, from a 'Use "…"' row at the bottom
     * of the panel. With no matches that row is the only one, so it is auto-highlighted
     * and a plain Enter commits; with matches above it, one arrow down reaches it.
     */
    public readonly customValue = input<boolean>(false);

    /**
     * the trailing icon on a custom row was clicked - the caller's chance to save what
     * was typed. The event carries keep(), which files the saved record in the panel.
     */
    public readonly customAdd = output<FormFieldAutosuggestCustomAddType>();

    /**
     * Already translated, all of them. The caller pipes through transloco - a field
     * object holds i18n KEYS, a hand-written form holds literals, and the control
     * should not have to know which. Its OWN strings (loading, no match, retry, clear)
     * go through transloco in the template.
     */
    public readonly name = input<string>('');
    /** id forwarded to the rendered input; falls back to name when omitted */
    public readonly inputId = input<string>('');
    public readonly label = input<string>('');
    public readonly placeholder = input<string>('');
    public readonly hint = input<string>('');
    public readonly error = input<string>('');
    public readonly iconPrepend = input<string>('');
    public readonly iconAppend = input<string>('');
    public readonly required = input<boolean>(false);
    public readonly disabled = input<boolean>(false);

    // ████ VIEW ██████████████████████████████████████████████████████████
    /** state.repaint writes a late label straight into this box */
    private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('AppFormFieldAutosuggestInput');

    /** state opens the panel for group picker */
    private readonly triggerEl = viewChild('AppFormFieldAutosuggestInput', { read: MatAutocompleteTrigger });

    /** multiselect only: state.ts drives its errorState by hand - see type.ts */
    private readonly chipGrid = viewChild('chipGrid', { read: MatChipGrid });

    /**
     * MatInput's ngDoCheck only calls updateErrorState() `if (this.ngControl)` - so the
     * single-select box's standalone [ngModel] (see template.html) exists purely to give
     * it an NgControl to ask, the same trick @base/form-fields/text/component.ts uses.
     * This matcher then answers with the CALLER's own [error] flag rather than that
     * dummy control's own (always-valid) state, which is the actual point.
     *
     * mat-chip-grid cannot use the same trick - see chipGrid above - so state.ts drives
     * its error state by calling updateErrorState() directly, matcher included.
     */
    public readonly errorMatcher: ErrorStateMatcher = { isErrorState: () => !!this.error() };

    constructor() {
        /**
         * Inputs are not readable while state.ts initialises its fields, so it gets the
         * signals themselves rather than their values - everything stays live, and
         * every lambda in there runs after this point.
         */
        this.service.state.bind({
            value: this.value,

            optionLoader: this.optionLoader,
            valueLoader: this.valueLoader,
            minLength: this.minLength,
            debounce: this.debounce,
            dependentFieldValue: this.dependentFieldValue,

            requireSelection: this.requireSelection,
            multiselect: this.multiselect,
            maxSelection: this.maxSelection,
            customValue: this.customValue,
            customAdd: this.customAdd,

            template: this.template,
            option: this.option,
            optionDefault: this.optionDefault,

            inputEl: this.inputEl,
            triggerEl: this.triggerEl,

            error: this.error,
            disabled: this.disabled,
            chipGrid: this.chipGrid,
        });
    }
}
