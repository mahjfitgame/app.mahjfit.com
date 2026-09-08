// file: src/app/base/form-fields/radio/state.ts
import { computed, effect, resource, Service, signal } from '@angular/core';
import {
    FormFieldRadioConfigType,
    FormFieldRadioEntryType,
    FormFieldRadioGroupEntryType,
    FormFieldRadioOptionGroupItemType,
    FormFieldRadioOptionSourceType,
} from '@base/form-fields/radio/type';
import type { FormFieldOptionRequestType } from '@base/form-fields/type';

type FormFieldRadioOptionRequestType =
    FormFieldOptionRequestType<FormFieldRadioOptionSourceType>;

/**
 * Every signal and computed of this control, plus the small transforms its computeds
 * need. Injected by service.ts, which is what the component and the template talk to -
 * so nothing in here injects the service back.
 *
 * Provided by the component -> one per rendered field, destroyed with it. Deliberately
 * NOT SignalStateService: that base class is for state that must survive a restart, and
 * nothing here persists.
 *
 * No transloco dependency, unlike select/state.ts - there is no search box to match
 * translated labels against, so labels stay RAW and the template pipes them once.
 */
@Service({ autoProvided: false })
export class FormFieldRadioState {

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    /**
     * The component's inputs, set once by bind() from its constructor.
     *
     * A signal and not a plain field: every computed below reads it, and a computed that
     * happened to run before bind() would otherwise cache its null answer forever.
     */
    private readonly _config = signal<FormFieldRadioConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    private readonly optionResource = resource<
        FormFieldRadioOptionSourceType,
        FormFieldRadioOptionRequestType | undefined
    >({
        params: () => {
            const config = this.config();
            const loader = config?.optionLoader();

            if (!config || !loader || config.disabledByDependency()) return undefined;

            return {
                loader,
                dependentFieldValue: config.dependentFieldValue(),
            };
        },
        loader: ({ params, abortSignal }) => params.loader({
            dependentFieldValue: params.dependentFieldValue,
            abortSignal,
        }),
        defaultValue: {},
    });

    private readonly publishLoadedOption = effect(() => {
        const config = this.config();

        if (!config?.optionLoader()) return;
        if (config.option() === this.optionResource.value) return;

        config.option.set(this.optionResource.value);
    });

    // ████ COMPUTED PROPERTIES █████████████████████████████████████████

    /**
     * THE ONE PLACE [option] stops being a declaration and becomes data.
     *
     * Two reads deep on purpose: config().option() takes the INPUT's value, which may
     * itself be a signal, and the second call takes that signal's value. BOTH happen
     * inside this computed, so a resource landing re-runs it and every reader below
     * repaints with nothing pushed in.
     */
    private readonly bag = computed<FormFieldRadioOptionSourceType>(() => {
        const source = this.config()?.option() ?? null;

        return typeof source === 'function' ? source() : source;
    });

    /** ONE branch for the whole control, and it sniffs the DATA - [template] is optional */
    public readonly isGrouped = computed<boolean>(() => this.isGroupBag(this.bag()));

    /** the 'Any' / 'None' row above the options. Its FIRST entry only */
    public readonly defaultOption = computed(() =>
        this.firstOption(this.config()?.optionDefault()),
    );

    /** a flat bag's rows, in declaration order. A grouped bag goes through groupEntry() */
    public readonly entry = computed<FormFieldRadioEntryType[]>(() =>
        this.isGrouped() ? [] : this.rowsOf(this.bag()),
    );

    /** a grouped bag: each heading with its own rows */
    public readonly groupEntry = computed<FormFieldRadioGroupEntryType[]>(() => {
        if (!this.isGrouped()) return [];

        return this.entriesOf(this.bag()).map((grp) => ({
            key: grp.key,
            item: grp.item as FormFieldRadioOptionGroupItemType,
            option: this.rowsOf(grp.item?.option),
        }));
    });

    /**
     * what <mat-radio-group> is given as its [value].
     *
     * '' and not null, so an [optionDefault] keyed '' paints itself checked while the
     * field holds nothing - the same fallback select/state.ts renderValue() uses.
     */
    public readonly renderValue = computed<any>(() => this.config()?.value() ?? '');

    /**
     * is there anything to clear? What the clear button is shown on.
     *
     * ⚠ NOT a truthiness test: parseKey() turns '0' into the number 0 and 'false' into
     * false, and both are ordinary keys. '' IS empty, deliberately - that is
     * [optionDefault]'s own key, so 'Any' is the cleared state, not something to clear.
     */
    public readonly hasValue = computed<boolean>(() => {
        const value = this.config()?.value();

        return value !== null && value !== undefined && value !== '';
    });

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /** called once, from the component's constructor */
    public bind(config: FormFieldRadioConfigType): void {
        this._config.set(config);
    }

    /** a row was picked: the key, straight through */
    public setValue(next: any): void {
        this.config()?.value.set(next ?? null);
    }

    public clear(): void {
        this.config()?.value.set(null);
    }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████

    /**
     * '42' -> 42, 'true' -> true. Object keys are always strings, so without this the
     * [value] binding hands a string to a bag holding a number and the picked row never
     * matches. Local, and not CrudUtility.parseKey, because injecting that would drag
     * CrudState in behind it and this control would only work on a CRUD screen.
     */
    private parseKey(key: string | number | symbol): any {
        const keyStr = String(key);

        if (keyStr === 'true') return true;
        if (keyStr === 'false') return false;
        if (!isNaN(Number(keyStr)) && keyStr.trim() !== '') return Number(keyStr);

        return keyStr;
    }

    /**
     * A grouped bag is { groupKey: { label, option: {…} } } instead of { key: 'Label' }.
     * Told apart by SHAPE: a group's value always carries its own [option].
     */
    private isGroupBag(bag: any): boolean {
        if (!bag || Array.isArray(bag)) return false;

        const first = bag instanceof Map
            ? [...bag.values()][0]
            : (typeof bag === 'object' ? Object.values(bag)[0] : null);

        return !!first && typeof first === 'object' && !Array.isArray(first) && 'option' in first;
    }

    /** the single 'Any' / 'None' row above the options, or null */
    private firstOption(
        option: Record<string | number, any> | null | undefined,
    ): { key: any; value: any } | null {
        const first = Object.entries(option ?? {})[0];

        if (!first) return null;

        return { key: first[0] === '' ? '' : this.parseKey(first[0]), value: first[1] };
    }

    /**
     * array | object | Map -> entries in the order the caller declared them.
     *
     * No | keyvalue pipe anywhere in this control, deliberately twice over: it allocates
     * a fresh array on every change detection, and its default comparator ALPHABETISES -
     * which is exactly what today's CRUD block does to a flat bag.
     */
    private entriesOf(source: any): Array<{ key: any; item: any }> {
        if (!source) return [];

        // an ARRAY entry is its own key - see FormFieldRadioOptionSourceType
        if (Array.isArray(source)) return source.map((item) => ({ key: item, item }));

        // a Map hands the key back in its own type; Object.entries always stringifies
        if (source instanceof Map) return [...source].map(([key, item]) => ({ key, item }));

        return Object.entries(source).map(([key, item]) => ({ key: this.parseKey(key), item }));
    }

    /** one bag -> its normalized rows */
    private rowsOf(source: any): FormFieldRadioEntryType[] {
        return this.entriesOf(source).map(({ key, item }) => ({
            key,
            item,
            label: this.labelText(item, key),
        }));
    }

    /** the flat text of a row: its own [label] when it carries one, else the value itself */
    private labelText(item: any, key: any): string {
        if (item === null || item === undefined) return String(key);

        return typeof item === 'object' ? String(item.label ?? key) : String(item);
    }
}
