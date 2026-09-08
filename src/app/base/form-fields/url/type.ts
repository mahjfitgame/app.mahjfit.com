// file: src/app/base/form-fields/url/type.ts
import { WritableSignal } from '@angular/core';

/**
 * █ INTERNAL ██████████████████████████████████████████████████████████
 * The component's whole input surface, handed to state.ts once from its constructor.
 * Accessors, not values, so everything stays live.
 */
export interface FormFieldUrlConfigType {
    /** the typed text. Writable: clear() resets it to null */
    value: WritableSignal<string | null>;
}
