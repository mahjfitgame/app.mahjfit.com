// file: src/app/base/crud/default/mutation/form/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from 'src/app/base/crud/service/entry';
import { CrudFormFieldComponent } from 'src/app/base/crud/component/form-field/component';

@Component({
  selector: 'crud-mutation-form-component',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [CrudFormFieldComponent],
  providers: [],
})
export class CrudMutationFormComponent {
  public readonly service = inject(CrudService);
}
