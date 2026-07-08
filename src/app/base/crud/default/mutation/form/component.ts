// file: ./src/app/base/crud/default/mutation/form/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from '@base/crud/service';
import { CrudDefaultFormFieldComponent } from '@base/crud/default/form-field/component';

@Component({
  selector: 'app-crud-default-mutation-form',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [CrudDefaultFormFieldComponent],
  providers: [],
})
export class CrudDefaultMutationFormComponent {
  public readonly service = inject(CrudService);
}
