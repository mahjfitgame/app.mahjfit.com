// file: src/app/base/crud/url.ts
import { effect, inject, Service, untracked } from "@angular/core";
import { UrlParamsType } from "@libs/url/type";
import { UrlService } from "@libs/url/service";
import { CrudFieldNormalizeModeEnum, CrudFieldUiTypeEnum, CrudUrlFieldFlagValueEnum } from "@base/crud/enum";
import { LogService } from "@libs/log/service";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { CrudState } from "@base/crud/state/init";
import { CrudStateFormFieldUpdaterType, CrudStateFormFieldObjType, CrudActionRecordPrimaryKeyValueType, CrudActionRecordSecondaryKeyValueType, CrudFormFieldInfoType } from "@base/crud/type";
import { CrudUtility } from "@base/crud/utility";
import { CrudValidation } from "@base/crud/validation";
import { NavigationEnd, Router } from "@angular/router";
import { Location } from '@angular/common';
import { catchError, filter, firstValueFrom, map, of, take, timeout } from "rxjs";
import { CrudRoute } from "@base/crud/route";
import { FoundationFieldDefaultNameEnum } from "@libs/foundation/field/enum";

@Service({ autoProvided: false })
export class CrudUrl {
    private readonly router = inject(Router);
    private readonly location = inject(Location);
    /**
     * IMPORTANT 
     * 
     * Do not import UrlService directly in other CRUD service
     * Make sure to use same instance by injecting CrudUrl
     * This is to mantain URL sync between modules and adjust behaviour 
     */
    private readonly url = inject(UrlService);
    
    private readonly log = inject(LogService);
    public readonly state = inject(CrudState);
    public readonly route = inject(CrudRoute);
    public readonly utility = inject(CrudUtility);
    public readonly validation = inject(CrudValidation);

    private syncingCrudAndUrlState = false;

    constructor() {
        // auto sync url on crud state change, so no need to make a separate request everytime
        effect(() => {
            /**
             * Main URL sync flag:
             * If UrlService sync is disabled, skip the expensive CRUD -> URL work.
             */
            if (!this.url.isUrlSyncEnabled()) {
                return;
            }

            /**
             * Track only CRUD-owned state groups.
             * Any update to these groups will re-run this effect.
             * Explicit reactive dependencies for CRUD → URL synchronization.
             */
            void this.state.searchFilter.searchFilterFieldObj();
            void this.state.listing.viewOptionFieldObj();
            void this.state.listing.listOperationFieldObj();

            /**
             * Avoid echo while URL -> CRUD hydration is running.
             */
            if (this.syncingCrudAndUrlState) {
                return;
            }

            /**
             * Important:
             * syncUrlStateFromCrudState reads/writes URL state.
             * Run it untracked so URL-state changes do not become dependencies
             * of this CRUD-state effect.
             */
            untracked(() => {
                this.syncUrlStateFromCrudState();
            });
        });
    }

    // █████ URL SERVICE BOOTSTRAP ███████████████████████████████████████████

    /**
     * Child module should call this once during service/component init.
     *
     * UrlService does the URL work:
     * 1. Reads current route URL into UrlStateRuntime.
     * 2. Enables URL sync.
     *
     * CrudUrl does not inspect routes.
     */
    public initUrlSync(): void {
        this.url.initUrlSync();
    }

    /**
     * Optional direct pass-through.
     *
     * Normally prefer initUrlSync() because it reads URL first and enables sync
     * after URL state is populated.
     */
    public enableUrlSync(flag: boolean = true): void {
        this.url.enableUrlSync(flag);
    }

    // █████ MAIN API: URL_STATE -> CRUD_STATE ███████████████████████████████

    public initCrudStateFromUrlState(): void {
        // debugger; // on the line where you want to stop
        if (!this.url.isUrlSyncEnabled()) {
            return;
        }

        try {
            this.syncingCrudAndUrlState = true;
            

            // get the current URL matrix params
            const sourceMatrixParams = this.url.state.getMatrixParams();

            // SearchFilterFieldObj
            this.syncCrudFieldObjGroupFromUrlState(
                sourceMatrixParams,
                this.state.searchFilter.searchFilterFieldObj(),
                (key, patch) => this.state.searchFilter.updateSearchFilterFieldObj(key, patch),
            );

            // ViewOptionFieldObj
            this.syncCrudFieldObjGroupFromUrlState(
                sourceMatrixParams,
                this.state.listing.viewOptionFieldObj(),
                (key, patch) => this.state.listing.updateViewOptionFieldObj(key as any, patch),
            );

            // ListOperationFieldObj
            this.syncCrudFieldObjGroupFromUrlState(
                sourceMatrixParams,
                this.state.listing.listOperationFieldObj(),
                (key, patch) => this.state.listing.updateListOperationFieldObj(key as any, patch)
            );
        } finally {
            this.syncingCrudAndUrlState = false;
        }
    }
    /**
     * Hydrate CRUD state from UrlStateRuntime.
     *
     * This is the main method you should call after:
     * - URL service has synced URL into UrlStateRuntime
     * - CRUD field objects have been initialized
     *
     * It can be called before API fetch to hydrate filters/page/options.
     * It can be called again after API fetch to hydrate selected rows.
     * 
     * ON PAGE LOAD REQUEST WILL COME HERE
     */
    public syncCrudStateFromUrlState(): void {
        if (!this.url.isUrlSyncEnabled()) {
            return;
        }

        this.initCrudStateFromUrlState();

        // Sync URL state, but on initial load we make api call and after perform sync
        this.syncingCrudAndUrlState = true;
        this.syncUrlStateFromCrudState();
        this.syncingCrudAndUrlState = false;
    }

    /**
     * Hydrate CRUD state from UrlStateRuntime.
     * It takes a field object as input, loop through each field, and update.
     * At the end it calls state update methods [updateField] to update state. 
     * 
     * So, this is generic method which can be used for any field object.
     * searchFilterFieldObj()
     * viewOptionFieldObj()
     * listOperationFieldObj()
     */
    private syncCrudFieldObjGroupFromUrlState(
        sourceMatrixParams: UrlParamsType,
        fieldObj: CrudStateFormFieldObjType,
        updateField: CrudStateFormFieldUpdaterType,
    ): void {
        const keys = Object.keys(fieldObj);

        /**
         * Collected here rather than re-walked afterwards: updateField() rebuilds the
         * field object, so [fieldObj] is a stale snapshot the moment the first value
         * is written. The fresh value has to be carried out of this loop by hand.
         */
        const restored: Array<{ fieldKey: string; fieldInfo: any; value: any }> = [];

        for (let i = 0; i < keys.length; i++) {
            const fieldKey = keys[i];
            const fieldInfo = fieldObj[fieldKey];

            const matrixParamName = fieldInfo?.url_matrix_param;

            /**
             * url_matrix_param = null means:
             * this field is intentionally not URL-backed.
             */
            if (!matrixParamName) {
                continue;
            }

            /**
             * If URL does not have this param, keep the already-initialized
             * CRUD default.
             */
            if (!(matrixParamName in sourceMatrixParams)) {
                continue;
            }

            const result = this.validation.normalizeAndValidateCrudFormFieldValue(
                this.decodeFlagUrlValue(sourceMatrixParams[matrixParamName], fieldInfo),
                fieldInfo,
                undefined,
                CrudFieldNormalizeModeEnum.CTOS,
                this.state.getCrudModuleContext(),
            );
            
            if (!result.valid) {
                continue;
            }

            // update in crud state if valid using provided callback
            updateField(fieldKey, {
                value: result.value,
            });

            if (typeof (fieldInfo as any)?.value_loader === 'function') {
                restored.push({
                    fieldKey: fieldKey,
                    fieldInfo: fieldInfo,
                    value: result.value,
                });
            }
        }

        if (restored.length === 0) {
            return;
        }

        /**
         * Deliberately not awaited. The values above are already applied, and the
         * search drawer that renders these fields is closed at init time, so the
         * label lands long before anything paints it.
         *
         * The one window it does not cover: opening the drawer while the lookup is
         * still in flight shows the raw key until the field is rendered again.
         */
        void this.loadValueLabelFromUrlState(restored, updateField);
    }

    /**
     * A value restored from the URL is a key with no label: the URL carries
     * ";region=3" and never the name. There is no record here either, so fr_field
     * has nothing to read - the field's own value_loader() is the only thing that
     * can name it.
     *
     * The answer is merged into [option], so every ui type that already reads
     * [option] - SELECT, MULTISELECT, BUTTON_SELECT, BUTTON_MULTISELECT, RADIO,
     * CHECKBOX, AUTOSUGGEST - is served by this one pass, and none of them need to know
     * it happened.
     */
    private async loadValueLabelFromUrlState(
        restored: Array<{ fieldKey: string; fieldInfo: any; value: any }>,
        updateField: CrudStateFormFieldUpdaterType,
    ): Promise<void> {
        for (let i = 0; i < restored.length; i++) {
            const { fieldKey, fieldInfo, value } = restored[i];

            const loader = fieldInfo?.value_loader;

            if (typeof loader !== 'function' || value === null || value === undefined || value === '') {
                continue;
            }

            /**
             * AUTOSUGGEST and MULTIAUTOSUGGEST name their own values, so asking here is
             * the same request twice.
             *
             * <app-form-field-autosuggest> is handed this very value_loader through
             * [valueLoader] and asks for whatever it cannot name, ONCE PER KEY, from
             * its own mount. It is also the more complete of the two: this pass only
             * ever sees values that arrived in the URL, while the control equally
             * covers a field object carrying its own `value:` and a value set later
             * in code.
             *
             * Every other ui type reading [option] - SELECT, MULTISELECT, BUTTON_SELECT,
             * BUTTON_MULTISELECT, RADIO, CHECKBOX - has no such loader of its own and
             * still needs this.
             */
            if (
                fieldInfo?.type === CrudFieldUiTypeEnum.AUTOSUGGEST ||
                fieldInfo?.type === CrudFieldUiTypeEnum.MULTISELECTAUTOSUGGEST
            ) {
                continue;
            }

            /**
             * A SIGNAL [option] bag names its own keys the moment it lands, so asking
             * a loader here is the same request twice - the same reason the two
             * autosuggest types are skipped above.
             *
             * And it would not merely be wasted: updateField() writes a PLAIN object,
             * so the answer would replace the signal on the field object and the field
             * would stop following it for good - a later reload() would repaint
             * nothing.
             */
            if (typeof fieldInfo.option === 'function') {
                continue;
            }

            const known = { ...(fieldInfo.option ?? {}), ...(fieldInfo.option_default ?? {}) };

            // every key already named - asking again would be a wasted request
            const pending = (Array.isArray(value) ? value : [value])
                .filter((v) => v !== null && v !== undefined && v !== '' && !(String(v) in known));

            if (pending.length === 0) {
                continue;
            }

            try {
                const loaded = await loader(value, fieldInfo);

                if (!loaded || Object.keys(loaded).length === 0) {
                    continue;
                }

                // merged, not replaced: a static [option] bag stays authoritative
                updateField(fieldKey, {
                    option: { ...(fieldInfo.option ?? {}), ...loaded },
                });
            } catch (e) {
                // a value that cannot be named is not worth breaking the page for;
                // the control falls back to showing the raw key
                this.log.error('loadValueLabelFromUrlState', e);
            }
        }
    }

    // █████ MAIN API: CRUD_STATE -> URL_STATE ███████████████████████████████

    /**
     * This is the main method to sync URL state from CRUD state.
     * 
     * Generate normalized CRUD matrix params and push only CRUD-owned params
     * into UrlStateRuntime through UrlService.
     *
     * Important:
     * - unrelated URL matrix params are preserved
     * - CRUD-owned old params are removed/replaced
     * - UrlService performs actual URL writing
     */
    public syncUrlStateFromCrudState(): void {
        if (!this.url.isUrlSyncEnabled()) {
            return;
        }

        // do not write list/filter matrix params onto action URLs such as add, update etc
        if (this.route.readIsCrudActionRoute()) {
            return;
        }

        const currentMatrixParams = this.url.state.getMatrixParams();

        const nextMatrixParams: UrlParamsType = {
            ...this.removeCrudOwnedParams(currentMatrixParams),
            ...this.getCrudMatrixParamsFromState(),
        };

        // sync url state
        // ⚠ setMatrixParams REPLACES. patchMatrixParams would leave stale params behind.
        this.url.state.setMatrixParams(nextMatrixParams);
    }

    /**
     * @param patch: UrlParamsType
     * @returns void
     * 
     * Optional direct patch helper for UI actions.
     * Allow to pass URL matrix params directly.
     *
     * Example:
     * this.crud.url.patchCrudUrlState({ qs: 'india', cp: 1 });
     */
    public patchCrudUrlState(patch: UrlParamsType): void {
        if (!this.url.isUrlSyncEnabled()) {
            return;
        }
        const currentMatrixParams = this.url.state.getMatrixParams();

        const nextMatrixParams: UrlParamsType = {
            ...this.removeCrudOwnedParams(currentMatrixParams),
            ...this.getCrudMatrixParamsFromState(),
            ...patch,
        };

        // ⚠ setMatrixParams REPLACES. patchMatrixParams would leave stale params behind.
        this.url.state.setMatrixParams(nextMatrixParams);
    }

    public getCrudMatrixParamsFromState(): UrlParamsType {
        const params: UrlParamsType = {};

        const groups = this.getCrudStateFieldGroupsWithOrder();

        for (let i = 0; i < groups.length; i++) {
            Object.assign(
                params,
                this.getCrudFieldGroupMatrixParamsFromState(groups[i]),
            );
        }

        return params;
    }

    private getCrudFieldGroupMatrixParamsFromState(
        fieldObj: CrudStateFormFieldObjType,
    ): UrlParamsType {
        const params: UrlParamsType = {};

        const keys = Object.keys(fieldObj);
        for (let i = 0; i < keys.length; i++) {
            const fieldKey = keys[i];
            const fieldInfo = fieldObj[fieldKey];

            const matrixParamName = fieldInfo?.url_matrix_param;

            if (!matrixParamName) {
                continue;
            }

            const sourceValue = fieldInfo.value;
            const preserveEmptyFlag = this.isClearableFlag(fieldInfo);

            if (!preserveEmptyFlag && this.shouldSkipUrlValue(sourceValue)) {
                continue;
            }

            const result = this.validation.normalizeAndValidateCrudFormFieldValue(
                sourceValue,
                fieldInfo,
                undefined,
                CrudFieldNormalizeModeEnum.STOC,
                this.state.getCrudModuleContext(),
            );

            const urlValue = this.encodeFlagUrlValue(result.value, fieldInfo);

            if (!result.valid || this.shouldSkipUrlValue(urlValue)) {
                continue;
            }

            params[matrixParamName] = urlValue;
        }
        return params;
    }

    // █████ READ CURRENT CRUD PARAMS FROM URL STATE █████████████████████████

    /**
     * @returns UrlParamsType
     * 
     * Returns normalized/validated CRUD params currently present in UrlStateRuntime.
     * key is field.url_matrix_param and value is field.value
     * This method does not mutate CrudStateRuntime.
     * Just fetch the state data, process and return in required format
     */
    public getCrudMatrixParamsFromUrlState(): UrlParamsType {
        const sourceMatrixParams = this.url.state.getMatrixParams();
        const params: UrlParamsType = {};

        const groups = this.getCrudStateFieldGroupsWithOrder();

        for (let i = 0; i < groups.length; i++) {
            Object.assign(
                params,
                this.getCrudFieldGroupMatrixParamsFromUrlState(
                    sourceMatrixParams,
                    groups[i],
                ),
            );
        }

        return params;
    }

    /**
     * @returns UrlParamsType
     * 
     * As we deinfe matrix param name in fieldObject with `url_matrix_param` key, we need to get it from set fieldObject
     * This will be used to send back to UrlState to sync with url
     * This is how set name used in url params
     * This process also make sure that we have only params which are owned by crud
     */
    private getCrudFieldGroupMatrixParamsFromUrlState(
        sourceMatrixParams: UrlParamsType,
        fieldObj: CrudStateFormFieldObjType,
    ): UrlParamsType {
        const params: UrlParamsType = {};
        const keys = Object.keys(fieldObj);

        for (let i = 0; i < keys.length; i++) {
            const fieldKey = keys[i];
            const fieldInfo = fieldObj[fieldKey];

            const matrixParamName = fieldInfo?.url_matrix_param;

            if (!matrixParamName) {
                continue;
            }

            if (!(matrixParamName in sourceMatrixParams)) {
                continue;
            }

            const result = this.validation.normalizeAndValidateCrudFormFieldValue(
                this.decodeFlagUrlValue(sourceMatrixParams[matrixParamName], fieldInfo),
                fieldInfo,
                undefined,
                CrudFieldNormalizeModeEnum.CTOS,
                this.state.getCrudModuleContext(),
            );

            if (
                !result.valid
                || (!this.isClearableFlag(fieldInfo) && this.shouldSkipUrlValue(result.value))
            ) {
                continue;
            }

            params[matrixParamName] = result.value;
        }

        return params;
    }

    // █████ CRUD PARAM OWNERSHIP ███████████████████████████████████████████

    public removeCrudOwnedParams(params: UrlParamsType): UrlParamsType {
        const crudParamNames = this.getCrudOwnedMatrixParamNames();
        const next: UrlParamsType = {};

        for (const key in params) {
            if (!crudParamNames.has(key)) {
                next[key] = params[key];
            }
        }

        return next;
    }

    public getCrudOwnedMatrixParamNames(): Set<string> {
        const names = new Set<string>();
        const groups = this.getCrudStateFieldGroupsWithOrder();

        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const keys = Object.keys(group);

            for (let j = 0; j < keys.length; j++) {
                const matrixParamName = group[keys[j]]?.url_matrix_param;

                if (matrixParamName) {
                    names.add(matrixParamName);
                }
            }
        }

        return names;
    }

    /**
     * @returns array of field objects
     * 
     * This is small but important helper method.
     * Returns order in this array changes the order of matrix params position in URL 
     */
    public getCrudStateFieldGroupsWithOrder(): CrudStateFormFieldObjType[] {
        return [
            this.state.searchFilter.searchFilterFieldObj(),
            this.state.listing.listOperationFieldObj(),
            this.state.listing.viewOptionFieldObj(),
        ];
    }

    // ██████ CRUD ACTION URL ███████████████████████████████████████████
    public getCrudActionNavigationState(): Record<string, string> {
        return {
            crudReturnUrl: this.router.url,
        };
    }
    public getCrudBaseUrl(): string {
        return this.state.getModuleRoute().absolutePath();
    }
    public getCreateActionUrl(): string {
        return this.state.getModuleRoute().absolutePathCreate();
    }
    /** LIVE — secondary-key addressed read-only record url. */
    public getViewActionUrlBySecondaryKey(key: CrudActionRecordSecondaryKeyValueType): string {
        return this.state.getModuleRoute().absolutePathView(this.getActionRouteKey(key));
    }
    /** LIVE — secondary-key addressed print url. */
    public getPrintActionUrlBySecondaryKey(key: CrudActionRecordSecondaryKeyValueType): string {
        return this.state.getModuleRoute().absolutePathPrint(this.getActionRouteKey(key));
    }
    /**
     * PARKED — primary-key addressed update url.
     *
     * Fills ':id', the param the parked CrudState/CrudRoute primary chain reads
     * back. The UPDATE route currently declares ':keyid', so the central path
     * builder drops that unmatched placeholder until a primary-key addressed
     * action slug exists. That remains parked rather than silently becoming a
     * duplicate of the secondary builder.
     *
     * Use getUpdateActionUrlBySecondaryKey() for anything real.
     */
    public getUpdateActionUrlByPrimaryKey(id: CrudActionRecordPrimaryKeyValueType): string {
        return this.getCrudActionUrl(FoundationActionEnum.UPDATE, {
            [`:${FoundationFieldDefaultNameEnum.ID}`]: this.getActionRouteKey(id),
        });
    }

    /**
     * LIVE — secondary-key addressed update url.
     *
     * Fills ':keyid', which is what the UPDATE action route declares and what
     * CrudState.crudActionRecordSecondaryKey reads back, so the builder and the
     * reader cannot drift.
     */
    public getUpdateActionUrlBySecondaryKey(key: CrudActionRecordSecondaryKeyValueType): string {
        return this.state.getModuleRoute().absolutePathUpdate(this.getActionRouteKey(key));
    }

    /**
     * PARKED — primary-key addressed duplicate url. The DUPLICATE route currently
     * declares ':keyid', so this follows the same parked contract as UPDATE above
     * until a primary-key addressed action slug exists.
     */
    public getDuplicateActionUrlByPrimaryKey(id: CrudActionRecordPrimaryKeyValueType): string {
        return this.getCrudActionUrl(FoundationActionEnum.DUPLICATE, {
            [`:${FoundationFieldDefaultNameEnum.ID}`]: this.getActionRouteKey(id),
        });
    }

    /** LIVE — secondary-key addressed duplicate url. */
    public getDuplicateActionUrlBySecondaryKey(key: CrudActionRecordSecondaryKeyValueType): string {
        return this.state.getModuleRoute().absolutePathDuplicate(this.getActionRouteKey(key));
    }

    private getActionRouteKey(
        value: CrudActionRecordPrimaryKeyValueType | CrudActionRecordSecondaryKeyValueType,
    ): string | number {
        return Array.isArray(value) ? value.join(',') : value ?? '';
    }

    /** Only parked action URLs use this generic path API. */
    private getCrudActionUrl(
        action: FoundationActionEnum,
        params: Record<string, string | number> = {},
    ): string {
        return this.state.getModuleRoute().absolutePathAction(action, params);
    }
    public async navigateAwayFromCrudAction(): Promise<boolean> {
        const returnUrl = history.state?.crudReturnUrl;

        if (returnUrl) {
            return this.router.navigateByUrl(returnUrl);
        }

        if (history.state?.navigationId > 1) {
            const navigationEnd = firstValueFrom(
                this.router.events.pipe(
                    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
                    take(1),
                    map(() => true),
                    timeout({ first: 10000 }),
                    catchError(() => of(false)),
                ),
            );

            this.location.back();

            const navigatedBack = await navigationEnd;
            if (navigatedBack) {
                return true;
            }
        }

        return this.router.navigateByUrl(this.getCrudBaseUrl());
    }
    

    // █████ SMALL VALUE HELPERS ████████████████████████████████████████████

    private isClearableFlag(fieldInfo: CrudFormFieldInfoType): boolean {
        return fieldInfo.type === CrudFieldUiTypeEnum.FLAG
            && fieldInfo.flag?.clearable === true;
    }

    private encodeFlagUrlValue(
        value: unknown,
        fieldInfo: CrudFormFieldInfoType,
    ): any {
        if (!this.isClearableFlag(fieldInfo)) return value;
        if (value === null || value === undefined) return CrudUrlFieldFlagValueEnum.NULL;
        if (value === '') return CrudUrlFieldFlagValueEnum.NOT_NULL;

        return value;
    }

    private decodeFlagUrlValue(
        value: unknown,
        fieldInfo: CrudFormFieldInfoType,
    ): any {
        if (!this.isClearableFlag(fieldInfo)) return value;
        if (value === CrudUrlFieldFlagValueEnum.NULL) {
            return null;
        }
        if (value === CrudUrlFieldFlagValueEnum.NOT_NULL) {
            return '';
        }

        return value;
    }

    private shouldSkipUrlValue(value: unknown): boolean {
        if (value === null || value === undefined) {
            return true;
        }

        if (Array.isArray(value)) {
            return value.length === 0;
        }

        if (typeof value === 'string') {
            return value.trim().length === 0;
        }

        return false;
    }
    private toStringArray(value: unknown): string[] {
        const list = Array.isArray(value)
            ? value
            : String(value ?? "").split(",");

        const normalized = list
            .map((item) => String(item ?? "").trim())
            .filter((item) => item.length > 0);

        return [...new Set(normalized)];
    }
}
