// file: src/app/base/form-fields/file/regular/service.ts
import { inject, Service } from '@angular/core';
import { FormFieldFileRegularState } from '@base/form-fields/file/regular/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldFileRegularService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldFileRegularState);

    // ████ EVENTS ████████████████████████████████████████████████████████

    /**
     * The native <input type="file"> change event.
     * A file input cannot be set programmatically from JS - only read and
     * cleared - so this is a write-only channel into the field's value.
     */
    public onFileChange(event: Event, multiple: boolean): void {
        const input = event.target as HTMLInputElement;
        const files = input.files;

        if (!files || files.length === 0) {
            return;
        }

        this.state.setValue(multiple ? Array.from(files) : files[0]);

        // let the SAME file be re-picked later and still fire a change event
        input.value = '';
    }

    /** the clear button. It sits inside the field's own suffix, so the click stops here */
    public onClear(event: Event): void {
        event.stopPropagation();

        this.state.clear();
    }
}
