// file: src/app/base/form-fields/slider/component.ts
import { Component, inject, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldSliderService } from '@base/form-fields/slider/service';
import { FormFieldSliderState } from '@base/form-fields/slider/state';

@Component({
    selector: 'app-form-field-slider',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        TranslocoModule,
        // for <mat-label> ALONE - this control draws no <mat-form-field>, the same way
        // @base/form-fields/radio does
        MatFormFieldModule,
        MatSliderModule,
        MatIconModule,
    ],
    providers: [
        FormFieldSliderState,
        FormFieldSliderService,
    ],
})
export class FormFieldSliderComponent {
    public readonly service = inject(FormFieldSliderService);

    // ████ VALUE █████████████████████████████████████████████████████████
    public readonly value = model<number | null>(null);
    public readonly dependentFieldValue = input<any>(null);

    // ████ TRACK ██████████████████████████████████████████████████████████
    public readonly min = input<number>(0);
    public readonly max = input<number>(100);
    public readonly step = input<number>(1);

    // ████ CHROME ████████████████████████████████████████████████████████
    public readonly name = input<string>('');
    public readonly inputId = input<string>('');
    public readonly label = input<string>('');
    public readonly hint = input<string>('');
    public readonly error = input<string>('');
    public readonly iconPrepend = input<string>('');
    public readonly iconAppend = input<string>('');
    public readonly disabled = input<boolean>(false);

    constructor() {
        this.service.state.bind({
            value: this.value,
            min: this.min,
        });
    }
}
