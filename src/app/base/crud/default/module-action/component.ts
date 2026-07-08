// file: ./src/app/base/crud/default/module-action/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from '@base/crud/service';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-crud-default-module-action',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [RouterModule, NgTemplateOutlet, MatIconModule, MatMenuModule, MatButtonModule],
  providers: [],
})
export class CrudDefaultModuleActionComponent {
  public readonly service = inject(CrudService);
}
