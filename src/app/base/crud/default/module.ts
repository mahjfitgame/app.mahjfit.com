import { NgModule } from "@angular/core";
import { CrudDefaultListingComponent } from "@base/crud/default/listing/component";
import { CrudDefaultModuleActionComponent } from "@base/crud/default/module-action/component";
import { CrudDefaultQuickSearchComponent } from "@base/crud/default/quick-search/component";
import { CrudDefaultPaginationComponent } from "@base/crud/default/pagination/component";
import { CrudDefaultSearchFilterComponent } from "@base/crud/default/search-filter/component";
import { CrudDefaultMutationComponent } from "@base/crud/default/mutation/component";

@NgModule({
    imports: [
        CrudDefaultListingComponent,
        CrudDefaultModuleActionComponent,
        CrudDefaultPaginationComponent,
        CrudDefaultQuickSearchComponent,
        CrudDefaultSearchFilterComponent,
        CrudDefaultMutationComponent,
    ],
    exports: [
        CrudDefaultListingComponent,
        CrudDefaultModuleActionComponent,
        CrudDefaultPaginationComponent,
        CrudDefaultQuickSearchComponent,
        CrudDefaultSearchFilterComponent,
        CrudDefaultMutationComponent,
    ],
})
export class CrudDefaultModule { 

}