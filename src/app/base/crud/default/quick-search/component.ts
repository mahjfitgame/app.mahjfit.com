// file: src/app/base/crud/default/quick-search/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from 'src/app/base/crud/service/entry';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgTemplateOutlet } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-quick-search',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    NgTemplateOutlet,
    TranslocoModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
  ],
  providers: [],
})
export class CrudDefaultQuickSearchComponent {
  public readonly service = inject(CrudService);
}
