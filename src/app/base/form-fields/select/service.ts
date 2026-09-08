// file: src/app/base/form-fields/select/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldSelectState } from '@base/form-fields/select/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module in this repo is
 * layered.
 *
 * Everything reactive - signals, computeds, effects - is in state.ts. What is left here
 * is the handlers the template fires.
 */
@Service({ autoProvided: false })
export class FormFieldSelectService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldSelectState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    /**
     * a row was picked. Multiselect goes through applySelection() because the All row
     * has to be read out of the list before it can become a value; single select is the
     * key exactly as it came.
     */
    public onSelectionChange(value: any): void {
        if (this.state.config()?.multiselect()) {
            this.state.applySelection(value);

            return;
        }

        this.state.setValue(value);
    }

    /** the clear button. Stops the click so the panel does not open on the way out */
    public onClear(event: Event): void {
        event.stopPropagation();

        this.state.clear();
    }

    /**
     * [chips]: one chip removed.
     *
     * The chips sit INSIDE <mat-select-trigger>, which is the surface that opens the
     * panel - but nothing has to be stopped here, because matChipRemove already calls
     * stopPropagation() and preventDefault() itself (chips.mjs, MatChipRemove._handleClick).
     */
    public onChipRemove(key: any): void {
        this.state.removeKey(key);
    }

    /** every keystroke in the filter box, lowercased once here rather than per row */
    public onSearch(text: string): void {
        this.state.query.set((text ?? '').trim().toLowerCase());
    }

    public onPanelOpened(): void {
        this.state.focusSearch();
    }

    /** a filter is a way of finding one row, not a setting: the next open starts clean */
    public onPanelClosed(): void {
        this.state.clearSearch();
    }

    /**
     * The filter box lives INSIDE the panel, so its keystrokes bubble to <mat-select>'s
     * own handler: letters would drive its typeahead and jump the active row, and Space
     * would toggle a row while the user is mid-word.
     *
     * Everything is swallowed EXCEPT the keys the panel legitimately owns, which still
     * reach it - so arrows still navigate, Enter still picks, Escape still closes and Tab
     * still leaves, all while the caret stays in the box.
     */
    public onSearchKeydown(event: KeyboardEvent): void {
        const panelKey = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'];

        if (!panelKey.includes(event.key)) event.stopPropagation();
    }
}
