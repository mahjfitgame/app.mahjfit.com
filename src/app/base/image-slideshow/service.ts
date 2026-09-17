// file: src/app/base/image-slideshow/service.ts
import { DestroyRef, effect, inject, Service } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import type { SwiperContainer } from 'swiper/element';
import type { SwiperOptions } from 'swiper/types';
import { BREAKPOINT_SIZE_OPTIONS } from '@libs/breakpoint/const';
import { BreakpointSizeEnum } from '@libs/breakpoint/enum';
import { I18nService } from '@base/internationalization/service';
import { I18nBidiEnum } from '@base/internationalization/enum';
import { ImageSlideshowState } from '@base/image-slideshow/state';
import {
    DEF_IMAGE_SLIDESHOW_SWIPER,
    DEF_IMAGE_SLIDESHOW_THUMBS_SWIPER,
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
