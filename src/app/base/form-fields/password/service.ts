// file: src/app/base/form-fields/password/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldPasswordState } from '@base/form-fields/password/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldPasswordService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldPasswordState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    public onInput(value: string): void {
        this.state.setValue(value);
    }

    public onClear(event: Event): void {
        event.stopPropagation();

        this.state.clear();
    }

    /** the eye icon. It sits inside the field's own suffix, so the click stops here */
    public onToggleReveal(event: Event): void {
        event.stopPropagation();

        this.state.toggleReveal();
    }
}
