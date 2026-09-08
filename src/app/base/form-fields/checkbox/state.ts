// file: src/app/base/form-fields/checkbox/state.ts
import { computed, effect, resource, Service, signal } from '@angular/core';
import {
    FormFieldCheckboxConfigType,
    FormFieldCheckboxEntryType,
    FormFieldCheckboxGroupEntryType,
    FormFieldCheckboxOptionGroupItemType,
    FormFieldCheckboxOptionSourceType,
} from '@base/form-fields/checkbox/type';
import type { FormFieldOptionRequestType } from '@base/form-fields/type';

type FormFieldCheckboxOptionRequestType =
    FormFieldOptionRequestType<FormFieldCheckboxOptionSourceType>;

/**
 * Every signal and computed of this control, plus the small transforms its computeds
 * need. Injected by service.ts, which is what the component and the template talk to -
 * so nothing in here injects the service back.
 *
 * Provided by the component -> one per rendered field, destroyed with it. No transloco
 * dependency, same reasoning as @base/form-fields/radio/state.ts - labels stay RAW and
 * the template pipes them once.
 */
@Service({ autoProvided: false })
export class FormFieldCheckboxState {

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    /**
     * The component's inputs, set once by bind() from its constructor.
     *
     * A signal and not a plain field: every computed below reads it, and a computed that
     * happened to run before bind() would otherwise cache its null answer forever.
     */
    private readonly _config = signal<FormFieldCheckboxConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    private readonly optionResource = resource<
        FormFieldCheckboxOptionSourceType,
        FormFieldCheckboxOptionRequestType | undefined
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
    private readonly bag = computed<FormFieldCheckboxOptionSourceType>(() => {
        const source = this.config()?.option() ?? null;

        return typeof source === 'function' ? source() : source;
    });

    /** ONE branch for the whole control, and it sniffs the DATA - [template] is optional */
    public readonly isGrouped = computed<boolean>(() => this.isGroupBag(this.bag()));

    /** the single extra row above the options. Its FIRST entry only - not counted in [allKeys] */
    public readonly defaultOption = computed(() =>
        this.firstOption(this.config()?.optionDefault()),
    );

    /** a flat bag's rows, in declaration order. A grouped bag goes through groupEntry() */
    public readonly entry = computed<FormFieldCheckboxEntryType[]>(() =>
        this.isGrouped() ? [] : this.rowsOf(this.bag()),
    );

    /** a grouped bag: each heading with its own rows */
    public readonly groupEntry = computed<FormFieldCheckboxGroupEntryType[]>(() => {
        if (!this.isGrouped()) return [];

        return this.entriesOf(this.bag()).map((grp) => ({
            key: grp.key,
            item: grp.item as FormFieldCheckboxOptionGroupItemType,
            option: this.rowsOf(grp.item?.option),
        }));
    });

    /**
     * every REAL option key, flattened - what the All row selects and what its (n/total)
     * count is measured against. The default row is deliberately NOT part of this: it is
     * an extra toggle, not one of the field's real options.
     */
    public readonly allKeys = computed<any[]>(() =>
        this.isGrouped()
            ? this.groupEntry().flatMap((grp) => grp.option.map((row) => row.key))
            : this.entry().map((row) => row.key),
    );

    /** the picked keys, straight off the field. Always an array */
    private readonly selectedKeys = computed<any[]>(() => this.config()?.value() ?? []);

    private readonly selectedKeySet = computed<Set<any>>(() => new Set(this.selectedKeys()));

    /** how many real options are currently picked - the "n" half of the header's (n/total) */
    public readonly selectedCount = computed<number>(() => this.selectedKeys().length);

    /** every real option currently picked - what flips the header row to "Deselect" */
    public readonly isAllSelected = computed<boolean>(() => {
        const all = this.allKeys();

        if (all.length === 0) return false;

        const selected = this.selectedKeySet();

        return all.every((key) => selected.has(key));
    });

    /** some, but not all, real options picked - what puts the header row in its dash state */
    public readonly isIndeterminate = computed<boolean>(() =>
        this.selectedKeys().length > 0 && !this.isAllSelected(),
    );

    /** the cap reached? What locks every UNCHECKED row once [maxSelection] is hit */
    public readonly isFull = computed<boolean>(() => {
        const max = this.config()?.maxSelection() ?? 0;

        return max > 0 && this.selectedKeys().length >= max;
    });

    /** the All / Deselect row: on by default, but a capped field has no "select everything" */
    public readonly showAllRow = computed<boolean>(() =>
        (this.config()?.selectAll() ?? true) && (this.config()?.maxSelection() ?? 0) === 0,
    );

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /** called once, from the component's constructor */
    public bind(config: FormFieldCheckboxConfigType): void {
        this._config.set(config);
    }

    /** is this key currently picked? Covers the default row's key too */
    public isChecked(key: any): boolean {
        return this.selectedKeySet().has(key);
    }

    /** one row flipped. Silently a no-op past the cap - the row is disabled by then anyway */
    public toggle(key: any, checked: boolean): void {
        const current = this.selectedKeys();

        if (checked) {
            if (current.includes(key) || this.isFull()) return;

            this.config()?.value.set([...current, key]);
            return;
        }

        this.config()?.value.set(current.filter((existing) => existing !== key));
    }

    /** the header row: every real option, or none of them */
    public toggleAll(): void {
        this.config()?.value.set(this.isAllSelected() ? [] : [...this.allKeys()]);
    }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████

    /**
     * '42' -> 42, 'true' -> true. Object keys are always strings, so without this a key
     * picked from a numeric bag would come back a string and never match [value] again.
     * Local, and not CrudUtility.parseKey - see @base/form-fields/radio/state.ts.
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

    /** the single extra row above the options, or null */
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
     * No | keyvalue pipe anywhere in this control, deliberately: it allocates a fresh
     * array on every change detection, and its default comparator ALPHABETISES - which
     * is exactly what today's CRUD block does to a flat bag.
     */
    private entriesOf(source: any): Array<{ key: any; item: any }> {
        if (!source) return [];

        // an ARRAY entry is its own key - see FormFieldCheckboxOptionSourceType
        if (Array.isArray(source)) return source.map((item) => ({ key: item, item }));

        // a Map hands the key back in its own type; Object.entries always stringifies
        if (source instanceof Map) return [...source].map(([key, item]) => ({ key, item }));

        return Object.entries(source).map(([key, item]) => ({ key: this.parseKey(key), item }));
    }

    /** one bag -> its normalized rows */
    private rowsOf(source: any): FormFieldCheckboxEntryType[] {
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
