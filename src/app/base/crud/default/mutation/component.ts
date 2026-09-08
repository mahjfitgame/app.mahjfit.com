// file: src/app/base/crud/default/mutation-form/form.component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from 'src/app/base/crud/service/entry';
import { CrudDefaultMutationEndSideBarComponent } from '@base/crud/default/mutation/end-side-bar/component';
import { NgComponentOutlet } from '@angular/common';
import { CrudDefaultMutationEndDrawerComponent } from '@base/crud/default/mutation/end-drawer/component';

@Component({
  selector: 'app-crud-default-mutation',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [
    NgComponentOutlet,
    CrudDefaultMutationEndDrawerComponent,
    CrudDefaultMutationEndSideBarComponent,
  ],
  providers: [],
})
export class CrudDefaultMutationComponent {
  public readonly service = inject(CrudService);
}
