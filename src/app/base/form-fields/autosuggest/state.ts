// file: src/app/base/form-fields/autosuggest/state.ts
import { computed, debounced, effect, inject, resource, Service, signal, untracked } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { LogService } from '@libs/log/service';
import {
    FormFieldAutosuggestConfigType,
    FormFieldAutosuggestEntryType,
    FormFieldAutosuggestGroupEntryType,
    FormFieldAutosuggestOptionItemType,
    FormFieldAutosuggestResultType,
    FormFieldAutosuggestValueLoaderResultType,
} from '@base/form-fields/autosuggest/type';

/**
 * The low level holder: every signal, computed and raw store of this control, plus the
 * small transforms its own computeds need. Injected by service.ts, which is what the
 * component and the template talk to - so nothing in here injects the service back.
 *
 * Provided by the component -> one per rendered field, destroyed with it. Deliberately
 * NOT SignalStateService: that base class is for state that must survive a restart
 * (localStorage / session / cookie / server sync) and nothing here persists.
 *
 * Nothing survives the component either, and that is the trade this control makes on
 * purpose: a remounted field re-searches, and a saved key is renamed by [valueLoader]
 * for the cost of one request.
 */
@Service({ autoProvided: false })
export class FormFieldAutosuggestState {

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly log = inject(LogService);

    /** for ONE string: the heading a grouped panel files typed values under */
    private readonly transloco = inject(TranslocoService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    /**
     * The group typed values are filed under in a GROUPED panel, and a key no loader
     * will ever return - group keys come from the data, this one comes from here.
     */
    private readonly customGroupKey = '__custom__';

    /**
     * dependency key -> query text -> result. Dependent controls must never offer rows
     * fetched for a previous parent; independent controls use one empty dependency bucket.
     */
    private readonly cache = new Map<string, Map<string, FormFieldAutosuggestResultType>>();

    /** Tracks related-field context changes without making the previous value reactive state. */
    private dependentFieldValueInitialized = false;
    private previousDependentFieldValueKey = '';

    /**
     * option key -> plain label. What [displayWith] reads, and the control's memory of
     * "42 means India". Also plain: Material calls displayWith imperatively.
     */
    private readonly label = new Map<string, string>();

    /** keys already sent to valueLoader, so a cold key is asked for once */
    private readonly asked = new Set<string>();

    /**
     * keys the user typed rather than picked. What the 'save this' action reads to know
     * a value still needs saving - in the panel, in the box and on a chip.
     */
    private readonly custom = new Set<string>();

    /**
     * keys whose last save attempt came back with nothing usable. A SIGNAL, unlike the
     * sets above: nothing else moves when a save fails, so this is what repaints the
     * action in danger colours.
     */
    private readonly _failed = signal<string[]>([]);

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    /**
     * The component's inputs, set once by bind() from its constructor.
     *
     * A signal and not a plain field: every computed below reads it, and a computed
     * that happened to run before bind() would otherwise cache its null answer forever.
     */
    private readonly _config = signal<FormFieldAutosuggestConfigType | null>(null);
    public readonly config = this._config.asReadonly();

    /** what the user typed; service.onQuery writes here on every keystroke */
    public readonly query = signal<string>('');

    /** the custom row waiting for a group pick (grouped fields only) */
    public readonly customSavePending = signal<{ key: any; item: any } | null>(null);

    /** the group the user chose to save under in the group picker */
    public readonly customSaveGroupKey = signal<any>(null);

    /**
     * quiet time before the value is passed on.
     *
     * The function form of [wait] rather than a plain number, so the delay is read per
     * keystroke instead of captured before the inputs exist. It is exactly what the
     * number form does internally (core.mjs:3313 `typeof wait === 'number' ? () => new
     * Promise(r => setTimeout(r, wait)) : wait`), stale-timer guard included.
     */
    private readonly queryDebounced = debounced(
        this.query,
        () => new Promise<void>((done) => setTimeout(done, this.config()?.debounce() ?? 300)),
    );

    /**
     * Bumped ONLY when a label arrives out of band - from valueLoader(), which resolves
     * after Material has already painted the box, so the box has to be repainted (see
     * [repaint] below), and after the resource decided it had nothing to show, so
     * params() has to be asked again (see [result] below).
     *
     * The render path learns labels too, but from inside a computed(), where a signal
     * write is an error - and nothing needs repainting while the panel is open anyway.
     * So it writes [label] directly and never touches this.
     *
     * Declared ABOVE [result] because params() reads it: class fields initialise in
     * order, and the other way round leaves the lambda holding an undefined.
     */
    private readonly _learned = signal<number>(0);

    /**
     * MODE B: the field's own resource. With no [optionLoader] bound,
     * params() returns undefined forever and this resource sits idle.
     */
    public readonly result = resource<
        FormFieldAutosuggestResultType,
        { query: string; dependentFieldValue: any; dependentFieldValueKey: string } | undefined
    >({
        params: () => {
            /**
             * TRACKED on purpose, and it must stay that way: if this ran before bind()
             * and every read in it were untracked, the computation would register no
             * dependency at all and the resource would sit idle for good.
             */
            const config = this.config();

            if (!config) return undefined;

            /**
             * untracked: the query text drives the request, the callback's identity must
             * not. An inline arrow at the call site would otherwise hand us a new
             * function on every change detection and refetch on each one.
             */
            const optionLoader = untracked(() => config.optionLoader());

            if (!optionLoader) return undefined;   // no loader: resource stays idle
            if (config.disabled()) return undefined;

            const dependentFieldValue = config.dependentFieldValue();
            const dependentFieldValueKey = this.toDependentFieldValueKey(dependentFieldValue);

            const q = (this.queryDebounced.value() ?? '').trim();

            if (q.length >= config.minLength()) {
                return { query: q, dependentFieldValue, dependentFieldValueKey };
            }

            /**
             * Too short to search, but do NOT go idle: idle resets value() back to
             * defaultValue and the panel empties out.
             *
             * '' is a real params value - the resource treats ONLY undefined as idle -
             * and the loader reads it as "show everything cached".
             *
             * undefined only on a cold field, where there is nothing to show yet.
             *
             * [_learned] is read for the dependency: [cache] is a plain Map, so the rows
             * valueLoader files there move nothing on their own, and a field that went
             * idle while cold would stay idle with them sitting unread.
             */
            this._learned();

            return (this.cache.get(dependentFieldValueKey)?.size ?? 0) > 0
                ? { query: '', dependentFieldValue, dependentFieldValueKey }
                : undefined;
        },
        defaultValue: {},
        loader: async ({ params, abortSignal }): Promise<FormFieldAutosuggestResultType> => {
            /**
             * '' = the box is empty. Hand back the union of every search made since this
             * field mounted, merged straight out of the cache - so typing "as", "eu",
             * "oc" and then clearing shows all of them, not just the last one's rows.
             * No request: every row here has already been fetched.
             */
            if (params.query === '') {
                const all = new Map<string | number, any>();
                const grouped = this.isGrouped();

                this.cache.get(params.dependentFieldValueKey)?.forEach((result) => {
                    this.entry(result).forEach((e) => {
                        if (!grouped) {
                            all.set(e.key, e.item);

                            return;
                        }

                        /**
                         * PER GROUP, exactly like learn() below: two searches that both
                         * hit the same region are two halves of one group, and setting
                         * the second over the first would drop the rows of the first.
                         */
                        const group = all.get(e.key) ?? { ...e.item, option: new Map() };

                        group.option = this.learnRow(group.option, e.item?.option);

                        all.set(e.key, group);
                    });
                });

                return all;
            }

            const dependencyCache = this.cache.get(params.dependentFieldValueKey) ?? new Map<
                string,
                FormFieldAutosuggestResultType
            >();
            const hit = dependencyCache.get(params.query);

            if (hit) return hit;

            // the one line the caller owns: its api call, its response shape
            const optionLoader = untracked(() => this.config()!.optionLoader()!);
            const out = await optionLoader({
                query: params.query,
                abortSignal,
                dependentFieldValue: params.dependentFieldValue,
            });

            dependencyCache.set(params.query, out);
            this.cache.set(params.dependentFieldValueKey, dependencyCache);

            return out;
        },
    });

    // ████ COMPUTED PROPERTIES █████████████████████████████████████████

    /**
     * [option] + [optionDefault] - what displayWith seeds from.
     *
     * THE ONE PLACE [option] stops being a declaration and becomes data. Two reads deep:
     * config().option() takes the INPUT's value, which may itself be a signal - see
     * FormFieldAutosuggestOptionType - and the second call takes that signal's value.
     * Both happen inside this computed, so a seed that arrives late is picked up.
     *
     * ⚠ The unwrap has to come BEFORE the spread: spreading a function yields no keys at
     * all, so the seed would silently be nothing but [optionDefault].
     */
    private readonly seed = computed<Record<string | number, any>>(() => {
        const source = this.config()?.option() ?? {};
        const option = typeof source === 'function' ? source() : source;

        return {
            ...option,
            ...(this.config()?.optionDefault() ?? {}),
        };
    });

    /**
     * the 'Any' / 'None' row above the results. SINGLE select only.
     *
     * There is no such thing as an 'Any' CHIP: its key is '' and picking it would file
     * an empty string among the selected keys - a blank chip, sent to the api as a real
     * value. [optionDefault] still feeds [seed] in multiselect, so a caller using it as
     * a label bag keeps that half.
     */
    public readonly defaultOption = computed(() =>
        this.config()?.multiselect() ? null : this.firstOption(this.config()?.optionDefault()),
    );

    /**
     * ONE branch for the whole control, reading a DECLARATION rather than sniffing the
     * payload: [template].group set = the loader returns groups.
     */
    public readonly isGrouped = computed<boolean>(() => !!this.config()?.template()?.group);

    /**
     * NOT result().value() at the call sites below.
     *
     * value() THROWS a ResourceValueError once the loader has rejected
     * (_resource-chunk.mjs:233) - [defaultValue] only covers "never loaded" and
     * "reloading after an error". The rows are read ABOVE the error row in the
     * template, so reading it raw would blow the whole panel up and the clickable retry
     * row would never render.
     */
    private readonly resultValue = computed(() => {
        return this.result.error() ? null : this.result.value();
    });

    /**
     * The rows. Both learn labels as they normalize - a write, but into a plain Map,
     * never a signal, so a computed() is a legal home for it. It also means the
     * normalizer runs once per new result rather than once per template read.
     */
    public readonly optionEntry = computed<FormFieldAutosuggestEntryType[]>(() =>
        this.isGrouped() ? [] : this.option(this.resultValue()),
    );

    public readonly groupEntry = computed<FormFieldAutosuggestGroupEntryType[]>(() =>
        this.isGrouped() ? this.group(this.resultValue()) : [],
    );

    /**
     * Recomputed when the seed changes, which is the point: [option] can be stamped
     * late and the new bag has to reach Material. Identity is stable in between, so the
     * binding does not churn every change detection.
     */
    public readonly displayWith = computed(() => this.createDisplayWith(this.seed()));

    /**
     * the 'no match' row.
     *
     * NOT shown while the resource is idle: a cold field would otherwise greet the user
     * with "No match found" the moment the empty box takes focus, before anything has
     * been typed. With no rows at all Material hides the panel instead
     * (_setVisibility at options.length === 0), which is what should happen.
     *
     * BOTH entry lists are tested, and a grouped field is not excluded - it used to be,
     * and that was the bug: optionEntry() is always empty when grouped, so the test had
     * to be skipped there, which left a grouped field with no results rendering ZERO
     * options. Material then hid the panel, and a hidden panel is a CLOSED panel
     * (panelOpen = _overlayAttached && showPanel), so the trigger emitted (closed) at
     * autocomplete.mjs:651 the moment the empty result landed - and the multiselect
     * (closed) handler wiped the box the user was still typing in.
     *
     * One row is all it takes to keep the panel alive, which is what the flat field was
     * quietly getting right all along.
     */
    public readonly showNoMatch = computed<boolean>(
        () => this.result.status() !== 'idle'
            && !this.optionEntry().length
            && !this.groupEntry().length
            && !this.customOption(),   // that row already says what to do about it
    );

    // ████ CUSTOM VALUE █████████████████████████████████████████████████

    /**
     * The typed text, offered as a value of its own - the 'Use "…"' row - or null when
     * [customValue] is off, the box is empty, or that text is already a chip.
     *
     * The text IS the key: nothing has to be invented, and displayWith() names an
     * unknown key after itself, so the chip reads correctly with no label to learn.
     *
     * Read off [query] rather than the debounced copy: this row costs no request, so
     * there is nothing to wait for.
     */
    public readonly customOption = computed<string | null>(() => {
        if (!this.config()?.customValue()) return null;

        const text = this.query().trim();

        if (!text) return null;

        const taken = this.selectedChips().some(
            (chip) => chip.label.toLowerCase() === text.toLowerCase(),
        );

        return taken ? null : text;
    });

    /**
     * SINGLE select: the value, when the user typed it - what the box's own 'save this'
     * button is drawn from. Shaped like a chip, so both call the same handler.
     *
     * [_learned] is read because [custom] is a plain Set: keepCustom() fills it and
     * commitCustom() empties it, and both go through learn(), which is what moves.
     */
    public readonly customSelected = computed<{ key: any; label: string } | null>(() => {
        const config = this.config();

        if (!config || config.multiselect()) return null;

        this._learned();

        const key = config.value();

        return this.custom.has(String(key))
            ? { key, label: this.displayWith()(key) }
            : null;
    });

    /**
     * EVERY group this field has seen - what the "save it under which group?" picker
     * offers, and NOT what the panel is currently showing.
     *
     * groupEntry() is the wrong list to pick a group from, twice over: it holds only the
     * groups the CURRENT query answered with, and group() then drops any group whose
     * rows are all filtered out. Select a typed value in a single select field and the
     * query IS that typed text - whose result is the custom group and nothing else - so
     * the picker rendered a heading, two buttons, and not one radio. Clicking the same
     * action from a row in an open panel worked only because the query behind it still
     * had real groups in its answer.
     *
     * [cache] is the union of every search this field has made, which is the honest set
     * of groups a value can be filed under. The synthetic custom group is not one of
     * them - a typed value cannot be saved into the bucket typed values sit in.
     *
     * [_learned] and [resultValue] are read for their DEPENDENCIES alone: [cache] is a
     * plain Map, so neither the loader filling it nor learn() merging into it moves
     * anything a computed could notice by itself.
     */
    public readonly customSaveGroup = computed<FormFieldAutosuggestEntryType[]>(() => {
        if (!this.isGrouped()) return [];

        this._learned();
        this.resultValue();

        const all = new Map<any, any>();

        this.currentDependentFieldValueCache().forEach((result) => {
            this.entry(result).forEach((e) => {
                if (e.key === this.customGroupKey || e.item?.custom) return;

                // FIRST answer wins: later searches carry the same heading, fewer rows
                if (!all.has(e.key)) all.set(e.key, e.item);
            });
        });

        return [...all].map(([key, item]) => ({ key, item }));
    });

    // ████ MULTISELECT ██████████████████████████████████████████████████

    /** Selected keys as array. Single mode = []. */
    public readonly selectedKeys = computed<any[]>(() => {
        if (!this.config()?.multiselect()) return [];
        const v = this.config()!.value();
        return Array.isArray(v) ? v : (v != null && v !== '' ? [v] : []);
    });

    /** {key, label} pairs for chip display. Reads the label map that option()/learn() already feed. */
    public readonly selectedChips = computed(() => {
        /**
         * Read for the dependency alone. [label] is a plain Map, so a name that lands
         * out of band - valueLoader answering for a value the form was OPENED on -
         * changes nothing this computed tracks, and a chip painted before that answer
         * would go on calling itself "3" for the life of the field. [_learned] is the
         * one signal that moves when that happens, and this is where it is spent.
         */
        this._learned();

        /**
         * displayWith() and not the [label] Map straight: it is the ONE definition of
         * "what does this key read as", and reading the computed is also what merges
         * the caller's [option] seed into the map in the first place. Off the raw Map a
         * chip could paint before that merge had happened - the panel's [displayWith]
         * binding sits BELOW the chip grid in the template - and a key the caller named
         * directly in [option] would render as its own id.
         */
        const displayWith = this.displayWith();

        return this.selectedKeys().map(key => ({
            key,
            label: displayWith(key) || String(key),
            custom: this.custom.has(String(key)),
        }));
    });

    /**
     * the chips are at [maxSelection] and nothing more can go in.
     *
     * ONE definition for both halves of the rule: the template disables the box off it
     * so the user is told, and addChip() below refuses off it so nothing can get past a
     * disabled box - a paste, an Enter on an already open panel, a caller reaching in.
     *
     * Two ways to never be full, and both are the normal case: a single select, whose
     * selectedKeys() is [] - so without the multiselect() test a maxSelection of 1
     * would read 0 >= 1 and report it permanently full - and maxSelection 0, which is
     * the default and means no ceiling at all.
     */
    public readonly isFull = computed<boolean>(() => {
        const config = this.config();

        if (!config?.multiselect()) return false;

        const max = config.maxSelection();

        return max > 0 && this.selectedKeys().length >= max;
    });

    /** One disabled rule for every interactive element in the control. */
    public readonly isDisabled = computed<boolean>(() =>
        !!this.config()?.disabled(),
    );

    // ████ LISTENERS ███████████████████████████████████████████████████

    /**
     * A key with no label yet - a form opened on a saved record. Ask once; claimAsk()
     * remembers the key, so this cannot loop however often the effect re-runs.
     *
     * Never in free text mode. Without [requireSelection] the trigger calls _onChange
     * on every keystroke (autocomplete.mjs:574), so [value] would step through "i",
     * "in", "ind" … and each one is a key nothing has rendered - one lookup per
     * character. Free text is its own label anyway: there is nothing to name.
     */
    private readonly coldValue = effect(() => {
        const config = this.config();

        if (!config || !config.requireSelection()) return;

        const valueLoader = config.valueLoader();

        if (!valueLoader) return;

        /**
         * ONE lookup per KEY, never one for the value as a whole.
         *
         * In multiselect the value is an ARRAY, and String([2, 3]) is "2,3" - a key no
         * label map will ever hold and no loader was ever asked for. So the whole value
         * read as cold on every single change: the form opened, the loader ran for
         * "2,3"; a chip went in, and "2,3,5" was a brand new cold value, so it ran
         * again; a chip came out, and so did "2,5". Per key it asks for what it does not
         * know and nothing else - which for a picked chip is nothing at all, because the
         * row it was picked from named it on the way past (see option()).
         */
        const cold = (config.multiselect() ? this.selectedKeys() : [config.value()])
            .filter((key) => !this.hasLabel(key));

        if (!cold.length) return;

        /**
         * ALWAYS an array, in single select too, where it is one key long.
         *
         * The loader is asked to name KEYS, and how many of them there are is a fact
         * about the field, not about the request. Handing over the caller's own shape
         * instead only means every loader opens by branching on a case its own field
         * can never be in - and gets it wrong the day [multiselect] is flipped, which
         * is a change to the FIELD and has no business being a change to its loader.
         *
         * One shape, one `where id IN (…)`, both modes.
         */
        this.resolveValue(cold, valueLoader);
    });

    /**
     * A new related-field context gets a clean query surface and its own cache bucket.
     * The caller owns the selected value through the parent field's on_change callback.
     */
    private readonly dependentFieldValueChange = effect(() => {
        const config = this.config();
        if (!config) return;

        const dependentFieldValueKey = this.toDependentFieldValueKey(
            config.dependentFieldValue(),
        );

        if (!this.dependentFieldValueInitialized) {
            this.dependentFieldValueInitialized = true;
            this.previousDependentFieldValueKey = dependentFieldValueKey;
            return;
        }

        if (dependentFieldValueKey === this.previousDependentFieldValueKey) return;

        this.previousDependentFieldValueKey = dependentFieldValueKey;

        this.clearInput();
        this.customSavePending.set(null);
        this.customSaveGroupKey.set(null);
    });

    /**
     * Repaint when a label lands AFTER the value did. Material paints the box once, in
     * a microtask (autocomplete.mjs:522 writeValue), so nothing else would ever show
     * the answer valueLoader just fetched.
     */
    private readonly repaint = effect(() => {
        this._learned();   // the reason that is a signal

        const config = this.config();

        if (!config || config.multiselect()) return;

        /**
         * Never in multiselect: there the value is an ARRAY held by the chips, and the
         * box is a query field the user types in - painting displayWith(array) into it
         * would stamp a stringified array over what they are typing.
         */
        const text = this.displayWith()(config.value());
        const el = config.inputEl()?.nativeElement;

        // never fight the user: only repaint a box they are not typing in
        if (el && document.activeElement !== el && el.value !== text) el.value = text;
    });

    /**
     * mat-chip-grid's error display, driven by hand.
     *
     * updateErrorState() is the exact method Angular itself calls from ngDoCheck() - but
     * only `if (this.ngControl)`, which this control deliberately never gives it (see
     * FormFieldAutosuggestConfigType.chipGrid for why). Calling it directly needs no
     * ngControl at all: _getCurrentErrorState() falls back to a null control, and the
     * matcher bound on <mat-chip-grid> in template.html (component.errorMatcher) ignores
     * that argument anyway - it answers with the caller's own [error] flag.
     */
    private readonly chipGridError = effect(() => {
        const config = this.config();
        if (!config?.multiselect()) return;

        config.error();   // the dependency this effect exists to react to

        config.chipGrid()?.updateErrorState();
    });

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /** called once, from the component's constructor */
    public bind(config: FormFieldAutosuggestConfigType): void {
        this._config.set(config);
    }

    /** multiselect: add a key, skip duplicates and empties, refuse once [maxSelection] is reached */
    public addChip(key: any): void {
        const config = this.config();
        if (!config || this.isFull()) return;

        /**
         * An OPTION key, and the one value that is never one is '' - the 'Any' row's
         * key. Nothing else can arrive empty, and CRUD's MULTISELECTAUTOSUGGEST
         * normalizer drops it on the way back out too, so agreeing here means a chip
         * cannot exist that the value it belongs to would refuse.
         *
         * Unrelated to the '' the cache is keyed on: that one is a QUERY - the empty
         * box - and the union loader reads cache values, never their keys.
         */
        if (key === null || key === undefined || key === '') return;

        const current = this.selectedKeys();
        if (current.some(k => String(k) === String(key))) return;

        config.value.set([...current, key]);
        this.clearInput();
    }

    /**
     * The 'Use "…"' row was the one picked: file it like any other result, so the empty
     * box offers it back and a removed chip can be re-added without retyping.
     *
     * Not for a grouped field: everything in that cache is a group, and a typed word
     * belongs to none of them.
     */
    public keepCustom(key: any): void {
        if (String(key) !== this.customOption()) return;

        const text = String(key);
        const row = { key: text, label: text, custom: true };

        this.custom.add(text);

        /**
         * Filed like any other server answer, so the panel offers it back the moment the
         * value lets go of it. learn() names it on the way past, which is also what
         * stops coldValue handing a typed word to the caller's valueLoader as an id.
         *
         * A GROUPED panel holds groups only, so typed values get one of their own: a
         * flat row filed among them is walked for an .option it has not got and drops
         * out of the panel - which is exactly what a removed chip looked like before.
         *
         * Both the group and the row carry custom: true, so [template.group] and
         * [template.option] can tell them apart from anything the server sent.
         */
        this.learn(this.isGrouped()
            ? {
                [this.customGroupKey]: {
                    key: this.customGroupKey,
                    label: this.transloco.translate('GL.FIELD.COMMON.CUSTOM_GROUP'),
                    icon: 'edit_note',
                    custom: true,
                    option: { [text]: row },
                },
            }
            : { [text]: row });
    }

    /**
     * The trailing icon on a custom row: handed straight to the caller, because saving
     * the typed value is the module's business and not this control's.
     *
     * keep() is the way back in - whatever the caller saved is filed exactly like a
     * valueLoader answer, so a real record can replace the typed row in the panel.
     */
    public runCustomSelection(key: any, item: any): void {
        this.setFailed(key, false);   // a new attempt clears the last one's verdict

        if (this.isGrouped()) {
            this.customSavePending.set({ key, item });
            // keep the panel open so the user can pick a group
            this.config()?.triggerEl()?.openPanel();
        } else {
            this.config()?.customAdd.emit({
                key,
                item,
                groupKey: null,
                keep: (record) => this.commitCustom(key, record),
            });
        }
    }

    /** The user picked a group and clicked Save in the group picker */
    public confirmCustomSave(): void {
        const pending = this.customSavePending();
        if (!pending) return;

        this.config()?.customAdd.emit({
            key: pending.key,
            item: pending.item,
            groupKey: this.customSaveGroupKey(),
            keep: (record) => this.commitCustom(pending.key, record),
        });

        this.cancelCustomSave();
    }

    /** The user clicked Cancel in the group picker */
    public cancelCustomSave(): void {
        this.customSavePending.set(null);
        this.customSaveGroupKey.set(null);
    }

    /**
     * A real record has come back for a typed value: file it, drop the placeholder it
     * replaces, and put its key in the field - from here the value is an id like every
     * other pick, and submit sends it as one.
     *
     * Nothing back means the caller had nothing to save, and the typed row stays exactly
     * as it was.
     */
    private commitCustom(
        key: any,
        record: FormFieldAutosuggestValueLoaderResultType
            | void
            | Promise<FormFieldAutosuggestValueLoaderResultType | void>,
    ): void {
        void Promise.resolve(record)
            .then((saved) => {
                const to = saved ? this.rowKey(saved)[0] : undefined;

                /**
                 * Nothing usable back - no answer at all, or one naming no row. The
                 * value is still only text, so nothing is committed and the action says
                 * so rather than half-dropping the row it could not replace.
                 */
                if (to === undefined) return this.setFailed(key, true);

                this.learn(saved!);
                this.dropCustom(key);
                this.swapValue(key, to);

                /**
                 * The panel is on the empty box here - params() is '' and stays '', so
                 * nothing else would ask the resource to read the cache it just changed.
                 * No request: the loader answers '' out of the cache.
                 */
                this.result.reload();
            })
            .catch((e) => {
                this.setFailed(key, true);
                this.log.error('FormFieldAutosuggestState.commitCustom', e);
            });
    }

    /**
     * Blank the visible box and the query behind it.
     *
     * The DOM write is not optional in multiselect: there is no ngModel on that input,
     * and MatAutocompleteTrigger._setValueAndClose has already painted displayWith(key)
     * into it (autocomplete.mjs:691) BEFORE (optionSelected) fires - so without this the
     * typed text is replaced by the picked label and just sits there behind the chips.
     */
    public clearInput(): void {
        this.query.set('');

        const el = this.config()?.inputEl()?.nativeElement;

        if (el && el.value !== '') el.value = '';
    }

    /** multiselect: remove one key */
    public removeChip(key: any): void {
        const config = this.config();
        if (!config) return;

        config.value.set(this.selectedKeys().filter(k => String(k) !== String(key)));
    }

    /**
     * Out-of-band labels: from valueLoader only. Bumps [learned] so the input can be
     * repainted, which the render path must never do - see [_learned].
     *
     * The answer is also cached, exactly like a typed query's answer: it IS a server
     * result and behaves like one, so deselecting a value the form opened on offers it
     * again straight away, off a row already paid for. It goes in under '' - the query
     * that fetched it - which is the same slot the empty box already reads.
     *
     * Rows answered with a bare label carry only that label, because that is all they
     * were given; a template drawing more than item.label wants the item form.
     *
     * A GROUPED field's loader answers in the shape ITS panel is read in - groupKey =>
     * { label, icon, option } - because everything already in that cache is a group. A
     * flat row filed there would be walked for an .option it has not got, and a row key
     * that happened to match a group key would displace the whole group.
     */
    private learn(record: FormFieldAutosuggestValueLoaderResultType): void {
        // merged, never replaced: single select learns one key at a time
        const dependencyCache = this.currentDependentFieldValueCache();
        const cached = (dependencyCache.get('') ?? new Map()) as Map<string | number, any>;
        const grouped = this.isGrouped();

        this.entry(record).forEach((e) => {
            const item = (e.item && typeof e.item === 'object' ? e.item : { label: String(e.item) });

            if (!grouped) {
                this.label.set(String(e.key), String(item.label ?? e.key));
                cached.set(e.key, item);

                return;
            }

            /**
             * The names live one level down, and the merge is PER GROUP: two lookups
             * answering for the same region must join it, not replace it.
             */
            const group = cached.get(e.key) ?? { ...item, option: new Map() };

            group.option = this.learnRow(group.option, item.option);

            cached.set(e.key, group);
        });

        if (cached.size) {
            dependencyCache.set('', cached);
            this.cache.set(this.currentDependentFieldValueKey(), dependencyCache);
        }

        this._learned.update((n) => n + 1);
    }

    /** rows of [add] merged into [into], every label learned on the way past */
    private learnRow(into: any, add: any): Map<string | number, FormFieldAutosuggestOptionItemType> {
        const out: Map<string | number, FormFieldAutosuggestOptionItemType> = into instanceof Map
            ? into
            : new Map(this.entry(into).map((e) => [e.key, e.item]));

        this.entry(add).forEach((e) => {
            this.label.set(String(e.key), String(e.item?.label ?? e.key));
            out.set(e.key, e.item);
        });

        return out;
    }

    /** true while this key's last save attempt failed - the action paints danger */
    public isFailed(key: any): boolean {
        return this._failed().includes(String(key));
    }

    /** the action's own error state, per key */
    private setFailed(key: any, failed: boolean): void {
        const k = String(key);

        this._failed.update((all) => (failed ? [...all, k] : all.filter((x) => x !== k)));
    }

    /**
     * the OPTION keys a valueLoader-shaped answer names - one level down when grouped,
     * where the outer keys are the groups and the rows live under their .option.
     */
    private rowKey(record: FormFieldAutosuggestValueLoaderResultType): any[] {
        return this.isGrouped()
            ? this.entry(record).flatMap((grp) => this.entry(grp.item?.option).map((e) => e.key))
            : this.entry(record).map((e) => e.key);
    }

    /** the typed placeholder, once a real row has taken its place */
    private dropCustom(key: any): void {
        const cached = this.currentDependentFieldValueCache().get('') as Map<any, any> | undefined;
        const group = cached?.get(this.customGroupKey);
        const bag: Map<any, any> | undefined = this.isGrouped() ? group?.option : cached;

        bag?.delete(this.parseKey(key));
        this.custom.delete(String(key));

        // the custom group goes with its last row: a heading over nothing is a bug
        if (this.isGrouped() && !bag?.size) cached?.delete(this.customGroupKey);
    }

    /** the typed key replaced by the real one, in whichever shape the value holds */
    private swapValue(from: any, to: any): void {
        const config = this.config();

        if (!config || to === undefined) return;

        if (config.multiselect()) {
            config.value.set(
                this.selectedKeys().map((k) => (String(k) === String(from) ? to : k)),
            );

            return;
        }

        if (String(config.value()) === String(from)) config.value.set(to);
    }

    /**
     * "has this key already been sent to valueLoader?", and claim it if not. One call
     * so the check and the claim cannot drift apart.
     */
    private claimAsk(value: any): boolean {
        const key = String(value);

        if (this.asked.has(key)) return false;

        this.asked.add(key);

        return true;
    }

    /** a failed lookup releases its key, so a retry is allowed to happen */
    private releaseAsk(value: any): void {
        this.asked.delete(String(value));
    }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████

    /**
     * '42' -> 42, 'true' -> true. Object keys are always strings, so without this the
     * [value] binding hands a string to a record holding a number and the selected row
     * never matches.
     */
    private parseKey(key: string | number | symbol): any {
        const keyStr = String(key);

        if (keyStr === 'true') return true;
        if (keyStr === 'false') return false;
        if (!isNaN(Number(keyStr)) && keyStr.trim() !== '') return Number(keyStr);

        return keyStr;
    }

    /** true when this key can already be named without asking anyone */
    private hasLabel(value: any): boolean {
        if (value === null || value === undefined || value === '') return true;

        const key = String(value);

        return this.label.has(key) || key in this.seed();
    }

    /** The dependency bucket currently visible to this mounted control. */
    private currentDependentFieldValueCache(): Map<string, FormFieldAutosuggestResultType> {
        return this.cache.get(this.currentDependentFieldValueKey()) ?? new Map();
    }

    private currentDependentFieldValueKey(): string {
        return this.toDependentFieldValueKey(this.config()?.dependentFieldValue());
    }

    private toDependentFieldValueKey(value: any): string {
        if (this.isEmptyDependentFieldValue(value)) return '__empty__';

        try {
            return JSON.stringify(value) ?? String(value);
        } catch {
            return String(value);
        }
    }

    private isEmptyDependentFieldValue(value: any): boolean {
        return value === null
            || value === undefined
            || value === ''
            || (Array.isArray(value) && value.length === 0);
    }

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████

    /**
     * Name a key nothing has rendered - a form opened on a saved record. Asked ONCE per
     * key: the answer goes into [label], and a failure releases the key so a retry can
     * happen.
     *
     * Deliberately fire-and-forget. The value is already correct; only its label is
     * missing, and a page is not worth breaking over a label.
     */
    private resolveValue(
        key: any[],
        run: (key: any[]) => FormFieldAutosuggestValueLoaderResultType
            | Promise<FormFieldAutosuggestValueLoaderResultType>,
    ): void {
        /**
         * Claimed one by one, and only the keys that survive the claim are sent: a
         * second chip added while the first lookup is still in the air asks for itself
         * alone, not for the pair.
         */
        const cold = key.filter(
            (k) => k !== null && k !== undefined && k !== '' && this.claimAsk(k),
        );

        if (!cold.length) return;

        void Promise.resolve()
            .then(() => run(cold))
            .then((record) => this.learn(record))
            .catch((e) => {
                cold.forEach((k) => this.releaseAsk(k));
                this.log.error('FormFieldAutosuggestState.resolveValue', e);
            });
    }

    /** the single 'Any' / 'None' row above the results, or null */
    private firstOption(
        option: Record<string, any> | null | undefined,
    ): { key: any; value: any } | null {
        const first = Object.entries(option ?? {})[0];

        if (!first) return null;

        return { key: first[0] === '' ? '' : this.parseKey(first[0]), value: first[1] };
    }

    /** object | Map -> entries in the order the loader produced them */
    private entry(source: any): FormFieldAutosuggestEntryType[] {
        if (!source) return [];

        // a Map hands back the key in its own type; Object.entries always stringifies
        return source instanceof Map
            ? [...source].map(([key, item]) => ({ key, item }))
            : Object.entries(source).map(([key, item]) => ({ key: this.parseKey(key), item }));
    }

    /**
     * rows, recording each label in [label] on the way past.
     *
     * Not misplaced: MatAutocompleteTrigger._setValueAndClose calls _assignOptionValue
     * -> displayWith(key) at autocomplete.mjs:691 BEFORE it emits (optionSelected) at
     * :693 - so learning the label on selection is two lines too late and the input
     * would keep the raw key. It has to be known while the row renders, and it always
     * can be: nothing gets picked that was not rendered first.
     *
     * Writes the plain Map only - never learn() - because this runs inside a computed(),
     * where a signal write is an error.
     */
    private option(source: any): FormFieldAutosuggestEntryType[] {
        const entry = this.entry(source);

        entry.forEach((e) => this.label.set(String(e.key), String(e.item?.label ?? e.key)));

        /**
         * multiselect: a key already sitting in the chips is not offered a second time,
         * and comes back the moment its chip is removed - selectedKeys() is a signal, so
         * both directions are one recompute of the computed that called this.
         *
         * AFTER the learn loop above on purpose: the chips read their text out of
         * [label], so a row still has to be named on its way OUT of the list.
         *
         * Single select gets [] from selectedKeys(), so this is one length check.
         */
        const selected = this.selectedKeys();

        if (!selected.length) return entry;

        const taken = new Set(selected.map(String));

        return entry.filter((e) => !taken.has(String(e.key)));
    }

    /**
     * groups, each carrying its rows already normalized, learned and filtered.
     *
     * A group left with no rows is dropped with them: option() above hides what is
     * already picked, and a bare heading over nothing reads as a rendering bug.
     */
    private group(source: any): FormFieldAutosuggestGroupEntryType[] {
        return this.entry(source)
            .map((grp) => ({
                key: grp.key,
                item: grp.item,
                option: this.option(grp.item?.option),
            }))
            .filter((grp) => grp.option.length);
    }

    /**
     * [displayWith]. mat-autocomplete keeps the KEY in the model and paints the input
     * itself by calling this with that key - so it has to name a key that is often no
     * longer in the visible result: the user typed on and the resource moved. option()
     * above keeps the map fed.
     *
     * [seed] is the caller's own key => label bag ([option] + [optionDefault]). Merged
     * on every call, not once: that bag can be stamped LATE - a form resolving a
     * relation off a record it has just loaded - and a one-shot seed would miss it. The
     * has() guard means a label learned from a rendered row always wins, and re-seeding
     * is a no-op once the key is known.
     */
    private createDisplayWith(seed: Record<string | number, any>): (value: any) => string {
        Object.entries(seed ?? {}).forEach(([k, v]) => {
            if (!this.label.has(k)) this.label.set(k, String(v));
        });

        return (value: any) =>
            value === null || value === undefined || value === ''
                ? ''
                : (this.label.get(String(value)) ?? String(value));
    }
}
