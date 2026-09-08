// file: src/app/base/crud/default/listing/record-action/component.ts
import { Component, inject, input } from '@angular/core';
import { CrudService } from '@base/crud/service';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-crud-default-listing-record-action',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    RouterModule, 
    TranslocoModule, 
    MatIconModule, 
    MatMenuModule, 
    MatButtonModule,
    MatDividerModule
  ],
  providers: [],
})
export class CrudDefaultListingRecordActionComponent {
  public readonly service = inject(CrudService);

  public readonly row = input.required<Record<string, any>>();
}
