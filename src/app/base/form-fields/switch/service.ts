import { inject, Service } from '@angular/core';
import { FormFieldSwitchState } from '@base/form-fields/switch/state';

@Service({ autoProvided: false })
export class FormFieldSwitchService {
  public readonly state = inject(FormFieldSwitchState);

  public onChange(checked: boolean): void {
    this.state.setChecked(checked);
  }
}
