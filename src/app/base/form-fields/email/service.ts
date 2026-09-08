// file: src/app/base/form-fields/email/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldEmailState } from '@base/form-fields/email/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldEmailService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldEmailState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    public onInput(value: string): void {
        this.state.setValue(value);
    }

    public onClear(event: Event): void {
        event.stopPropagation();

        this.state.clear();
    }
}
