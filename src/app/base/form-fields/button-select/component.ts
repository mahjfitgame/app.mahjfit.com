import { Component, ElementRef, inject, input, model, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
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
    selector: 'app-form-field-button-select',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        TranslocoModule,
        MatFormFieldModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
    ],
    providers: [FormFieldSelectState, FormFieldSelectService],
})
export class FormFieldButtonSelectComponent {
    public readonly service = inject(FormFieldSelectService);

    public readonly value = model<any>(null);
    public readonly dependentFieldValue = input<any>(null);
    public readonly disabledByDependency = input<boolean>(false);

    public readonly option = model<FormFieldSelectOptionType>(null);
    public readonly optionLoader = input<
        FormFieldOptionLoaderType<FormFieldSelectOptionSourceType> | null
    >(null);
    public readonly optionDefault = input<Record<string | number, any>>({});
    public readonly template = input<FormFieldSelectTemplateType | null>(null);

    public readonly multiselect = input<boolean>(false);
    public readonly maxSelection = input<number>(0);
    public readonly selectAll = input<boolean>(true);

    public readonly name = input<string>('');
    public readonly inputId = input<string>('');
    public readonly label = input<string>('');
    public readonly hint = input<string>('');
    public readonly error = input<string>('');
    public readonly iconPrepend = input<string>('');
    public readonly iconAppend = input<string>('');
    public readonly required = input<boolean>(false);
    public readonly disabled = input<boolean>(false);
    public readonly clearable = input<boolean>(true);

    private readonly chips = signal<boolean>(false);
    private readonly searchable = signal<boolean>(false);
    private readonly searchEl = signal<ElementRef<HTMLInputElement> | undefined>(undefined);

    constructor() {
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
