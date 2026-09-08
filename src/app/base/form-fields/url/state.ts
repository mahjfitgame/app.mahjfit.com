// file: src/app/base/form-fields/url/state.ts
import { computed, Service, signal } from '@angular/core';
import { FormFieldUrlConfigType } from '@base/form-fields/url/type';

/**
 * Every signal and computed of this control. Injected by service.ts, which is what
 * the component and the template talk to - so nothing in here injects the service back.
 *
 * Provided by the component -> one per rendered field, destroyed with it.
 */
@Service({ autoProvided: false })
export class FormFieldUrlState {

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _config = signal<FormFieldUrlConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    // ████ COMPUTED PROPERTIES █████████████████████████████████████████

    /** what the <input> is given as its [value]. '' and not null - it holds no null */
    public readonly renderValue = computed<string>(() => this.config()?.value() ?? '');

    /** is there anything to clear / open? What the clear button and the open-link anchor key off */
    public readonly hasValue = computed<boolean>(() => !!this.config()?.value());

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /** called once, from the component's constructor */
    public bind(config: FormFieldUrlConfigType): void {
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
