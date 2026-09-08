import { NgModule } from "@angular/core";
import { CrudDefaultListingComponent } from "@base/crud/default/listing/component";
import { CrudDefaultModuleActionComponent } from "@base/crud/default/module-action/component";
import { CrudDefaultQuickSearchComponent } from "@base/crud/default/quick-search/component";
import { CrudDefaultPaginationComponent } from "@base/crud/default/pagination/component";
import { CrudDefaultListingSearchComponent } from "src/app/base/crud/default/listing-search/component";
import { CrudDefaultMutationComponent } from "@base/crud/default/mutation/component";
import { CrudDefaultViewComponent } from "@base/crud/default/view/component";

@NgModule({
    imports: [
        CrudDefaultListingComponent,
        CrudDefaultModuleActionComponent,
        CrudDefaultPaginationComponent,
        CrudDefaultQuickSearchComponent,
        CrudDefaultListingSearchComponent,
        CrudDefaultMutationComponent,
        CrudDefaultViewComponent,
    ],
    exports: [
        CrudDefaultListingComponent,
        CrudDefaultModuleActionComponent,
        CrudDefaultPaginationComponent,
        CrudDefaultQuickSearchComponent,
        CrudDefaultListingSearchComponent,
        CrudDefaultMutationComponent,
        CrudDefaultViewComponent,
    ],
})
export class CrudDefaultModule { 

}
