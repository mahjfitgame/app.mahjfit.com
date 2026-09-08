import { computed, Service, signal } from '@angular/core';
import { FormFieldSwitchConfigType, FormFieldSwitchValueType } from '@base/form-fields/switch/type';

@Service({ autoProvided: false })
export class FormFieldSwitchState {
  private readonly _config = signal<FormFieldSwitchConfigType | null>(null);
  public readonly config = this._config.asReadonly();

  public readonly onValue = computed<FormFieldSwitchValueType>(
    () => this.config()?.option()?.on ?? true,
  );

  public readonly offValue = computed<FormFieldSwitchValueType>(
    () => this.config()?.option()?.off ?? false,
  );

  /** A missing value renders in the off position, matching the former CRUD template. */
  public readonly checked = computed<boolean>(
    () => (this.config()?.value() ?? this.offValue()) === this.onValue(),
  );

  public bind(config: FormFieldSwitchConfigType): void {
    this._config.set(config);
  }

  public setChecked(checked: boolean): void {
    this.config()?.value.set(checked ? this.onValue() : this.offValue());
  }
}
