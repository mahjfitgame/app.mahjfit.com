// file: src/app/base/crud/default/mutation-form/form.component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from 'src/app/base/crud/service/entry';
import { CrudMutationEndSideBarComponent } from 'src/app/base/crud/component/mutation/end-side-bar/component';
import { NgComponentOutlet } from '@angular/common';
import { CrudMutationEndDrawerComponent } from 'src/app/base/crud/component/mutation/end-drawer/component';

@Component({
  selector: 'crud-mutation-component',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    NgComponentOutlet,
    CrudMutationEndDrawerComponent,
    CrudMutationEndSideBarComponent,
  ],
  providers: [],
})
export class CrudMutationComponent {
  public readonly service = inject(CrudService);
}
