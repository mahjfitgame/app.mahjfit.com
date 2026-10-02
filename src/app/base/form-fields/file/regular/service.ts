// file: src/app/base/form-fields/file/regular/service.ts
import { inject, Service } from '@angular/core';
import { LogService } from '@libs/log/service';
import { ImageSlideshowDialog } from '@base/image-slideshow/dialog';
import { ImageSlideshowItemType } from '@base/image-slideshow/type';
import { FileSlideshowType } from '@base/form-fields/file/type';
import { FormFieldFileRegularState } from '@base/form-fields/file/regular/state';

/**
 * What the component and the template talk to: state.ts is injected here and reached as
 * service.state.* from the markup, the same way every other module here is layered.
 */
@Service({ autoProvided: false })
export class FormFieldFileRegularService {

    // ████ DEPENDENCIES ██████████████████████████████████████████████████

    public readonly state = inject(FormFieldFileRegularState);
    public readonly log = inject(LogService);

    /**
     * ⚠ the FIRST @base SIBLING import out of @base/form-fields, and it is
     * deliberate. The rule is that form-fields may never import CRUD
     * (@see FormFieldFileUtility), and @base/image-slideshow imports neither
     * crud nor form-fields - only @libs/breakpoint and
     * @base/internationalization - so there is no cycle to create.
     *
     * Light, too: this service is MatDialog plus a size helper, and the swiper
     * bundle stays behind the `await import()` inside its open().
     */
    private readonly imageSlideshowDialog = inject(ImageSlideshowDialog);

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

    // ████ SLIDESHOW █████████████████████████████████████████████████████

    /**
     * Opens the fullscreen viewer over this field's own existing-file preview -
     * ONE item, so no startIndex, and no showThumbs either: the slideshow's
     * state.showThumbs already gates itself on slideCount() > 1.
     *
     * [config] null = not opted in, which makes a stray call a no-op rather
     * than a surprise lightbox.
     *
     * ⚠ .catch() and not void: open() awaits an import() of the slideshow
     * chunk, which rejects offline or against a hash that a deploy has moved.
     * void would leave that an unhandled rejection.
     */
    public openSlideshow(
        config: FileSlideshowType | null,
        item: ImageSlideshowItemType,
    ): void {
        if (!config || !item.src) return;

        // size is left undefined when the consumer did not set one, so the
        // slideshow applies its own FULL default rather than this file guessing
        this.imageSlideshowDialog
            .open({ items: [item], size: config.size })
            .catch((error) => this.log.error('image slideshow open failed', error));
    }
}
