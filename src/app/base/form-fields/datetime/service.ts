import { inject, Service } from '@angular/core';
import { FormFieldDatetimeModeEnum } from '@base/form-fields/datetime/enum';
import { FormFieldDatetimeState } from '@base/form-fields/datetime/state';
import { FormFieldDatetimeValueType } from '@base/form-fields/datetime/type';
import { DateTimeService } from '@libs/date-time/service';

@Service({ autoProvided: false })
export class FormFieldDatetimeService {
    public readonly state = inject(FormFieldDatetimeState);
    private readonly dateTime = inject(DateTimeService);

    public onDateTimeChange(value: unknown): void {
        if (this.state.isRange()) {
            const range = Array.isArray(value) ? value : [];

            this.state.setValue(
                this.formatValue(range[0] ?? null, FormFieldDatetimeModeEnum.DATETIME),
            );
            this.state.setRangeEndValue(
                this.formatValue(range[1] ?? null, FormFieldDatetimeModeEnum.DATETIME),
            );
            return;
        }

        const mode = this.state.config()?.mode() ?? FormFieldDatetimeModeEnum.DATETIME;
        const scalarMode =
            mode === FormFieldDatetimeModeEnum.DATETIME_RANGE
                ? FormFieldDatetimeModeEnum.DATETIME
                : mode;

        this.state.setValue(this.formatValue(value, scalarMode));
    }

    public onClear(event: Event): void {
        event.stopPropagation();
        this.state.clear();
    }

    private formatValue(
        value: unknown,
        mode: Exclude<FormFieldDatetimeModeEnum, FormFieldDatetimeModeEnum.DATETIME_RANGE>,
    ): FormFieldDatetimeValueType {
        const holder: { value: FormFieldDatetimeValueType } = { value: null };
        const input = value instanceof Date || typeof value === 'string' ? value : null;

        switch (mode) {
            case FormFieldDatetimeModeEnum.DATE:
                this.dateTime.owlDateChange(holder, input);
                break;
            case FormFieldDatetimeModeEnum.TIME:
                this.dateTime.owlTimeChange(holder, input);
                break;
            default:
                this.dateTime.owlDateTimeChange(holder, input);
        }

        return holder.value;
    }
}
