import { Signal, WritableSignal } from '@angular/core';
import type {
    OwlDateTimeInputDirective,
    PickerType,
    SelectMode,
} from '@danielmoncada/angular-datetime-picker';
import { FormFieldDatetimeModeEnum } from '@base/form-fields/datetime/enum';

export type FormFieldDatetimeValueType = Date | string | number | null;

export type FormFieldDatetimeFilterType = (date: Date | null) => boolean;

export interface FormFieldDatetimeEventType {
    source: OwlDateTimeInputDirective<Date>;
    value: Date | Array<Date | null> | null;
    input: HTMLInputElement;
}

/** Internal live values used by the datetime state. */
export interface FormFieldDatetimeConfigType {
    value: WritableSignal<FormFieldDatetimeValueType>;
    rangeEndValue: WritableSignal<FormFieldDatetimeValueType>;
    mode: Signal<FormFieldDatetimeModeEnum>;
    min: Signal<FormFieldDatetimeValueType>;
    max: Signal<FormFieldDatetimeValueType>;
    startAt: Signal<FormFieldDatetimeValueType>;
    endAt: Signal<FormFieldDatetimeValueType>;
}

export interface FormFieldDatetimeModeConfigType {
    pickerType: PickerType;
    selectMode: SelectMode;
    triggerIcon: string;
}
