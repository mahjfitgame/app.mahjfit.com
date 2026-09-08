// file: src/app/base/form-fields/range/type.ts
import { Signal, WritableSignal } from '@angular/core';

/** Internal live values used by the range state. */
export interface FormFieldRangeConfigType {
    fromValue: WritableSignal<number | null>;
    toValue: WritableSignal<number | null>;
    min: Signal<number>;
    max: Signal<number>;
}
