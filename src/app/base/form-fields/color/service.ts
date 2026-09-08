// file: src/app/base/form-fields/color/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldColorState } from '@base/form-fields/color/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldColorService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldColorState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    /** the typeable text half, on (change) - see state.setTextValue for why */
    public onTextChange(text: string): void {
        this.state.setTextValue(text);
    }

    /** the native swatch, on (input) - it only ever hands over a clean '#rrggbb' */
    public onSwatchChange(hex: string): void {
        this.state.setSwatchValue(hex);
    }

    public onClear(event: Event): void {
        event.stopPropagation();

        this.state.clear();
    }
}
