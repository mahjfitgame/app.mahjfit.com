// file: src/app/base/crud/validation.ts
import { inject, Service } from "@angular/core";
import { formatDate } from '@angular/common';
import { SchemaPathTree, email, hidden, maxLength, minLength, pattern, required, validate, max, min } from "@angular/forms/signals";
import { CrudFieldInfoType, CrudFieldOptionType, CrudFieldValidationResultType, CrudFieldValidationType, CrudFormFieldInfoType, CrudFormFieldValueAngularValidatorLookUpType, CrudFormFieldValueNormalizerLookUpType, CrudFormFieldValueValidatorLookUpType, CrudFieldValueFormatterLookUpType, CrudStateMutationFieldObjType, CrudFieldValidationInfoType, CrudModuleContextType } from "@base/crud/type";
import { CrudFieldNormalizeModeEnum, CrudFieldUiTypeEnum, CrudFieldValidationEnum } from "@base/crud/enum";
import { ConfService } from "@libs/conf/service";
import { CrudUtility } from "@base/crud/utility";
import { I18nService } from "@base/internationalization/service";

@Service({ autoProvided: false })
export class CrudValidation {
    private static readonly URL_PATTERN = /^(https?|ftp):\/\/[^\s$.?#].[^\s]*$/i;
    private static readonly TIME_PATTERN = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?(\s?[AP]M)?$/i;
    private static readonly DATETIME_TIME_PATTERN = /[0-9]:[0-9]/;
    private static readonly COLOR_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    private static readonly DIGIT_PATTERN = /^\d+$/;
    private static readonly DECIMAL_PATTERN = /^[+-]?([0-9]*[.])?[0-9]+$/;
    private static readonly TEXT_PATTERN = /^[a-zA-Z\s\u00C0-\u017F,.'-]+$/;

    private readonly utility = inject(CrudUtility);

    private readonly conf = inject(ConfService);
    private readonly i18n = inject(I18nService);

    private readonly fieldFormatter: CrudFieldValueFormatterLookUpType = {
        [CrudFieldUiTypeEnum.NONE]: (value) => value,
        [CrudFieldUiTypeEnum.HIDDEN]: (value) => value,
        [CrudFieldUiTypeEnum.TEXT]: (value) => value,
        [CrudFieldUiTypeEnum.TEXTAREA]: (value) => value,
        [CrudFieldUiTypeEnum.SELECT]: (value, fieldInfo, row) => {
            return this.lookupSingleListingValue(value, fieldInfo, row);
        },
        [CrudFieldUiTypeEnum.BUTTON_SELECT]: (value, fieldInfo, row) => {
            return this.lookupSingleListingValue(value, fieldInfo, row);
        },
        [CrudFieldUiTypeEnum.AUTOSUGGEST]: (value, fieldInfo, row) => {
            return this.lookupSingleListingValue(value, fieldInfo, row);
        },
        [CrudFieldUiTypeEnum.MULTISELECTAUTOSUGGEST]: (value, fieldInfo, row) => {
            return this.lookupMultiListingValues(value, fieldInfo, row).join(', ');
        },
        [CrudFieldUiTypeEnum.MULTISELECT]: (value, fieldInfo, row) => {
            return this.lookupMultiListingValues(value, fieldInfo, row).join(', ');
        },
        [CrudFieldUiTypeEnum.BUTTON_MULTISELECT]: (value, fieldInfo, row) => {
            return this.lookupMultiListingValues(value, fieldInfo, row).join(', ');
        },
        [CrudFieldUiTypeEnum.RADIO]: (value, fieldInfo, row) => {
            return this.lookupSingleListingValue(value, fieldInfo, row);
        },
        [CrudFieldUiTypeEnum.CHECKBOX]: (value, fieldInfo, row) => {
            return this.lookupMultiListingValues(value, fieldInfo, row).join(', ');
        },
        [CrudFieldUiTypeEnum.NUMBER]: (value) => value,
        [CrudFieldUiTypeEnum.FLAG]: (value, fieldInfo) => {
            const flagLabel = fieldInfo.flag?.label;

            if (!flagLabel) {
                return value;
            }

            if (value === null || value === undefined) {
                return flagLabel.is_null
                    ? this.i18n.translate(flagLabel.is_null)
                    : '';
            }

            if (value === '') {
                return flagLabel.is_datetime
                    ? this.i18n.translate(flagLabel.is_datetime)
                    : '';
            }

            const dateTimeLabel = flagLabel.is_datetime
                ? this.i18n.translate(flagLabel.is_datetime)
                : '';
            const formattedDate = this.formatListingDate(
                value,
                this.conf.formatDateTime,
                fieldInfo.default,
            );

            return dateTimeLabel ? `${dateTimeLabel} ${formattedDate}` : formattedDate;
        },
        [CrudFieldUiTypeEnum.SWITCH]: (value, fieldInfo) => {
            if (this.utility.isSwitchOptionType(fieldInfo.option)) {
                if (value === fieldInfo.option.on) {
                    return this.i18n.translate('GL.FIELD.SWITCH.ON');
                }

                if (value === fieldInfo.option.off) {
                    return this.i18n.translate('GL.FIELD.SWITCH.OFF');
                }
            }

            return value;
        },
        [CrudFieldUiTypeEnum.DATE]: (value, fieldInfo) => {
            return this.formatListingDate(value, this.conf.formatDate, fieldInfo.default);
        },
        [CrudFieldUiTypeEnum.TIME]: (value, fieldInfo) => {
            return this.formatListingDate(value, this.conf.formatTime, fieldInfo.default);
        },
        [CrudFieldUiTypeEnum.DATETIME]: (value, fieldInfo) => {
            return this.formatListingDate(value, this.conf.formatDateTime, fieldInfo.default);
        },
        [CrudFieldUiTypeEnum.DATETIME_RANGE]: (value, fieldInfo) => {
            return this.formatListingDate(value, this.conf.formatDateTime, fieldInfo.default);
        },
        [CrudFieldUiTypeEnum.PASSWORD]: (value, fieldInfo) => {
            return this.utility.isBlankValue(value) ? (fieldInfo.default ?? value) : '••••••••';
        },
        [CrudFieldUiTypeEnum.EMAIL]: (value) => value,
        [CrudFieldUiTypeEnum.URL]: (value) => value,
        [CrudFieldUiTypeEnum.TEL]: (value) => value,
        [CrudFieldUiTypeEnum.SLIDER]: (value) => value,
        [CrudFieldUiTypeEnum.RANGE]: (value) => value,
        [CrudFieldUiTypeEnum.FILE]: (value) => value,
        [CrudFieldUiTypeEnum.COLOR]: (value) => value,
        [CrudFieldUiTypeEnum.HTML]: (value) => value,
        [CrudFieldUiTypeEnum.ARRAY]: (value, fieldInfo, row) => {
            return this.lookupMultiListingValues(value, fieldInfo, row).join(', ');
        },
        [CrudFieldUiTypeEnum.JSON]: (value, fieldInfo) => {
            if (this.utility.isBlankValue(value)) {
                return fieldInfo.default ?? value;
            }

            return JSON.stringify(value, null, 2);
        },
    };

    private readonly formFieldValidator: CrudFormFieldValueValidatorLookUpType = {
        [CrudFieldValidationEnum.REQUIRED]: (v: any) => {
            return this.utility.isValidationEmpty(v)
                ? this.validationFailure(v, 'GL.VALIDATION.REQUIRED')
                : this.validationSuccess(v);
        },

        [CrudFieldValidationEnum.MIN_LENGTH]: (v: any, fi: CrudFormFieldInfoType) => {
            const minLength = fi.validation?.[CrudFieldValidationEnum.MIN_LENGTH]?.value as number | undefined;
            if (minLength === undefined || minLength === null) return this.validationSuccess(v);
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);

            const value = this.utility.toStringValue(v);
            return value.length >= Number(minLength)
                ? this.validationSuccess(v)
                : this.validationFailure(v, this.i18n.translate('GL.VALIDATION.MIN_LENGTH', { min_length: minLength }));
        },

        [CrudFieldValidationEnum.MAX_LENGTH]: (v: any, fi: CrudFormFieldInfoType) => {
            const maxLength = fi.validation?.[CrudFieldValidationEnum.MAX_LENGTH]?.value as number | undefined;
            if (maxLength === undefined || maxLength === null) return this.validationSuccess(v);
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);

            const value = this.utility.toStringValue(v);
            return value.length <= Number(maxLength)
                ? this.validationSuccess(v)
                : this.validationFailure(v, this.i18n.translate('GL.VALIDATION.MAX_LENGTH', { max_length: maxLength }));
        },

        [CrudFieldValidationEnum.MIN]: (v: any, fi: CrudFormFieldInfoType) => {
            const minValue = fi.validation?.[CrudFieldValidationEnum.MIN]?.value;
            if (minValue === undefined || minValue === null) return this.validationSuccess(v);
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);

            const n = this.utility.toFiniteNumber(v);
            const min = this.utility.toFiniteNumber(minValue);

            if (n !== null && min !== null) {
                return n >= min ? this.validationSuccess(v) : this.validationFailure(v, this.i18n.translate('GL.VALIDATION.MIN', { min: minValue }));
            }

            // fallback: date compare
            const dt = new Date(v as any).getTime();
            const minDt = new Date(minValue as any).getTime();
            if (!Number.isNaN(dt) && !Number.isNaN(minDt)) {
                return dt >= minDt ? this.validationSuccess(v) : this.validationFailure(v, this.i18n.translate('GL.VALIDATION.MIN', { min: minValue }));
            }

            return this.validationFailure(v, this.i18n.translate('GL.VALIDATION.MIN', { min: minValue }));
        },

        [CrudFieldValidationEnum.MAX]: (v: any, fi: CrudFormFieldInfoType) => {
            const maxValue = fi.validation?.[CrudFieldValidationEnum.MAX]?.value;
            if (maxValue === undefined || maxValue === null) return this.validationSuccess(v);
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);

            const n = this.utility.toFiniteNumber(v);
            const max = this.utility.toFiniteNumber(maxValue);

            if (n !== null && max !== null) {
                return n <= max ? this.validationSuccess(v) : this.validationFailure(v, this.i18n.translate('GL.VALIDATION.MAX', { max: maxValue }));
            }

            // fallback: date compare
            const dt = new Date(v as any).getTime();
            const maxDt = new Date(maxValue as any).getTime();
            if (!Number.isNaN(dt) && !Number.isNaN(maxDt)) {
                return dt <= maxDt ? this.validationSuccess(v) : this.validationFailure(v, this.i18n.translate('GL.VALIDATION.MAX', { max: maxValue }));
            }

            return this.validationFailure(v, this.i18n.translate('GL.VALIDATION.MAX', { max: maxValue }));
        },

        [CrudFieldValidationEnum.PATTERN]: (v: any, fi: CrudFormFieldInfoType) => {
            const patternValue = fi.validation?.[CrudFieldValidationEnum.PATTERN]?.value;
            if (!patternValue) return this.validationSuccess(v);
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);

            const regex = patternValue instanceof RegExp ? patternValue : new RegExp(String(patternValue));
            regex.lastIndex = 0;
            return regex.test(this.utility.toStringValue(v))
                ? this.validationSuccess(v)
                : this.validationFailure(v, 'GL.VALIDATION.PATTERN');
        },

        [CrudFieldValidationEnum.EMAIL]: (v: any) => {
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(this.utility.toStringValue(v))
                ? this.validationSuccess(v)
                : this.validationFailure(v, 'GL.VALIDATION.EMAIL');
        },

        [CrudFieldValidationEnum.DATE]: (v: any, fi: CrudFormFieldInfoType) => {
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);
            return this.utility.toValidDate(v) !== null
                ? this.validationSuccess(v)
                : this.validationFailure(v, 'GL.VALIDATION.DATE');
        },

        [CrudFieldValidationEnum.TIME]: (v: any, fi: CrudFormFieldInfoType) => {
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);
            return this.isTimeValueValid(v)
                ? this.validationSuccess(v)
                : this.validationFailure(v, 'GL.VALIDATION.TIME');
        },

        [CrudFieldValidationEnum.DATETIME]: (v: any, fi: CrudFormFieldInfoType) => {
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);
            return this.isDatetimeValueValid(v)
                ? this.validationSuccess(v)
                : this.validationFailure(v, 'GL.VALIDATION.DATETIME');
        },

        [CrudFieldValidationEnum.URL]: (v: any) => {
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);
            return CrudValidation.URL_PATTERN.test(this.utility.toStringValue(v))
                ? this.validationSuccess(v)
                : this.validationFailure(v, 'GL.VALIDATION.URL');
        },

        [CrudFieldValidationEnum.MATCH_FIELD]: (v: any, fi: CrudFormFieldInfoType, r?: Record<string, any>) => {
            const matchField = fi.validation?.[CrudFieldValidationEnum.MATCH_FIELD]?.value as string | undefined;
            if (!matchField || !r) return this.validationSuccess(v);
            return v === r[matchField]
                ? this.validationSuccess(v)
                : this.validationFailure(v, this.i18n.translate('GL.VALIDATION.MATCH_FIELD', { expected: matchField }));
        },

        [CrudFieldValidationEnum.COLOR]: (v: any) => {
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);
            return CrudValidation.COLOR_PATTERN.test(this.utility.toStringValue(v))
                ? this.validationSuccess(v)
                : this.validationFailure(v, 'GL.VALIDATION.COLOR');
        },

        [CrudFieldValidationEnum.DIGIT]: (v: any) => {
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);
            return CrudValidation.DIGIT_PATTERN.test(this.utility.toStringValue(v))
                ? this.validationSuccess(v)
                : this.validationFailure(v, 'GL.VALIDATION.DIGIT');
        },

        [CrudFieldValidationEnum.DECIMAL]: (v: any) => {
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);
            return this.isDecimalValueValid(v)
                ? this.validationSuccess(v)
                : this.validationFailure(v, 'GL.VALIDATION.DECIMAL');
        },

        [CrudFieldValidationEnum.TEXT]: (v: any) => {
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);
            return this.isTextValueValid(v)
                ? this.validationSuccess(v)
                : this.validationFailure(v, 'GL.VALIDATION.TEXT');
        },

        [CrudFieldValidationEnum.EXTENSION]: (v: any, fi: CrudFormFieldInfoType) => {
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);

            const allowed = fi.validation?.[CrudFieldValidationEnum.EXTENSION]?.value as string[] | undefined;
            if (!Array.isArray(allowed) || allowed.length === 0) return this.validationSuccess(v);

            const fileName = this.utility.toStringValue(v);
            const dotIndex = fileName.lastIndexOf('.');
            if (dotIndex < 0) return this.validationFailure(v, this.i18n.translate('GL.VALIDATION.EXTENSION', { allowed: allowed.join(', ') }));

            const ok = this.hasAllowedExtension(fileName, allowed);

            return ok ? this.validationSuccess(v) : this.validationFailure(v, this.i18n.translate('GL.VALIDATION.EXTENSION', { allowed: allowed.join(', ') }));
        },

        [CrudFieldValidationEnum.OPTION_RANGE]: (v: any, fi: CrudFormFieldInfoType) => {
            if (this.utility.isValidationEmpty(v)) return this.validationSuccess(v);
            if (!fi.option) return this.validationSuccess(v);

            const isValid = this.isOptionValueAllowed(v, fi.option);

            return isValid
                ? this.validationSuccess(v)
                : this.validationFailure(v, 'GL.VALIDATION.OPTION_RANGE');
        },

        [CrudFieldValidationEnum.FN]: (v: any, fi: CrudFormFieldInfoType, r?: Record<string, any>) => {
            const fn = fi.validation?.[CrudFieldValidationEnum.FN]?.value;
            if (typeof fn !== 'function') {
                return this.validationSuccess(v);
            }

            const result = fn(v, fi, r);

            if (typeof result === 'boolean') {
                return result ? this.validationSuccess(v) : this.validationFailure(v, 'GL.VALIDATION.FN');
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

            return this.validationSuccess(v);
        },
    };

    private readonly signalFormFieldValidator: CrudFormFieldValueAngularValidatorLookUpType = {
        // REQUIRED
        [CrudFieldValidationEnum.REQUIRED]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            required((sp as any)[f], { message: rule.message });
        },

        // MIN_LENGTH
        [CrudFieldValidationEnum.MIN_LENGTH]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            minLength((sp as any)[f], rule.value as number, { message: rule.message });
        },

        // MAX_LENGTH
        [CrudFieldValidationEnum.MAX_LENGTH]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            maxLength((sp as any)[f], rule.value as number, { message: rule.message });
        },

        // MIN
        [CrudFieldValidationEnum.MIN]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            validate((sp as any)[f], (ctx) => {
                const val = ctx.value();
                if (val === null || val === undefined || val === '') return null;

                const isNumericField = fi.type === CrudFieldUiTypeEnum.NUMBER
                    || fi.type === CrudFieldUiTypeEnum.SLIDER
                    || fi.type === CrudFieldUiTypeEnum.RANGE;

                if (isNumericField) {
                    return Number(val) >= Number(rule.value) ? null : { kind: 'min', message: rule.message };
                }

                const dateVal = new Date(val as any).getTime();
                const minVal = new Date(rule.value as any).getTime();

                if (!isNaN(dateVal) && !isNaN(minVal)) {
                    return dateVal >= minVal ? null : { kind: 'min', message: rule.message };
                }

                return Number(val) >= Number(rule.value) ? null : { kind: 'min', message: rule.message };
            });
        },

        // MAX
        [CrudFieldValidationEnum.MAX]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            validate((sp as any)[f], (ctx) => {
                const val = ctx.value();
                if (val === null || val === undefined || val === '') return null;

                const isNumericField = fi.type === CrudFieldUiTypeEnum.NUMBER
                    || fi.type === CrudFieldUiTypeEnum.SLIDER
                    || fi.type === CrudFieldUiTypeEnum.RANGE;

                if (isNumericField) {
                    return Number(val) <= Number(rule.value) ? null : { kind: 'max', message: rule.message };
                }

                const dateVal = new Date(val as any).getTime();
                const maxVal = new Date(rule.value as any).getTime();

                if (!isNaN(dateVal) && !isNaN(maxVal)) {
                    return dateVal <= maxVal ? null : { kind: 'max', message: rule.message };
                }

                return Number(val) <= Number(rule.value) ? null : { kind: 'max', message: rule.message };
            });
        },

        // PATTERN
        [CrudFieldValidationEnum.PATTERN]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            pattern((sp as any)[f], rule.value as any, { message: rule.message });
        },

        // EMAIL
        [CrudFieldValidationEnum.EMAIL]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            email((sp as any)[f], { message: rule.message });
        },

        // DATE
        [CrudFieldValidationEnum.DATE]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            validate((sp as any)[f], (ctx) => {
                const val = ctx.value();
                if (!val) return null;
                return this.utility.toValidDate(val) !== null
                    ? null
                    : { kind: 'date', message: rule.message };
            });
        },

        // TIME
        [CrudFieldValidationEnum.TIME]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            validate((sp as any)[f], (ctx) => {
                const val = ctx.value();
                if (!val) return null;
                return this.isTimeValueValid(val)
                    ? null
                    : { kind: 'time', message: rule.message };
            });
        },

        // DATETIME
        [CrudFieldValidationEnum.DATETIME]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            validate((sp as any)[f], (ctx) => {
                const val = ctx.value();
                if (!val) return null;

                return this.isDatetimeValueValid(val)
                    ? null
                    : { kind: 'datetime', message: rule.message };
            });
        },

        // URL
        [CrudFieldValidationEnum.URL]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            pattern((sp as any)[f], CrudValidation.URL_PATTERN, { message: rule.message });
        },

        // MATCH_FIELD
        [CrudFieldValidationEnum.MATCH_FIELD]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            validate((sp as any)[f], (ctx) => {
                const currentVal = ctx.value();
                const otherVal = ctx.valueOf((sp as any)[rule.value as string]);
                return currentVal === otherVal ? null : { kind: 'mismatch', message: rule.message };
            });
        },

        // COLOR
        [CrudFieldValidationEnum.COLOR]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            pattern((sp as any)[f], CrudValidation.COLOR_PATTERN, { message: rule.message });
        },

        // DIGIT
        [CrudFieldValidationEnum.DIGIT]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            pattern((sp as any)[f], CrudValidation.DIGIT_PATTERN, { message: rule.message });
        },

        // DECIMAL
        [CrudFieldValidationEnum.DECIMAL]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            validate((sp as any)[f], (ctx) => {
                const val = ctx.value();
                if (val === null || val === undefined || val === '') return null;

                return this.isDecimalValueValid(val)
                    ? null
                    : { kind: 'decimal', message: rule.message };
            });
        },

        // TEXT
        [CrudFieldValidationEnum.TEXT]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            validate((sp as any)[f], (ctx) => {
                const val = ctx.value();
                if (val === null || val === undefined || val === '') return null;

                return this.isTextValueValid(val, true)
                    ? null
                    : { kind: 'text', message: rule.message };
            });
        },

        // EXTENSION
        [CrudFieldValidationEnum.EXTENSION]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            validate((sp as any)[f], (ctx) => {
                const fileName = ctx.value() as string;
                if (!fileName || typeof fileName !== 'string') return null;

                const allowedExt = rule.value as string[];
                const isValid = this.hasAllowedExtension(fileName, allowedExt);

                return isValid ? null : { kind: 'extension', message: rule.message };
            });
        },

        // OPTION_RANGE
        [CrudFieldValidationEnum.OPTION_RANGE]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            validate((sp as any)[f], (ctx) => {
                const value = ctx.value();
                if (this.utility.isValidationEmpty(value)) return null;

                /**
                 * Resolved HERE and not hoisted out: this runs inside validate(),
                 * so reading a signal bag registers a dependency and the rule
                 * re-runs by itself once the options land. A value restored before
                 * they arrived stops being reported as out of range the moment
                 * the real list is in.
                 */
                const options = this.utility.getOptionValues(fi.option);
                if (options.length === 0) return null;

                // support multiselect/array values
                const isValid = this.isOptionValueAllowed(value, fi.option);

                return isValid ? null : { kind: 'option_range', message: rule.message };
            });
        },

        // FN
        [CrudFieldValidationEnum.FN]: <T>(sp: SchemaPathTree<T>, f: string, validationType: CrudFieldValidationEnum, rule: CrudFieldValidationInfoType, fi: CrudFormFieldInfoType) => {
            validate((sp as any)[f], (ctx) => {
                if (typeof rule.value === 'function') {
                    const record: any = ctx.valueOf(sp as any);
                    const fv = record[f];
                    const result = rule.value(fv, fi, record);
                    const valid = typeof result === 'boolean'
                        ? result
                        : result?.valid !== false;

                    return valid ? null : { kind: 'custom', message: rule.message };
                }
                return null;
            });
        },
    };


    constructor() {}

    private encryptFieldValueIfNeeded(
        value: any,
        fieldInfo: CrudFieldInfoType,
        context?: CrudModuleContextType,
    ): any {
        if (!fieldInfo.apply_enc || this.utility.isBlankValue(value)) {
            return value;
        }

        const moduleContext = this.utility.requireModuleContext(context);

        if (Array.isArray(value)) {
            return value.map((item) => this.utility.encPrimaryKey(item, moduleContext));
        }

        return this.utility.encPrimaryKey(value, moduleContext);
    }

    private lookupListingOption(
        value: any,
        source?: CrudFieldOptionType,
    ): any {
        const option = this.utility.resolveOption(source);

        if (!option || this.utility.isBlankValue(value)) {
            return value;
        }

        if (Array.isArray(option)) {
            const index = Number(value);

            if (Number.isInteger(index) && index >= 0) {
                return option[index] ?? value;
            }

            return value;
        }

        const optionRecord = this.utility.flatOption(option);

        return optionRecord[String(value)] ?? value;
    }

    private lookupSingleListingValue(
        value: any,
        fieldInfo: CrudFieldInfoType,
        row: Record<string, any>,
    ): any {
        if (fieldInfo.fr_field) {
            const relationValue = this.utility.getByPath(row, fieldInfo.fr_field);

            if (!this.utility.isBlankValue(relationValue)) {
                return relationValue;
            }
        }

        return fieldInfo.option
            ? this.lookupListingOption(value, fieldInfo.option)
            : value;
    }

    private lookupMultiListingValues(
        value: any,
        fieldInfo: CrudFieldInfoType,
        row: Record<string, any>,
    ): any[] {
        if (fieldInfo.fr_field) {
            const relationValue = this.utility.getByPath(row, fieldInfo.fr_field);

            if (!this.utility.isBlankValue(relationValue)) {
                return Array.isArray(relationValue)
                    ? relationValue.map((item) => this.getRelationItemLabel(item))
                    : [relationValue];
            }
        }

        const values = this.utility.toArrayValue(value);

        return fieldInfo.option
            ? values.map((item) => this.lookupListingOption(item, fieldInfo.option))
            : values;
    }

    private getRelationItemLabel(item: any): any {
        if (!item || typeof item !== 'object') {
            return item;
        }

        if ('label' in item) {
            return item.label;
        }

        if ('name' in item) {
            return item.name;
        }

        if ('title' in item) {
            return item.title;
        }

        return item;
    }

    private formatListingDate(
        value: any,
        format: string,
        fallback: any,
    ): any {
        if (this.utility.isBlankValue(value)) {
            return fallback ?? value;
        }

        try {
            return formatDate(String(value), format, this.conf.languageCode);
        } catch {
            return value;
        }
    }

    /**
     * Normalize a form value according to its CRUD field type.
     */
    public normalizeCrudFormFieldValue(
        v: unknown,
        fi: CrudFormFieldInfoType,
        r: Record<string, any> = {},
        mode: CrudFieldNormalizeModeEnum = CrudFieldNormalizeModeEnum.CTOS,
        context?: CrudModuleContextType,
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
                return this.getFormFieldSourceValue(v, fi) ?? null;
            },

            [CrudFieldUiTypeEnum.TEXT]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = this.getFormFieldSourceValue(v, fi);

                if (this.utility.isNil(src)) {
                    return '';
                }

                return this.utility.toStringValue(src);
            },

            [CrudFieldUiTypeEnum.TEXTAREA]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = this.getFormFieldSourceValue(v, fi);

                if (this.utility.isNil(src)) {
                    return '';
                }

                return this.utility.toStringValue(src);
            },

            [CrudFieldUiTypeEnum.SELECT]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const a = this.normalizeSingleOptionValue(v, fi, mode, context);

                return a;
            },

            [CrudFieldUiTypeEnum.BUTTON_SELECT]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.normalizeSingleOptionValue(v, fi, mode, context);
            },

            /**
             * NOT normalizeSingleOptionValue(): suggestions are remote, so [option] is
             * empty and fieldOptionHasValue() would throw every real key away as soon as the
             * field also declares [option_default].
             */
            [CrudFieldUiTypeEnum.AUTOSUGGEST]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = this.getFormFieldSourceValue(v, fi);

                return this.utility.isBlankValue(src) ? null : src;
            },

            /**
             * The array arm of AUTOSUGGEST above, and NOT normalizeMultiOptionValue():
             * that runs every entry through normalizeSingleOptionValue, whose
             * fieldOptionHasValue() would throw real keys away for the same reason the single
             * arm avoids it - suggestions are remote, so [option] is empty.
             *
             * CrudUtility.toArrayValue() does the work that matters here: the URL carries
             * ";test_autosuggest=2,3" as ONE string, and without the split it reaches
             * the control as the single key "2,3" - one chip, named after nothing.
             */
            [CrudFieldUiTypeEnum.MULTISELECTAUTOSUGGEST]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = this.getFormFieldSourceValue(v, fi);

                if (this.utility.isBlankValue(src)) {
                    return [];
                }

                const out: any[] = [];
                const seen = new Set<string>();

                this.utility.toArrayValue(src).forEach((key) => {
                    if (this.utility.isBlankValue(key) || seen.has(String(key))) {
                        return;
                    }

                    seen.add(String(key));
                    out.push(key);
                });

                return out;
            },

            [CrudFieldUiTypeEnum.MULTISELECT]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.normalizeMultiOptionValue(v, fi, mode, context);
            },

            [CrudFieldUiTypeEnum.BUTTON_MULTISELECT]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.normalizeMultiOptionValue(v, fi, mode, context);
            },

            [CrudFieldUiTypeEnum.RADIO]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.normalizeSingleOptionValue(v, fi, mode, context);
            },

            [CrudFieldUiTypeEnum.CHECKBOX]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.normalizeMultiOptionValue(v, fi, mode, context);
            },

            [CrudFieldUiTypeEnum.NUMBER]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.utility.toFiniteNumber(this.getFormFieldSourceValue(v, fi));
            },

            [CrudFieldUiTypeEnum.FLAG]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                // Unlike ordinary blank fields, a FLAG's null is an explicit off value.
                const src = v === null ? null : this.getFormFieldSourceValue(v, fi);

                if (src === null) {
                    return null;
                }

                if (src instanceof Date) {
                    return Number.isNaN(src.getTime()) ? null : src;
                }

                if (typeof src === 'string') {
                    const s = src.trim();

                    if (!s) {
                        return '';
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
                const src = this.getFormFieldSourceValue(v, fi);

                if (this.utility.isSwitchOptionType(fi.option)) {
                    /**
                     * Matched against the field's OWN option pair, never against
                     * the translated words displayed for the switch.
                     *
                     * Those two literals used to be accepted here as a second
                     * chance at a match. They could not be translated (the
                     * stored value must not shift with the active language) and
                     * they were unreachable anyway: only the SWITCH *formatter*
                     * produces them, and its output goes to the listing cell and
                     * quick search, never back into normalization.
                     *
                     * Compared as strings because the URL hands every matrix
                     * param over as text: `enabled=1` arrives as "1" while option.on
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
                return this.utility.toValidDate(this.getFormFieldSourceValue(v, fi));
            },

            [CrudFieldUiTypeEnum.TIME]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.utility.normalizeTimeString(this.getFormFieldSourceValue(v, fi));
            },

            [CrudFieldUiTypeEnum.DATETIME]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.utility.toValidDate(this.getFormFieldSourceValue(v, fi));
            },

            // DATETIME_RANGE holds one half of the pair; each key normalizes as a datetime
            [CrudFieldUiTypeEnum.DATETIME_RANGE]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.utility.toValidDate(this.getFormFieldSourceValue(v, fi));
            },

            [CrudFieldUiTypeEnum.PASSWORD]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = this.getFormFieldSourceValue(v, fi);

                if (this.utility.isNil(src)) {
                    return '';
                }

                return this.utility.toStringValue(src);
            },

            [CrudFieldUiTypeEnum.EMAIL]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = this.getFormFieldSourceValue(v, fi);

                if (this.utility.isNil(src)) {
                    return '';
                }

                return this.utility.toStringValue(src);
            },

            [CrudFieldUiTypeEnum.URL]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = this.getFormFieldSourceValue(v, fi);

                if (this.utility.isNil(src)) {
                    return '';
                }

                return this.utility.toStringValue(src);
            },

            [CrudFieldUiTypeEnum.TEL]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = this.getFormFieldSourceValue(v, fi);

                if (this.utility.isNil(src)) {
                    return '';
                }

                return this.utility.toStringValue(src);
            },

            [CrudFieldUiTypeEnum.SLIDER]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.utility.toFiniteNumber(this.getFormFieldSourceValue(v, fi));
            },

            // RANGE holds one half of the pair; each key normalizes as a plain number
            [CrudFieldUiTypeEnum.RANGE]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.utility.toFiniteNumber(this.getFormFieldSourceValue(v, fi));
            },

            [CrudFieldUiTypeEnum.FILE]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = this.getFormFieldSourceValue(v, fi);

                return this.utility.isBlankValue(src) ? null : src;
            },

            [CrudFieldUiTypeEnum.COLOR]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = this.getFormFieldSourceValue(v, fi);

                if (this.utility.isNil(src)) {
                    return '';
                }

                return this.utility.toStringValue(src).toLowerCase();
            },

            [CrudFieldUiTypeEnum.HTML]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                const src = this.getFormFieldSourceValue(v, fi);

                if (this.utility.isNil(src)) {
                    return '';
                }

                return this.utility.toStringValue(src);
            },

            [CrudFieldUiTypeEnum.ARRAY]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.utility.toArrayValue(this.getFormFieldSourceValue(v, fi));
            },

            [CrudFieldUiTypeEnum.JSON]: (
                v: any,
                fi: CrudFormFieldInfoType,
                r: any,
                mode: CrudFieldNormalizeModeEnum,
            ) => {
                return this.utility.toJsonValue(this.getFormFieldSourceValue(v, fi));
            },
        };

        /**
         * ctos:
         * encrypted client/url/form value -> decrypt -> normalize
         *
         * stoc:
         * raw server value -> normalize -> encrypt
         */
        const inputValue = this.decryptInputByMode(v, fi, mode, context);
        let normalizedValue = normalizer[fi.type](inputValue, fi, r, mode);

        // apply custom normalizer
        if(fi.normalize_val) {
            normalizedValue = fi.normalize_val(normalizedValue, fi, r, mode);
        }

        const encVal = this.encryptOutputByMode(normalizedValue, fi, mode, context);
        return encVal;
    }

    private getFormFieldSourceValue(
        value: any,
        fieldInfo: CrudFormFieldInfoType,
    ): any {
        if (!this.utility.isNil(value)) {
            return value;
        }

        if (!this.utility.isNil(fieldInfo.value)) {
            return fieldInfo.value;
        }

        if (!this.utility.isNil(fieldInfo.default)) {
            return fieldInfo.default;
        }

        return value;
    }

    private decryptConfiguredFieldValue(
        value: any,
        fieldInfo: CrudFormFieldInfoType,
        context?: CrudModuleContextType,
    ): any {
        if (!fieldInfo.apply_enc || this.utility.isBlankValue(value)) {
            return value;
        }

        const moduleContext = this.utility.requireModuleContext(context);
        const decrypted = this.utility.descPrimaryKey(value, moduleContext);

        return decrypted ?? value;
    }

    private encryptConfiguredFieldValue(
        value: any,
        fieldInfo: CrudFormFieldInfoType,
        context?: CrudModuleContextType,
    ): any {
        if (!fieldInfo.apply_enc || this.utility.isBlankValue(value)) {
            return value;
        }

        const moduleContext = this.utility.requireModuleContext(context);

        return this.utility.encPrimaryKey(value, moduleContext);
    }

    private decryptInputByMode(
        value: any,
        fieldInfo: CrudFormFieldInfoType,
        mode: CrudFieldNormalizeModeEnum,
        context?: CrudModuleContextType,
    ): any {
        if (mode !== CrudFieldNormalizeModeEnum.CTOS || !fieldInfo.apply_enc) {
            return value;
        }

        if (Array.isArray(value)) {
            return value.map((item) => {
                return this.decryptConfiguredFieldValue(item, fieldInfo, context);
            });
        }

        if (
            typeof value === 'string'
            && value.includes(',')
            && (
                fieldInfo.type === CrudFieldUiTypeEnum.MULTISELECT
                || fieldInfo.type === CrudFieldUiTypeEnum.BUTTON_MULTISELECT
                || fieldInfo.type === CrudFieldUiTypeEnum.CHECKBOX
                || fieldInfo.type === CrudFieldUiTypeEnum.ARRAY
            )
        ) {
            return value
                .split(',')
                .map((item) => {
                    return this.decryptConfiguredFieldValue(item.trim(), fieldInfo, context);
                })
                .filter((item) => !this.utility.isBlankValue(item));
        }

        return this.decryptConfiguredFieldValue(value, fieldInfo, context);
    }

    private encryptOutputByMode(
        value: any,
        fieldInfo: CrudFormFieldInfoType,
        mode: CrudFieldNormalizeModeEnum,
        context?: CrudModuleContextType,
    ): any {
        if (mode !== CrudFieldNormalizeModeEnum.STOC || !fieldInfo.apply_enc) {
            return value;
        }

        if (Array.isArray(value)) {
            return value.map((item) => {
                return this.encryptConfiguredFieldValue(item, fieldInfo, context);
            });
        }

        return this.encryptConfiguredFieldValue(value, fieldInfo, context);
    }

    private fieldOptionHasValue(
        value: any,
        fieldInfo: CrudFormFieldInfoType,
    ): boolean {
        if (this.utility.isNil(value)) {
            return false;
        }

        const option = this.utility.resolveOption(fieldInfo.option);
        const hasDefaultOptions = !!fieldInfo.option_default
            && typeof fieldInfo.option_default === 'object'
            && Object.keys(fieldInfo.option_default).length > 0;
        const hasOptions = Array.isArray(option)
            ? option.length > 0
            : !!option && typeof option === 'object' && Object.keys(option).length > 0;

        if (!hasDefaultOptions && !hasOptions) {
            return true;
        }

        return this.utility.hasOptionValue(fieldInfo.option_default, value)
            || this.utility.hasOptionValue(fieldInfo.option, value);
    }

    private getDefaultOptionValue(fieldInfo: CrudFormFieldInfoType): any {
        const defaultOption = this.utility.getFirstOptionValue(fieldInfo.option_default);

        if (defaultOption !== null) {
            return defaultOption;
        }

        return this.utility.getFirstOptionValue(fieldInfo.option);
    }

    private normalizeSingleOptionValue(
        value: any,
        fieldInfo: CrudFormFieldInfoType,
        mode: CrudFieldNormalizeModeEnum,
        context?: CrudModuleContextType,
    ): any {
        if (this.utility.isBlankValue(value)) {
            if (!this.utility.isBlankValue(fieldInfo.value)) {
                return mode === CrudFieldNormalizeModeEnum.CTOS
                    ? this.decryptInputByMode(fieldInfo.value, fieldInfo, mode, context)
                    : fieldInfo.value;
            }

            if (!this.utility.isBlankValue(fieldInfo.default)) {
                return mode === CrudFieldNormalizeModeEnum.CTOS
                    ? this.decryptInputByMode(fieldInfo.default, fieldInfo, mode, context)
                    : fieldInfo.default;
            }

            return this.getDefaultOptionValue(fieldInfo);
        }

        let key = value;

        if (typeof value === 'object') {
            if (!this.utility.isNil(value.id)) {
                key = value.id;
            } else if (!this.utility.isNil(value.value)) {
                key = value.value;
            } else if (!this.utility.isNil(value.key)) {
                key = value.key;
            } else {
                key = this.utility.toStringValue(value);
            }
        }

        if (
            typeof key === 'string'
            || typeof key === 'number'
            || typeof key === 'boolean'
        ) {
            key = this.utility.parseKey(key);
        }

        if (!this.fieldOptionHasValue(key, fieldInfo)) {
            if (!this.utility.isBlankValue(fieldInfo.value)) {
                return mode === CrudFieldNormalizeModeEnum.CTOS
                    ? this.decryptInputByMode(fieldInfo.value, fieldInfo, mode, context)
                    : fieldInfo.value;
            }

            if (!this.utility.isBlankValue(fieldInfo.default)) {
                return mode === CrudFieldNormalizeModeEnum.CTOS
                    ? this.decryptInputByMode(fieldInfo.default, fieldInfo, mode, context)
                    : fieldInfo.default;
            }

            return this.getDefaultOptionValue(fieldInfo);
        }

        return key;
    }

    private normalizeMultiOptionValue(
        value: any,
        fieldInfo: CrudFormFieldInfoType,
        mode: CrudFieldNormalizeModeEnum,
        context?: CrudModuleContextType,
    ): any[] {
        const normalizedValues = this.utility.toArrayValue(value)
            .map((item) => {
                return this.normalizeSingleOptionValue(item, fieldInfo, mode, context);
            })
            .filter((item) => !this.utility.isBlankValue(item));

        const seen = new Set<string>();
        const output: any[] = [];

        for (const item of normalizedValues) {
            const key = typeof item === 'string'
                ? item
                : JSON.stringify(item);

            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            output.push(item);
        }

        return output;
    }

    private validationSuccess(value: any): CrudFieldValidationResultType {
        return {
            valid: true,
            value,
            errors: [],
        };
    }

    private validationFailure(
        value: any,
        message: string,
    ): CrudFieldValidationResultType {
        return {
            valid: false,
            value,
            errors: [message],
        };
    }

    private isTimeValueValid(value: any): boolean {
        return CrudValidation.TIME_PATTERN.test(this.utility.toStringValue(value));
    }

    private isDatetimeValueValid(value: any): boolean {
        return this.utility.toValidDate(value) !== null
            && CrudValidation.DATETIME_TIME_PATTERN.test(this.utility.toStringValue(value));
    }

    private isDecimalValueValid(value: any): boolean {
        return CrudValidation.DECIMAL_PATTERN.test(this.utility.toStringValue(value));
    }

    private isTextValueValid(
        value: any,
        requireString: boolean = false,
    ): boolean {
        if (requireString && typeof value !== 'string') {
            return false;
        }

        return CrudValidation.TEXT_PATTERN.test(this.utility.toStringValue(value));
    }

    private hasAllowedExtension(
        fileName: string,
        allowedExtensions: string[],
    ): boolean {
        const fileExtension = fileName
            .substring(fileName.lastIndexOf('.'))
            .toLowerCase();

        return allowedExtensions.some((extension) => {
            return extension.toLowerCase() === fileExtension;
        });
    }

    private isOptionValueAllowed(
        value: any,
        option: CrudFieldOptionType,
    ): boolean {
        return Array.isArray(value)
            ? value.every((item) => this.utility.hasOptionValue(option, item))
            : this.utility.hasOptionValue(option, value);
    }

    /**
     * Validate one already-normalized CRUD form value.
     */
    private validateCrudFormFieldValue(
        v: unknown,
        fi: CrudFormFieldInfoType,
        r?: Record<string, any>
    ): CrudFieldValidationResultType {
        const errors: string[] = [];

        const validationEntries = Object.entries(fi.validation ?? {}) as [CrudFieldValidationEnum, CrudFieldValidationInfoType][];

        for (const [validationType, rule] of validationEntries) {
            const validate = this.formFieldValidator[validationType];
            if (!validate) continue;

            const result = validate(v, fi, r);

            if (!result.valid) {
                errors.push(rule?.message || result.errors[0]);
            }
        }

        return {
            valid: errors.length === 0,
            value: v,
            errors,
        };
    }

    /**
     * @normalizeAndValidateCrudFormFieldValue
     * Normalize and validate a CRUD form field value.
     */
    public normalizeAndValidateCrudFormFieldValue(
        v: unknown,
        fi: CrudFormFieldInfoType,
        r?: Record<string, any>,
        mode: CrudFieldNormalizeModeEnum = CrudFieldNormalizeModeEnum.CTOS,
        context?: CrudModuleContextType,
    ): CrudFieldValidationResultType {
        const nv = this.normalizeCrudFormFieldValue(v, fi, r, mode, context);

        const vr = this.validateCrudFormFieldValue(nv, fi, r);

        const resp: CrudFieldValidationResultType = {
            valid: vr.valid,
            value: (vr.valid ? nv : fi.default) ?? null,
            errors: vr.errors,
        };

        return resp;
    }

    /**
     * Format a configured field value for listing, quick-search and read-only views.
     */
    public formatCrudFieldValue(
        v: any,
        fi: CrudFieldInfoType,
        r: Record<string, any>,
        context?: CrudModuleContextType,
    ): any {
        const formattedValue = this.fieldFormatter[fi.type](v, fi, r);
        const encryptedValue = this.encryptFieldValueIfNeeded(
            formattedValue,
            fi,
            context,
        );

        if (fi.format_val) {
            return fi.format_val(encryptedValue, fi, r);
        }

        return encryptedValue;
    }

    // Apply validation methods available from "@angular/forms/signals".
    // TODO: hidden() logic is pending with angular forms, not clear at this time.
    /**
     *  @setCrudSignalFormValidation
     */
    public setCrudSignalFormValidation<T>(
        sp: SchemaPathTree<T>, // schema path
        fObj: CrudStateMutationFieldObjType, // fields info
    ): void {

        const keys = Object.keys(fObj);
        for (let i = 0; i < keys.length; i++) {
            const f = keys[i];
            const fi = fObj[f];

            if (fi.validation) {
                const rules = Object.entries(fi.validation) as [CrudFieldValidationEnum, CrudFieldValidationInfoType][];

                for (const [validationType, rule] of rules) {
                    const apply = this.signalFormFieldValidator[validationType];
                    if (!apply) continue;
                    apply(sp, f, validationType, rule, fi);
                }
            }
        }
    }
}
