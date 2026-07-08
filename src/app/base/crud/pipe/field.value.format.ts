import { Pipe, PipeTransform, inject } from '@angular/core';
import { CrudListingFieldInfoType } from '@base/crud/type';
import { CrudValidation } from '@base/crud/validation';

@Pipe({
    name: 'fieldValueFormat',
    standalone: true,
    pure: true,
})
export class CrudFieldValueFormatPipe implements PipeTransform {
    private readonly validation = inject(CrudValidation);

    public transform(value: any, finfo: CrudListingFieldInfoType, record: any): string {
        return this.validation.formatCrudListingFieldValue(value, finfo, record);
    }
}