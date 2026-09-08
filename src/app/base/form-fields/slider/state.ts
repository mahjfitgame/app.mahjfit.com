// file: src/app/base/form-fields/slider/state.ts
import { computed, Service, signal } from '@angular/core';
import { FormFieldSliderConfigType } from '@base/form-fields/slider/type';

/**
 * Every signal and computed of this control. Injected by service.ts, which is what
 * the component and the template talk to - so nothing in here injects the service back.
 *
 * Provided by the component -> one per rendered field, destroyed with it.
 */
@Service({ autoProvided: false })
export class FormFieldSliderState {

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _config = signal<FormFieldSliderConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    // ████ COMPUTED PROPERTIES █████████████████████████████████████████

    /**
     * what <input matSliderThumb> is given as its [value]. matSliderThumb reads this
     * through Angular's numberAttribute - it wants an actual number, never '' the way
     * NUMBER's plain <input> does - so a null value falls back to the track's own floor.
     */
    public readonly renderValue = computed<number>(
        () => this.config()?.value() ?? this.config()?.min() ?? 0,
    );

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /** called once, from the component's constructor */
    public bind(config: FormFieldSliderConfigType): void {
        this._config.set(config);
    }

    public setValue(next: number): void {
        this.config()?.value.set(next);
    }
}
