// file: src/app/base/form-fields/textarea/component.ts
import { Component, inject, input, model } from '@angular/core';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldTextareaService } from '@base/form-fields/textarea/service';
import { FormFieldTextareaState } from '@base/form-fields/textarea/state';

@Component({
    selector: 'app-form-field-textarea',
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
        TextFieldModule,
    ],
    providers: [
        FormFieldTextareaState,
        FormFieldTextareaService,
    ],
})
export class FormFieldTextareaComponent {
    public readonly service = inject(FormFieldTextareaService);

    // ████ VALUE █████████████████████████████████████████████████████████
    public readonly value = model<string | null>(null);
    public readonly dependentFieldValue = input<any>(null);

    // ████ VALIDATION ████████████████████████████████████████████████████
    public readonly minLength = input<number | null>(null);
    /** also drives the "n / max" counter hint under the field */
    public readonly maxLength = input<number | null>(null);

    // ████ LAYOUT █████████████████████████████████████████████████████████
    /** cdkAutosizeMinRows - matches what CRUD's inline block always drew */
    public readonly minRows = input<number>(3);
    public readonly maxRows = input<number>(8);

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

    /**
     * @see @base/form-fields/text/component.ts - MatInput needs an NgControl before it
     * will ever call updateErrorState() at all, hence template.html's standalone
     * [ngModel]; this matcher is what makes it answer with OUR [error] flag.
     */
    public readonly errorMatcher: ErrorStateMatcher = { isErrorState: () => !!this.error() };

    constructor() {
        this.service.state.bind({
            value: this.value,
        });
    }
}
