// file: src/app/base/form-fields/textarea/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldTextareaState } from '@base/form-fields/textarea/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldTextareaService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldTextareaState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    public onInput(value: string): void {
        this.state.setValue(value);
    }

    public onClear(event: Event): void {
        event.stopPropagation();

        this.state.clear();
    }
}
