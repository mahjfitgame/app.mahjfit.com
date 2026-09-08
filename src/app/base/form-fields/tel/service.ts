// file: src/app/base/form-fields/tel/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldTelState } from '@base/form-fields/tel/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldTelService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldTelState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    public onInput(value: string): void {
        this.state.setValue(value);
    }

    public onClear(event: Event): void {
        event.stopPropagation();

        this.state.clear();
    }
}
