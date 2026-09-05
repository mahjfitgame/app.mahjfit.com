// file: src/app/base/crud/url.ts
import { effect, inject, Service, untracked } from "@angular/core";
import { UrlParamsType } from "@libs/url/type";
import { UrlService } from "@libs/url/service";
import { CrudFieldNormalizeModeEnum } from "@base/crud/enum";
import { FoundationActionEnum, FoundationActionSlugEnum } from "@libs/foundation/action/enum";
import { CrudState } from "@base/crud/state";
import { CrudStateFormFieldUpdaterType, CrudStateFormFieldObjType, CrudActionRecordPrimaryKeyValueType, CrudActionRecordSecondaryKeyValueType } from "@base/crud/type";
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
             */
            this.state.searchFilterFieldObj();
            this.state.viewOptionFieldObj();
            this.state.listOperationFieldObj();

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
                this.state.searchFilterFieldObj(),
                (key, patch) => this.state.updateSearchFilterFieldObj(key, patch),
            );

            // ViewOptionFieldObj
            this.syncCrudFieldObjGroupFromUrlState(
                sourceMatrixParams,
                this.state.viewOptionFieldObj(),
                (key, patch) => this.state.updateViewOptionFieldObj(key as any, patch),
            );

            // ListOperationFieldObj
            this.syncCrudFieldObjGroupFromUrlState(
                sourceMatrixParams,
                this.state.listOperationFieldObj(),
                (key, patch) => this.state.updateListOperationFieldObj(key as any, patch)
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
                sourceMatrixParams[matrixParamName],
                fieldInfo,
                undefined,
                CrudFieldNormalizeModeEnum.CTOS,
            );
            
            if (!result.valid) {
                continue;
            }

            // update in crud state if valid using provided callback
            updateField(fieldKey, {
                value: result.value,
            });
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

            if (this.shouldSkipUrlValue(sourceValue)) {
                continue;
            }

            const result = this.validation.normalizeAndValidateCrudFormFieldValue(
                sourceValue,
                fieldInfo,
                undefined,
                CrudFieldNormalizeModeEnum.STOC,
            );

            if (!result.valid || this.shouldSkipUrlValue(result.value)) {
                continue;
            }

            params[matrixParamName] = result.value;
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
                sourceMatrixParams[matrixParamName],
                fieldInfo,
                undefined,
                CrudFieldNormalizeModeEnum.CTOS,
            );

            if (!result.valid || this.shouldSkipUrlValue(result.value)) {
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
            this.state.searchFilterFieldObj(),
            this.state.listOperationFieldObj(),
            this.state.viewOptionFieldObj(),
        ];
    }

    // ██████ CRUD ACTION URL ███████████████████████████████████████████
    public getCrudActionNavigationState(): Record<string, string> {
        return {
            crudReturnUrl: this.router.url,
        };
    }
    public getCrudBaseUrl(): string {
        const urlWithoutHash = this.router.url.split('#')[0];
        const [pathOnly] = urlWithoutHash.split('?');

        const cleanSegments = pathOnly
            .split('/')
            .map((segment) => segment.split(';')[0]);

        const lastSegment = cleanSegments.at(-1);
        const secondLastSegment = cleanSegments.at(-2);

        if (lastSegment === FoundationActionEnum.CREATE) {
            cleanSegments.pop();
        } else if (secondLastSegment === FoundationActionEnum.UPDATE) {
            cleanSegments.splice(-2);
        }

        return cleanSegments.join('/');
    }
    public getCreateActionUrl(): string {
        return `${this.getCrudBaseUrl()}/${FoundationActionEnum.CREATE}`;
    }
    /**
     * PARKED — primary-key addressed update url.
     *
     * Fills ':id', the param the parked CrudState/CrudRoute primary chain reads
     * back. FoundationActionSlugEnum.UPDATE is ':keyid', so this produces a url
     * with an unfilled placeholder until a primary-key addressed slug exists —
     * that is the parked state, not a bug to patch by pointing it at ':keyid'.
     * Doing that would silently make it a duplicate of the secondary builder.
     *
     * Use getUpdateActionUrlBySecondaryKey() for anything real.
     */
    public getUpdateActionUrlByPrimaryKey(id: CrudActionRecordPrimaryKeyValueType): string {
        return this.buildUpdateActionUrl(id, FoundationFieldDefaultNameEnum.ID);
    }

    /**
     * LIVE — secondary-key addressed update url.
     *
     * Fills ':keyid', which is what FoundationActionSlugEnum.UPDATE declares
     * and what CrudState.crudActionRecordSecondaryKey reads back, so the
     * builder and the reader cannot drift.
     */
    public getUpdateActionUrlBySecondaryKey(key: CrudActionRecordSecondaryKeyValueType): string {
        return this.buildUpdateActionUrl(key, FoundationFieldDefaultNameEnum.KEYID);
    }

    /**
     * ⚠ the placeholder name is a PARAMETER here, derived from the same
     * FoundationFieldDefaultNameEnum the slug template is built from. It used
     * to be hardcoded on one side while the template came from a constant —
     * rename the constant and only half of it moved, leaving a literal
     * ':keyid' in the emitted url. No compile error, no test, just a dead link.
     */
    private buildUpdateActionUrl(
        value: CrudActionRecordPrimaryKeyValueType | CrudActionRecordSecondaryKeyValueType,
        paramName: FoundationFieldDefaultNameEnum,
    ): string {
        // 1. join the parent and child slugs
        let fullPath = [this.getCrudBaseUrl(), FoundationActionSlugEnum.UPDATE].join('/');

        // 2. check if values are array then join them with commas
        if (Array.isArray(value)) {
            value = value.join(',');
        }

        // 3. replace placeholders with actual values, all parameters stay in service only
        const params: Record<string, string | number> = {
            [`:${paramName}`]: value ?? '',
        };

        Object.entries(params).forEach(([key, val]) => {
            fullPath = fullPath.replace(key, val.toString());
        });

        return fullPath;
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