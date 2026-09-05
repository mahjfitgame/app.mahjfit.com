// file: src/app/base/crud/default/search-filter/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from '@base/crud/service';
import { MatIconModule } from '@angular/material/icon';
import { CdkPortal } from '@angular/cdk/portal';
import { PrivateAreaLayoutDirective } from '@area/private/directive';
import { CrudDefaultFormFieldComponent } from '@base/crud/default/form-field/component';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-search-filter',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    CdkPortal,
    PrivateAreaLayoutDirective,

    TranslocoModule,

    MatIconModule,
    MatButtonModule,

    CrudDefaultFormFieldComponent,
  ],
  providers: [],
})
export class CrudDefaultSearchFilterComponent {
  public readonly service = inject(CrudService);
}
