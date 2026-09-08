// file: src/app/base/form-fields/checkbox/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldCheckboxState } from '@base/form-fields/checkbox/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldCheckboxService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldCheckboxState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    /** one row flipped. (change) hands back MatCheckboxChange - only .checked matters */
    public onToggle(key: any, checked: boolean): void {
        this.state.toggle(key, checked);
    }

    /** the header row: every real option, or none of them */
    public onToggleAll(): void {
        this.state.toggleAll();
    }
}
