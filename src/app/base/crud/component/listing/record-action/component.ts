// file: src/app/base/crud/default/listing/record-action/component.ts
import { Component, inject, input } from '@angular/core';
import { CrudService } from 'src/app/base/crud/service/entry';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'crud-listing-record-action-component',
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
export class CrudListingRecordActionComponent {
  public readonly service = inject(CrudService);

  public readonly row = input.required<Record<string, any>>();
}
