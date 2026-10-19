// file: src/app/base/image-slideshow/service.ts
import { DestroyRef, effect, inject, Service } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import type { SwiperContainer } from 'swiper/element';
import type { SwiperOptions } from 'swiper/types';
import { BREAKPOINT_SIZE_OPTIONS } from '@libs/breakpoint/const';
import { BreakpointSizeEnum } from '@libs/breakpoint/enum';
import { LogService } from '@libs/log/service';
import { PrintService } from '@libs/print/service';
import { I18nService } from '@base/internationalization/service';
import { I18nBidiEnum } from '@base/internationalization/enum';
import { ImageSlideshowState } from '@base/image-slideshow/state';
import {
    DEF_IMAGE_SLIDESHOW_SWIPER,
    DEF_IMAGE_SLIDESHOW_THUMBS_SWIPER,
    IMAGE_SLIDESHOW_PRINT_CSS,
    IMAGE_SLIDESHOW_PRINT_DELAY,
} from '@base/image-slideshow/const';
import { ImageSlideshowUtility } from '@base/image-slideshow/utility';

/**
 * Drives ONE swiper pair. Per component instance, like its state.
 *
 * No signals live here - state.ts owns every one of them.
 */
@Service({ autoProvided: false })
export class ImageSlideshowService {

    // ████████████████████████████████████████████████████████████████████
    // ███ DEPENDENCIES ███████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public readonly state = inject(ImageSlideshowState);
    private readonly utility = inject(ImageSlideshowUtility);
    private readonly i18n = inject(I18nService);

    /**
     * ⚠ both are @libs - the layer this module already sits on - and NOT a new
     * @base sibling edge. The rule is that @base/image-slideshow imports
     * neither crud nor form-fields, which is what lets form-fields depend on
     * IT; see .agents/coding-rules.md.
     *
     * ⚠ no bundle cost: app.service.ts already injects PrintService, so it is
     * in the main bundle and this does not drag the printer plugin into the
     * lazy slideshow chunk.
     */
    private readonly printService = inject(PrintService);
    private readonly log = inject(LogService);

    /**
     * ⚠ OPTIONAL, and NEVER read directly - go through dialogRef().
     *
     * An INLINE viewer rendered inside somebody else's dialog resolves that
     * ANCESTOR's ref here. Only state.isDialog(), which comes from an input
     * that solely ImageSlideshowDialog sets, may unlock it.
     */
    private readonly injectedDialogRef = inject(MatDialogRef, { optional: true });

    // raw element handles - not signals, nothing renders off them
    private mainEl: SwiperContainer | null = null;
    private thumbsEl: SwiperContainer | null = null;
    private ringEl: HTMLElement | null = null;

    constructor() {
        /**
         * Swiper reads direction ONLY at init (shared/swiper-core.mjs:4023), so
         * a language flip while the viewer is open needs this call. The dir
         * attribute in the template covers the init case.
         */
        effect(() => {
            const bidi = this.i18n.state.bidi();

            this.mainEl?.swiper?.changeLanguageDirection(bidi);
            this.thumbsEl?.swiper?.changeLanguageDirection(bidi);
        });

        inject(DestroyRef).onDestroy(() => this.detach());
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ RTL ████████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * RTL is NOT a caller option and never will be - the app's direction is the
     * app's business. Same read as NotifyService.getPosition().
     *
     * ⚠ SwiperOptions has no [rtl] member. This feeds the template's
     * [attr.dir], which is the only thing Swiper actually reads.
     */
    public dir(): I18nBidiEnum {
        return this.i18n.state.bidi();
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ LIFECYCLE ██████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * Handed both containers by the component from afterNextRender(), so the
     * @for slides are already in the DOM - which is what init="false" buys.
     *
     * ⚠ order is load-bearing: the THUMBS instance must exist before the main
     * container's params are built, because Swiper's Thumbs module asserts
     * `thumbs.swiper instanceof Swiper` (modules/thumbs.mjs:60) - an element or
     * a selector is silently ignored.
     */
    public attach(mainEl: SwiperContainer, thumbsEl: SwiperContainer | null): void {
        if (this.mainEl) return;

        this.mainEl = mainEl;
        this.thumbsEl = thumbsEl;

        if (thumbsEl) {
            Object.assign(thumbsEl, this.buildThumbsParams());
            thumbsEl.initialize();
        }

        Object.assign(mainEl, this.buildMainParams());
        mainEl.initialize();

        this.state.setReady(true);
    }

    /**
     * ⚠ drops references and nothing else. The custom element's own
     * disconnectedCallback() destroys its Swiper (swiper-element.mjs:188), so
     * calling swiper.destroy() here would race it.
     */
    public detach(): void {
        this.mainEl = null;
        this.thumbsEl = null;
        this.ringEl = null;
        this.state.setReady(false);
    }

    public setRingEl(el: HTMLElement | null): void {
        this.ringEl = el;
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ PARAMS █████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * DEF first, caller second, runtime LAST. [thumbs] and [initialSlide] are
     * ours by definition - the thumbs instance does not exist until now, and
     * the start index arrives through its own input.
     */
    private buildMainParams(): SwiperOptions {
        return {
            ...DEF_IMAGE_SLIDESHOW_SWIPER,
            ...this.state.swiperOverride(),
            initialSlide: this.state.startIndex(),

            /**
             * A one-slide group cannot loop, and DEF has loop: true. Swiper
             * warns on every init - `slides.length < slidesPerView +
             * loopedSlides` (swiper-core.mjs) - so this only silences noise: it
             * already LOCKS itself for a single slide (isLocked =
             * snapGrid.length === 1), which hides the arrows through
             * .swiper-button-lock, hides the lone bullet through
             * .swiper-pagination-bullet:only-child, and makes slideNext/Prev
             * early-return.
             *
             * ⚠ runtime, so it beats a caller's swiperOverride - the stance
             * [initialSlide] and [thumbs] already take. Both one-item callers
             * are real: a quick search narrowed to one row, and a file field's
             * single-preview viewer. Mirrors state.showThumbs' slideCount() > 1.
             */
            ...(this.state.slideCount() < 2 ? { loop: false } : {}),

            ...(this.thumbsEl?.swiper ? { thumbs: { swiper: this.thumbsEl.swiper } } : {}),

            /**
             * ⚠ FORCED, and not a caller option - this module owns its own
             * event wiring.
             *
             * Swiper's OWN callback API, not addEventListener on the element.
             * Three things fall out of that, and the third is why the DOM route
             * had to be abandoned:
             *
             * - fully TYPED. SwiperOptions.on is
             *   `{ [E in keyof SwiperEvents]?: SwiperEvents[E] }` (core.d.ts),
             *   so `swiper` here is a Swiper and `scale` is a number, with no
             *   e.detail[] index guessing.
             * - still ZERO change detection until one of these writes a signal,
             *   exactly like a native listener in this zoneless app.
             * - and it never touches [eventsPrefix]. @see bindEvents' removal -
             *   the custom element prefixes its re-dispatched DOM events with
             *   'swiper' precisely so they cannot collide with real DOM events,
             *   and clearing that prefix to make addEventListener('slidechange')
             *   work ALSO renamed swiper's touchStart/touchMove/touchEnd
             *   lifecycle events to 'touchstart'/'touchmove'/'touchend'. Those
             *   bubble to document, where swiper core listens for the real ones
             *   (shared/swiper-core.mjs events()), so its own handler received a
             *   CustomEvent, read `[...e.changedTouches]` on it and threw
             *   `TypeError: changedTouches is not iterable` on every click.
             *   Going through `on` leaves the prefix at its default.
             */
            on: {
                slideChange: (swiper) => this.state.setActiveIndex(swiper.realIndex),

                zoomChange: (_swiper, scale) => this.state.setZoomed(scale > 1),

                // autoplay state has ONE source of truth: swiper's own events,
                // never the toggle method below.
                autoplayStart: () => this.state.setAutoplayOn(true),
                autoplayStop: () => {
                    this.state.setAutoplayOn(false);
                    this.writeRing(0);
                },

                /**
                 * ⚠ fires every animation frame. Writes a CSS custom property
                 * straight onto the ring and touches NO signal - see the note
                 * on ImageSlideshowState for why.
                 */
                autoplayTimeLeft: (_swiper, _timeLeft, percentage) =>
                    this.writeRing(1 - percentage),
            },
        };
    }

    private buildThumbsParams(): SwiperOptions {
        return {
            ...DEF_IMAGE_SLIDESHOW_THUMBS_SWIPER,
            ...this.state.thumbsSwiperOverride(),
            initialSlide: this.state.startIndex(),
            loop: false,
        };
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ EVENTS █████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * There is no addEventListener anywhere in this module - the handlers are
     * the `on` block of buildMainParams() above, which explains why.
     */
    private writeRing(progress: number): void {
        this.ringEl?.style.setProperty('--bfw-slideshow-autoplay', String(progress));
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ TOOLBAR ACTIONS ████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    public toggleAutoplay(): void {
        const autoplay = this.mainEl?.swiper?.autoplay;

        if (!autoplay) return;

        if (autoplay.running) {
            autoplay.stop();
        } else {
            autoplay.start();
        }
    }

    public toggleZoom(): void {
        this.mainEl?.swiper?.zoom?.toggle();
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ PRINT ██████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * A print job is running - the toolbar button disables on it.
     *
     * A plain method rather than a signal of its own: the one source of truth
     * is PrintState, and state.ts owns no copy of another module's signal.
     * Reading it through here still tracks, exactly like dir() above.
     */
    public isPrinting(): boolean {
        return this.printService.state.isPrinting();
    }

    /**
     * Prints the ACTIVE slide, one image to a page. Not the group: the thumbs
     * strip is the affordance for choosing, and a twelve-page print is a
     * different feature with a different button.
     *
     * ⚠ html() and NOT element(). element()'s native path (PrintService.
     * printLive) mounts a clone on <body> and prints the LIVE document, which
     * never reads PrintOptionsType.css - so the sheet would be laid out by app
     * CSS on device and by ours in the browser. html() reaches
     * Printer.printHtml instead, which builds its own document, so carrying the
     * <style> INSIDE the string is what gives both platforms one layout.
     *
     * ⚠ the markup is built as a DOM node and read back through outerHTML,
     * never string-interpolated. html() writes the string in as-is (its manual
     * says so) and [src] is an api url with a query string - outerHTML escapes
     * both it and [alt] by construction. CrudUtility.escapeHtml is the repo's
     * only escaper and is not reachable from this layer anyway.
     *
     * ⚠ nothing here re-checks permission. @see FileSlideshowType.print - the
     * caller resolved its module's PRINT action before the input was bound.
     */
    public async printActiveImage(): Promise<void> {
        const item = this.state.activeItem();

        if (!item?.src) return;

        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt ?? '';

        /**
         * ⚠ warms the cache BEFORE the print document requests the same url.
         * PrintService.whenReadyToPrint() waits for stylesheets only, never for
         * images, and a picture that has not arrived prints a blank sheet.
         *
         * A rejection is NOT fatal and is swallowed on purpose: the print
         * document issues its own request regardless, so a failed decode costs
         * the pre-warm, not the print.
         */
        await img.decode().catch(() => undefined);

        const result = await this.printService.html(
            `<style>${IMAGE_SLIDESHOW_PRINT_CSS}</style>${img.outerHTML}`,
            {
                title: item.name || item.alt || document.title,
                // the sheet is deliberately theme-free - see the css const
                useAppStyles: false,
                delay: IMAGE_SLIDESHOW_PRINT_DELAY,
            },
        );

        /**
         * `busy` is a second click while the dialog is open - nothing went
         * wrong, and the button is already disabled on isPrinting() anyway.
         *
         * Logged rather than notified: @base/notify would be a new base->base
         * edge for a failure that cannot normally happen, and PrintService has
         * already logged the technical cause - this only names the caller.
         */
        if (!result.ok && !result.busy) {
            this.log.error('[PRINT SLIDESHOW IMAGE FAILED]', result.error);
        }
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ DIALOG █████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /** null unless this instance IS the dialog body. @see injectedDialogRef */
    private dialogRef(): MatDialogRef<unknown> | null {
        return this.state.isDialog() ? this.injectedDialogRef : null;
    }

    public close(): void {
        this.dialogRef()?.close();
    }

    /**
     * The toolbar menu's options. A plain field, not a signal - the list is a
     * module constant and never changes, so state.ts has nothing to own here.
     */
    public readonly sizeOptions = BREAKPOINT_SIZE_OPTIONS;

    /**
     * The toolbar's fullscreen toggle: FULL <-> whatever the consumer opened at.
     *
     * ⚠ a WRAPPER over applyDialogSize(), never a replacement. Everything that
     * makes a live resize work - updateSize(), the updatePosition() re-centre,
     * the panel-class swap, the swiper.update() - stays in that one method, so
     * the size MENU that this button replaced (commented out in template.html,
     * kept for when the full switcher is wanted again) goes straight back to
     * calling it with nothing to rewire.
     */
    public toggleFullscreen(): void {
        this.applyDialogSize(
            this.state.isFullscreen()
                ? this.state.restoreSize()
                : BreakpointSizeEnum.FULL,
        );
    }

    /**
     * Resizes an ALREADY OPEN dialog. The opening size is set in the config by
     * ImageSlideshowDialog.open() instead, which is why this only ever runs
     * from the toolbar button.
     *
     * ⚠ config.panelClass cannot be replaced on a live ref, so the chrome swap
     * goes through addPanelClass / removePanelClass. Safe here, unlike right
     * after open(), because Material stamped its own classes long ago.
     */
    public applyDialogSize(size: BreakpointSizeEnum): void {
        const ref = this.dialogRef();

        if (!ref) return;

        const previous = this.utility.dialogSize(this.state.dialogSize());
        const next = this.utility.dialogSize(size);

        ref.updateSize(next.width, next.height);

        /**
         * ⚠ REQUIRED after every updateSize(), and the reason a resized dialog
         * was landing against the left edge.
         *
         * CDK's GlobalPositionStrategy decides justify-content ONCE, at apply(),
         * from config.width: a pane that is '100vw' with maxWidth '100vw' is
         * "flush" and gets justify-content:flex-start plus margin-inline 0
         * (_overlay-module-chunk.mjs:1947). OverlayRef.updateSize() rewrites the
         * config and the element size but never re-runs the strategy (:878), so
         * shrinking FULL -> XL left the flush-left alignment behind.
         *
         * updatePosition() with no argument re-centers and re-applies, now
         * reading the new width. crud/service/mutation.ts never hits this - it
         * sizes at open and never resizes a live dialog.
         */
        ref.updatePosition();

        if (next.panelClass !== previous.panelClass) {
            ref.removePanelClass(previous.panelClass);
            ref.addPanelClass(next.panelClass);
        }

        this.state.setDialogSize(size);

        /**
         * ⚠ the pane just resized under a live Swiper, which caches slide
         * widths and will not re-measure on its own. Without this the dialog is
         * the right size and the image is not.
         */
        this.mainEl?.swiper?.update();
        this.thumbsEl?.swiper?.update();
    }
}
