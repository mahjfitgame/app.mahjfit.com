// file: src/app/base/form-fields/autosuggest/service.ts
import { inject, Service } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { FormFieldAutosuggestState } from '@base/form-fields/autosuggest/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached
 * as service.state.* from the markup, the same way every other module in this repo is
 * layered.
 *
 * Everything reactive - signals, computeds, effects - is in state.ts. What is left
 * here is the handlers the template fires.
 */
@Service({ autoProvided: false })
export class FormFieldAutosuggestService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldAutosuggestState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    /**
     * every keystroke, from the NATIVE (input) event. Not ngModelChange: with
     * [requireSelection] the trigger never calls _onChange while typing
     * (autocomplete.mjs:574), so it would never fire in the default mode.
     */
    public onQuery(text: string): void {
        this.state.query.set(text ?? '');
    }

    /**
     * the clear button: drop the value and put the panel back to the cached union.
     *
     * [] and not null in multiselect - the caller's property is typed as an array there,
     * and selectedKeys() would have to keep un-nulling it.
     */
    public onClear(): void {
        const config = this.state.config();

        config?.value.set(config.multiselect() ? [] : null);

        this.state.clearInput();
    }

    /**
     * an option was picked from the panel.
     *
     * keepCustom FIRST: it is a no-op unless the 'Use "…"' row was the one picked, and
     * addChip below blanks the query that row is computed from.
     *
     * Single select needs nothing else - ngModel already holds the key.
     */
    public onOptionSelected(event: MatAutocompleteSelectedEvent): void {
        this.state.keepCustom(event.option.value);

        if (this.state.config()?.multiselect()) this.state.addChip(event.option.value);
    }

    /**
     * the trailing icon on a custom row: it acts ON the row, it does not pick it - so
     * the click is stopped before mat-option's own handler sees it and selects.
     */
    public onCustomSelection(key: any, item: any, event: Event): void {
        event.stopPropagation();

        this.state.runCustomSelection(key, item);
    }

    /** multiselect: remove one chip */
    public onChipRemove(key: any): void {
        this.state.removeChip(key);
    }

    /** autocomplete panel closed */
    public onPanelClosed(): void {
        if (this.state.customSavePending()) {
            this.state.config()?.triggerEl()?.openPanel();
        } else if (this.state.config()?.multiselect()) {
            this.state.clearInput();
        }
    }

    /** grouped picker: confirm group selection */
    public onCustomSaveConfirm(event: Event): void {
        event.stopPropagation();
        this.state.confirmCustomSave();
    }

    /** grouped picker: cancel group selection */
    public onCustomSaveCancel(event: Event): void {
        event.stopPropagation();
        this.state.cancelCustomSave();
    }
}
