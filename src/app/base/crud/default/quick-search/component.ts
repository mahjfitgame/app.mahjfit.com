// file: ./src/app/base/crud/default/quick-search/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from '@base/crud/service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgTemplateOutlet } from '@angular/common';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-crud-default-quick-search',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    NgTemplateOutlet,
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
