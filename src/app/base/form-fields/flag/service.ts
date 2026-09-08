import { inject, Service } from '@angular/core';
import { FormFieldFlagState } from '@base/form-fields/flag/state';
import { FormFieldFlagValueType } from '@base/form-fields/flag/type';
import { FormFieldDatetimeModeEnum } from '@base/form-fields/datetime/enum';
import { DateTimeService } from '@libs/date-time/service';

@Service({ autoProvided: false })
export class FormFieldFlagService {
  public readonly state = inject(FormFieldFlagState);
  private readonly dateTime = inject(DateTimeService);

  public pickerValue(): Date | null {
    return this.dateTime.owlDateTimeValue(this.valueHolder());
  }

  public onToggle(checked: boolean): void {
    if (!checked) {
      this.state.setValue(this.state.offValue());
      return;
    }

    this.onDateTimeChange(new Date());
  }

  public onDateTimeChange(value: Date | string | null): void {
    const holder = this.valueHolder();

    switch (this.state.mode()) {
      case FormFieldDatetimeModeEnum.DATE:
        this.dateTime.owlDateChange(holder, value);
        break;
      case FormFieldDatetimeModeEnum.TIME:
        this.dateTime.owlTimeChange(holder, value);
        break;
      default:
        this.dateTime.owlDateTimeChange(holder, value);
    }

    this.state.setValue(holder.value);
  }

  public onClear(event: Event): void {
    event.stopPropagation();
    this.state.setValue(this.state.clearedValue());
  }

  private valueHolder(): { value: FormFieldFlagValueType } {
    return { value: this.state.value() };
  }
}
