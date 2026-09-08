// file: src/app/base/form-fields/range/state.ts
import { computed, Service, signal } from '@angular/core';
import { FormFieldRangeConfigType } from '@base/form-fields/range/type';

@Service({ autoProvided: false })
export class FormFieldRangeState {
    private readonly _config = signal<FormFieldRangeConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    public readonly renderFromValue = computed<number>(
        () => this.config()?.fromValue() ?? this.config()?.min() ?? 0,
    );

    public readonly renderToValue = computed<number>(
        () => this.config()?.toValue() ?? this.config()?.max() ?? 100,
    );

    public bind(config: FormFieldRangeConfigType): void {
        this._config.set(config);
    }

    public setFromValue(value: number): void {
        this.config()?.fromValue.set(value);
    }

    public setToValue(value: number): void {
        this.config()?.toValue.set(value);
    }
}
