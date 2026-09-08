// file: src/app/base/form-fields/checkbox/component.ts
import { Component, inject, input, model } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldCheckboxService } from '@base/form-fields/checkbox/service';
import { FormFieldCheckboxState } from '@base/form-fields/checkbox/state';
import {
    FormFieldCheckboxOptionSourceType,
    FormFieldCheckboxOptionType,
    FormFieldCheckboxTemplateType,
} from '@base/form-fields/checkbox/type';
import type { FormFieldOptionLoaderType } from '@base/form-fields/type';

@Component({
    selector: 'app-form-field-checkbox',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        TranslocoModule,
        // for <mat-label> ALONE - this control draws no <mat-form-field>, same as RADIO
        MatFormFieldModule,
        MatCheckboxModule,
        MatIconModule,
    ],
    providers: [
        // service injects state, so both are provided here and both die with the field
        FormFieldCheckboxState,
        FormFieldCheckboxService,
    ],
})
export class FormFieldCheckboxComponent {
    /**
     * This class declares ONLY what the framework will not let state.ts hold: input()
     * and model() have to sit on the component. Every computed() lives there, and
     * reaches these through bind() in the constructor.
     */
    public readonly service = inject(FormFieldCheckboxService);

    // ████ VALUE █████████████████████████████████████████████████████████
    /** the picked KEYS. Always an array - a checkbox group holds many by definition */
    public readonly value = model<any[]>([]);
    public readonly dependentFieldValue = input<any>(null);
    public readonly disabledByDependency = input<boolean>(false);

    // ████ OPTIONS ███████████████████████████████████████████████████████
    /** the whole option list, held by the field. Array, bag, grouped bag, Map, or a signal */
    public readonly option = model<FormFieldCheckboxOptionType>(null);
    public readonly optionLoader = input<
        FormFieldOptionLoaderType<FormFieldCheckboxOptionSourceType> | null
    >(null);

    /** a single extra row above the options. Only its FIRST entry becomes a row */
    public readonly optionDefault = input<Record<string | number, any>>({});

    /** OPTIONAL: a field declaring none keeps the plain "{{ label | transloco }}" row */
    public readonly template = input<FormFieldCheckboxTemplateType | null>(null);

    // ████ MODE ██████████████████████████████████████████████████████████
    /** the All / Deselect row at the top of the grid, with its (n/total) count */
    public readonly selectAll = input<boolean>(true);

    /** how many keys the field may hold, 0 meaning no limit. Also hides the All row */
    public readonly maxSelection = input<number>(0);

    // ████ LAYOUT ████████████████████████████████████████████████████████
    /** how many rows sit side by side. 2 is what CRUD has always drawn */
    public readonly columns = input<number>(2);

    public readonly name = input<string>('');
    public readonly inputId = input<string>('');
    public readonly label = input<string>('');
    public readonly hint = input<string>('');
    public readonly error = input<string>('');
    public readonly iconPrepend = input<string>('');
    public readonly iconAppend = input<string>('');
    public readonly required = input<boolean>(false);
    public readonly disabled = input<boolean>(false);

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

            selectAll: this.selectAll,
            maxSelection: this.maxSelection,
        });
    }
}
