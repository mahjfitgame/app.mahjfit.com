// file: src/app/base/form-fields/select/component.ts
import { Component, ElementRef, inject, input, model, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldSelectService } from '@base/form-fields/select/service';
import { FormFieldSelectState } from '@base/form-fields/select/state';
import {
    FormFieldSelectOptionSourceType,
    FormFieldSelectOptionType,
    FormFieldSelectTemplateType,
} from '@base/form-fields/select/type';
import type { FormFieldOptionLoaderType } from '@base/form-fields/type';

@Component({
    selector: 'app-form-field-select',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        FormsModule,
        TranslocoModule,
        MatFormFieldModule,
        // exports MatOptionModule -> mat-option + mat-optgroup come with it
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatChipsModule,
    ],
    providers: [
        // service injects state, so both are provided here and both die with the field
        FormFieldSelectState,
        FormFieldSelectService,
    ],
})
export class FormFieldSelectComponent {
    /**
     * This class declares ONLY what the framework will not let state.ts hold: input(),
     * model() and viewChild() have to sit on the component. Every computed(), every
     * effect() and every other signal lives there, and reaches these through bind() in
     * the constructor.
     *
     * service.state is how the template reads state, matching every other module here.
     */
    public readonly service = inject(FormFieldSelectService);

    // ████ VALUE █████████████████████████████████████████████████████████
    /**
     * the KEY, never the text. Single select holds one; [multiselect] holds an array of
     * them. Two-way, so the parent's own property follows a pick.
     */
    public readonly value = model<any>(null);
    public readonly dependentFieldValue = input<any>(null);
    public readonly disabledByDependency = input<boolean>(false);

    // ████ OPTIONS ███████████████████████████████████████████████████████
    /**
     * the whole option list, held by the field. An array, a key => label bag, a grouped
     * bag or a Map - told apart by shape. This is the difference from AUTOSUGGEST, whose
     * rows are fetched while the user types.
     */
    public readonly option = model<FormFieldSelectOptionType>(null);

    /** Optional full-list loader; state owns the resource built from it. */
    public readonly optionLoader = input<
        FormFieldOptionLoaderType<FormFieldSelectOptionSourceType> | null
    >(null);

    /**
     * the 'Any' / 'None' row above the options, and a second label seed.
     *
     * Only its FIRST entry becomes a row. Single select only - see state.defaultOption.
     */
    public readonly optionDefault = input<Record<string | number, any>>({});

    /**
     * OPTIONAL, unlike AUTOSUGGEST where it is the only renderer: a field declaring none
     * keeps the plain "{{ label | transloco }}" row.
     */
    public readonly template = input<FormFieldSelectTemplateType | null>(null);

    // ████ MODE ██████████████████████████████████████████████████████████
    /** true -> the value becomes any[] and the panel gets checkboxes */
    public readonly multiselect = input<boolean>(false);

    /**
     * how many keys [multiselect] may hold. Ignored entirely in single select.
     *
     * 0 = no limit, and that is the default: [multiselect] on its own means "pick as many
     * as you like", and a field that needs a ceiling names it. Setting one also takes the
     * All row away - see state.showAllRow.
     */
    public readonly maxSelection = input<number>(0);

    /** the All / Deselect row at the top of a multiselect panel */
    public readonly selectAll = input<boolean>(true);

    /**
     * multiselect trigger: removable chips instead of a "n selected" count.
     *
     * Off by default, which is what CRUD's inline block has always drawn. On, it reads
     * like the autosuggest's chip grid.
     */
    public readonly chips = input<boolean>(false);

    /** a filter box pinned at the top of the open panel */
    public readonly searchable = input<boolean>(false);

    // ████ CHROME ████████████████████████████████████████████████████████
    /**
     * Already translated, all of them. The caller pipes through transloco - a field
     * object holds i18n KEYS, a hand-written form holds literals, and the control should
     * not have to know which. Its OWN strings (search, all, deselect, no match, clear) go
     * through transloco in the template, and so do the OPTION LABELS, which are i18n keys
     * in every CRUD field. A literal survives that untouched.
     */
    public readonly name = input<string>('');
    /** id forwarded to the rendered control; falls back to name when omitted */
    public readonly inputId = input<string>('');
    public readonly label = input<string>('');
    public readonly placeholder = input<string>('');
    public readonly hint = input<string>('');
    public readonly error = input<string>('');
    public readonly iconPrepend = input<string>('');
    public readonly iconAppend = input<string>('');
    public readonly required = input<boolean>(false);
    public readonly disabled = input<boolean>(false);
    public readonly clearable = input<boolean>(true);

    // ████ VIEW ██████████████████████████████████████████████████████████
    /** state.focusSearch puts the caret here when the panel opens */
    private readonly searchEl = viewChild<ElementRef<HTMLInputElement>>('AppFormFieldSelectSearch');

    /**
     * What makes [error] visible at all.
     *
     * mat-form-field renders <mat-error> only while its control reports errorState
     * (_form-field-chunk.mjs:894 - `_errorChildren.length > 0 && _control.errorState`),
     * and a <mat-select> with no NgControl behind it reports false for ever. So without
     * this the error string is projected into a slot that is never switched on.
     *
     * mat-select only re-asks the matcher while it HAS an NgControl (select.mjs:331 -
     * `if (ngControl) { … this.updateErrorState(); }`), which is why the template binds a
     * standalone [ngModel] rather than a plain [value]: that is what puts an NgControl
     * behind it. Nothing else about the value flow changes - (selectionChange) is still
     * what writes, and standalone keeps the field out of any parent <form>, exactly as
     * the autosuggest does for the same reason.
     *
     * The matcher then answers with the CALLER's flag rather than a form control's
     * validity, which is the point: the validity lives in the caller's form and this
     * control is only being told the verdict.
     */
    public readonly errorMatcher: ErrorStateMatcher = { isErrorState: () => !!this.error() };

    constructor() {
        /**
         * Inputs are not readable while state.ts initialises its fields, so it gets the
         * signals themselves rather than their values - everything stays live, and every
         * lambda in there runs after this point.
         */
        this.service.state.bind({
            value: this.value,

            option: this.option,
            optionLoader: this.optionLoader,
            dependentFieldValue: this.dependentFieldValue,
            disabledByDependency: this.disabledByDependency,
            optionDefault: this.optionDefault,
            template: this.template,

            multiselect: this.multiselect,
            maxSelection: this.maxSelection,
            selectAll: this.selectAll,
            chips: this.chips,
            searchable: this.searchable,

            searchEl: this.searchEl,
        });
    }
}
