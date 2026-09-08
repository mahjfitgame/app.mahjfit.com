import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormFieldDatetimeModeEnum } from '@base/form-fields/datetime/enum';
import { FormFieldFlagService } from '@base/form-fields/flag/service';
import { FormFieldFlagState } from '@base/form-fields/flag/state';
import {
  FormFieldFlagLabelType,
  FormFieldFlagModeType,
  FormFieldFlagValueType,
} from '@base/form-fields/flag/type';
import { DateTimeService } from '@libs/date-time/service';

describe('FormFieldFlagService date/time mode', () => {
  const dateTime = {
    owlDateDisplayValue: vi.fn(() => 'date-display'),
    owlTimeDisplayValue: vi.fn(() => 'time-display'),
    owlDateTimeDisplayValue: vi.fn(() => 'datetime-display'),
    owlDateValue: vi.fn(() => null),
    owlTimeValue: vi.fn(() => null),
    owlDateTimeValue: vi.fn(() => null),
    owlDateChange: vi.fn((holder: { value: FormFieldFlagValueType }) => {
      holder.value = 'date-value';
    }),
    owlTimeChange: vi.fn((holder: { value: FormFieldFlagValueType }) => {
      holder.value = 'time-value';
    }),
    owlDateTimeChange: vi.fn((holder: { value: FormFieldFlagValueType }) => {
      holder.value = 'datetime-value';
    }),
  };

  let state: FormFieldFlagState;
  let service: FormFieldFlagService;
  let value: ReturnType<typeof signal<FormFieldFlagValueType>>;
  let mode: ReturnType<typeof signal<FormFieldFlagModeType>>;
  let flagLabel: ReturnType<typeof signal<FormFieldFlagLabelType | null>>;
  let clearable: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        FormFieldFlagState,
        FormFieldFlagService,
        { provide: DateTimeService, useValue: dateTime },
      ],
    });

    state = TestBed.inject(FormFieldFlagState);
    service = TestBed.inject(FormFieldFlagService);
    value = signal<FormFieldFlagValueType>(null);
    mode = signal<FormFieldFlagModeType>(FormFieldDatetimeModeEnum.DATETIME);
    flagLabel = signal<FormFieldFlagLabelType | null>(null);
    clearable = signal(false);

    state.bind({
      value,
      mode,
      flagLabel,
      clearable,
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('maps each mode to the matching picker and icon', () => {
    mode.set(FormFieldDatetimeModeEnum.DATE);
    expect(state.modeConfig()).toEqual({ pickerType: 'calendar', triggerIcon: 'today' });

    mode.set(FormFieldDatetimeModeEnum.TIME);
    expect(state.modeConfig()).toEqual({ pickerType: 'timer', triggerIcon: 'schedule' });

    mode.set(FormFieldDatetimeModeEnum.DATETIME);
    expect(state.modeConfig()).toEqual({ pickerType: 'both', triggerIcon: 'calendar_clock' });
  });

  it('uses the configured display formatter for each mode', () => {
    mode.set(FormFieldDatetimeModeEnum.DATE);
    expect(state.displayValue()).toBe('date-display');

    mode.set(FormFieldDatetimeModeEnum.TIME);
    expect(state.displayValue()).toBe('time-display');

    mode.set(FormFieldDatetimeModeEnum.DATETIME);
    expect(state.displayValue()).toBe('datetime-display');

    expect(dateTime.owlDateDisplayValue).toHaveBeenCalledOnce();
    expect(dateTime.owlTimeDisplayValue).toHaveBeenCalledOnce();
    expect(dateTime.owlDateTimeDisplayValue).toHaveBeenCalledOnce();
  });

  it('uses the configured value formatter for each mode', () => {
    const selected = new Date(2026, 8, 3, 12, 30, 45);

    mode.set(FormFieldDatetimeModeEnum.DATE);
    service.onDateTimeChange(selected);
    expect(value()).toBe('date-value');

    mode.set(FormFieldDatetimeModeEnum.TIME);
    service.onDateTimeChange(selected);
    expect(value()).toBe('time-value');

    mode.set(FormFieldDatetimeModeEnum.DATETIME);
    service.onDateTimeChange(selected);
    expect(value()).toBe('datetime-value');

    expect(dateTime.owlDateChange).toHaveBeenCalledOnce();
    expect(dateTime.owlTimeChange).toHaveBeenCalledOnce();
    expect(dateTime.owlDateTimeChange).toHaveBeenCalledOnce();
  });

  it('uses the selected mode when the flag is switched on', () => {
    mode.set(FormFieldDatetimeModeEnum.TIME);

    service.onToggle(true);

    expect(dateTime.owlTimeChange).toHaveBeenCalledOnce();
    expect(value()).toBe('time-value');
  });

  it('uses labels only for display and keeps raw flag values label-independent', () => {
    clearable.set(true);
    flagLabel.set({
      is_null: 'TEST.FLAG.IS_NULL',
      is_datetime: 'TEST.FLAG.IS_DATETIME',
    });

    value.set(null);
    expect(state.offValue()).toBeNull();
    expect(state.displayLabelKey()).toBe('TEST.FLAG.IS_NULL');

    value.set('');
    expect(state.clearedValue()).toBe('');
    expect(state.displayLabelKey()).toBe('TEST.FLAG.IS_DATETIME');

    flagLabel.set({
      is_null: 'TEST.FLAG.CHANGED_NULL',
      is_datetime: 'TEST.FLAG.CHANGED_DATETIME',
    });
    expect(value()).toBe('');
    expect(state.displayLabelKey()).toBe('TEST.FLAG.CHANGED_DATETIME');
  });

  it('emits null when switched off and an empty value when cleared', () => {
    clearable.set(true);
    flagLabel.set({
      is_null: 'TEST.FLAG.IS_NULL',
      is_datetime: 'TEST.FLAG.IS_DATETIME',
    });

    value.set('date-value');
    service.onToggle(false);
    expect(value()).toBeNull();

    value.set('date-value');
    service.onClear(new Event('click'));
    expect(value()).toBe('');
  });
});
