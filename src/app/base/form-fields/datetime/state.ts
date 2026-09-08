import { computed, inject, Service, signal } from '@angular/core';
import {
    FormFieldDatetimeConfigType,
    FormFieldDatetimeModeConfigType,
    FormFieldDatetimeValueType,
} from '@base/form-fields/datetime/type';
import { FormFieldDatetimeModeEnum } from '@base/form-fields/datetime/enum';
import { DateTimeService } from '@libs/date-time/service';

@Service({ autoProvided: false })
export class FormFieldDatetimeState {
    private readonly dateTime = inject(DateTimeService);

    private readonly _config = signal<FormFieldDatetimeConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    public readonly modeConfig = computed<FormFieldDatetimeModeConfigType>(() => {
        switch (this.config()?.mode()) {
            case FormFieldDatetimeModeEnum.DATE:
                return { pickerType: 'calendar', selectMode: 'single', triggerIcon: 'today' };
            case FormFieldDatetimeModeEnum.TIME:
                return { pickerType: 'timer', selectMode: 'single', triggerIcon: 'schedule' };
            case FormFieldDatetimeModeEnum.DATETIME_RANGE:
                return { pickerType: 'both', selectMode: 'range', triggerIcon: 'date_range' };
            default:
                return { pickerType: 'both', selectMode: 'single', triggerIcon: 'calendar_clock' };
        }
    });

    public readonly isRange = computed<boolean>(
        () => this.config()?.mode() === FormFieldDatetimeModeEnum.DATETIME_RANGE,
    );

    public readonly pickerValue = computed<Date | null>(() =>
        this.toPickerDate(this.config()?.value()),
    );

    public readonly pickerValues = computed<Array<Date | null>>(() => [
        this.toPickerDate(this.config()?.value()),
        this.toPickerDate(this.config()?.rangeEndValue()),
    ]);

    public readonly pickerModel = computed<Date | Array<Date | null> | null>(() =>
        this.isRange() ? this.pickerValues() : this.pickerValue(),
    );

    public readonly minValue = computed<Date | null>(() =>
        this.toPickerDate(this.config()?.min()),
    );

    public readonly maxValue = computed<Date | null>(() =>
        this.toPickerDate(this.config()?.max()),
    );

    public readonly startAtValue = computed<Date | null>(() =>
        this.toPickerDate(this.config()?.startAt()),
    );

    public readonly endAtValue = computed<Date | null>(() =>
        this.toPickerDate(this.config()?.endAt()),
    );

    public readonly hasValue = computed<boolean>(() => {
        const config = this.config();

        if (!config) return false;

        return this.isSet(config.value()) || (this.isRange() && this.isSet(config.rangeEndValue()));
    });

    public bind(config: FormFieldDatetimeConfigType): void {
        this._config.set(config);
    }

    public setValue(value: FormFieldDatetimeValueType): void {
        this.config()?.value.set(value);
    }

    public setRangeEndValue(value: FormFieldDatetimeValueType): void {
        this.config()?.rangeEndValue.set(value);
    }

    public clear(): void {
        this.config()?.value.set(null);

        if (this.isRange()) this.config()?.rangeEndValue.set(null);
    }

    private toPickerDate(value: FormFieldDatetimeValueType | undefined): Date | null {
        return this.dateTime.owlDateTimeValue({ value: value ?? null });
    }

    private isSet(value: FormFieldDatetimeValueType): boolean {
        return value !== null && value !== undefined && value !== '';
    }
}
