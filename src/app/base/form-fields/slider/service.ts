// file: src/app/base/form-fields/slider/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldSliderState } from '@base/form-fields/slider/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldSliderService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldSliderState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    /** (valueChange) off matSliderThumb - already a parsed number, nothing left to guard */
    public onChange(value: number): void {
        this.state.setValue(value);
    }
}
