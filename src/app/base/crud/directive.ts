// file: src/app/area/private/directive.ts
import { AfterViewInit, Directive, inject, input, OnDestroy } from "@angular/core";
import { CdkPortal } from "@angular/cdk/portal";
import { CrudState  } from "@base/crud/state/init";

@Directive({
  selector: 'ng-template[crudFieldLayout][cdkPortal]',
  standalone: true,
})
export class CrudLayoutDirective implements AfterViewInit, OnDestroy {
  public readonly fieldKey = input.required<string>({
    alias: 'crudFieldLayout',
  });

  protected readonly portal = inject(CdkPortal);
  protected readonly crudState = inject(CrudState);

  public ngAfterViewInit(): void {
    this.crudState.addSlotField(this.fieldKey(), this.portal);
  }

  public ngOnDestroy(): void {
    this.crudState.removeSlotField(this.fieldKey());
  }
}
