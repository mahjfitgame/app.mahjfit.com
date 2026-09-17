// file: src/app/base/image-slideshow/state.ts
import { computed, linkedSignal, Service, signal } from '@angular/core';
import type { SwiperOptions } from 'swiper/types';
import { BreakpointSizeEnum } from '@libs/breakpoint/enum';
import { IMAGE_SLIDESHOW_SECONDARY_SIZE } from '@base/image-slideshow/const';
import { ImageSlideshowModeEnum } from '@base/image-slideshow/enum';
import { ImageSlideshowConfigType, ImageSlideshowItemType } from '@base/image-slideshow/type';

@Service({ autoProvided: false })
export class ImageSlideshowState {

    // ████ DEPENDENCIES ████████████████████████████████████████████████
    // n/a

    // ████ CLASS PROPERTIES ████████████████████████████████████████████
    // n/a

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████

    /**
     * The component's live inputs, handed over once by bind().
     *
     * A signal and not a plain field: every computed below reads it, and a
     * computed that happened to run before bind() would otherwise cache its
     * null answer forever. Same reasoning as FormFieldAutosuggestState._config.
     */
    private readonly _config = signal<ImageSlideshowConfigType | null>(null);

    /**
     * Which slide is showing. The slidechange listener writes it.
     *
     * ⚠ linkedSignal and not signal(0): the counter must read the OPENING slide
     * before the user has moved, and Swiper fires no slidechange for the slide
     * it starts on. Seeding it in bind() does not work either - inputs are not
     * populated yet while the constructor runs, so it would latch 0 forever and
     * a dialog opened on slide 3 would say '1 / 4'.
     *
     * Recomputing from startIndex also means a caller who swaps [startIndex]
     * gets a correct counter without any extra wiring.
     */
    private readonly _activeIndex = linkedSignal<number>(() => this.startIndex());
    public readonly activeIndex = this._activeIndex.asReadonly();

    /** is the autoplay timer running. NOT the progress ring - see below. */
    private readonly _autoplayOn = signal<boolean>(false);
    public readonly autoplayOn = this._autoplayOn.asReadonly();

    /** is the current slide zoomed in. Drives the zoom button's icon. */
    private readonly _zoomed = signal<boolean>(false);
    public readonly zoomed = this._zoomed.asReadonly();

    /**
     * DIALOG only. Follows the [size] input, then the switcher walks it.
     *
     * ⚠ linkedSignal for the same reason as activeIndex above: seeding it in
     * bind() reads the input before it is populated, so a caller opening at
     * anything other than the default would latch FULL.
     *
     * A signal rather than a read off MatDialogRef because the toolbar icon and
     * the safe-area classes follow it.
     */
    private readonly _dialogSize = linkedSignal<BreakpointSizeEnum>(
        () => this._config()?.size() ?? BreakpointSizeEnum.FULL,
    );
    public readonly dialogSize = this._dialogSize.asReadonly();

    /** true once initialize() has returned on the main container */
    private readonly _ready = signal<boolean>(false);
    public readonly ready = this._ready.asReadonly();

    /**
     * ⚠ there is NO autoplayProgress signal, on purpose.
     *
     * Swiper's autoplaytimeleft fires every animation frame. This app is
     * ZONELESS, so a native listener costs nothing until it writes a signal -
     * and a signal write there would schedule ~60 change-detection passes a
     * second for a decoration. ImageSlideshowService.writeRing() sets a CSS
     * custom property straight on the element instead.
     */

    // ████ COMPUTED PROPERTIES █████████████████████████████████████████

    /**
     * ⚠ READ ONCE, at attach time. Swiper is initialised against the slides that
     * exist at that moment and this module ships no re-sync, so a caller with
     * async data must keep the viewer out of the DOM until the list is final:
     *
     *     @if (photos().length) {
     *         <image-slideshow-component [items]="photos()" />
     *     }
     *
     * Adding to a live [items] puts slides in the DOM that Swiper never
     * measured - it caches slide widths and is not told. That is also what
     * makes showThumbs safe to read once: the strip is created in the same
     * render as the slides it mirrors.
     */
    public readonly items = computed<ImageSlideshowItemType[]>(
        () => this._config()?.items() ?? [],
    );
    public readonly slideCount = computed<number>(() => this.items().length);
    public readonly hasItems = computed<boolean>(() => this.slideCount() > 0);

    public readonly mode = computed<ImageSlideshowModeEnum>(
        () => this._config()?.mode() ?? ImageSlideshowModeEnum.INLINE,
    );
    public readonly isDialog = computed<boolean>(
        () => this.mode() === ImageSlideshowModeEnum.DIALOG,
    );
    public readonly isFullscreen = computed<boolean>(
        () => this.isDialog() && this.dialogSize() === BreakpointSizeEnum.FULL,
    );

    /**
     * The size the CONSUMER asked for, which survives every setDialogSize().
     *
     * ⚠ re-reads the input rather than the _dialogSize linkedSignal above, and
     * duplicating that expression is the point: _dialogSize's whole job is to
     * hold the OVERRIDDEN value, so it can never answer this. The input itself
     * is a constant - dialog.ts binds `() => size` - so this stays correct for
     * the life of the dialog.
     */
    public readonly configuredSize = computed<BreakpointSizeEnum>(
        () => this._config()?.size() ?? BreakpointSizeEnum.FULL,
    );

    /**
     * Where the fullscreen toggle lands on the way OUT.
     *
     * ⚠ FULL is never the answer: a consumer that opened fullscreen, or set
     * nothing, would otherwise toggle FULL -> FULL and the button would look
     * broken. That is the whole reason IMAGE_SLIDESHOW_SECONDARY_SIZE exists.
     */
    public readonly restoreSize = computed<BreakpointSizeEnum>(() => {
        const configured = this.configuredSize();

        return configured === BreakpointSizeEnum.FULL
            ? IMAGE_SLIDESHOW_SECONDARY_SIZE
            : configured;
    });

    /**
     * ⚠ read ONCE, at attach time - this is not a runtime toggle, and it is the
     * [items] contract above that makes that true. Flipping it later would need
     * a destroy + rebuild, which is deliberately not shipped.
     */
    public readonly showThumbs = computed<boolean>(
        () => (this._config()?.showThumbs() ?? true) && this.slideCount() > 1,
    );
    public readonly showToolbar = computed<boolean>(
        () => this._config()?.showToolbar() ?? true,
    );

    /**
     * ⚠ defaults FALSE, unlike every other show* flag here. Handing over the
     * original file is opt-in. Unlike showThumbs it IS a live toggle - it gates
     * one button, not an initialised swiper instance.
     */
    public readonly showDownload = computed<boolean>(
        () => this._config()?.showDownload() ?? false,
    );

    /** clamped - a caller's stale index must not blank the viewer */
    public readonly startIndex = computed<number>(() => {
        const raw = this._config()?.startIndex() ?? 0;
        const max = Math.max(0, this.slideCount() - 1);

        return Math.min(Math.max(0, raw), max);
    });

    public readonly activeItem = computed<ImageSlideshowItemType | null>(
        () => this.items()[this.activeIndex()] ?? null,
    );

    /** fills GL.SLIDESHOW.COUNTER - 'slide 3 of 12' */
    public readonly counterParams = computed<Record<string, number>>(() => ({
        current: this.activeIndex() + 1,
        total: this.slideCount(),
    }));

    /** caller params, merged by the service - kept raw here */
    public readonly swiperOverride = computed<SwiperOptions>(
        () => this._config()?.swiper() ?? {},
    );
    public readonly thumbsSwiperOverride = computed<SwiperOptions>(
        () => this._config()?.thumbsSwiper() ?? {},
    );

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    // n/a

    // ████ LISTENERS ███████████████████████████████████████████████████
    // n/a

    // ████ SIGNAL METHODS ██████████████████████████████████████████████

    /**
     * Called once, from the component's constructor.
     *
     * ⚠ takes the input SIGNALS, not their values, and reads NONE of them here:
     * inputs are not populated while the constructor runs, so anything latched
     * at this point would be the default forever. Everything above derives from
     * _config instead and stays live.
     */
    public bind(config: ImageSlideshowConfigType): void {
        this._config.set(config);
    }

    public setActiveIndex(index: number): void { this._activeIndex.set(index); }
    public setAutoplayOn(on: boolean): void { this._autoplayOn.set(on); }
    public setZoomed(zoomed: boolean): void { this._zoomed.set(zoomed); }
    public setDialogSize(size: BreakpointSizeEnum): void { this._dialogSize.set(size); }
    public setReady(ready: boolean): void { this._ready.set(ready); }

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
