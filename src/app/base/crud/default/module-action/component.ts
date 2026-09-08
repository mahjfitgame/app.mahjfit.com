// file: src/app/base/crud/default/module-action/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from 'src/app/base/crud/service/entry';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-module-action',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    RouterModule,
    NgTemplateOutlet,
    TranslocoModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  providers: [],
})
export class CrudDefaultModuleActionComponent {
  public readonly service = inject(CrudService);
}
