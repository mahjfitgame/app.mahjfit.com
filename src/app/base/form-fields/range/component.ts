// file: src/app/base/form-fields/range/component.ts
import { Component, inject, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { FormFieldRangeService } from '@base/form-fields/range/service';
import { FormFieldRangeState } from '@base/form-fields/range/state';

@Component({
    selector: 'app-form-field-range',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        MatFormFieldModule,
        MatIconModule,
        MatSliderModule,
    ],
    providers: [
        FormFieldRangeState,
        FormFieldRangeService,
    ],
})
export class FormFieldRangeComponent {
    public readonly service = inject(FormFieldRangeService);

    public readonly fromValue = model<number | null>(null);
    public readonly toValue = model<number | null>(null);
    public readonly dependentFieldValue = input<any>(null);

    public readonly min = input<number>(0);
    public readonly max = input<number>(100);
    public readonly step = input<number>(1);

    public readonly fromName = input<string>('');
    public readonly fromInputId = input<string>('');
    public readonly toName = input<string>('');
    public readonly toInputId = input<string>('');
    public readonly label = input<string>('');
    public readonly hint = input<string>('');
    public readonly error = input<string>('');
    public readonly iconPrepend = input<string>('');
    public readonly iconAppend = input<string>('');
    public readonly disabled = input<boolean>(false);

    constructor() {
        this.service.state.bind({
            fromValue: this.fromValue,
            toValue: this.toValue,
            min: this.min,
            max: this.max,
        });
    }
}
