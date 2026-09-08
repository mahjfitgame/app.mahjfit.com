// file: src/app/base/form-fields/tel/component.ts
import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldTelService } from '@base/form-fields/tel/service';
import { FormFieldTelState } from '@base/form-fields/tel/state';

@Component({
    selector: 'app-form-field-tel',
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
        FormFieldTelState,
        FormFieldTelService,
    ],
})
export class FormFieldTelComponent {
    public readonly service = inject(FormFieldTelService);

    // ████ VALUE █████████████████████████████████████████████████████████
    public readonly value = model<string | null>(null);
    public readonly dependentFieldValue = input<any>(null);

    // ████ VALIDATION ████████████████████████████████████████████████████
    public readonly minLength = input<number | null>(null);
    public readonly maxLength = input<number | null>(null);
    /** forwarded straight to [attr.pattern] - the only one of these six that uses it */
    public readonly pattern = input<string | null>(null);

    // ████ CHROME ████████████████████████████████████████████████████████
    public readonly name = input<string>('');
    public readonly inputId = input<string>('');
    public readonly label = input<string>('');
    public readonly placeholder = input<string>('');
    public readonly hint = input<string>('');
    public readonly error = input<string>('');
    public readonly iconPrepend = input<string>('');
    /** 'call' when unset - the fallback lives in the template, not here */
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
