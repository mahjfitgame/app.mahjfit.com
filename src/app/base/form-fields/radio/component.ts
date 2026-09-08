// file: src/app/base/form-fields/radio/component.ts
import { Component, inject, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldRadioService } from '@base/form-fields/radio/service';
import { FormFieldRadioState } from '@base/form-fields/radio/state';
import {
    FormFieldRadioOptionSourceType,
    FormFieldRadioOptionType,
    FormFieldRadioTemplateType,
} from '@base/form-fields/radio/type';
import type { FormFieldOptionLoaderType } from '@base/form-fields/type';

@Component({
    selector: 'app-form-field-radio',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        TranslocoModule,
        // for <mat-label> ALONE - this control draws no <mat-form-field>, the same way
        // CRUD's inline RADIO / CHECKBOX blocks use it today
        MatFormFieldModule,
        MatRadioModule,
        MatButtonModule,
        MatIconModule,
    ],
    providers: [
        // service injects state, so both are provided here and both die with the field
        FormFieldRadioState,
        FormFieldRadioService,
    ],
})
export class FormFieldRadioComponent {
    /**
     * This class declares ONLY what the framework will not let state.ts hold: input()
     * and model() have to sit on the component. Every computed() lives there, and
     * reaches these through bind() in the constructor.
     *
     * service.state is how the template reads state, matching every other module here.
     */
    public readonly service = inject(FormFieldRadioService);

    // ████ VALUE █████████████████████████████████████████████████████████
    /**
     * the KEY, never the text. One key, always: a radio group is single by definition -
     * a field wanting many says so with its TYPE and gets CHECKBOX or MULTISELECT.
     */
    public readonly value = model<any>(null);
    public readonly dependentFieldValue = input<any>(null);
    public readonly disabledByDependency = input<boolean>(false);

    // ████ OPTIONS ███████████████████████████████████████████████████████
    /** the whole option list, held by the field. Array, bag, grouped bag, Map, or a signal */
    public readonly option = model<FormFieldRadioOptionType>(null);
    public readonly optionLoader = input<
        FormFieldOptionLoaderType<FormFieldRadioOptionSourceType> | null
    >(null);

    /** the 'Any' / 'None' row above the options. Only its FIRST entry becomes a row */
    public readonly optionDefault = input<Record<string | number, any>>({});

    /** OPTIONAL: a field declaring none keeps the plain "{{ label | transloco }}" row */
    public readonly template = input<FormFieldRadioTemplateType | null>(null);

    // ████ LAYOUT ████████████████████████████████████████████████████████
    /** how many rows sit side by side. 2 is what CRUD has always drawn */
    public readonly columns = input<number>(2);

    public readonly name = input<string>('');
    /** id forwarded to the group element; falls back to name when omitted */
    public readonly inputId = input<string>('');
    public readonly label = input<string>('');
    public readonly hint = input<string>('');
    public readonly error = input<string>('');
    public readonly iconPrepend = input<string>('');
    public readonly iconAppend = input<string>('');
    public readonly required = input<boolean>(false);
    public readonly disabled = input<boolean>(false);

    /**
     * a radio cannot unpick itself, so OFF by default: an [optionDefault] 'Any' row is
     * the idiom for "no choice", and a × next to it would be two ways to say one thing.
     */
    public readonly clearable = input<boolean>(false);

    constructor() {
        /**
         * Inputs are not readable while state.ts initialises its fields, so it gets the
         * signals themselves rather than their values - everything stays live.
         */
        this.service.state.bind({
            value: this.value,

            option: this.option,
            optionLoader: this.optionLoader,
            dependentFieldValue: this.dependentFieldValue,
            disabledByDependency: this.disabledByDependency,
            optionDefault: this.optionDefault,
        });
    }
}
