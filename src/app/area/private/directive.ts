// file: src/app/area/private/directive.ts
import { AfterViewInit, Directive, inject, input, OnDestroy } from "@angular/core";
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { CdkPortal } from "@angular/cdk/portal";
import { PrivateAreaLayoutService } from "@area/private/service";

@Directive({
  selector: 'ng-template[privateAreaLayout][cdkPortal]',
  standalone: true,
})
export class PrivateAreaLayoutDirective implements AfterViewInit, OnDestroy {
  public readonly privateAreaLayout = input.required<PrivateAreaLayoutSlotEnum>({
    alias: 'privateAreaLayout',
  });

  protected readonly portal = inject(CdkPortal);
  
  public readonly privateAreaLayoutIndex = input<number | undefined>(undefined, {
    alias: 'privateAreaLayoutIndex',
  });

  public readonly privateAreaLayoutLabel = input<string | undefined>(undefined, {
    alias: 'privateAreaLayoutLabel',
  });

  protected readonly service = inject(PrivateAreaLayoutService);

  public ngAfterViewInit(): void {
    this.service.state.setPortal(
        this.privateAreaLayout(), 
        this.portal, 
        this.privateAreaLayoutIndex(), 
        this.privateAreaLayoutLabel()
      );
  }

  public ngOnDestroy(): void {
    this.service.state.clearPortal(this.privateAreaLayout(), this.portal);
  }
}