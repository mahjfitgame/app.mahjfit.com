// file: src/app/base/form-fields/file/regular/component.ts
import { Component, inject, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';
import { FileSlideshowType } from '@base/form-fields/file/type';
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
    /**
     * The viewer's options, and its PRESENCE is the opt-in: non-null turns the
     * existing-file image preview into a <button> that opens the fullscreen
     * image-slideshow over it. null/absent leaves a plain picture.
     *
     * Taken as the OBJECT and not a boolean plus a size, so a consumer passes
     * the one thing it already holds - @base/crud's CrudFieldSlideshowType
     * aliases this very type, so `[slideshow]="finfo.slideshow ?? null"` is the
     * whole binding, with no flag to keep in step with its options.
     *
     * ⚠ no is_image guard needed: the preview this governs is already inside
     * the template's `@if (isImage())`.
     */
    public readonly slideshow = input<FileSlideshowType | null>(null);
    /** the persisted file's access-url variants, when [value] is a filename string rather than a picked File */
    public readonly fileValue = input<FormFieldFileRegularAccessUrlType | null>(null);
    /** shows a delete button next to the existing-file preview/link when true */
    public readonly canDeleteExisting = input<boolean>(false);
    public readonly uploadDelete = output<void>();

    public onUploadDeleteClick(event: Event): void {
        event.stopPropagation();
        this.uploadDelete.emit();
    }
    /**
     * Thin, same stance as onUploadDeleteClick - but it does NOT emit. Deleting
     * an upload is a SERVER mutation the host has to authorize
     * (hasUploadDelete()); opening a lightbox over a picture this field already
     * renders is local, unauthorized and side-effect free, so the field owns it
     * outright and the consumer needs no handler.
     *
     * alt is [label] and not initials: this control has no row to read a
     * monogram field off, and the field's own label describes the picture
     * better than initials would.
     */
    public onSlideshowOpenClick(event: Event): void {
        event.stopPropagation();

        const url = this.fileValue();
        if (!url) return;

        this.service.openSlideshow(this.slideshow(), {
            src: url.direct || url.thumb,
            thumb: url.thumb || url.direct,
            alt: this.label(),
        });
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
