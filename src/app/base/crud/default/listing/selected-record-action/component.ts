// file: src/app/base/crud/default/listing/selected-record-action/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from '@base/crud/service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-listing-selected-record-action',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    TranslocoModule,
    MatIconModule,
    MatCheckboxModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  providers: [],
})
export class CrudDefaultListingSelectedRecordActionComponent {
  public readonly service = inject(CrudService);
}
