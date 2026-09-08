// file: src/app/base/crud/state/root.ts

import { computed, inject, Injector, linkedSignal, signal } from "@angular/core";
import { CrudActionRecordPrimaryKeyValueType, CrudActionRecordSecondaryKeyValueType, CrudModuleActionRouteType, CrudSlotFieldPortalType, CrudSlotFieldsType, CrudUniqueKeyType } from "@base/crud/type";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation/module/type";
import { CRUD_STATE_STORE_KEY } from "../const";
import { UrlService } from "@libs/url/service";
import { CrudRoute } from "@base/crud/route";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { FoundationFieldDefaultNameEnum } from "@libs/foundation/field/enum";
import { CrudValidation } from "../validation";

export abstract class CrudRootState extends SignalStateService implements FoundationModuleStateType {
    // ████ DEPENDENCIES ████████████████████████████████████████████████
    protected readonly crudInjector = inject(Injector);

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);
    public readonly url = inject(UrlService);
    public readonly route = inject(CrudRoute);
    
    public readonly validation = inject(CrudValidation);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████
    public override readonly storeKey = CRUD_STATE_STORE_KEY;

    // ████ LISTENERS ███████████████████████████████████████████████████
    public override onActivate(): void {
        /*
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }
        });
        this.registerDeactivationCleanup(() => registerEffect.destroy());
        */
    }
    public override onDeactivate(): void {
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ moduleRoute ██████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _moduleRoute = signal<CrudModuleActionRouteType | null>(null);
    public readonly moduleRoute = this._moduleRoute.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setModuleRoute(moduleRoute: CrudModuleActionRouteType): void {
        if (!moduleRoute?.registryKey) {
            throw new Error('CrudState: [moduleRoute] is not valid.');
        }

        this._moduleRoute.set(moduleRoute);
    }
    public getModuleRoute(): CrudModuleActionRouteType {
        const moduleRoute = this.moduleRoute();

        if (!moduleRoute) {
            throw new Error('CrudState: [moduleRoute] is not set.');
        }

        return moduleRoute;
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ _slotFields ██████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████
    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _slotFields = signal<CrudSlotFieldsType | null>(null);
    public readonly slotFields = this._slotFields.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setSlotFields(slotFields: CrudSlotFieldsType): void {
        this._slotFields.set(slotFields);
    }
    public addSlotField(key: string, portal: CrudSlotFieldPortalType): void {
        this._slotFields.update((current) => {
            return {
                ...(current ?? {}),
                [key]: portal,
            };
        })
    }
    public getSlotField(key: string): CrudSlotFieldPortalType | null {
        return this.slotFields()?.[key] ?? null;
    }
    public removeSlotField(key: string): void {
        this._slotFields.update(fields => {
            // if it's already null/undefined, there's nothing to remove
            if (!fields) return fields;

            // create a shallow copy to maintain immutability
            const updated = { ...fields };
            delete updated[key];

            return updated;
        });
    }
    public clearSlotFields(): void {
        this._slotFields.set(null);
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ crudAction ███████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly crudActionFromRoute = computed<FoundationActionEnum | null>(() => {
        const firstPath = this.url.state.activatedRouteFirstSegment();

        return firstPath && this.route.isCrudActionValue(firstPath) ? firstPath : null;
    });

    private readonly _crudAction = linkedSignal<FoundationActionEnum | null>(
        () => this.crudActionFromRoute(),
    );
    public readonly crudAction = this._crudAction.asReadonly();

    private readonly crudActionRecordPrimaryKeyFromRoute = computed<CrudActionRecordPrimaryKeyValueType>(
        () => this.route.toCrudActionRecordPrimaryKey(this.url.state.routeParams()[FoundationFieldDefaultNameEnum.ID] ?? null),
    );

    private readonly crudActionRecordSecondaryKeyFromRoute = computed<CrudActionRecordSecondaryKeyValueType>(
        () => this.route.toCrudActionRecordSecondaryKey(this.url.state.routeParams()[FoundationFieldDefaultNameEnum.KEYID] ?? null),
    );

    private readonly _crudActionRecordPrimaryKey = linkedSignal<CrudActionRecordPrimaryKeyValueType>(
        () => this.crudActionRecordPrimaryKeyFromRoute(),
    );
    public readonly crudActionRecordPrimaryKey = this._crudActionRecordPrimaryKey.asReadonly();

    private readonly _crudActionRecordSecondaryKey = linkedSignal<CrudActionRecordSecondaryKeyValueType>(
        () => this.crudActionRecordSecondaryKeyFromRoute(),
    );
    public readonly crudActionRecordSecondaryKey = this._crudActionRecordSecondaryKey.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setCrudAction(action: FoundationActionEnum | null): void {
        this._crudAction.set(action);
    }
    public clearCrudAction(): void {
        this._crudAction.set(null);
    }
    public setCrudActionRecordPrimaryKey(key: CrudActionRecordPrimaryKeyValueType): void {
        this._crudActionRecordPrimaryKey.set(key);
    }
    public clearCrudActionRecordPrimaryKey(): void {
        this._crudActionRecordPrimaryKey.set(null);
    }
    public setCrudActionRecordSecondaryKey(key: CrudActionRecordSecondaryKeyValueType): void {
        this._crudActionRecordSecondaryKey.set(key);
    }
    public clearCrudActionRecordSecondaryKey(): void {
        this._crudActionRecordSecondaryKey.set(null);
    }
    /**
     * Clears BOTH key readings, not just the live one. Leaving the parked
     * primary signal holding a stale value after an action closes is how the
     * two chains would drift the day someone switches back.
     */
    public clearCrudActionAndRecordKey(): void {
        this.clearCrudAction();
        this.clearCrudActionRecordPrimaryKey();
        this.clearCrudActionRecordSecondaryKey();
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ standard field  ██████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    // signal ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private readonly _primaryKey = signal<string | null>(null);
    public readonly primaryKey = this._primaryKey.asReadonly();

    private readonly _secondaryKey = signal<string | null>(null);
    public readonly secondaryKey = this._secondaryKey.asReadonly();

    private readonly _uniqueKey = signal<CrudUniqueKeyType | null>(null);
    public readonly uniqueKey = this._uniqueKey.asReadonly();

    private readonly _urlSlugField = signal<string | null>(null);
    public readonly urlSlugField = this._urlSlugField.asReadonly();

    private readonly _isMainField = signal<string | null>(null);
    public readonly isMainField = this._isMainField.asReadonly();

    private readonly _recordPositionField = signal<string | null>(null);
    public readonly recordPositionField = this._recordPositionField.asReadonly();

    private readonly _activeField = signal<string | null>(null);
    public readonly activeField = this._activeField.asReadonly();

    private readonly _deletedField = signal<string | null>(null);
    public readonly deletedField = this._deletedField.asReadonly();

    // method ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public setPrimaryKey(key: string): void {
        this._primaryKey.set(key);
    }
    public setSecondaryKey(key: string): void {
        this._secondaryKey.set(key);
    }
    public setUniqueKey(arr: CrudUniqueKeyType | null): void {
        this._uniqueKey.set(arr);
    }
    public setUrlSlugField(field: string | null): void {
        this._urlSlugField.set(field);
    }
    public setIsMainField(field: string | null): void {
        this._isMainField.set(field);
    }
    public setRecordPositionField(field: string | null): void {
        this._recordPositionField.set(field);
    }
    public setActiveField(field: string | null): void {
        this._activeField.set(field);
    }
    public setDeletedField(field: string | null): void {
        this._deletedField.set(field);
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ HELPER ███████████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    public getRecordPrimaryKeyValue(row: any, rowPkField?: string): string | null {
        // get primary key field name from state
        const pkf = this.primaryKey();

        // check for rowIdKey fields name, default to state
        if(!rowPkField && pkf) {
            rowPkField = pkf;
        }

        // if still no id, then return null
        if((!rowPkField || rowPkField === '') && (!pkf || pkf === '')) {
            return null;
        }

        const value = (rowPkField as string)
            .split('.') // nested property paths, not only simple keys. smaple [user.id]
            .reduce((current, key) => current?.[key], row);

        if (value === null || value === undefined || value === '') {
            return null;
        }
        return String(value);
    }
    public getRecordSecondaryKeyValue(row: any, rowSkField?: string): string | null {
        // get secondary key field name from state
        const skf = this.secondaryKey();

        // check for rowIdKey fields name, default to state
        if(!rowSkField && skf) {
            rowSkField = skf;
        }

        // if still no id, then return null
        if((!rowSkField || rowSkField === '') && (!skf || skf === '')) {
            return null;
        }

        const value = (rowSkField as string)
            .split('.') // nested property paths, not only simple keys. smaple [user.id]
            .reduce((current, key) => current?.[key], row);

        if (value === null || value === undefined || value === '') {
            return null;
        }
        return String(value);
    }
}
