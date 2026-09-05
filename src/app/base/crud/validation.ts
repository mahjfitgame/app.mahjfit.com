// file: src/app/base/crud/validation.ts
import { inject, Service } from "@angular/core";
import { formatDate } from '@angular/common';
import { SchemaPathTree, email, hidden, maxLength, minLength, pattern, required, validate, max, min } from "@angular/forms/signals";
import { CrudFieldOptionType, CrudFieldSwitchOptionType, CrudFieldValidationResultType, CrudFieldValidationType, CrudFormFieldInfoType, CrudFormFieldValueAngularValidatorLookUpType, CrudFormFieldValueNormalizerLookUpType, CrudFormFieldValueValidatorLookUpType, CrudListingFieldInfoType, CrudListingFieldValueFormatterLookUpType, CrudStateMutationFieldObjType, CrudFieldValidationInfoType } from "@base/crud/type";
import { CrudFieldNormalizeModeEnum, CrudFieldUiTypeEnum, CrudFieldValidationEnum } from "@base/crud/enum";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { CrudUtility } from "@base/crud/utility";
import { CrudState } from "@base/crud/state";
import { I18nService } from "@base/internationalization/service";

@Service({ autoProvided: false })
export class CrudValidation {
    public readonly state = inject(CrudState);
    private readonly utility = inject(CrudUtility);

    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    private readonly i18n = inject(I18nService);

    constructor() {}

    /**
     *  
     */
    public isSwitchOptionType(option: CrudFieldOptionType | undefined): option is CrudFieldSwitchOptionType {
        if (!option || Array.isArray(option) || typeof option !== 'object') {
            return false;
        }

        return Object.prototype.hasOwnProperty.call(option, 'on')
            && Object.prototype.hasOwnProperty.call(option, 'off');
    }

    /**
     *  
     */
    public formatCrudListingFieldValue(
        v: any,
        fi: CrudListingFieldInfoType,
        r: Record<string, any>
    ): any {
        const isEmpty = (value: any): boolean => {
            return value === null || value === undefined || value === '';
        };

        const getByPath = (obj: any, path?: string): any => {
            if (!path) {
                return undefined;
            }

            return path
                .split('.')
                .reduce((value, key) => value?.[key], obj);
        };

        const encIfNeeded = (value: any): any => {
            if(fi.apply_enc && fi.apply_enc === true && !isEmpty(value)) {
                if (Array.isArray(value)) {
                    return value.map((item) => this.utility.encPrimaryKey(item));
                }
                return this.utility.encPrimaryKey(value);    
            }
            return value;
        };

        const escapeHtml = (value: any): string => {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        const toArray = (value: any): any[] => {
            if (Array.isArray(value)) {
                return value;
            }

            if (isEmpty(value)) {
                return [];
            }

            if (typeof value === 'string') {
                const trimmed = value.trim();

                if (!trimmed) {
                    return [];
                }

                /**
                 * Supports:
                 * "1,2,3"
                 * "a,b,c"
                 */
                if (trimmed.includes(',')) {
                    return trimmed
                        .split(',')
                        .map((item) => item.trim())
                        .filter((item) => item !== '');
                }
            }

            return [value];
        };


        const lookupOption = (value: any, option?: CrudFieldOptionType): any => {
            if (!option || isEmpty(value)) {
                return value;
            }

            if (Array.isArray(option)) {
                /**
                 * For array option:
                 * option = ['Pending', 'Active']
                 * value = 1 => 'Active'
                 */
                const index = Number(value);

                if (Number.isInteger(index) && index >= 0) {
                    return option[index] ?? value;
                }

                /**
                 * Also support direct value match.
                 * option = ['active', 'inactive']
                 * value = 'active' => 'active'
                 */
                return option.includes(value) ? value : value;
            }

            /**
             * For object option:
             * option = { 1: 'Active', 2: 'Inactive' }
             */
            const optionRecord = option as Record<string, string | number | boolean>;

            return optionRecord[String(value)] ?? value;
        };

        const lookupSingleValue = (value: any, fieldInfo: CrudListingFieldInfoType, row: any): any => {
            if (fieldInfo.fr_field) {
                const frValue = getByPath(row, fieldInfo.fr_field);

                /**
                 * If relation value exists, use it.
                 * If relation is missing, fall back to option/value.
                 */
                if (!isEmpty(frValue)) {
                    return frValue;
                }
            }

            if (fieldInfo.option) {
                return lookupOption(value, fieldInfo.option);
            }

            return value;
        };

        const lookupMultiValue = (value: any, fieldInfo: CrudListingFieldInfoType, row: any): any[] => {
            if (fieldInfo.fr_field) {
                const frValue = getByPath(row, fieldInfo.fr_field);

                /**
                 * fr_field may return:
                 * ['Admin', 'Manager']
                 * [{ name: 'Admin' }, { name: 'Manager' }]
                 * 'Admin'
                 */
                if (!isEmpty(frValue)) {
                    if (Array.isArray(frValue)) {
                        return frValue.map((item) => {
                            if (
                                item &&
                                typeof item === 'object' &&
                                'label' in item
                            ) {
                                return item.label;
                            }

                            if (
                                item &&
                                typeof item === 'object' &&
                                'name' in item
                            ) {
                                return item.name;
                            }

                            if (
                                item &&
                                typeof item === 'object' &&
                                'title' in item
                            ) {
                                return item.title;
                            }

                            return item;
                        });
                    }

                    return [frValue];
                }
            }

            const values = toArray(value);

            if (fieldInfo.option) {
                return values.map((item) => lookupOption(item, fieldInfo.option));
            }

            return values;
        };

        const formatDateSafe = (value: any, format: string): any => {
            if (isEmpty(value)) {
                return fi.default ?? value;
            }

            try {
                return formatDate(String(value), format, this.conf.languageCode);
            } catch {
                return value;
            }
        };

        const formatter: CrudListingFieldValueFormatterLookUpType = {
            [CrudFieldUiTypeEnum.NONE]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.HIDDEN]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.TEXT]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.TEXTAREA]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.SELECT]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return lookupSingleValue(v, fi, r);
            },

            [CrudFieldUiTypeEnum.MULTISELECT]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return lookupMultiValue(v, fi, r).join(', ');
            },

            [CrudFieldUiTypeEnum.RADIO]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return lookupSingleValue(v, fi, r);
            },

            [CrudFieldUiTypeEnum.CHECKBOX]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return lookupMultiValue(v, fi, r).join(', ');
            },

            [CrudFieldUiTypeEnum.NUMBER]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.FLAG]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                if (fi.flag_label) {
                    /**
                     * flag_label holds i18n KEYS. Resolved here, not returned as
                     * keys, for the same reason as SWITCH below: this formatter
                     * feeds BOTH the listing cell and applyQuickSearch()'s text
                     * match, and the cell is printed without `| transloco`.
                     *
                     * An empty string is a deliberate 'no text here' (is_datetime
                     * is usually blank, meaning no prefix in front of the date),
                     * so it is passed through rather than looked up.
                     */
                    const label = (key: string): string => {
                        return key ? this.i18n.translate(key) : '';
                    };

                    if (isEmpty(v)) {
                        return label(fi.flag_label.is_null);
                    }

                    return `${label(fi.flag_label.is_datetime)}${formatDateSafe(v, this.conf.formatDateTime)}`;
                }

                return v;
            },

            [CrudFieldUiTypeEnum.SWITCH]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                if (this.isSwitchOptionType(fi.option)) {
                    /**
                     * Resolved here, not returned as a key: this formatter feeds
                     * BOTH the listing cell and applyQuickSearch()'s text match.
                     * Returning a key would make quick search compare against
                     * 'GL.FIELD.SWITCH.ON' instead of what the user can see.
                     */
                    if (v === fi.option.on) {
                        return this.i18n.translate('GL.FIELD.SWITCH.ON');
                    }

                    if (v === fi.option.off) {
                        return this.i18n.translate('GL.FIELD.SWITCH.OFF');
                    }
                }

                return v;
            },

            [CrudFieldUiTypeEnum.DATE]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return formatDateSafe(v, this.conf.formatDate);
            },

            [CrudFieldUiTypeEnum.TIME]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return formatDateSafe(v, this.conf.formatTime);
            },

            [CrudFieldUiTypeEnum.DATETIME]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return formatDateSafe(v, this.conf.formatDateTime);
            },

            [CrudFieldUiTypeEnum.PASSWORD]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.EMAIL]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.URL]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.TEL]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.SLIDER]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            // RANGE holds one half of the pair; the sibling field formats itself
            [CrudFieldUiTypeEnum.RANGE]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.FILE]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.COLOR]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.HTML]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return v;
            },

            [CrudFieldUiTypeEnum.ARRAY]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                return lookupMultiValue(v, fi, r).join(', ');
            },

            [CrudFieldUiTypeEnum.JSON]: (v: any, fi: CrudListingFieldInfoType, r: any) => {
                if (isEmpty(v)) {
                    return fi.default ?? v;
                }

                return `<pre>${escapeHtml(JSON.stringify(v, null, 2))}</pre>`;
            },
        };

        const formattedValue = formatter[fi.type](v, fi, r);
        const encVal = encIfNeeded(formattedValue);

        if(fi.format_val) {
            return fi.format_val(encVal, fi, r);
        }

        return encVal;
    }

    /**
     *  
     */
    public normalizeCrudFormFieldValue(
        v: unknown,
        fi: CrudFormFieldInfoType,
        r: Record<string, any> = {},
        mode: CrudFieldNormalizeModeEnum = CrudFieldNormalizeModeEnum.CTOS,
    ): any {
        /**
         * ctos = client to server
         * - incoming value may be encrypted
         * - decrypt first
         * - normalize to raw value
         *
         * stoc = server to client
         * - incoming value is raw DB/server value
         * - normalize first
         * - encrypt before sending to client
         */

        const isNil = (v: any): boolean => {
            return v === null || v === undefined;
        };

        const isEmpty = (v: any): boolean => {
            return v === null || v === undefined || v === '';
        };

        const getSourceValue = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): any => {
            if (!isNil(v)) {
                return v;
            }

            if (!isNil(fi.value)) {
                return fi.value;
            }

            if (!isNil(fi.default)) {
                return fi.default;
            }

            return v;
        };

        const toStringSafe = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): string => {
            if (isNil(v)) {
                return '';
            }

            if (typeof v === 'string') {
                return v;
            }

            return String(v);
        };

        const toNumberSafe = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): number | null => {
            if (isNil(v) || v === '') {
                return null;
            }

            if (typeof v === 'number') {
                return Number.isFinite(v) ? v : null;
            }

            const n = Number(String(v).trim());

            return Number.isFinite(n) ? n : null;
        };

        const toBoolSafe = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): boolean => {
            if (typeof v === 'boolean') {
                return v;
            }

            if (typeof v === 'number') {
                return v === 1;
            }

            if (typeof v === 'string') {
                const s = v.trim().toLowerCase();

                if (
                    s === 'true' ||
                    s === '1' ||
                    s === 'yes' ||
                    s === 'y' ||
                    s === 'on'
                ) {
                    return true;
                }

                if (
                    s === 'false' ||
                    s === '0' ||
                    s === 'no' ||
                    s === 'n' ||
                    s === 'off' ||
                    s === ''
                ) {
                    return false;
                }
            }

            return !!v;
        };

        const toDateSafe = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): Date | null => {
            if (isNil(v) || v === '') {
                return null;
            }

            if (v instanceof Date) {
                return Number.isNaN(v.getTime()) ? null : v;
            }

            const d = new Date(v);

            return Number.isNaN(d.getTime()) ? null : d;
        };

        const normalizeTimeString = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): string | null => {
            if (isNil(v) || v === '') {
                return null;
            }

            if (v instanceof Date && !Number.isNaN(v.getTime())) {
                const hh = String(v.getHours()).padStart(2, '0');
                const mm = String(v.getMinutes()).padStart(2, '0');
                const ss = String(v.getSeconds()).padStart(2, '0');

                return `${hh}:${mm}:${ss}`;
            }

            const s = String(v).trim();

            if (!s) {
                return null;
            }

            const parts = s.split(':');

            if (parts.length < 2 || parts.length > 3) {
                return s;
            }

            const hh = parts[0]?.padStart(2, '0');
            const mm = parts[1]?.padStart(2, '0');
            const ss = parts[2] != null ? parts[2].padStart(2, '0') : null;

            return ss == null ? `${hh}:${mm}` : `${hh}:${mm}:${ss}`;
        };

        const toArraySafe = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): any[] => {
            if (Array.isArray(v)) {
                return v;
            }

            if (isNil(v) || v === '') {
                return [];
            }

            if (typeof v === 'string') {
                const s = v.trim();

                if (!s) {
                    return [];
                }

                if (s.startsWith('[') && s.endsWith(']')) {
                    try {
                        const parsed = JSON.parse(s);

                        return Array.isArray(parsed) ? parsed : [parsed];
                    } catch {
                        // fallback to CSV because apparently strings enjoy cosplaying as arrays
                    }
                }

                return s
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean);
            }

            return [v];
        };

        const toJsonSafe = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): any => {
            if (isNil(v) || v === '') {
                return null;
            }

            if (typeof v === 'object') {
                return v;
            }

            if (typeof v === 'string') {
                const s = v.trim();

                if (!s) {
                    return null;
                }

                try {
                    return JSON.parse(s);
                } catch {
                    return s;
                }
            }

            return v;
        };

        const getByPath = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): any => {
            if (typeof v !== 'string' || !v) {
                return undefined;
            }

            return v
                .split('.')
                .reduce((value, key) => value?.[key], r);
        };

        const decryptOneSafe = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): any => {
            if (!fi.apply_enc || isEmpty(v)) {
                return v;
            }

            try {
                const decrypted = this.utility.descPrimaryKey(v);
                return decrypted ?? v;
            } catch {
                return v;
            }
        };

        const encryptOneSafe = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): any => {
            if (!fi.apply_enc || isEmpty(v)) {
                return v;
            }

            try {
                return this.utility.encPrimaryKey(v);
            } catch {
                return v;
            }
        };

        const decryptInputByMode = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): any => {
            if (mode !== CrudFieldNormalizeModeEnum.CTOS || !fi.apply_enc) {
                return v;
            }

            if (Array.isArray(v)) {
                return v.map((item) => decryptOneSafe(item, fi, r, mode));
            }

            if (
                typeof v === 'string' &&
                v.includes(',') &&
                (
                    fi.type === CrudFieldUiTypeEnum.MULTISELECT ||
                    fi.type === CrudFieldUiTypeEnum.CHECKBOX ||
                    fi.type === CrudFieldUiTypeEnum.ARRAY
                )
            ) {
                return v
                    .split(',')
                    .map((item) => decryptOneSafe(item.trim(), fi, r, mode))
                    .filter((item) => !isEmpty(item));
            }

            return decryptOneSafe(v, fi, r, mode);
        };

        const encryptOutputByMode = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): any => {
            if (mode !== CrudFieldNormalizeModeEnum.STOC || !fi.apply_enc) {
                return v;
            }

            if (Array.isArray(v)) {
                return v.map((item) => encryptOneSafe(item, fi, r, mode));
            }

            return encryptOneSafe(v, fi, r, mode);
        };

        const optionHasKey = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): boolean => {
            if (isNil(v)) {
                return false;
            }

            if (
                fi.option_default &&
                !Array.isArray(fi.option_default) &&
                typeof fi.option_default === 'object'
            ) {
                return Object.prototype.hasOwnProperty.call(
                    fi.option_default,
                    String(v),
                );
            }

            if (fi.option && Array.isArray(fi.option)) {
                return fi.option.some((optionValue) => String(optionValue) === String(v));
            }

            if (
                fi.option &&
                !Array.isArray(fi.option) &&
                typeof fi.option === 'object'
            ) {
                return Object.prototype.hasOwnProperty.call(
                    fi.option,
                    String(v),
                );
            }

            return true;
        };

        const pickDefaultOptionKey = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): any => {
            if (
                fi.option_default &&
                !Array.isArray(fi.option_default) &&
                typeof fi.option_default === 'object'
            ) {
                const keys = Object.keys(fi.option_default);

                return keys.length ? keys[0] : null;
            }

            if (fi.option && Array.isArray(fi.option) && fi.option.length > 0) {
                return fi.option[0];
            }

            if (
                fi.option &&
                !Array.isArray(fi.option) &&
                typeof fi.option === 'object'
            ) {
                const keys = Object.keys(fi.option);

                return keys.length ? keys[0] : null;
            }

            return null;
        };

        const normalizeSingleOptionValue = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): any => {
            if (isNil(v) || v === '') {
                if (!isNil(fi.value) && fi.value !== '') {
                    return mode === CrudFieldNormalizeModeEnum.CTOS
                        ? decryptInputByMode(fi.value, fi, r, mode)
                        : fi.value;
                }

                if (!isNil(fi.default) && fi.default !== '') {
                    return mode === CrudFieldNormalizeModeEnum.CTOS
                        ? decryptInputByMode(fi.default, fi, r, mode)
                        : fi.default;
                }

                return pickDefaultOptionKey(v, fi, r, mode);
            }

            let key = v;

            if (typeof v === 'object') {
                if (!isNil(v.id)) {
                    key = v.id;
                } else if (!isNil(v.value)) {
                    key = v.value;
                } else if (!isNil(v.key)) {
                    key = v.key;
                } else {
                    key = toStringSafe(v, fi, r, mode);
                }
            }

            if(!Number.isNaN(Number(key))) {
                key = Number(key);
            }

            if (!optionHasKey(key, fi, r, mode)) {
                if (!isNil(fi.value) && fi.value !== '') {
                    return mode === CrudFieldNormalizeModeEnum.CTOS
                        ? decryptInputByMode(fi.value, fi, r, mode)
                        : fi.value;
                }

                if (!isNil(fi.default) && fi.default !== '') {
                    return mode === CrudFieldNormalizeModeEnum.CTOS
                        ? decryptInputByMode(fi.default, fi, r, mode)
                        : fi.default;
                }

                return pickDefaultOptionKey(v, fi, r, mode);
            }

            return key;
        };

        const normalizeMultiOptionValue = (
            v: any,
            fi: CrudFormFieldInfoType,
            r: any,
            mode: CrudFieldNormalizeModeEnum,
        ): any[] => {
            const arr = toArraySafe(v, fi, r, mode)
                .map((item) => normalizeSingleOptionValue(item, fi, r, mode));

            const cleaned = arr.filter((item) => !isNil(item) && item !== '');

            const seen = new Set<string>();
            const out: any[] = [];

            for (const item of cleaned) {
                const key = typeof item === 'string' ? item : JSON.stringify(item);

                if (seen.has(key)) {
                    continue;
                }

                seen.add(key);
                out.push(item);
            }

            return out;
        };

        const normalizer: CrudFormFieldValueNormalizerLookUpType = {
            [CrudFieldUiTypeEnum.NONE]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return v;
            },

            [CrudFieldUiTypeEnum.HIDDEN]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return getSourceValue(v, fi, r, mode) ?? null;
            },

            [CrudFieldUiTypeEnum.TEXT]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = getSourceValue(v, fi, r, mode);

                if (isNil(src)) {
                    return '';
                }

                return toStringSafe(src, fi, r, mode);
            },

            [CrudFieldUiTypeEnum.TEXTAREA]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = getSourceValue(v, fi, r, mode);

                if (isNil(src)) {
                    return '';
                }

                return toStringSafe(src, fi, r, mode);
            },

            [CrudFieldUiTypeEnum.SELECT]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const a = normalizeSingleOptionValue(v, fi, r, mode);

                return a;
            },

            [CrudFieldUiTypeEnum.MULTISELECT]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return normalizeMultiOptionValue(v, fi, r, mode);
            },

            [CrudFieldUiTypeEnum.RADIO]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return normalizeSingleOptionValue(v, fi, r, mode);
            },

            [CrudFieldUiTypeEnum.CHECKBOX]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return normalizeMultiOptionValue(v, fi, r, mode);
            },

            [CrudFieldUiTypeEnum.NUMBER]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return toNumberSafe(getSourceValue(v, fi, r, mode), fi, r, mode);
            },

            [CrudFieldUiTypeEnum.FLAG]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = getSourceValue(v, fi, r, mode);

                if (src === null) {
                    return null;
                }

                if (src instanceof Date) {
                    return Number.isNaN(src.getTime()) ? null : src;
                }

                if (typeof src === 'string') {
                    const s = src.trim();

                    if (!s) {
                        return null;
                    }

                    const sl = s.toLowerCase();

                    if (
                        sl === 'true' ||
                        sl === '1' ||
                        sl === 'yes' ||
                        sl === 'on'
                    ) {
                        return new Date();
                    }

                    if (
                        sl === 'false' ||
                        sl === '0' ||
                        sl === 'no' ||
                        sl === 'off'
                    ) {
                        return null;
                    }

                    const d = new Date(s);

                    return Number.isNaN(d.getTime()) ? null : d;
                }

                if (typeof src === 'number') {
                    if (src === 1) {
                        return new Date();
                    }

                    if (src === 0) {
                        return null;
                    }

                    const d = new Date(src);

                    return Number.isNaN(d.getTime()) ? null : d;
                }

                return src ? new Date() : null;
            },

            [CrudFieldUiTypeEnum.SWITCH]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = getSourceValue(v, fi, r, mode);

                if (this.isSwitchOptionType(fi.option)) {
                    /**
                     * Matched against the field's OWN option pair — for rbin
                     * that is CRUD_RECYCLE_BIN_STATUS { on: 1, off: 0 } — never
                     * against the words 'On'/'Off'.
                     *
                     * Those two literals used to be accepted here as a second
                     * chance at a match. They could not be translated (the
                     * stored value must not shift with the active language) and
                     * they were unreachable anyway: only the SWITCH *formatter*
                     * produces them, and its output goes to the listing cell and
                     * quick search, never back into normalization.
                     *
                     * Compared as strings because the URL hands every matrix
                     * param over as text: `rb=1` arrives as "1" while option.on
                     * is the number 1, which strict === missed. Works the same
                     * for a boolean pair { on: true, off: false }.
                     */
                    const srcText = String(src);

                    if (srcText === String(fi.option.on)) {
                        return fi.option.on;
                    }

                    if (srcText === String(fi.option.off)) {
                        return fi.option.off;
                    }

                    return src;
                }

                return src;
            },

            [CrudFieldUiTypeEnum.DATE]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return toDateSafe(getSourceValue(v, fi, r, mode), fi, r, mode);
            },

            [CrudFieldUiTypeEnum.TIME]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return normalizeTimeString(getSourceValue(v, fi, r, mode), fi, r, mode);
            },

            [CrudFieldUiTypeEnum.DATETIME]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return toDateSafe(getSourceValue(v, fi, r, mode), fi, r, mode);
            },

            [CrudFieldUiTypeEnum.PASSWORD]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = getSourceValue(v, fi, r, mode);

                if (isNil(src)) {
                    return '';
                }

                return toStringSafe(src, fi, r, mode);
            },

            [CrudFieldUiTypeEnum.EMAIL]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = getSourceValue(v, fi, r, mode);

                if (isNil(src)) {
                    return '';
                }

                return toStringSafe(src, fi, r, mode);
            },

            [CrudFieldUiTypeEnum.URL]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = getSourceValue(v, fi, r, mode);

                if (isNil(src)) {
                    return '';
                }

                return toStringSafe(src, fi, r, mode);
            },

            [CrudFieldUiTypeEnum.TEL]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = getSourceValue(v, fi, r, mode);

                if (isNil(src)) {
                    return '';
                }

                return toStringSafe(src, fi, r, mode);
            },

            [CrudFieldUiTypeEnum.SLIDER]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return toNumberSafe(getSourceValue(v, fi, r, mode), fi, r, mode);
            },

            // RANGE holds one half of the pair; each key normalizes as a plain number
            [CrudFieldUiTypeEnum.RANGE]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return toNumberSafe(getSourceValue(v, fi, r, mode), fi, r, mode);
            },

            [CrudFieldUiTypeEnum.FILE]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = getSourceValue(v, fi, r, mode);

                return isEmpty(src) ? null : src;
            },

            [CrudFieldUiTypeEnum.COLOR]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = getSourceValue(v, fi, r, mode);

                if (isNil(src)) {
                    return '';
                }

                return toStringSafe(src, fi, r, mode).toLowerCase();
            },

            [CrudFieldUiTypeEnum.HTML]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = getSourceValue(v, fi, r, mode);

                if (isNil(src)) {
                    return '';
                }

                return toStringSafe(src, fi, r, mode);
            },

            [CrudFieldUiTypeEnum.ARRAY]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return toArraySafe(getSourceValue(v, fi, r, mode), fi, r, mode);
            },

            [CrudFieldUiTypeEnum.JSON]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return toJsonSafe(getSourceValue(v, fi, r, mode), fi, r, mode);
            },
        };

        /**
         * ctos:
         * encrypted client/url/form value -> decrypt -> normalize
         *
         * stoc:
         * raw server value -> normalize -> encrypt
         */
        const inputValue = decryptInputByMode(v, fi, r, mode);
        let normalizedValue = normalizer[fi.type](inputValue, fi, r, mode);

        // apply custom normalizer
        if(fi.normalize_val) {
            normalizedValue = fi.normalize_val(normalizedValue, fi, r, mode);
        }

        const encVal = encryptOutputByMode(normalizedValue, fi, r, mode);
        return encVal;
    }
    
    /**
     *  
     */
    public validateCrudFormFieldValue(
        v: unknown, 
        fi: CrudFormFieldInfoType,
        r?: Record<string, any>
    ): CrudFieldValidationResultType {
        const errors: string[] = [];

        const success = (value: any): CrudFieldValidationResultType => ({
            valid: true,
            value,
            errors: [],
        });

        const fail = (value: any, message: string): CrudFieldValidationResultType => ({
            valid: false,
            value,
            errors: [message],
        });

        const isEmpty = (value: any): boolean => {
            return (
                value === null ||
                value === undefined ||
                value === '' ||
                (Array.isArray(value) && value.length === 0)
            );
        };

        const toStringValue = (value: any): string => {
            if (value === null || value === undefined) {
                return '';
            }

            return String(value);
        };

        const toNumberValue = (value: any): number => {
            if (typeof value === 'number') {
                return value;
            }

            if (typeof value === 'string' && value.trim() !== '') {
                return Number(value);
            }

            return Number.NaN;
        };

        const isValidDateValue = (value: any): boolean => {
            if (value instanceof Date) {
                return !Number.isNaN(value.getTime());
            }

            if (typeof value !== 'string') {
                return false;
            }

            const trimmed = value.trim();

            if (!trimmed) {
                return false;
            }

            const date = new Date(trimmed);

            return !Number.isNaN(date.getTime());
        };

        const getOptionValues = (option: CrudFieldOptionType): any[] => {
            if (Array.isArray(option)) {
                return option as any[];
            }

            if (typeof option === 'object' && option !== null) {
                return Object.keys(option);
            }

            return [];
        };

        const normalizedValue = v;

        const validator: CrudFormFieldValueValidatorLookUpType = {
            [CrudFieldValidationEnum.REQUIRED]: (v: any) => {
                return isEmpty(v)
                    ? fail(v, 'GL.VALIDATION.REQUIRED')
                    : success(v);
            },

            [CrudFieldValidationEnum.MIN_LENGTH]: (v: any, fi: CrudFormFieldInfoType) => {
                const minLength = fi.validation?.[CrudFieldValidationEnum.MIN_LENGTH]?.value as number | undefined;
                if (minLength === undefined || minLength === null) return success(v);
                if (isEmpty(v)) return success(v);

                const value = toStringValue(v);
                return value.length >= Number(minLength)
                    ? success(v)
                    : fail(v, this.i18n.translate('GL.VALIDATION.MIN_LENGTH', { min_length: minLength }));
            },

            [CrudFieldValidationEnum.MAX_LENGTH]: (v: any, fi: CrudFormFieldInfoType) => {
                const maxLength = fi.validation?.[CrudFieldValidationEnum.MAX_LENGTH]?.value as number | undefined;
                if (maxLength === undefined || maxLength === null) return success(v);
                if (isEmpty(v)) return success(v);

                const value = toStringValue(v);
                return value.length <= Number(maxLength)
                    ? success(v)
                    : fail(v, this.i18n.translate('GL.VALIDATION.MAX_LENGTH', { max_length: maxLength }));
            },

            [CrudFieldValidationEnum.MIN]: (v: any, fi: CrudFormFieldInfoType) => {
                const minValue = fi.validation?.[CrudFieldValidationEnum.MIN]?.value;
                if (minValue === undefined || minValue === null) return success(v);
                if (isEmpty(v)) return success(v);

                const n = toNumberValue(v);
                const min = toNumberValue(minValue);

                if (!Number.isNaN(n) && !Number.isNaN(min)) {
                    return n >= min ? success(v) : fail(v, this.i18n.translate('GL.VALIDATION.MIN', { min: minValue }));
                }

                // fallback: date compare
                const dt = new Date(v as any).getTime();
                const minDt = new Date(minValue as any).getTime();
                if (!Number.isNaN(dt) && !Number.isNaN(minDt)) {
                    return dt >= minDt ? success(v) : fail(v, this.i18n.translate('GL.VALIDATION.MIN', { min: minValue }));
                }

                return fail(v, 'GL.VALIDATION.FN');
            },

            [CrudFieldValidationEnum.MAX]: (v: any, fi: CrudFormFieldInfoType) => {
                const maxValue = fi.validation?.[CrudFieldValidationEnum.MAX]?.value;
                if (maxValue === undefined || maxValue === null) return success(v);
                if (isEmpty(v)) return success(v);

                const n = toNumberValue(v);
                const max = toNumberValue(maxValue);

                if (!Number.isNaN(n) && !Number.isNaN(max)) {
                    return n <= max ? success(v) : fail(v, this.i18n.translate('GL.VALIDATION.MAX', { max: maxValue }));
                }

                // fallback: date compare
                const dt = new Date(v as any).getTime();
                const maxDt = new Date(maxValue as any).getTime();
                if (!Number.isNaN(dt) && !Number.isNaN(maxDt)) {
                    return dt <= maxDt ? success(v) : fail(v, this.i18n.translate('GL.VALIDATION.MAX', { max: maxValue }));
                }

                return fail(v, 'GL.VALIDATION.FN');
            },

            [CrudFieldValidationEnum.PATTERN]: (v: any, fi: CrudFormFieldInfoType) => {
                const patternValue = fi.validation?.[CrudFieldValidationEnum.PATTERN]?.value;
                if (!patternValue) return success(v);
                if (isEmpty(v)) return success(v);

                const regex = patternValue instanceof RegExp ? patternValue : new RegExp(String(patternValue));
                return regex.test(toStringValue(v))
                    ? success(v)
                    : fail(v, 'GL.VALIDATION.PATTERN');
            },

            [CrudFieldValidationEnum.EMAIL]: (v: any) => {
                if (isEmpty(v)) return success(v);
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(toStringValue(v))
                    ? success(v)
                    : fail(v, 'GL.VALIDATION.EMAIL');
            },

            [CrudFieldValidationEnum.DATE]: (v: any) => {
                if (isEmpty(v)) return success(v);
                return isValidDateValue(v)
                    ? success(v)
                    : fail(v, 'GL.VALIDATION.DATE');
            },

            [CrudFieldValidationEnum.TIME]: (v: any) => {
                if (isEmpty(v)) return success(v);
                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?(\s?[AP]M)?$/i;
                return timeRegex.test(toStringValue(v))
                    ? success(v)
                    : fail(v, 'GL.VALIDATION.TIME');
            },

            [CrudFieldValidationEnum.DATETIME]: (v: any) => {
                if (isEmpty(v)) return success(v);
                if (!isValidDateValue(v)) return fail(v, 'GL.VALIDATION.DATETIME');

                const s = toStringValue(v);
                const hasTime = /[0-9]:[0-9]/.test(s);
                return hasTime ? success(v) : fail(v, 'GL.VALIDATION.DATETIME');
            },

            [CrudFieldValidationEnum.URL]: (v: any) => {
                if (isEmpty(v)) return success(v);
                const urlRegex = /^(https?|ftp):\/\/[^\s$.?#].[^\s]*$/i;
                return urlRegex.test(toStringValue(v))
                    ? success(v)
                    : fail(v, 'GL.VALIDATION.URL');
            },

            [CrudFieldValidationEnum.MATCH_FIELD]: (v: any, fi: CrudFormFieldInfoType, r?: Record<string, any>) => {
                const matchField = fi.validation?.[CrudFieldValidationEnum.MATCH_FIELD]?.value as string | undefined;
                if (!matchField || !r) return success(v);
                return v === r[matchField]
                    ? success(v)
                    : fail(v, this.i18n.translate('GL.VALIDATION.MATCH_FIELD', { expected: matchField }));
            },

            [CrudFieldValidationEnum.COLOR]: (v: any) => {
                if (isEmpty(v)) return success(v);
                const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                return hexRegex.test(toStringValue(v))
                    ? success(v)
                    : fail(v, 'GL.VALIDATION.COLOR');
            },

            [CrudFieldValidationEnum.DIGIT]: (v: any) => {
                if (isEmpty(v)) return success(v);
                return /^\d+$/.test(toStringValue(v))
                    ? success(v)
                    : fail(v, 'GL.VALIDATION.DIGIT');
            },

            [CrudFieldValidationEnum.DECIMAL]: (v: any) => {
                if (isEmpty(v)) return success(v);
                const decimalRegex = /^[+-]?([0-9]*[.])?[0-9]+$/;
                return decimalRegex.test(toStringValue(v))
                    ? success(v)
                    : fail(v, 'GL.VALIDATION.DECIMAL');
            },

            [CrudFieldValidationEnum.TEXT]: (v: any) => {
                if (isEmpty(v)) return success(v);
                const textOnlyRegex = /^[a-zA-Z\s\u00C0-\u017F,.'-]+$/;
                const s = toStringValue(v);
                return textOnlyRegex.test(s)
                    ? success(v)
                    : fail(v, 'GL.VALIDATION.TEXT');
            },

            [CrudFieldValidationEnum.EXTENSION]: (v: any, fi: CrudFormFieldInfoType) => {
                if (isEmpty(v)) return success(v);

                const allowed = fi.validation?.[CrudFieldValidationEnum.EXTENSION]?.value as string[] | undefined;
                if (!Array.isArray(allowed) || allowed.length === 0) return success(v);

                const fileName = toStringValue(v);
                const dotIndex = fileName.lastIndexOf('.');
                if (dotIndex < 0) return fail(v, this.i18n.translate('GL.VALIDATION.EXTENSION', { allowed: allowed.join(', ') }));

                const fileExt = fileName.substring(dotIndex).toLowerCase();
                const ok = allowed.some((ext) => ext.toLowerCase() === fileExt);

                return ok ? success(v) : fail(v, this.i18n.translate('GL.VALIDATION.EXTENSION', { allowed: allowed.join(', ') }));
            },

            [CrudFieldValidationEnum.OPTION_RANGE]: (v: any, fi: CrudFormFieldInfoType) => {
                if (isEmpty(v)) return success(v);
                if (!fi.option) return success(v);

                const validValues = getOptionValues(fi.option);

                const isValid = Array.isArray(v)
                    ? v.every((item) => validValues.includes(item))
                    : validValues.includes(v);

                return isValid
                    ? success(v)
                    : fail(v, 'GL.VALIDATION.OPTION_RANGE');
            },

            [CrudFieldValidationEnum.FN]: (v: any, fi: CrudFormFieldInfoType, r?: Record<string, any>) => {
                const fn = fi.validation?.[CrudFieldValidationEnum.FN]?.value;
                if (typeof fn !== 'function') {
                    return success(v);
                }

                const result = fn(v, fi, r);

                if (typeof result === 'boolean') {
                    return result ? success(v) : fail(v, 'GL.VALIDATION.FN');
                }

                if (
                    result &&
                    typeof result === 'object' &&
                    'valid' in result &&
                    'value' in result &&
                    'errors' in result
                ) {
                    return result as CrudFieldValidationResultType;
                }

                return success(v);
            },
        };

        const validationEntries = Object.entries(fi.validation ?? {}) as [CrudFieldValidationEnum, CrudFieldValidationInfoType][];

        for (const [validationType, rule] of validationEntries) {
            const validate = validator[validationType];
            if (!validate) continue;

            const result = validate(normalizedValue, fi, r);

            if (!result.valid) {
                errors.push(rule?.message || result.errors[0]);
            }
        }

        return {
            valid: errors.length === 0,
            value: normalizedValue,
            errors,
        };
    }

    /**
     *  
     */
    public setCrudFormFieldValueAngularValidation<T>(
        sp: SchemaPathTree<T>, // schema path
        fsi: CrudStateMutationFieldObjType, // fields info
    ): void {

        // Helper to check if string is a valid date logic-wise (e.g. not Feb 31st)
        const isInvalidDate = (val: any) => {
            const d = new Date(val);
            return isNaN(d.getTime());
        };

        // apply validation methods available from "@angular/forms/signals"
        // TODO: hidden() logic is pending with angular forms, not clear at this time
        const setValidation: CrudFormFieldValueAngularValidatorLookUpType<T> = {
            // REQUIRED
            [CrudFieldValidationEnum.REQUIRED]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                required((sp as any)[f], { message: rule.message });
            },

            // MIN_LENGTH
            [CrudFieldValidationEnum.MIN_LENGTH]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                minLength((sp as any)[f], rule.value as number, { message: rule.message });
            },

            // MAX_LENGTH
            [CrudFieldValidationEnum.MAX_LENGTH]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                maxLength((sp as any)[f], rule.value as number, { message: rule.message });
            },

            // MIN
            [CrudFieldValidationEnum.MIN]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                validate((sp as any)[f], (ctx) => {
                    const val = ctx.value();
                    if (!val) return null;

                    const dateVal = new Date(val as any).getTime();
                    const minVal = new Date(rule.value as any).getTime();

                    if (!isNaN(dateVal) && !isNaN(minVal)) {
                        return dateVal >= minVal ? null : { kind: 'min', message: rule.message };
                    }

                    return Number(val) >= Number(rule.value) ? null : { kind: 'min', message: rule.message };
                });
            },

            // MAX
            [CrudFieldValidationEnum.MAX]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                validate((sp as any)[f], (ctx) => {
                    const val = ctx.value();
                    if (!val) return null;

                    const dateVal = new Date(val as any).getTime();
                    const maxVal = new Date(rule.value as any).getTime();

                    if (!isNaN(dateVal) && !isNaN(maxVal)) {
                        return dateVal <= maxVal ? null : { kind: 'max', message: rule.message };
                    }

                    return Number(val) <= Number(rule.value) ? null : { kind: 'max', message: rule.message };
                });
            },

            // PATTERN
            [CrudFieldValidationEnum.PATTERN]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                pattern((sp as any)[f], rule.value as any, { message: rule.message });
            },

            // EMAIL
            [CrudFieldValidationEnum.EMAIL]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                email((sp as any)[f], { message: rule.message });
            },

            // DATE
            [CrudFieldValidationEnum.DATE]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                validate((sp as any)[f], (ctx) => {
                    const val = ctx.value();
                    if (!val) return null;
                    return !isInvalidDate(val) ? null : { kind: 'date', message: rule.message };
                });
            },

            // TIME
            [CrudFieldValidationEnum.TIME]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                validate((sp as any)[f], (ctx) => {
                    const val = ctx.value();
                    if (!val) return null;
                    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?(\s?[AP]M)?$/i;
                    return timeRegex.test(val.toString()) ? null : { kind: 'time', message: rule.message };
                });
            },

            // DATETIME
            [CrudFieldValidationEnum.DATETIME]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                validate((sp as any)[f], (ctx) => {
                    const val = ctx.value();
                    if (!val) return null;
                    
                    if (isInvalidDate(val)) return { kind: 'datetime', message: rule.message };

                    const hasTime = /[0-9]:[0-9]/.test(val.toString());
                    return hasTime ? null : { kind: 'datetime', message: rule.message };
                });
            },

            // URL
            [CrudFieldValidationEnum.URL]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                const urlRegex = /^(https?|ftp):\/\/[^\s$.?#].[^\s]*$/i;
                pattern((sp as any)[f], urlRegex, { message: rule.message });
            },

            // MATCH_FIELD
            [CrudFieldValidationEnum.MATCH_FIELD]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                validate((sp as any)[f], (ctx) => {
                    const currentVal = ctx.value();
                    const otherVal = ctx.valueOf((sp as any)[rule.value as string]);
                    return currentVal === otherVal ? null : { kind: 'mismatch', message: rule.message };
                });
            },
            
            // COLOR
            [CrudFieldValidationEnum.COLOR]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                pattern((sp as any)[f], hexRegex, { message: rule.message });
            },

            // DIGIT
            [CrudFieldValidationEnum.DIGIT]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                pattern((sp as any)[f], /^\d+$/, { message: rule.message });
            },

            // DECIMAL
            [CrudFieldValidationEnum.DECIMAL]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                validate((sp as any)[f], (ctx) => {
                    const val = ctx.value();
                    if (val === null || val === undefined || val === '') return null;

                    const decimalRegex = /^[+-]?([0-9]*[.])?[0-9]+$/;
                    const isValid = decimalRegex.test(val.toString());

                    return isValid ? null : { kind: 'decimal', message: rule.message };
                });
            },

            // TEXT
            [CrudFieldValidationEnum.TEXT]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                validate((sp as any)[f], (ctx) => {
                    const val = ctx.value();
                    if (val === null || val === undefined || val === '') return null;

                    const textOnlyRegex = /^[a-zA-Z\s\u00C0-\u017F,.'-]+$/;
                    const isString = typeof val === 'string';
                    const isValidText = isString && textOnlyRegex.test(val);

                    return isValidText ? null : { kind: 'text', message: rule.message };
                });
            },

            // EXTENSION
            [CrudFieldValidationEnum.EXTENSION]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                validate((sp as any)[f], (ctx) => {
                    const fileName = ctx.value() as string;
                    if (!fileName || typeof fileName !== 'string') return null;

                    const allowedExt = rule.value as string[];
                    const fileExt = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
                    const isValid = allowedExt.some(ext => ext.toLowerCase() === fileExt);

                    return isValid ? null : { kind: 'extension', message: rule.message };
                });
            },

            // OPTION_RANGE
            [CrudFieldValidationEnum.OPTION_RANGE]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                validate((sp as any)[f], (ctx) => {
                    const value = ctx.value();
                    if (value === null || value === undefined || value === '') return null;

                    const options = fi.option;
                    if (!options) return null;

                    // Existing behavior: options can be array or object
                    const allowedValues = Array.isArray(options)
                    ? options
                    : (typeof options === 'object' ? Object.keys(options) : []);

                    // support multiselect/array values
                    const isValid = Array.isArray(value)
                    ? value.every((item) => allowedValues.includes(item as any))
                    : allowedValues.includes(value as any);

                    return isValid ? null : { kind: 'option_range', message: rule.message };
                });
            },

            // FN
            [CrudFieldValidationEnum.FN]: (sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
                validate((sp as any)[f], (ctx) => {
                    if (typeof rule.value === 'function') {
                        const record: any = ctx.valueOf(sp as any);
                        const fv = record[f];
                        const result = rule.value(fv, fi, record);
                        return result?.valid ? null : { kind: 'custom', message: rule.message };
                    }
                    return null;
                });
            },
        };

        const keys = Object.keys(fsi);
        for (let i = 0; i < keys.length; i++) {
            const f = keys[i];
            const fi = fsi[f];

            if (fi.validation) {
                const rules = Object.entries(fi.validation) as [CrudFieldValidationEnum, CrudFieldValidationInfoType][];

                for (const [validationType, rule] of rules) {
                    const apply = setValidation[validationType];
                    if (!apply) continue;
                    apply(sp, f, validationType, rule, fi);
                }
            }
        }
    }

    /**
     *  
     */
    public normalizeAndValidateCrudFormFieldValue(
        v: unknown, 
        fi: CrudFormFieldInfoType,
        r?: Record<string, any>,
        mode: CrudFieldNormalizeModeEnum = CrudFieldNormalizeModeEnum.CTOS
    ): CrudFieldValidationResultType {
        const nv = this.normalizeCrudFormFieldValue(v, fi, r, mode);

        const vr = this.validateCrudFormFieldValue(nv, fi, r);

        const resp: CrudFieldValidationResultType = {
            valid: vr.valid,
            value: (vr.valid ? nv : fi.default) ?? null,
            errors: vr.errors,
        };
        
        return resp;
    }
}
