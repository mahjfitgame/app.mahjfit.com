// file: src/app/base/crud/component/upload/form/component.ts
import { Component, inject } from '@angular/core';
import { CrudService } from 'src/app/base/crud/service/entry';
import { CrudFormFieldComponent } from 'src/app/base/crud/component/form-field/component';

@Component({
  selector: 'crud-upload-form-component',
  standalone: true,
  templateUrl: './template.html',
  styleUrl: './style.scss',
  imports: [CrudFormFieldComponent],
  providers: [],
})
export class CrudUploadFormComponent {
  public readonly service = inject(CrudService);
}
