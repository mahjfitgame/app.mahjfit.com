// file: src/app/base/form-fields/color/type.ts
import { WritableSignal } from '@angular/core';

/**
 * █ INTERNAL ██████████████████████████████████████████████████████████
 * The component's whole input surface, handed to state.ts once from its constructor.
 * Accessors, not values, so everything stays live.
 */
export interface FormFieldColorConfigType {
    /** the typed/picked text - not always a clean hex string, see state.renderValue */
    value: WritableSignal<string | null>;
}
