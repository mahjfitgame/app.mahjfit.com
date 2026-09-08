// file: src/app/base/form-fields/color/state.ts
import { computed, Service, signal } from '@angular/core';
import { FormFieldColorConfigType } from '@base/form-fields/color/type';

/**
 * Every signal and computed of this control, plus the small transforms its computeds
 * need. Injected by service.ts, which is what the component and the template talk to -
 * so nothing in here injects the service back.
 *
 * Provided by the component -> one per rendered field, destroyed with it.
 */
@Service({ autoProvided: false })
export class FormFieldColorState {

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    private readonly _config = signal<FormFieldColorConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    // ████ COMPUTED PROPERTIES █████████████████████████████████████████

    /** what the TEXT half is given as its [value]. Kept verbatim, even mid-typo */
    public readonly renderValue = computed<string>(() => this.config()?.value() ?? '');

    /**
     * what the native swatch is given as its [value].
     *
     * The swatch accepts nothing but a full '#rrggbb' - anything else and it silently
     * shows black - so it reads through a normalizer rather than off the raw value the
     * text half may still be getting wrong.
     */
    public readonly swatchValue = computed<string>(() =>
        this.normalizeColorText(this.config()?.value()) ?? '#000000',
    );

    /** is there anything to clear? */
    public readonly hasValue = computed<boolean>(() => !!this.config()?.value());

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /** called once, from the component's constructor */
    public bind(config: FormFieldColorConfigType): void {
        this._config.set(config);
    }

    /**
     * Commits text typed into the field. Bound to (change) in the template, so it runs
     * on blur/Enter rather than per keystroke - the normalized form would otherwise
     * overwrite the box mid-typo, throwing the caret to the end of a hex code the user
     * has not finished typing.
     *
     * Text that is not a hex colour is kept verbatim rather than discarded: a [pattern]
     * validation rule is what decides it is wrong, and that is the caller's business,
     * not this control's.
     */
    public setTextValue(text: string | null): void {
        const raw = (text ?? '').trim();

        if (!raw) {
            this.config()?.value.set(null);
            return;
        }

        this.config()?.value.set(this.normalizeColorText(raw) ?? raw);
    }

    /** the native swatch always answers with a clean '#rrggbb' - straight through */
    public setSwatchValue(hex: string): void {
        this.config()?.value.set(hex && hex.length > 0 ? hex : null);
    }

    public clear(): void {
        this.config()?.value.set(null);
    }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████

    /**
     * Accepts 'f00', '#F00', 'ff0000', '#FF0000' and settles them all on '#ff0000'.
     * null when the text is not a hex colour, so callers can tell 'nothing usable'
     * apart from a real value.
     */
    private normalizeColorText(value: unknown): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        const hex = String(value).trim().replace(/^#/, '').toLowerCase();

        if (/^[0-9a-f]{3}$/.test(hex)) {
            return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
        }

        if (/^[0-9a-f]{6}$/.test(hex)) {
            return `#${hex}`;
        }

        return null;
    }
}
