// file: src/app/base/form-fields/text/component.ts
import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldTextService } from '@base/form-fields/text/service';
import { FormFieldTextState } from '@base/form-fields/text/state';

@Component({
    selector: 'app-form-field-text',
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
        // service injects state, so both are provided here and both die with the field
        FormFieldTextState,
        FormFieldTextService,
    ],
})
export class FormFieldTextComponent {
    /**
     * This class declares ONLY what the framework will not let state.ts hold: input()
     * and model() have to sit on the component. Every computed() lives there, and
     * reaches these through bind() in the constructor.
     */
    public readonly service = inject(FormFieldTextService);

    // ████ VALUE █████████████████████████████████████████████████████████
    public readonly value = model<string | null>(null);
    public readonly dependentFieldValue = input<any>(null);

    // ████ VALIDATION ████████████████████████████████████████████████████
    /** forwarded as a native attribute only - HTML5 hinting, not an Angular validator */
    public readonly minLength = input<number | null>(null);
    /** also drives the "n / max" counter hint under the field */
    public readonly maxLength = input<number | null>(null);

    // ████ CHROME ████████████████████████████████████████████████████████
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

    /**
     * MatInput's ngDoCheck only calls updateErrorState() `if (this.ngControl)` - so with
     * no NgControl at all, <mat-form-field> never switches its subscript to the error
     * slot, no matter what [error] says. template.html attaches a standalone [ngModel]
     * for exactly this reason, the same trick @base/form-fields/select/component.ts uses
     * for <mat-select> - it is NOT part of the value flow (that stays [value] + (input)),
     * it exists purely to give MatInput an NgControl to ask.
     *
     * The matcher itself then answers with the CALLER's own [error] flag rather than
     * that standalone control's own (always-valid) state, which is the actual point.
     */
    public readonly errorMatcher: ErrorStateMatcher = { isErrorState: () => !!this.error() };

    constructor() {
        /**
         * Inputs are not readable while state.ts initialises its fields, so it gets the
         * signal itself rather than its value - it stays live.
         */
        this.service.state.bind({
            value: this.value,
        });
    }
}
