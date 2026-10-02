// file: src/app/base/form-fields/file/regular/component.ts
import { Component, inject, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldFileRegularAccessUrlType } from '@base/form-fields/file/regular/type';
import { FormFieldFileRegularService } from '@base/form-fields/file/regular/service';
import { FormFieldFileRegularState } from '@base/form-fields/file/regular/state';

@Component({
    selector: 'form-field-file-regular-component',
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
        FormFieldFileRegularState,
        FormFieldFileRegularService,
    ],
})
export class FormFieldFileRegularComponent {
    /**
     * This class declares ONLY what the framework will not let state.ts hold: input()
     * and model() have to sit on the component. Every computed() lives there, and
     * reaches these through bind() in the constructor.
     */
    public readonly service = inject(FormFieldFileRegularService);

    // ████ VALUE █████████████████████████████████████████████████████████
    public readonly value = model<File | File[] | string | null>(null);
    public readonly dependentFieldValue = input<any>(null);

    // ████ FILE ██████████████████████████████████████████████████████████
    /** adds the `multiple` attribute to the native input; value then becomes File[] */
    public readonly multiple = input<boolean>(false);
    /** true draws an <img> preview for an existing/persisted value; false draws a download link */
    public readonly isImage = input<boolean>(false);
    /** the persisted file's access-url variants, when [value] is a filename string rather than a picked File */
    public readonly fileValue = input<FormFieldFileRegularAccessUrlType | null>(null);
    /** shows a delete button next to the existing-file preview/link when true */
    public readonly canDeleteExisting = input<boolean>(false);
    public readonly uploadDelete = output<void>();

    public onUploadDeleteClick(event: Event): void {
        event.stopPropagation();
        this.uploadDelete.emit();
    }

    // ████ CHROME ████████████████████████████████████████████████████████
    public readonly name = input<string>('');
    /** id forwarded to the rendered control; falls back to name when omitted */
    public readonly inputId = input<string>('');
    public readonly label = input<string>('');
    public readonly hint = input<string>('');
    public readonly error = input<string>('');
    public readonly required = input<boolean>(false);
    public readonly disabled = input<boolean>(false);
    public readonly clearable = input<boolean>(true);

    /**
     * MatInput's ngDoCheck only calls updateErrorState() `if (this.ngControl)` - so with
     * no NgControl at all, <mat-form-field> never switches its subscript to the error
     * slot, no matter what [error] says. template.html attaches a standalone [ngModel]
     * for exactly this reason, same trick @base/form-fields/text/component.ts uses.
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
