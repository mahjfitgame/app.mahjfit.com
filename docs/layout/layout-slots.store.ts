import { signalStore, withMethods, withState, patchState } from '@ngrx/signals';
import { Portal } from '@angular/cdk/portal';

export type LayoutSlot =
  | 'mainHeader'
  | 'mainFooter'
  | 'startSidebar'
  | 'startSidebarFooter'
  | 'endSidebar'
  | 'endSidebarFooter';

export interface LayoutSlotsState {
  mainHeader: Portal<any> | null;
  mainFooter: Portal<any> | null;
  startSidebar: Portal<any> | null;
  startSidebarFooter: Portal<any> | null;
  endSidebar: Portal<any> | null;
  endSidebarFooter: Portal<any> | null;
}

const initialState: LayoutSlotsState = {
  mainHeader: null,
  mainFooter: null,
  startSidebar: null,
  startSidebarFooter: null,
  endSidebar: null,
  endSidebarFooter: null,
};

function slotPatch<K extends LayoutSlot>(
  slot: K,
  portal: LayoutSlotsState[K],
): Pick<LayoutSlotsState, K> {
  return { [slot]: portal } as Pick<LayoutSlotsState, K>;
}

export const LayoutSlotsStore = signalStore(
  { providedIn: 'root' },

  withState<LayoutSlotsState>(initialState),

  withMethods((store) => ({
    set(slot: LayoutSlot, portal: Portal<any>): void {
      patchState(store, slotPatch(slot, portal));
    },

    clear(slot: LayoutSlot, portal: Portal<any>): void {
      if (store[slot]() === portal) {
        patchState(store, slotPatch(slot, null));
      }
    },

    clearSlot(slot: LayoutSlot): void {
      patchState(store, slotPatch(slot, null));
    },

    reset(): void {
      patchState(store, initialState);
    },
  })),
);