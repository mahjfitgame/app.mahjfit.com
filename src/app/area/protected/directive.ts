// file: src/app/area/protected/directive.ts
import { AfterViewInit, Directive, inject, input, OnDestroy } from "@angular/core";
import { CdkPortal } from "@angular/cdk/portal";
import { ProtectedAreaLayoutSlotEnum } from "@area/protected/enum";
import { ProtectedAreaLayoutState } from "@area/protected/state";

/**
 * @ProtectedAreaLayoutDirective
 * a module hands a template to one of this shell's slots
 *
 *   <ng-template cdkPortal [protectedAreaLayout]="SlotEnum.SLOT_MAIN_HEADER_TOOLBAR_EXTENSION">
 *
 * ⚠ the mirror of PrivateAreaLayoutDirective, with a different selector and a
 * different state. a module cannot use one directive in both areas: the slot
 * enums are different types, which is the point — the compiler rejects a slot
 * the target shell has no outlet for
 *
 * ⚠ it injects the STATE, not the service. nothing here needs behaviour, and a
 * module template can then sit inside this area with no service instantiated
 */
@Directive({
    selector: 'ng-template[protectedAreaLayout][cdkPortal]',
    standalone: true,
})
export class ProtectedAreaLayoutDirective implements AfterViewInit, OnDestroy {
    public readonly protectedAreaLayout = input.required<ProtectedAreaLayoutSlotEnum>({
        alias: 'protectedAreaLayout',
    });

    protected readonly portal = inject(CdkPortal);
    protected readonly state = inject(ProtectedAreaLayoutState);

    public ngAfterViewInit(): void {
        this.state.setPortal(this.protectedAreaLayout(), this.portal);
    }

    public ngOnDestroy(): void {
        this.state.clearPortal(this.protectedAreaLayout(), this.portal);
    }
}
