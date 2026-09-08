// file: src/app/base/crud/utility.ts
import { formatDate } from "@angular/common";
import { inject, Service } from "@angular/core";
import {
    CrudFieldOptionSourceType,
    CrudFieldOptionType,
    CrudFieldSwitchOptionType,
    CrudModuleContextType,
} from "@base/crud/type";
import type { FindOperatorDto } from "@bfw/api-sdk/graphql/libs";
import { MatchScalarExpressionEnum } from "@bfw/api-sdk/graphql/libs/crud.enum";
import { SignatureService } from "@libs/signature/service";
import { UrlService } from "@libs/url/service";

@Service({ autoProvided: false })
export class CrudUtility {
    private readonly sign = inject(SignatureService);
    private readonly ump = inject(UrlService);

    constructor() {}

    // █████ ENCRYPTION ████████████████████████████████████████████████
    /**
     * ⚠ PARKED, NOT DEAD. Nothing calls these at runtime right now.
     *
     * They only ever ran behind `apply_enc: true`, and the one field that set
     * it — listing_selected_rows — now carries the SECONDARY key in the clear,
     * because that key is already opaque and needs no alias in front of it.
     * CrudValidation's encIfNeeded / decryptOneSafe / encryptOneSafe all
     * short-circuit on `!fi.apply_enc`, so this whole layer is bypassed.
     *
     * Kept, deliberately and primary-key salted, for the day a field needs
     * primary-key values in the url again. Set apply_enc back to true on that
     * field and this wakes up unchanged.
     *
     * ⚠ the primary key NAME is baked into the salt below — changing which key
     * feeds encId invalidates every alias already handed out in a bookmarked
     * or shared url.
     */

    public encPrimaryKey(
        id: string,
        context: CrudModuleContextType
    ): string {
        // checking with signature character
        if(this.sign.isEndStableShortAlias(id)) {
            return id;
        }

        const primaryKey = context.primaryKey ?? '';
        const prefix = primaryKey + '~crud';

        const salt = this.ump.getRouteBasedModuleAlias(prefix);
        return this.sign.createStableShortAlias(`${salt}~${id}`);
    }
    public descPrimaryKey(
        alias: string,
        context: CrudModuleContextType,
        rowIdKey?: string,
    ): string | null {
        const normalizedAlias = String(alias ?? '').trim();

        if (!normalizedAlias) {
            return null;
        }

        const matchedRow = context.rows.find((row) => {
            const rowId = context.getRecordPrimaryKeyValue(row, rowIdKey);

            if (!rowId) {
                return false;
            }

            return this.encPrimaryKey(rowId, context) === normalizedAlias;
        });

        return matchedRow
            ? context.getRecordPrimaryKeyValue(matchedRow, rowIdKey)
            : null;
    }
    public descPrimaryKeys(
        aliases: string[] | null | undefined,
        context: CrudModuleContextType,
        rowIdKey?: string,
    ): string[] | null {
        if (!aliases || aliases.length === 0) {
            return null;
        }

        const ids = aliases
            .map((alias) => this.descPrimaryKey(alias, context, rowIdKey))
            .filter((id): id is string => !!id);

        const uniqueIds = [...new Set(ids)];

        return uniqueIds.length > 0 ? uniqueIds : null;
    }

    // █████ FIND OPERATOR GETTER ████████████████████████████████████████████████
    public getFindOperatorEqual(value: unknown): FindOperatorDto | null {
        const scalar = String(value ?? '').trim();

        return scalar ? { equal: scalar } : null;
    }

    public getFindOperatorLike(value: unknown): FindOperatorDto | null {
        const scalar = String(value ?? '').trim();

        return scalar ? { like: `%${scalar}%` } : null;
    }

    public getFindOperatorInto(value: unknown): FindOperatorDto | null {
        const values = (Array.isArray(value) ? value : [value])
            .map((item) => String(item ?? '').trim())
            .filter(Boolean);

        return values.length ? { into: values } : null;
    }

    public getFindOperatorFlag(
        value: unknown,
        languageCode: string,
    ): FindOperatorDto | null {
        if (value === undefined) return null;
        if (value === null) return { nulls: true };
        if (value === '') return { nulls: false };

        const date = this.toValidDate(value);
        const scalar = date
            ? formatDate(date, 'yyyy-MM-dd', languageCode)
            : String(value).trim();

        return scalar
            ? {
                equal: scalar,
                matchScalar: {
                    fn: MatchScalarExpressionEnum.DATE,
                },
            }
            : null;
    }

    // █████ GENERAL ████████████████████████████████████████████████
    public isNil(value: unknown): value is null | undefined {
        return value === null || value === undefined;
    }
    public isBlankValue(value: unknown): boolean {
        return this.isNil(value) || value === '';
    }
    public isValidationEmpty(value: unknown): boolean {
        return this.isBlankValue(value)
            || (Array.isArray(value) && value.length === 0);
    }
    public toStringValue(value: unknown): string {
        return this.isNil(value) ? '' : String(value);
    }
    public toFiniteNumber(value: unknown): number | null {
        if (this.isBlankValue(value)) {
            return null;
        }

        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : null;
        }

        const valueText = String(value).trim();

        if (!valueText) {
            return null;
        }

        const normalized = Number(valueText);

        return Number.isFinite(normalized) ? normalized : null;
    }
    public toValidDate(value: unknown): Date | null {
        if (this.isBlankValue(value)) {
            return null;
        }

        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }

        const normalized = new Date(value as string | number);

        return Number.isNaN(normalized.getTime()) ? null : normalized;
    }
    public normalizeTimeString(value: unknown): string | null {
        if (this.isBlankValue(value)) {
            return null;
        }

        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            const hh = String(value.getHours()).padStart(2, '0');
            const mm = String(value.getMinutes()).padStart(2, '0');
            const ss = String(value.getSeconds()).padStart(2, '0');

            return `${hh}:${mm}:${ss}`;
        }

        const normalized = String(value).trim();

        if (!normalized) {
            return null;
        }

        const parts = normalized.split(':');

        if (parts.length < 2 || parts.length > 3) {
            return normalized;
        }

        const hh = parts[0]?.padStart(2, '0');
        const mm = parts[1]?.padStart(2, '0');
        const ss = parts[2] != null ? parts[2].padStart(2, '0') : null;

        return ss == null ? `${hh}:${mm}` : `${hh}:${mm}:${ss}`;
    }
    public toArrayValue(value: unknown): any[] {
        if (Array.isArray(value)) {
            return value;
        }

        if (this.isBlankValue(value)) {
            return [];
        }

        if (typeof value !== 'string') {
            return [value];
        }

        const normalized = value.trim();

        if (!normalized) {
            return [];
        }

        if (normalized.startsWith('[') && normalized.endsWith(']')) {
            try {
                const parsed = JSON.parse(normalized);

                return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                // Invalid JSON-shaped input falls back to the same CSV handling as any other string.
            }
        }

        return normalized
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== '');
    }
    public toJsonValue(value: unknown): unknown {
        if (this.isBlankValue(value)) {
            return null;
        }

        if (typeof value === 'object') {
            return value;
        }

        if (typeof value !== 'string') {
            return value;
        }

        const normalized = value.trim();

        if (!normalized) {
            return null;
        }

        try {
            return JSON.parse(normalized);
        } catch {
            return normalized;
        }
    }
    public getByPath(value: unknown, path?: string): unknown {
        if (!path) {
            return undefined;
        }

        return path
            .split('.')
            .reduce<any>((current, key) => current?.[key], value);
    }
    public escapeHtml(value: unknown): string {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    /**
     * A grouped option bag is { groupKey: { label, option: {…} } } instead of
     * { key: 'Label' }. The two are told apart by shape:
     * a flat bag's values are always scalars, a group's value always carries its
     * own [option] bag, so there is no ambiguity to guess at.
     */
    public isOptionGroup(options: any): boolean {
        if (!options || Array.isArray(options) || typeof options !== 'object') {
            return false;
        }

        const first = Object.values(options)[0] as any;

        return !!first && typeof first === 'object' && !Array.isArray(first) && 'option' in first;
    }
    public isSwitchOptionType(option: CrudFieldOptionType | undefined): option is CrudFieldSwitchOptionType {
        /**
         * This predicate deliberately does not resolve a signal. Callers read
         * option.on / option.off immediately after it narrows, and SWITCH options
         * are required to be a literal two-value bag.
         */
        if (!option || Array.isArray(option) || typeof option !== 'object') {
            return false;
        }

        return Object.prototype.hasOwnProperty.call(option, 'on')
            && Object.prototype.hasOwnProperty.call(option, 'off');
    }
    /**
     * [option] as DATA, whatever the field declared - see CrudFieldOptionType.
     *
     * THE ONLY place the signal form is unwrapped on the CRUD side. Called at the
     * ENTRY of each helper that consumes an option bag, never at their call sites,
     * so the ~15 places that read fi.option stay exactly as they are.
     *
     * Reading the signal HERE is also what keeps it live: a caller inside a
     * computed or a template registers the dependency, so a resource landing
     * repaints on its own with nothing pushing the value anywhere.
     */
    public resolveOption(option: CrudFieldOptionType): CrudFieldOptionSourceType {
        return typeof option === 'function' ? option() : option;
    }
    /** grouped or flat -> one flat key => label bag */
    public flatOption(source: CrudFieldOptionType): Record<string, any> {
        /**
         * [any] and not CrudFieldOptionSourceType, which is what this method's
         * parameter used to be: isOptionGroup() answers a boolean, not a type
         * predicate, so nothing narrows away the null | undefined arm and
         * Object.values() below has no overload for it.
         *
         * Only the PARAMETER needed widening - to accept the signal form - and the
         * body is as loosely typed as it has always been.
         */
        const options: any = this.resolveOption(source);

        if (!this.isOptionGroup(options)) {
            return options ?? {};
        }

        return Object.values(options).reduce<Record<string, any>>(
            (flat, group: any) => Object.assign(flat, group?.option ?? {}),
            {},
        );
    }
    public getOptionValues(source: CrudFieldOptionType): Array<string | number | boolean> {
        const option = this.resolveOption(source);

        if (Array.isArray(option)) {
            return option.map((value) => this.parseKey(value));
        }

        if (!option || typeof option !== 'object') {
            return [];
        }

        return Object.keys(this.flatOption(option))
            .map((key) => this.parseKey(key));
    }
    public hasOptionValue(source: CrudFieldOptionType, value: unknown): boolean {
        if (this.isNil(value)) {
            return false;
        }

        const normalizedValue = this.normalizeOptionValue(value);

        return this.getOptionValues(source)
            .some((optionValue) => Object.is(optionValue, normalizedValue));
    }
    public getFirstOptionValue(source: CrudFieldOptionType): string | number | boolean | null {
        return this.getOptionValues(source)[0] ?? null;
    }
    public parseKey(key: string | number | symbol | boolean): string | number | boolean {
        const keyStr = String(key);

        if (keyStr === 'true') return true;
        if (keyStr === 'false') return false;
        if (!isNaN(Number(keyStr)) && keyStr.trim() !== '') return Number(keyStr);
        return keyStr;
    }
    public requireModuleContext(context?: CrudModuleContextType): CrudModuleContextType {
        if (!context) {
            throw new Error('Crud module context is required when apply_enc is enabled.');
        }

        return context;
    }

    private normalizeOptionValue(value: unknown): unknown {
        if (
            typeof value === 'string'
            || typeof value === 'number'
            || typeof value === 'boolean'
        ) {
            return this.parseKey(value);
        }

        return value;
    }
}
