// file: src/app/base/form-fields/slider/type.ts
import { Signal, WritableSignal } from '@angular/core';

/**
 * █ INTERNAL ██████████████████████████████████████████████████████████
 * The component's whole input surface, handed to state.ts once from its constructor.
 * Accessors, not values, so everything stays live.
 */
export interface FormFieldSliderConfigType {
    /** the numeric value. Writable, but there is no clear() - a slider always shows a value */
    value: WritableSignal<number | null>;

    /** the floor renderValue() falls back to when [value] is null. Read-only: an input(), never written here */
    min: Signal<number>;
}
