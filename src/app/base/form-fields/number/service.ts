// file: src/app/base/form-fields/number/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldNumberState } from '@base/form-fields/number/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldNumberService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldNumberState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    /**
     * Every keystroke. [value] arrives already parsed - template.html's [ngModel]
     * activates Angular's own NumberValueAccessor (type="number" + ngModel is its whole
     * selector), which turns '' into null and everything else through parseFloat().
     *
     * parseFloat can still answer NaN - '-', '.', a bare 'e' - a KEYSTROKE STILL IN
     * PROGRESS, and that is left alone: the signal does not change, so [ngModel] does
     * not write the DOM back, and the browser keeps showing exactly what was typed until
     * it resolves one way or the other.
     */
    public onInput(value: number | null): void {
        if (value !== null && Number.isNaN(value)) {
            return;
        }

        this.state.setValue(value);
    }

    public onClear(event: Event): void {
        event.stopPropagation();

        this.state.clear();
    }
}
