// file: src/app/base/crud/default/listing/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from '@base/crud/service';
import { MatCardModule } from '@angular/material/card';
import { KeyValuePipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { A11yModule } from '@angular/cdk/a11y';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { CrudFieldValueFormatPipe } from '@base/crud/pipe/field.value.format';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { TermHighlightDirective } from '@libs/utility/directive/term.highlight.directive';
import { TranslocoModule } from '@jsverse/transloco';
import { CrudDefaultListingRecordActionComponent } from '@base/crud/default/listing/record-action/component';
import { CrudDefaultListingSelectedRecordActionComponent } from '@base/crud/default/listing/selected-record-action/component';

@Component({
  selector: 'app-crud-default-listing',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    KeyValuePipe,
    NgTemplateOutlet,
    NgClass,

    TranslocoModule,

    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatTableModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatButtonModule,

    CdkDropList,
    CdkDrag,
    A11yModule,

    CrudFieldValueFormatPipe,
    TermHighlightDirective,

    CrudDefaultListingRecordActionComponent,
    CrudDefaultListingSelectedRecordActionComponent,
  ],
  providers: [],
})
export class CrudDefaultListingComponent {
  public readonly service = inject(CrudService);
}
