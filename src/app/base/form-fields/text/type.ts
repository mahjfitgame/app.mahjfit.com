// file: src/app/base/form-fields/text/type.ts
import { WritableSignal } from '@angular/core';

/**
 * █ INTERNAL ██████████████████████████████████████████████████████████
 * The component's whole input surface, handed to state.ts once from its constructor.
 * Accessors, not values, so everything stays live.
 */
export interface FormFieldTextConfigType {
    /** the typed text. Writable: clear() resets it to null */
    value: WritableSignal<string | null>;
}
