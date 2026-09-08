import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldFlagService } from '@base/form-fields/flag/service';
import { FormFieldFlagState } from '@base/form-fields/flag/state';
import {
  FormFieldFlagLabelType,
  FormFieldFlagModeType,
  FormFieldFlagValueType,
} from '@base/form-fields/flag/type';
import { FormFieldDatetimeModeEnum } from '@base/form-fields/datetime/enum';
import { provideDateTimeFormat } from '@libs/date-time/provider';

@Component({
  selector: 'app-form-field-flag',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    FormsModule,
    TranslocoModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
  ],
  providers: [provideDateTimeFormat(), FormFieldFlagState, FormFieldFlagService],
})
export class FormFieldFlagComponent {
  public readonly service = inject(FormFieldFlagService);

  public readonly value = model<FormFieldFlagValueType>(null);
  public readonly dependentFieldValue = input<any>(null);
  public readonly mode = input<FormFieldFlagModeType>(FormFieldDatetimeModeEnum.DATETIME);
  public readonly flagLabel = input<FormFieldFlagLabelType | null>(null);
  public readonly min = input<FormFieldFlagValueType>(null);
  public readonly max = input<FormFieldFlagValueType>(null);

  public readonly name = input<string>('');
  public readonly inputId = input<string>('');
  public readonly label = input<string>('');
  public readonly hint = input<string>('');
  public readonly error = input<string>('');
  public readonly iconPrepend = input<string>('');
  public readonly iconAppend = input<string>('');
  public readonly required = input<boolean>(false);
  public readonly disabled = input<boolean>(false);
  public readonly clearable = input<boolean>(false);

  public readonly errorMatcher: ErrorStateMatcher = { isErrorState: () => !!this.error() };

  constructor() {
    this.service.state.bind({
      value: this.value,
      mode: this.mode,
      flagLabel: this.flagLabel,
      clearable: this.clearable,
    });
  }
}
