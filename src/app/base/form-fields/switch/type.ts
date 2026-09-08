import { Signal, WritableSignal } from '@angular/core';

/** Values a switch can store. */
export type FormFieldSwitchValueType = string | number | boolean | null;

/** Stored values for each toggle position. Missing values fall back to true/false. */
export interface FormFieldSwitchOptionType {
  on?: Exclude<FormFieldSwitchValueType, null>;
  off?: Exclude<FormFieldSwitchValueType, null>;
}

/** Internal live values bound to the switch state. */
export interface FormFieldSwitchConfigType {
  value: WritableSignal<FormFieldSwitchValueType>;
  option: Signal<FormFieldSwitchOptionType | null>;
}
