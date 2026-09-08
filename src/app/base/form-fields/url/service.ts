// file: src/app/base/form-fields/url/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldUrlState } from '@base/form-fields/url/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldUrlService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldUrlState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    public onInput(value: string): void {
        this.state.setValue(value);
    }

    public onClear(event: Event): void {
        event.stopPropagation();

        this.state.clear();
    }
}
