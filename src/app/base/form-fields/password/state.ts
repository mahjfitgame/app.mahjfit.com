// file: src/app/base/form-fields/password/state.ts
import { computed, Service, signal } from '@angular/core';
import { FormFieldPasswordConfigType } from '@base/form-fields/password/type';

/**
 * Every signal and computed of this control. Injected by service.ts, which is what
 * the component and the template talk to - so nothing in here injects the service back.
 *
 * Provided by the component -> one per rendered field, destroyed with it. [revealed]
 * lives here rather than in a Set<fkey> on some shared service - each rendered field
 * gets its own state instance, so per-field reveal state comes for free and needs no
 * key of its own the way CRUD's inline block needed one.
 */
@Service({ autoProvided: false })
export class FormFieldPasswordState {

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _config = signal<FormFieldPasswordConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    /** show the text in plain sight? UI-only - never written back to [value] */
    public readonly revealed = signal<boolean>(false);

    // ████ COMPUTED PROPERTIES █████████████████████████████████████████

    /** what the <input> is given as its [value]. '' and not null - it holds no null */
    public readonly renderValue = computed<string>(() => this.config()?.value() ?? '');

    /** is there anything to clear? What the clear button and the reveal button key off */
    public readonly hasValue = computed<boolean>(() => !!this.config()?.value());

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /** called once, from the component's constructor */
    public bind(config: FormFieldPasswordConfigType): void {
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

    public toggleReveal(): void {
        this.revealed.set(!this.revealed());
    }
}
