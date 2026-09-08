// file: src/app/base/form-fields/number/state.ts
import { computed, Service, signal } from '@angular/core';
import { FormFieldNumberConfigType } from '@base/form-fields/number/type';

/**
 * Every signal and computed of this control. Injected by service.ts, which is what
 * the component and the template talk to - so nothing in here injects the service back.
 *
 * Provided by the component -> one per rendered field, destroyed with it.
 */
@Service({ autoProvided: false })
export class FormFieldNumberState {

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _config = signal<FormFieldNumberConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    // ████ COMPUTED PROPERTIES █████████████████████████████████████████

    /** what the <input> is given as its [value]. '' and not null - it holds no null */
    public readonly renderValue = computed<number | string>(() => this.config()?.value() ?? '');

    /**
     * is there anything to clear?
     *
     * ⚠ NOT a truthiness test: 0 is a perfectly ordinary value here, and a truthy check
     * would hide the clear button on it exactly when there is something to clear.
     */
    public readonly hasValue = computed<boolean>(() => {
        const value = this.config()?.value();

        return value !== null && value !== undefined;
    });

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /** called once, from the component's constructor */
    public bind(config: FormFieldNumberConfigType): void {
        this._config.set(config);
    }

    public setValue(next: number | null): void {
        this.config()?.value.set(next);
    }

    public clear(): void {
        this.config()?.value.set(null);
    }
}
