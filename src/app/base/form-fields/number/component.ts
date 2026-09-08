// file: src/app/base/form-fields/number/component.ts
import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldNumberService } from '@base/form-fields/number/service';
import { FormFieldNumberState } from '@base/form-fields/number/state';

@Component({
    selector: 'app-form-field-number',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        FormsModule,
        TranslocoModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
    ],
    providers: [
        FormFieldNumberState,
        FormFieldNumberService,
    ],
})
export class FormFieldNumberComponent {
    public readonly service = inject(FormFieldNumberService);

    // ████ VALUE █████████████████████████████████████████████████████████
    public readonly value = model<number | null>(null);
    public readonly dependentFieldValue = input<any>(null);

    // ████ VALIDATION █████████████████████████████████████████████████████
    public readonly min = input<number | null>(null);
    public readonly max = input<number | null>(null);
    public readonly step = input<number | string>('any');

    // ████ CHROME ████████████████████████████████████████████████████████
    public readonly name = input<string>('');
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

    /** @see @base/form-fields/text/component.ts - MatInput needs an NgControl first */
    public readonly errorMatcher: ErrorStateMatcher = { isErrorState: () => !!this.error() };

    constructor() {
        this.service.state.bind({
            value: this.value,
        });
    }
}
