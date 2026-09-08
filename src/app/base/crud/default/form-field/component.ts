// file: src/app/base/crud/default/form-field/component.ts
import { Component, computed, inject, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { CrudService } from 'src/app/base/crud/service/entry';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { CrudFieldObj, CrudFieldObjInput, CrudFormFieldInfoType } from '@base/crud/type';
import { CrudFieldSlotPortalKeyPrefixEnum } from '@base/crud/enum';
import { TranslocoModule } from '@jsverse/transloco';
import { FormFieldAutosuggestComponent } from '@base/form-fields/autosuggest/component';
import { FormFieldSelectComponent } from '@base/form-fields/select/component';
import { FormFieldButtonSelectComponent } from '@base/form-fields/button-select/component';
import { FormFieldRadioComponent } from '@base/form-fields/radio/component';
import { FormFieldTextComponent } from '@base/form-fields/text/component';
import { FormFieldTextareaComponent } from '@base/form-fields/textarea/component';
import { FormFieldPasswordComponent } from '@base/form-fields/password/component';
import { FormFieldEmailComponent } from '@base/form-fields/email/component';
import { FormFieldUrlComponent } from '@base/form-fields/url/component';
import { FormFieldTelComponent } from '@base/form-fields/tel/component';
import { FormFieldNumberComponent } from '@base/form-fields/number/component';
import { FormFieldCheckboxComponent } from '@base/form-fields/checkbox/component';
import { FormFieldColorComponent } from '@base/form-fields/color/component';
import { FormFieldSliderComponent } from '@base/form-fields/slider/component';
import { FormFieldRangeComponent } from '@base/form-fields/range/component';
import { FormFieldSwitchComponent } from '@base/form-fields/switch/component';
import { FormFieldFlagComponent } from '@base/form-fields/flag/component';
import { FormFieldDatetimeComponent } from '@base/form-fields/datetime/component';

@Component({
  selector: 'app-crud-default-form-field',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    KeyValuePipe,
    NgTemplateOutlet,
    TranslocoModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatTooltipModule,
    /**
     * The field types CRUD no longer draws itself. Each brings its own Material pieces
     * with it - mat-autocomplete and mat-spinner for one, mat-select and its panel for
     * another, mat-radio-group / mat-checkbox for others - which is why FormsModule,
     * MatSelectModule and MatCheckboxModule are no longer imported here: nothing left
     * in this template uses ngModel, mat-select/mat-option or mat-checkbox directly.
     */
    FormFieldAutosuggestComponent,
    FormFieldSelectComponent,
    FormFieldButtonSelectComponent,
    FormFieldRadioComponent,
    FormFieldTextComponent,
    FormFieldTextareaComponent,
    FormFieldPasswordComponent,
    FormFieldEmailComponent,
    FormFieldUrlComponent,
    FormFieldTelComponent,
    FormFieldNumberComponent,
    FormFieldCheckboxComponent,
    FormFieldColorComponent,
    FormFieldSliderComponent,
    FormFieldRangeComponent,
    FormFieldSwitchComponent,
    FormFieldFlagComponent,
    FormFieldDatetimeComponent,
  ],
})
export class CrudDefaultFormFieldComponent {
  public readonly service = inject(CrudService);

  // if file has slot then we need to get slot key prefix of that form type
  public readonly slotPrefix = input<CrudFieldSlotPortalKeyPrefixEnum>();

  // accepts object OR array of objects
  public readonly formFieldObj = input<CrudFieldObjInput>(null);

  // accepts the signal-forms FieldTree driving this field set (mutationForm / listingSearchForm)
  public readonly formState = input<FieldTree<Record<string, any>> | null>(null);

  // always gives array, so template stays simple
  public readonly formFieldObjList = computed<CrudFieldObj[]>(() => {
    const value = this.formFieldObj();
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });

  /** Interpolation values used by the shared GL.VALIDATION messages. */
  public validationMessageParams(finfo: CrudFormFieldInfoType): Record<string, any> {
    const validation = finfo.validation;
    const allowed = validation?.extension?.value;

    return {
      min_length: validation?.min_length?.value,
      max_length: validation?.max_length?.value,
      min: validation?.min?.value,
      max: validation?.max?.value,
      expected: validation?.match_field?.value,
      allowed: Array.isArray(allowed) ? allowed.join(', ') : allowed,
    };
  }
}
