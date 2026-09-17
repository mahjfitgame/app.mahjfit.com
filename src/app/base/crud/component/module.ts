import { NgModule } from "@angular/core";
import { CrudListingComponent } from "src/app/base/crud/component/listing/component";
import { CrudModuleActionComponent } from "src/app/base/crud/component/module-action/component";
import { CrudQuickSearchComponent } from "src/app/base/crud/component/quick-search/component";
import { CrudPaginationComponent } from "src/app/base/crud/component/pagination/component";
import { CrudListingSearchComponent } from "src/app/base/crud/component/listing-search/component";
import { CrudMutationComponent } from "src/app/base/crud/component/mutation/component";
import { CrudViewComponent } from "src/app/base/crud/component/view/component";

@NgModule({
    imports: [
        CrudListingComponent,
        CrudModuleActionComponent,
        CrudPaginationComponent,
        CrudQuickSearchComponent,
        CrudListingSearchComponent,
        CrudMutationComponent,
        CrudViewComponent,
    ],
    exports: [
        CrudListingComponent,
        CrudModuleActionComponent,
        CrudPaginationComponent,
        CrudQuickSearchComponent,
        CrudListingSearchComponent,
        CrudMutationComponent,
        CrudViewComponent,
    ],
})
export class CrudComponentModule { 

}
