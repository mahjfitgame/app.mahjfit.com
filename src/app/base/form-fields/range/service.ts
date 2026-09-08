// file: src/app/base/form-fields/range/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldRangeState } from '@base/form-fields/range/state';

@Service({ autoProvided: false })
export class FormFieldRangeService {
    public readonly state = inject(FormFieldRangeState);

    public onFromChange(value: number): void {
        this.state.setFromValue(value);
    }

    public onToChange(value: number): void {
        this.state.setToValue(value);
    }
}
