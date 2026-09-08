// file: src/app/base/crud/state/init.ts

import { Service } from "@angular/core";
import { CrudListingState } from "./listing";
import { CrudMutationState } from "./mutation";
import { CrudRootState } from "./root";
import { CrudSearchFilterState } from "./search.filter";
import { CrudModuleContextType } from "../type";
import { CrudActionState } from "./action";
import { CrudViewState } from "./view";

@Service({ autoProvided: false })
export class CrudState extends CrudRootState {
    public readonly action: CrudActionState;
    public readonly searchFilter: CrudSearchFilterState;
    public readonly listing: CrudListingState;
    public readonly mutation: CrudMutationState;
    public readonly view: CrudViewState;

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    /*
    public readonly debugState = computed(() => ({

    }));
    */

    constructor() {
        super();

        // authorisation based access permissions for crud actions
        this.action = new CrudActionState(this);

        this.searchFilter = new CrudSearchFilterState(
            this,
            this.action,
        );
        this.listing = new CrudListingState(
            this,
            this.action,
            this.crudInjector,
            this.validation,
            this.searchFilter,
        );
        this.mutation = new CrudMutationState(
            this,
            this.action,
            this.crudInjector,
            this.validation,
        );
        this.view = new CrudViewState(
            this,
            this.action,
        );

        // All composed signals/forms must exist before persistence activates.
        this.initializeSignalState();
    }
    
    // ████ LISTENERS ███████████████████████████████████████████████████
    public override onActivate(): void {
        super.onActivate();
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
        super.onDeactivate();
    }

    // ███████████████████████████████████████████████████████████████████
    // ████ HELPER ███████████████████████████████████████████████████████
    // ███████████████████████████████████████████████████████████████████

    public getCrudModuleContext(): CrudModuleContextType {
        return {
            primaryKey: this.primaryKey(),
            secondaryKey: this.secondaryKey(),
            uniqueKey: this.uniqueKey(),
            urlSlugField: this.urlSlugField(),
            isMainField: this.isMainField(),
            recordPositionField: this.recordPositionField(),
            activeField: this.activeField(),
            deletedField: this.deletedField(),
            rows: this.listing.listingDataSource().data,
            getRecordPrimaryKeyValue: 
                (row, rowPkField) => this.getRecordPrimaryKeyValue(row, rowPkField),
            getRecordSecondaryKeyValue: 
                (row, rowSkField) => this.getRecordSecondaryKeyValue(row, rowSkField),
        };
    }
}
