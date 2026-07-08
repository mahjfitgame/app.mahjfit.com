import { NgModule } from "@angular/core";
import { CrudDefaultModule } from "@base/crud/default/module";
import { CrudComponent } from "@base/crud/component";

@NgModule({
    imports: [
        CrudDefaultModule,
        CrudComponent
    ],
    providers: [
    ],
    exports: [
        CrudDefaultModule,
        CrudComponent
    ],
})
export class CrudModule { 

}