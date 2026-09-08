// file: src/app/base/form-fields/radio/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldRadioState } from '@base/form-fields/radio/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module in this repo is
 * layered.
 *
 * Everything reactive lives in state.ts. What is left here is the handlers the template
 * fires - two, because a radio does one thing.
 */
@Service({ autoProvided: false })
export class FormFieldRadioService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldRadioState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    /** a row was picked. (change) hands back MatRadioChange - only its value matters */
    public onChange(value: any): void {
        this.state.setValue(value);
    }

    /** the clear button. It sits inside the header row, so the click stops here */
    public onClear(event: Event): void {
        event.stopPropagation();

        this.state.clear();
    }
}
