// file: src/app/base/crud/service/root.ts
import { inject, Injector } from "@angular/core";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { BreakpointObserverService } from "@libs/breakpoint/service";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignatureService } from "@libs/signature/service";
import { PrivateAreaLayoutService } from "@area/private/service";
import { BreadcrumbService } from "xng-breadcrumb";
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { CrudFieldSlotPortalKeyPrefixEnum, CrudFieldUiTypeEnum, CrudListingAdditionalColumnsEnum, CrudActionUiLayoutEnum, CrudEndSideBarTabEnum } from "@base/crud/enum";
import { UiSizeEnum } from "@libs/breakpoint/enum";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { CrudUrl } from "@base/crud/url";
import { CrudRoute } from "@base/crud/route";
import { CrudUtility } from "@base/crud/utility";
import { CrudValidation } from "@base/crud/validation";
import { NotifyService } from "@base/notify/service";
import {
    CrudFindByKeyHandlerType,
    CrudRecordKeyInputType,
    CrudRecordKeyType,
    CrudRecordType,
    CrudStateRecordFieldObjType,
    CrudStateFormFieldObjType,
} from "@base/crud/type";
import { NotifyBannerService } from "@base/notify-banner/service";
import { DateTimeService } from "@libs/date-time/service";
import { I18nService } from "@base/internationalization/service";
import { CRUD_I18N_KEY, CRUD_PRINT_SECTION_ID } from "@base/crud/const";
import { CrudState } from "src/app/base/crud/state/entry";
import {
    FormFieldDatetimeModeEnum,
    FormFieldDatetimePickerModeEnum,
    FormFieldDatetimeStartViewEnum,
} from "@base/form-fields/datetime/enum";
import { FoundationFieldDefaultNameEnum } from "@libs/foundation/field/enum";
import { ConfirmationDialogService } from "@base/confirmation-dialog/service";

/**
 * Base of the CrudService split (mirrors CrudRootState in state/root.ts).
 * Holds only DI + generic, child-agnostic helpers. Anything that needs to
 * know about action/searchFilter/listing/mutation/view lives in those files
 * (or in init.ts when it needs more than one of them) — never here.
 */
export abstract class CrudRootService {

    // ████████████████████████████████████████████████████████████████████
    // ███ RAW VARIABLES ██████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public readonly PrivateAreaLayoutSlotEnum = PrivateAreaLayoutSlotEnum;
    public readonly CrudFieldUiTypeEnum = CrudFieldUiTypeEnum;
    public readonly CrudFieldSlotPortalKeyPrefixEnum = CrudFieldSlotPortalKeyPrefixEnum;
    public readonly CrudListingAdditionalColumnsEnum = CrudListingAdditionalColumnsEnum;
    public readonly CrudActionUiLayoutEnum = CrudActionUiLayoutEnum;
    public readonly UiSizeEnum = UiSizeEnum;
    public readonly CRUD_PRINT_SECTION_ID = CRUD_PRINT_SECTION_ID;
    public readonly CrudEndSideBarTabEnum = CrudEndSideBarTabEnum;
    public readonly CrudActionEnum = FoundationActionEnum;
    public readonly FormFieldDatetimeModeEnum = FormFieldDatetimeModeEnum;
    public readonly FormFieldDatetimePickerModeEnum = FormFieldDatetimePickerModeEnum;
    public readonly FormFieldDatetimeStartViewEnum = FormFieldDatetimeStartViewEnum;
    public readonly FoundationFieldDefaultNameEnum = FoundationFieldDefaultNameEnum;

    // ████████████████████████████████████████████████████████████████████
    // ███ DEPENDENCIES ███████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private componentInjector: Injector | null = null;

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);

    public readonly api = inject(BfwApiService);

    public readonly notify = inject(NotifyService);
    public readonly notifyBanner = inject(NotifyBannerService);
    public readonly sign = inject(SignatureService);
    public readonly bos = inject(BreakpointObserverService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly breadcrumb = inject(BreadcrumbService);
    public readonly datetime = inject(DateTimeService);

    public readonly paLayout = inject(PrivateAreaLayoutService);
    public readonly confirmationDialog = inject(ConfirmationDialogService);

    public readonly state = inject(CrudState);
    public readonly utility = inject(CrudUtility);
    public readonly validation = inject(CrudValidation);
    public readonly url = inject(CrudUrl);
    public readonly route = inject(CrudRoute);

    // ████████████████████████████████████████████████████████████████████
    // ███ API ACCESS (generic by-key finders) ███████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private findByPrimaryKeyHandler: CrudFindByKeyHandlerType | null = null;
    private findBySecondaryKeyHandler: CrudFindByKeyHandlerType | null = null;

    // ████████████████████████████████████████████████████████████████████
    // ███ OTHER ██████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public readonly emptyOptionBag: Record<string, any> = Object.freeze({});

    public initI18n(): void {
        this.i18n.useModule(CRUD_I18N_KEY);
    }

    /**
     * Set the injector from component.
     *
     * CrudService is feature-scoped via providers (not app-root singleton).
     * Logic is in service, but actual UI rendering context belongs to component tree/overlay host.
     * So, insted of using app-root singleton from service, we need to use component injector.
     * Here we can do same in service like
     * - private readonly injector = inject(Injector);
     * but component-driven injection is better, this keeps service less tightly coupled to DI container acquisition, while still allowing dynamic component resolution.
     */
    public setComponentInjector(injector: Injector): void {
        this.componentInjector = injector;
    }
    public getComponentInjector(): Injector {
        if (!this.componentInjector) {
            throw new Error('CrudService: [componentInjector] is not set.');
        }
        return this.componentInjector;
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ CRUD MODULE EXECUTOR REGISTRATION (by-key finders) █████████████
    // ████████████████████████████████████████████████████████████████████
    public registerFindByPrimaryKey(handler: CrudFindByKeyHandlerType): void {
        this.findByPrimaryKeyHandler = handler;
    }
    public registerFindBySecondaryKey(handler: CrudFindByKeyHandlerType): void {
        this.findBySecondaryKeyHandler = handler;
    }

    /** Find zero or more records using this module's configured primary key. */
    public async findByPrimaryKey(
        input: CrudRecordKeyInputType,
        fieldObj: CrudStateRecordFieldObjType,
    ): Promise<CrudRecordType[]> {
        if (!this.findByPrimaryKeyHandler) {
            throw new Error('CRUD find-by-primary-key handler is not registered.');
        }

        const keys = this.normalizeRecordKeys(input);
        return keys.length > 0 ? this.findByPrimaryKeyHandler(keys, fieldObj) : [];
    }

    /** Find zero or more records using this module's configured secondary key. */
    public async findBySecondaryKey(
        input: CrudRecordKeyInputType,
        fieldObj: CrudStateRecordFieldObjType,
    ): Promise<CrudRecordType[]> {
        if (!this.findBySecondaryKeyHandler) {
            throw new Error('CRUD find-by-secondary-key handler is not registered.');
        }

        const keys = this.normalizeRecordKeys(input);
        return keys.length > 0 ? this.findBySecondaryKeyHandler(keys, fieldObj) : [];
    }

    public async findOneByPrimaryKey(
        key: CrudRecordKeyType,
        fieldObj: CrudStateRecordFieldObjType,
    ): Promise<CrudRecordType | null> {
        const records = await this.findByPrimaryKey(key, fieldObj);
        return records[0] ?? null;
    }

    public async findOneBySecondaryKey(
        key: CrudRecordKeyType,
        fieldObj: CrudStateRecordFieldObjType,
    ): Promise<CrudRecordType | null> {
        const records = await this.findBySecondaryKey(key, fieldObj);
        return records[0] ?? null;
    }

    private normalizeRecordKeys(
        input: CrudRecordKeyInputType,
    ): CrudRecordKeyType[] {
        const keys = Array.isArray(input) ? input : [input];
        const unique = new Map<string, CrudRecordKeyType>();

        for (const key of keys) {
            const normalized = String(key).trim();
            if (normalized.length > 0 && !unique.has(normalized)) {
                unique.set(normalized, key);
            }
        }

        return [...unique.values()];
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ SHARED HELPER (used by search.filter.ts and listing.ts) ███████
    // ████████████████████████████████████████████████████████████████████
    public formFieldInputValues(
        fieldObj: CrudStateFormFieldObjType,
        omitEmpty: boolean,
    ): Record<string, any> {
        const output: Record<string, any> = {};

        for (const [key, fieldInfo] of Object.entries(fieldObj)) {
            if (fieldInfo.type === CrudFieldUiTypeEnum.NONE) continue;

            const value = fieldInfo.value ?? fieldInfo.default ?? null;
            const preserveEmptyFlag = fieldInfo.type === CrudFieldUiTypeEnum.FLAG
                && fieldInfo.flag?.clearable === true;

            if (omitEmpty && !preserveEmptyFlag && this.utility.isValidationEmpty(value)) continue;

            output[key] = value instanceof Date ? value.toISOString() : value;
        }

        return output;
    }
}
