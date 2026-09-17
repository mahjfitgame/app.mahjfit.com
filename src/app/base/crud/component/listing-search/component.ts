// file: src/app/base/crud/default/listing-search/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from 'src/app/base/crud/service/entry';
import { MatIconModule } from '@angular/material/icon';
import { CdkPortal } from '@angular/cdk/portal';
import { PrivateAreaLayoutDirective } from '@area/private/directive';
import { CrudFormFieldComponent } from 'src/app/base/crud/component/form-field/component';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'crud-listing-search-component',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    CdkPortal,
    PrivateAreaLayoutDirective,

    TranslocoModule,

    MatIconModule,
    MatButtonModule,
    MatTooltipModule,

    CrudFormFieldComponent,
  ],
  providers: [],
})
export class CrudListingSearchComponent {
  public readonly service = inject(CrudService);
}
