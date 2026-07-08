// file: ./src/app/base/crud/default/form-field/component.ts
import { Component, computed, inject, input } from '@angular/core';
import { CrudService } from '@base/crud/service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { KeyValuePipe, NgTemplateOutlet } from '@angular/common';
import { CrudFieldObj, CrudFieldObjInput } from '@base/crud/type';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from '@danielmoncada/angular-datetime-picker';
import { FormsModule } from '@angular/forms';
import { provideDateTimeFormat } from '@libs/date-time/provider';
import { CrudFieldSlotPortalKeyPrefixEnum } from '@base/crud/enum';

@Component({
  selector: 'app-crud-default-form-field',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    KeyValuePipe,
    NgTemplateOutlet,
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatCheckboxModule,
    FormsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
  ],
  providers: [provideDateTimeFormat()],
})
export class CrudDefaultFormFieldComponent {
  public readonly service = inject(CrudService);

  // if file has slot then we need to get slot key prefix of that form type
  public readonly slotPrefix = input<CrudFieldSlotPortalKeyPrefixEnum>();

  // accepts object OR array of objects
  public readonly fieldObj = input<CrudFieldObjInput>(null);

  // always gives array, so template stays simple
  public readonly fieldObjList = computed<CrudFieldObj[]>(() => {
    const value = this.fieldObj();
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });
}
