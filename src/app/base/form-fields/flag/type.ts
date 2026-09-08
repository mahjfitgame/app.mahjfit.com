import { Signal, WritableSignal } from '@angular/core';
import { FormFieldDatetimeModeEnum } from '@base/form-fields/datetime/enum';

/** Raw values accepted by the flag and the Owl date-time picker. */
export type FormFieldFlagValueType = Date | string | number | null;

/** Scalar date/time modes supported by a flag when it is switched on. */
export type FormFieldFlagModeType =
  | FormFieldDatetimeModeEnum.DATE
  | FormFieldDatetimeModeEnum.TIME
  | FormFieldDatetimeModeEnum.DATETIME;

/** Optional translation keys shown for the two flag states. */
export interface FormFieldFlagLabelType {
  is_null?: string;
  is_datetime?: string;
}

/** Internal live values bound to the flag state. */
export interface FormFieldFlagConfigType {
  value: WritableSignal<FormFieldFlagValueType>;
  mode: Signal<FormFieldFlagModeType>;
  flagLabel: Signal<FormFieldFlagLabelType | null>;
  clearable: Signal<boolean>;
}
