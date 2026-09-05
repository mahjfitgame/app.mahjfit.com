// file: src/app/base/crud/default/mutation/page/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from '@base/crud/service';
import { NgComponentOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-crud-default-mutation-page',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [NgComponentOutlet, TranslocoModule, MatButtonModule, MatIconModule],
})
export class CrudDefaultMutationPageComponent {
  public readonly service = inject(CrudService);
}
