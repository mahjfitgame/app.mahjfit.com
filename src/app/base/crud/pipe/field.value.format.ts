import { Pipe, PipeTransform, inject } from '@angular/core';
import { CrudFieldInfoType } from '@base/crud/type';
import { CrudValidation } from '@base/crud/validation';
import { CrudState } from 'src/app/base/crud/state/entry';

@Pipe({
    name: 'fieldValueFormat',
    standalone: true,
    pure: true,
})
export class CrudFieldValueFormatPipe implements PipeTransform {
    private readonly validation = inject(CrudValidation);
    private readonly state = inject(CrudState);

    public transform(value: any, finfo: CrudFieldInfoType, record: any): string {
        return this.validation.formatCrudFieldValue(
            value,
            finfo,
            record,
            this.state.getCrudModuleContext(),
        );
    }
}
