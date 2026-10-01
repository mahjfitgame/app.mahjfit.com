// file: src/app/base/form-fields/file/regular/state.ts
import { computed, Service, signal } from '@angular/core';
import { FormFieldFileRegularConfigType } from '@base/form-fields/file/regular/type';

/**
 * Every signal and computed of this control. Injected by service.ts, which is what
 * the component and the template talk to - so nothing in here injects the service back.
 *
 * Provided by the component -> one per rendered field, destroyed with it.
 */
@Service({ autoProvided: false })
export class FormFieldFileRegularState {

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    /**
     * The component's inputs, set once by bind() from its constructor.
     *
     * A signal and not a plain field: every computed below reads it, and a computed that
     * happened to run before bind() would otherwise cache its null answer forever.
     */
    private readonly _config = signal<FormFieldFileRegularConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    // ████ COMPUTED PROPERTIES █████████████████████████████████████████

    /**
     * flattened to an array regardless of single/multiple, so the template
     * stays simple - a string (the persisted filename of an untouched
     * existing upload) is not a picked File, so it flattens to empty here.
     */
    public readonly files = computed<File[]>(() => {
        const value = this.config()?.value() ?? null;
        if (!value || typeof value === 'string') return [];

        const list = Array.isArray(value) ? value : [value];
        return list.filter((item): item is File => item instanceof File);
    });

    /** is there anything picked? What the clear button and the file list key off */
    public readonly hasValue = computed<boolean>(() => this.files().length > 0);

    /** what the readonly display input shows - comma-joined names, or '' when empty */
    public readonly fileNamesLabel = computed<string>(() => this.files().map((f) => f.name).join(', '));

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /** called once, from the component's constructor */
    public bind(config: FormFieldFileRegularConfigType): void {
        this._config.set(config);
    }

    /** the native <input type="file"> change event, already resolved to File or File[] */
    public setValue(next: File | File[] | null): void {
        this.config()?.value.set(next);
    }

    /** the clear button only */
    public clear(): void {
        this.config()?.value.set(null);
    }
}
