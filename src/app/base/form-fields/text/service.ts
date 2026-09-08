// file: src/app/base/form-fields/text/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldTextState } from '@base/form-fields/text/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldTextService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldTextState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    /** every keystroke. (input) and not (change) - the field updates live, as it always has */
    public onInput(value: string): void {
        this.state.setValue(value);
    }

    /** the clear button. It sits inside the field's own suffix, so the click stops here */
    public onClear(event: Event): void {
        event.stopPropagation();

        this.state.clear();
    }
}
