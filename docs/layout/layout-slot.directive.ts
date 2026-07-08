import {
  AfterViewInit,
  Directive,
  OnDestroy,
  inject,
  input,
} from '@angular/core';
import { CdkPortal } from '@angular/cdk/portal';
import { LayoutSlot, LayoutSlotsStore } from './layout-slots.store';

@Directive({
  selector: 'ng-template[appLayoutSlot][cdkPortal]',
  standalone: true,
})
export class LayoutSlotDirective implements AfterViewInit, OnDestroy {
  public readonly slot = input.required<LayoutSlot>({ alias: 'appLayoutSlot' });

  private readonly portal = inject(CdkPortal);
  private readonly layoutSlots = inject(LayoutSlotsStore);

  ngAfterViewInit(): void {
    this.layoutSlots.set(this.slot(), this.portal);
  }

  ngOnDestroy(): void {
    this.layoutSlots.clear(this.slot(), this.portal);
  }
}