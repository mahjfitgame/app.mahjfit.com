import { Component, inject, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ScrollStrategy } from '@angular/cdk/overlay';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
} from '@danielmoncada/angular-datetime-picker';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldDatetimeService } from '@base/form-fields/datetime/service';
import { FormFieldDatetimeState } from '@base/form-fields/datetime/state';
import {
    FormFieldDatetimeModeEnum,
    FormFieldDatetimePickerModeEnum,
    FormFieldDatetimeStartViewEnum,
} from '@base/form-fields/datetime/enum';
import {
    FormFieldDatetimeEventType,
    FormFieldDatetimeFilterType,
    FormFieldDatetimeValueType,
} from '@base/form-fields/datetime/type';
import { provideDateTimeFormat } from '@libs/date-time/provider';

@Component({
    selector: 'app-form-field-datetime',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        FormsModule,
        TranslocoModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        OwlDateTimeModule,
        OwlNativeDateTimeModule,
    ],
    providers: [
        provideDateTimeFormat(),
        FormFieldDatetimeState,
        FormFieldDatetimeService,
    ],
})
export class FormFieldDatetimeComponent {
    public readonly service = inject(FormFieldDatetimeService);

    // value is the scalar value, or the first value when mode is datetime_range
    public readonly value = model<FormFieldDatetimeValueType>(null);
    public readonly rangeEndValue = model<FormFieldDatetimeValueType>(null);
    public readonly dependentFieldValue = input<any>(null);
    public readonly mode = input<FormFieldDatetimeModeEnum>(FormFieldDatetimeModeEnum.DATETIME);

    // input[owlDateTime]
    public readonly min = input<FormFieldDatetimeValueType>(null);
    public readonly max = input<FormFieldDatetimeValueType>(null);
    public readonly filter = input<FormFieldDatetimeFilterType | null>(null);
    public readonly rangeSeparator = input<string>(' - ');
    public readonly readonlyInput = input<boolean>(true);

    // owl-date-time
    public readonly pickerMode = input<FormFieldDatetimePickerModeEnum>(
        FormFieldDatetimePickerModeEnum.POPUP,
    );
    public readonly startView = input<FormFieldDatetimeStartViewEnum>(
        FormFieldDatetimeStartViewEnum.MONTH,
    );
    public readonly startAt = input<FormFieldDatetimeValueType>(null);
    public readonly endAt = input<FormFieldDatetimeValueType>(null);
    public readonly showCalendarWeeks = input<boolean>(false);
    public readonly yearOnly = input<boolean>(false);
    public readonly multiyearOnly = input<boolean>(false);
    public readonly firstDayOfWeek = input<number>(0);
    public readonly hideOtherMonths = input<boolean>(false);
    public readonly hour12Timer = input<boolean>(true);
    public readonly showSecondsTimer = input<boolean>(true);
    public readonly stepHour = input<number>(1);
    public readonly stepMinute = input<number>(1);
    public readonly stepSecond = input<number>(1);
    public readonly opened = input<boolean>(false);
    public readonly backdropClass = input<string | string[]>([]);
    public readonly panelClass = input<string | string[]>([]);
    public readonly scrollStrategy = input<ScrollStrategy | undefined>(undefined);

    // Material field chrome
    public readonly name = input<string>('');
    public readonly inputId = input<string>('');
    public readonly label = input<string>('');
    public readonly placeholder = input<string>('');
    public readonly hint = input<string>('');
    public readonly error = input<string>('');
    public readonly iconPrepend = input<string>('');
    public readonly iconAppend = input<string>('');
    public readonly required = input<boolean>(false);
    public readonly disabled = input<boolean>(false);
    public readonly clearable = input<boolean>(true);

    // Owl events, forwarded so standalone and CRUD callers keep the full event surface
    public readonly dateTimeInput = output<FormFieldDatetimeEventType>();
    public readonly dateTimeChange = output<FormFieldDatetimeEventType>();
    public readonly beforePickerOpen = output<void>();
    public readonly afterPickerOpen = output<void>();
    public readonly afterPickerClosed = output<void>();
    public readonly yearSelected = output<Date>();
    public readonly monthSelected = output<Date>();
    public readonly dateSelected = output<Date>();

    public readonly errorMatcher: ErrorStateMatcher = { isErrorState: () => !!this.error() };

    constructor() {
        this.service.state.bind({
            value: this.value,
            rangeEndValue: this.rangeEndValue,
            mode: this.mode,
            min: this.min,
            max: this.max,
            startAt: this.startAt,
            endAt: this.endAt,
        });
    }
}
