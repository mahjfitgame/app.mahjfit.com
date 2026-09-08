import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldSwitchService } from '@base/form-fields/switch/service';
import { FormFieldSwitchState } from '@base/form-fields/switch/state';
import { FormFieldSwitchOptionType, FormFieldSwitchValueType } from '@base/form-fields/switch/type';

@Component({
  selector: 'app-form-field-switch',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    FormsModule,
    TranslocoModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  providers: [FormFieldSwitchState, FormFieldSwitchService],
})
export class FormFieldSwitchComponent {
  public readonly service = inject(FormFieldSwitchService);

  public readonly value = model<FormFieldSwitchValueType>(null);
  public readonly dependentFieldValue = input<any>(null);
  public readonly option = input<FormFieldSwitchOptionType | null>(null);

  public readonly onLabel = input<string>('GL.FIELD.SWITCH.ON');
  public readonly offLabel = input<string>('GL.FIELD.SWITCH.OFF');

  public readonly name = input<string>('');
  public readonly inputId = input<string>('');
  public readonly label = input<string>('');
  public readonly hint = input<string>('');
  public readonly error = input<string>('');
  public readonly iconPrepend = input<string>('');
  public readonly iconAppend = input<string>('');
  public readonly required = input<boolean>(false);
  public readonly disabled = input<boolean>(false);

  public readonly errorMatcher: ErrorStateMatcher = { isErrorState: () => !!this.error() };

  constructor() {
    this.service.state.bind({
      value: this.value,
      option: this.option,
    });
  }
}
