// file: src/app/base/crud/default/mutation/page/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from 'src/app/base/crud/service/entry';
import { NgComponentOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'crud-mutation-page-component',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    NgComponentOutlet, 
    TranslocoModule,
    MatButtonModule, 
    MatIconModule,
  ],
})
export class CrudMutationPageComponent {
  public readonly service = inject(CrudService);
}
