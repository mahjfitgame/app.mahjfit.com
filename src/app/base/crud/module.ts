import { NgModule } from "@angular/core";
import { CrudComponentModule } from "src/app/base/crud/component/module";
import { CrudComponent } from "src/app/base/crud/component/component";

@NgModule({
    imports: [
        /**
         * A standalone component must be imported before it can be re-exported.
         * (An NgModule does not - CrudComponentModule is re-exported below
         * without appearing here.)
         */
        CrudComponent
    ],
    providers: [
    ],
    exports: [
        /**
         * If we don't want to use <crud-component> directly and want to define a
         * custom layout in the child/consumer, we need all the individual pieces,
         * so re-export them here.
         *
         * CrudComponent already imports CrudComponentModule, but a standalone
         * component's imports are private to its own template and are never
         * re-exported - so the consumer would not get them from CrudComponent.
         */
        CrudComponentModule,
        CrudComponent
    ],
})
export class CrudModule { 

}