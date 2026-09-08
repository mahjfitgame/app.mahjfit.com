// file: src/app/base/form-fields/select/state.ts
import { computed, effect, inject, resource, Service, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { FOUNDATION_ALL_VALUE } from '@libs/foundation/const';
import {
    FormFieldSelectConfigType,
    FormFieldSelectEntryType,
    FormFieldSelectGroupEntryType,
    FormFieldSelectOptionGroupItemType,
    FormFieldSelectOptionSourceType,
} from '@base/form-fields/select/type';
import type { FormFieldOptionRequestType } from '@base/form-fields/type';

type FormFieldSelectOptionRequestType =
    FormFieldOptionRequestType<FormFieldSelectOptionSourceType>;

/**
 * The low level holder: every signal and computed of this control, plus the small
 * transforms its own computeds need. Injected by service.ts, which is what the component
 * and the template talk to - so nothing in here injects the service back.
 *
 * Provided by the component -> one per rendered field, destroyed with it. Deliberately
 * NOT SignalStateService: that base class is for state that must survive a restart
 * (localStorage / session / cookie / server sync) and nothing here persists.
 *
 * The whole file is TWO layers, and that split is the design:
 *   layer 1 - the WHOLE bag, never filtered. Feeds the selection maths and the trigger.
 *   layer 2 - the ROWS, filtered by the search box. Feeds the panel.
 * Mixing them is what makes a filtered multiselect quietly lose picks - see matches().
 */
@Service({ autoProvided: false })
export class FormFieldSelectState {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    /**
     * For the SEARCH and nothing else. Option labels are i18n KEYS in most fields and
     * the panel renders the translation, so matching the raw key would miss on exactly
     * the text the user can see. A literal comes straight back out, so a hand-written
     * form's plain labels are unaffected - and this app disables missing-key logging in
     * both modes (internationalization/provider.ts), so a literal is not noise either.
     */
    private readonly transloco = inject(TranslocoService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    /** one identity for "nothing is disabled", so the common case allocates nothing */
    private readonly noKey: ReadonlySet<any> = new Set<any>();

    /**
     * The All row's value, exposed so the template can bind it.
     *
     * A SENTINEL, not a key: it is appended to what mat-select renders so the row paints
     * checked, and applySelection() strips it back off before anything becomes a value.
     * It must never reach the model, the api or the URL.
     */
    public readonly allValue = FOUNDATION_ALL_VALUE;

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    /**
     * The component's inputs, set once by bind() from its constructor.
     *
     * A signal and not a plain field: every computed below reads it, and a computed that
     * happened to run before bind() would otherwise cache its null answer forever.
     */
    private readonly _config = signal<FormFieldSelectConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    /** the in-panel filter, already lowercased. service.onSearch writes it */
    public readonly query = signal<string>('');

    /**
     * Full-list loading belongs to the rendered control. A field with no loader returns
     * undefined and leaves the resource idle, so existing static/signal [option] inputs
     * keep their exact behaviour. A dependency resolver makes its loader idle through
     * [disabledByDependency], using the same decision that disables the control.
     */
    private readonly optionResource = resource<
        FormFieldSelectOptionSourceType,
        FormFieldSelectOptionRequestType | undefined
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

    /**
     * Publish the SIGNAL, not its current value. In CRUD the model output writes this to
     * finfo.option, so OPTION_RANGE validation subscribes to the same resource as the
     * panel. Outside CRUD it simply gives [(option)] callers the same live source.
     */
    private readonly publishLoadedOption = effect(() => {
        const config = this.config();

        if (!config?.optionLoader()) return;
        if (config.option() === this.optionResource.value) return;

        config.option.set(this.optionResource.value);
    });

    // ████ COMPUTED PROPERTIES █████████████████████████████████████████
    // layer 1: the whole bag, never filtered

    /**
     * THE ONE PLACE [option] stops being a declaration and becomes data.
     *
     * Two reads deep on purpose: config().option() takes the INPUT's value, which may
     * itself be a signal - see FormFieldSelectOptionType - and the second call takes
     * that signal's value. BOTH happen inside this computed, so a resource landing
     * re-runs it and every reader below repaints with nothing pushed in.
     */
    private readonly bag = computed<FormFieldSelectOptionSourceType>(() => {
        const source = this.config()?.option() ?? null;

        return typeof source === 'function' ? source() : source;
    });

    /**
     * ONE branch for the whole control, and it sniffs the DATA - unlike the autosuggest,
     * which reads a [template].group declaration. It has to: [template] is optional here,
     * so a grouped field may well declare none.
     */
    public readonly isGrouped = computed<boolean>(() => this.isGroupBag(this.bag()));

    /** every selectable key, groups flattened, in declaration order */
    public readonly allKey = computed<any[]>(() => {
        const bag = this.bag();

        if (!bag) return [];

        return this.isGrouped()
            ? this.entriesOf(bag).flatMap((grp) =>
                this.entriesOf(grp.item?.option).map((row) => row.key),
            )
            : this.entriesOf(bag).map((row) => row.key);
    });

    /**
     * key => label, for every key this field can name.
     *
     * The bag wins and [optionDefault] is layered over it. There is no third source:
     * every key this field can name is a key the CALLER put in the bag.
     *
     * Labels stay RAW here - an i18n key is still an i18n key. The template pipes them
     * exactly once, which is also why the search has to translate for itself.
     */
    public readonly labelByKey = computed<Map<string, string>>(() => {
        const out = new Map<string, string>();
        const config = this.config();

        if (!config) return out;

        const row = this.isGrouped()
            ? this.entriesOf(this.bag()).flatMap((grp) => this.entriesOf(grp.item?.option))
            : this.entriesOf(this.bag());

        row.forEach((r) => out.set(String(r.key), this.labelText(r.item, r.key)));

        Object.entries(config.optionDefault() ?? {}).forEach(([key, value]) =>
            out.set(key, String(value)),
        );

        return out;
    });

    /**
     * the 'Any' / 'None' row above the options. SINGLE select only.
     *
     * There is no such thing as an 'Any' selection in a multiselect: its key is '' and
     * picking it would file an empty string among the keys - a blank row, sent to the api
     * as a real value. [optionDefault] still feeds labelByKey() in multiselect, so a
     * caller using it as a label bag keeps that half.
     */
    public readonly defaultOption = computed(() =>
        this.config()?.multiselect() ? null : this.firstOption(this.config()?.optionDefault()),
    );

    // layer 2: the rows, filtered by the search box

    public readonly entry = computed<FormFieldSelectEntryType[]>(() =>
        this.isGrouped() ? [] : this.rowsOf(this.bag()),
    );

    /**
     * A group left with no rows is dropped with them: a bare heading over nothing reads
     * as a rendering bug, and while filtering it is simply a group nothing matched in.
     */
    public readonly groupEntry = computed<FormFieldSelectGroupEntryType[]>(() => {
        if (!this.isGrouped()) return [];

        return this.entriesOf(this.bag())
            .map((grp) => ({
                key: grp.key,
                item: grp.item as FormFieldSelectOptionGroupItemType,
                option: this.rowsOf(grp.item?.option),
            }))
            .filter((grp) => grp.option.length > 0);
    });

    /**
     * the 'no match' row. Only ever while a query is active: with nothing typed an empty
     * panel means the field was given no options, and "No match found" would be a lie
     * about a search nobody ran.
     */
    public readonly showNoMatch = computed<boolean>(() =>
        !!this.config()?.searchable()
        && this.query().length > 0
        && this.entry().length === 0
        && this.groupEntry().length === 0,
    );

    // ████ SELECTION ███████████████████████████████████████████████████

    /** the picked keys as an array. Single select is always [] */
    public readonly selectedKey = computed<any[]>(() => {
        const config = this.config();

        if (!config?.multiselect()) return [];

        const value = config.value();

        if (Array.isArray(value)) return value;

        return value === null || value === undefined || value === '' ? [] : [value];
    });

    private readonly selectedKeySet = computed<Set<string>>(
        () => new Set(this.selectedKey().map(String)),
    );

    /** {key, label} pairs for [chips]. Labels stay raw - the template pipes them */
    public readonly selectedChip = computed<Array<{ key: any; label: string }>>(() => {
        const label = this.labelByKey();

        return this.selectedKey().map((key) => ({
            key,
            label: label.get(String(key)) ?? String(key),
        }));
    });

    public readonly isAllSelected = computed<boolean>(() => {
        const total = this.allKey().length;

        return total > 0 && this.selectedKey().length >= total;
    });

    /**
     * the selection is at [maxSelection] and nothing more can go in.
     *
     * ONE definition for both halves of the rule: the panel disables the rows past the
     * ceiling so the user is told, and capped() below refuses whatever gets past a
     * disabled row anyway.
     *
     * Two ways to never be full, and both are the normal case: a single select, whose
     * selectedKey() is [] - so without the multiselect() test a maxSelection of 1 would
     * read 0 >= 1 and report it permanently full - and maxSelection 0, the default,
     * which means no ceiling at all.
     */
    public readonly isFull = computed<boolean>(() => {
        const config = this.config();

        if (!config?.multiselect()) return false;

        const max = config.maxSelection();

        return max > 0 && this.selectedKey().length >= max;
    });

    /**
     * the keys a full multiselect must grey out - everything not already picked, so what
     * IS picked stays removable.
     *
     * One shared empty Set while there is room, which is the normal case: the template
     * tests every visible row against this, so it is one computed read plus an O(1)
     * lookup and never a scan inside the loop.
     */
    public readonly disabledKey = computed<ReadonlySet<any>>(() => {
        if (!this.isFull()) return this.noKey;

        const selected = this.selectedKeySet();

        return new Set(this.allKey().filter((key) => !selected.has(String(key))));
    });

    /**
     * the All / Deselect row.
     *
     * OFF whenever there is a ceiling: "take everything" and "at most n" are two rules
     * that cannot both hold, and a row that would be trimmed the moment it is clicked is
     * worse than no row at all.
     */
    public readonly showAllRow = computed<boolean>(() => {
        const config = this.config();

        return !!config?.multiselect()
            && config.selectAll()
            && config.maxSelection() === 0
            && this.allKey().length > 0;
    });

    /**
     * what <mat-select> is given as its [value].
     *
     * The sentinel is appended so the All row paints checked, and it NEVER leaves this
     * class - applySelection() strips it back off on the way in. Single select falls back
     * to '' rather than null so an [optionDefault] whose key is '' selects itself.
     */
    public readonly renderValue = computed<any>(() => {
        const config = this.config();

        if (!config) return null;
        if (!config.multiselect()) return config.value() ?? '';

        const selected = this.selectedKey();

        return this.showAllRow() && this.isAllSelected()
            ? [...selected, FOUNDATION_ALL_VALUE]
            : selected;
    });

    /**
     * is there anything to clear? What the clear button is shown on.
     *
     * ⚠ NOT a truthiness test on the value, which is what this replaced: parseKey() turns
     * '0' into the number 0 and 'false' into false, and both are ordinary keys - a status
     * of 0, or the group key 0 that region-less rows bucket under. Either would have read
     * as "empty" and left the field with no way back out of a pick.
     *
     * '' IS empty, deliberately: that is [optionDefault]'s own key, so picking 'Any' is
     * the cleared state rather than something to clear.
     */
    public readonly hasValue = computed<boolean>(() => {
        const config = this.config();

        if (!config) return false;
        if (config.multiselect()) return this.selectedKey().length > 0;

        const value = config.value();

        return value !== null && value !== undefined && value !== '';
    });

    /** SINGLE select: the plain text of the picked key. Raw - the template pipes it */
    public readonly triggerLabel = computed<string>(() => {
        const config = this.config();

        if (!config || config.multiselect()) return '';

        /**
         * The SAME '' fallback renderValue() uses, and it has to be: with an
         * [optionDefault] declared, a null value leaves mat-select showing the row keyed
         * '' - so reading the raw value here would report nothing while the panel has the
         * 'Any' row ticked, and the trigger would paint blank.
         */
        const key = config.value() ?? '';

        return this.labelByKey().get(String(key)) ?? String(key);
    });

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /** called once, from the component's constructor */
    public bind(config: FormFieldSelectConfigType): void {
        this._config.set(config);
    }

    /** single select: the picked key, straight through */
    public setValue(next: any): void {
        this.config()?.value.set(next ?? null);
    }

    /**
     * the clear button.
     *
     * [] and not null in multiselect - the caller's property is typed as an array there,
     * and selectedKey() would have to keep un-nulling it.
     */
    public clear(): void {
        const config = this.config();

        config?.value.set(config.multiselect() ? [] : null);

        this.clearSearch();
    }

    /**
     * Blank the filter - the BOX as well as the query behind it.
     *
     * The DOM write is not optional: mat-select keeps its panel view alive between opens
     * rather than rebuilding it, so the input is the same element every time and setting
     * the signal alone leaves the last search sitting in a box whose list is no longer
     * filtered by it.
     */
    public clearSearch(): void {
        this.query.set('');

        const el = this.config()?.searchEl()?.nativeElement;

        if (el && el.value !== '') el.value = '';
    }

    /** [chips]: drop one key */
    public removeKey(key: any): void {
        const config = this.config();

        if (!config) return;

        config.value.set(this.selectedKey().filter((k) => String(k) !== String(key)));
    }

    /**
     * MULTISELECT: what <mat-select> handed back, turned into the value the field holds.
     *
     * The three cases are the All row's whole behaviour, and they are told apart by what
     * the incoming list carries rather than by what was clicked - Material reports a
     * selection, not an intent.
     */
    public applySelection(incoming: any[]): void {
        const config = this.config();

        if (!config) return;

        const all = this.allKey();
        const current = this.selectedKey().filter((key) => key !== FOUNDATION_ALL_VALUE);
        const next = (Array.isArray(incoming) ? incoming : [])
            .filter((key) => key !== FOUNDATION_ALL_VALUE);

        const wasAll = all.length > 0 && current.length === all.length;
        const hasAll = Array.isArray(incoming) && incoming.includes(FOUNDATION_ALL_VALUE);

        /** CASE 1: 'All' was clicked, and not everything was selected before */
        if (!wasAll && hasAll) {
            config.value.set(this.capped([...all]));

            return;
        }

        /**
         * CASE 2: 'Deselect' was clicked. The row gave up the sentinel while every real
         * key is still in the list - which is the only thing telling it apart from a
         * plain row clicked while everything happened to be selected.
         */
        if (wasAll && !hasAll && next.length === all.length) {
            config.value.set([]);

            return;
        }

        /** CASE 3: an ordinary row */
        config.value.set(this.capped(next));
    }

    /**
     * Put the caret in the filter box when the panel opens.
     *
     * setTimeout and not a straight read: the box only exists while the panel is open, so
     * viewChild() is still undefined when (opened) fires and resolves on the change
     * detection that follows. One turn of the loop is all it needs, and focus() touches
     * no signal, so there is nothing to schedule around it.
     */
    public focusSearch(): void {
        setTimeout(() => this.config()?.searchEl()?.nativeElement.focus());
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
     * Told apart by SHAPE, the same way an array is: a flat bag's value is a scalar or a
     * row, a group's value always carries its own [option], so there is nothing to guess.
     */
    private isGroupBag(bag: any): boolean {
        if (!bag || Array.isArray(bag)) return false;

        const first = bag instanceof Map
            ? [...bag.values()][0]
            : (typeof bag === 'object' ? Object.values(bag)[0] : null);

        return !!first && typeof first === 'object' && !Array.isArray(first) && 'option' in first;
    }

    /** does this row survive the filter? */
    private matches(row: FormFieldSelectEntryType, query: string): boolean {
        /**
         * Nothing typed: everything shows, and - because signal dependencies are tracked
         * as they are read - the row computeds take NO dependency on the selection in
         * that case, so an unfiltered panel does not re-render on every pick.
         */
        if (!query) return true;

        /**
         * A selected row is NEVER filtered out. Not cosmetic: <mat-select> re-derives its
         * selection from the options it can SEE, so a picked option pulled out of the DOM
         * drops out of the selection with it - and the next (selectionChange) would hand
         * back a value with the hidden picks silently missing.
         */
        if (this.selectedKeySet().has(String(row.key))) return true;

        return this.transloco.translate(row.label).toLowerCase().includes(query);
    }

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████

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
     * No | keyvalue pipe anywhere in this control, and that is deliberate twice over: it
     * allocates a fresh array on every change detection, and its default comparator
     * alphabetises - so today's CRUD block silently re-sorts a flat bag while leaving a
     * grouped one alone. Declaration order, always.
     */
    private entriesOf(source: any): Array<{ key: any; item: any }> {
        if (!source) return [];

        // an ARRAY entry is its own key - see FormFieldSelectOptionType
        if (Array.isArray(source)) return source.map((item) => ({ key: item, item }));

        // a Map hands the key back in its own type; Object.entries always stringifies
        if (source instanceof Map) return [...source].map(([key, item]) => ({ key, item }));

        return Object.entries(source).map(([key, item]) => ({ key: this.parseKey(key), item }));
    }

    /** one bag -> its normalized, filtered rows */
    private rowsOf(source: any): FormFieldSelectEntryType[] {
        const query = this.query();
        const out: FormFieldSelectEntryType[] = [];

        this.entriesOf(source).forEach(({ key, item }) => {
            const row: FormFieldSelectEntryType = { key, item, label: this.labelText(item, key) };

            if (this.matches(row, query)) out.push(row);
        });

        return out;
    }

    /** the flat text of a row: its own [label] when it carries one, else the value itself */
    private labelText(item: any, key: any): string {
        if (item === null || item === undefined) return String(key);

        return typeof item === 'object' ? String(item.label ?? key) : String(item);
    }

    /**
     * [maxSelection], enforced in ONE place. The panel disables the rows past the ceiling
     * so the user is told why, and this refuses whatever gets past a disabled row anyway -
     * a caller writing the value directly, or an All row on a bag that has since grown.
     */
    private capped(key: any[]): any[] {
        const max = this.config()?.maxSelection() ?? 0;

        return max > 0 && key.length > max ? key.slice(0, max) : key;
    }
}
