import { computed, inject, Service, signal } from '@angular/core';
import type { PickerType } from '@danielmoncada/angular-datetime-picker';
import {
  FormFieldFlagConfigType,
  FormFieldFlagModeType,
  FormFieldFlagValueType,
} from '@base/form-fields/flag/type';
import { FormFieldDatetimeModeEnum } from '@base/form-fields/datetime/enum';
import { DateTimeService } from '@libs/date-time/service';

@Service({ autoProvided: false })
export class FormFieldFlagState {
  private readonly dateTime = inject(DateTimeService);

  private readonly _config = signal<FormFieldFlagConfigType | null>(null);
  public readonly config = this._config.asReadonly();

  public readonly value = computed<FormFieldFlagValueType>(() => this.config()?.value() ?? null);

  public readonly mode = computed<FormFieldFlagModeType>(
    () => this.config()?.mode() ?? FormFieldDatetimeModeEnum.DATETIME,
  );

  public readonly modeConfig = computed<{ pickerType: PickerType; triggerIcon: string }>(() => {
    switch (this.mode()) {
      case FormFieldDatetimeModeEnum.DATE:
        return { pickerType: 'calendar', triggerIcon: 'today' };
      case FormFieldDatetimeModeEnum.TIME:
        return { pickerType: 'timer', triggerIcon: 'schedule' };
      default:
        return { pickerType: 'both', triggerIcon: 'calendar_clock' };
    }
  });

  public readonly displayValue = computed<string>(() => {
    const holder = { value: this.value() };

    switch (this.mode()) {
      case FormFieldDatetimeModeEnum.DATE:
        return this.dateTime.owlDateDisplayValue(holder);
      case FormFieldDatetimeModeEnum.TIME:
        return this.dateTime.owlTimeDisplayValue(holder);
      default:
        return this.dateTime.owlDateTimeDisplayValue(holder);
    }
  });

  public readonly offValue = computed<FormFieldFlagValueType>(() => {
    return null;
  });

  public readonly clearedValue = computed<FormFieldFlagValueType>(() => {
    return '';
  });

  public readonly isOn = computed<boolean>(() => {
    const value = this.config()?.value();

    return value !== null && value !== undefined && value !== this.offValue();
  });

  public readonly isCleared = computed<boolean>(
    () => this.isOn() && this.config()?.value() === this.clearedValue(),
  );

  public readonly hasDateTime = computed<boolean>(() => this.isOn() && !this.isCleared());

  /** Null means the template should display the formatted date-time instead. */
  public readonly displayLabelKey = computed<string | null>(() => {
    const label = this.config()?.flagLabel();

    if (!this.isOn()) return label?.is_null || 'GL.FIELD.FLAG.NOT_SET';

    return this.isCleared() && label?.is_datetime ? label.is_datetime : null;
  });

  public bind(config: FormFieldFlagConfigType): void {
    this._config.set(config);
  }

  public setValue(value: FormFieldFlagValueType): void {
    this.config()?.value.set(value);
  }
}
