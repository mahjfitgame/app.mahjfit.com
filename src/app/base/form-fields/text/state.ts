// file: src/app/base/form-fields/text/state.ts
import { computed, Service, signal } from '@angular/core';
import { FormFieldTextConfigType } from '@base/form-fields/text/type';

/**
 * Every signal and computed of this control. Injected by service.ts, which is what
 * the component and the template talk to - so nothing in here injects the service back.
 *
 * Provided by the component -> one per rendered field, destroyed with it.
 */
@Service({ autoProvided: false })
export class FormFieldTextState {

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    /**
     * The component's inputs, set once by bind() from its constructor.
     *
     * A signal and not a plain field: every computed below reads it, and a computed that
     * happened to run before bind() would otherwise cache its null answer forever.
     */
    private readonly _config = signal<FormFieldTextConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    // ████ COMPUTED PROPERTIES █████████████████████████████████████████

    /** what the <input> is given as its [value]. '' and not null - an <input> holds no null */
    public readonly renderValue = computed<string>(() => this.config()?.value() ?? '');

    /** is there anything to clear? What the clear button and the char counter key off */
    public readonly hasValue = computed<boolean>(() => !!this.config()?.value());

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /** called once, from the component's constructor */
    public bind(config: FormFieldTextConfigType): void {
        this._config.set(config);
    }

    /** every keystroke, straight through - clearing by hand leaves '', not null */
    public setValue(next: string): void {
        this.config()?.value.set(next);
    }

    /** the clear button only */
    public clear(): void {
        this.config()?.value.set(null);
    }
}
