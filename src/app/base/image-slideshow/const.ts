// file: src/app/base/image-slideshow/const.ts
import type { SwiperOptions } from 'swiper/types';
import { BreakpointSizeEnum } from '@libs/breakpoint/enum';

/**
 * Overlay-pane classes the dialog swaps between sizes.
 *
 * ⚠ Tailwind scans source files for CLASS LITERALS, so these must stay literals -
 * a class built by concatenation is never generated. The fullscreen one is the
 * same literal crud/service/mutation.ts uses; it zeroes the container radius.
 *
 * Which of the two applies is ImageSlideshowUtility.dialogSize()'s answer - the
 * logic lives in utility.ts because const.ts holds constants only.
 */
export const IMAGE_SLIDESHOW_FULLSCREEN_PANEL_CLASS = 'tw:[--mat-dialog-container-shape:0px]';
export const IMAGE_SLIDESHOW_INSET_PANEL_CLASS = 'bfw-safe-area-p';

export const IMAGE_SLIDESHOW_AUTOPLAY_DELAY = 4000;

/**
 * The stop the toolbar's fullscreen toggle drops back to when the consumer asked
 * for FULL, or asked for nothing at all.
 *
 * ⚠ a viewer that OPENS fullscreen still needs somewhere to go on the way out,
 * and FULL -> FULL is not a toggle. Any consumer that named its own size gets
 * that size back instead - see ImageSlideshowState.restoreSize().
 */
export const IMAGE_SLIDESHOW_SECONDARY_SIZE = BreakpointSizeEnum.XXL;

/**
 * MAIN swiper defaults.
 *
 * Every feature the module ships is ON here, so a caller turns one OFF by
 * passing `{ zoom: false }` rather than by re-listing the other six.
 *
 * ⚠ [autoplay] is configured but `enabled: false`, NOT `autoplay: false`. The
 * module has to be INSTALLED at init for swiper.autoplay.start() to exist
 * later - `autoplay: false` leaves the toolbar button with nothing to call.
 *
 * ⚠ no [thumbs], no [initialSlide] and no [rtl] here. The first two are
 * runtime values ImageSlideshowService writes; the third is not a Swiper
 * option at all - direction comes off the element's dir attribute.
 */
export const DEF_IMAGE_SLIDESHOW_SWIPER: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 16,
    speed: 300,
    loop: true,
    grabCursor: true,

    // thumbs needs this to highlight the active thumb
    watchSlidesProgress: true,

    navigation: { enabled: true },

    /**
     * Plain CLICKABLE dots - no renderBullet, so Swiper draws its own bullet and
     * there is no HTML string being injected into the shadow root at all.
     *
     * ⚠ NO dynamicBullets, deliberately. It keeps a long group tidy by showing a
     * window of a few bullets and scaling the rest to nothing - which means the
     * far slides have no bullet the user can actually hit, leaving the row worth
     * only next/prev. Every bullet is rendered full size here so ANY slide is one
     * click away, which is the entire point of pagination; the thumbs strip is
     * the affordance for choosing a specific picture out of a large set.
     *
     * Styling is the --swiper-pagination-* custom properties in style.scss:
     * custom properties INHERIT through the shadow boundary, and that is the
     * only way to reach a bullet (only the pagination container has a part).
     */
    pagination: {
        enabled: true,
        clickable: true,
    },

    keyboard: { enabled: true, onlyInViewport: true },
    mousewheel: { forceToAxis: true, thresholdDelta: 8 },
    zoom: { maxRatio: 4, toggle: true },
    a11y: { enabled: true },

    autoplay: {
        enabled: false,
        delay: IMAGE_SLIDESHOW_AUTOPLAY_DELAY,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
    },

    // one image either side is decoded ahead; the rest stay loading="lazy"
    lazyPreloadPrevNext: 1,
};

/**
 * THUMBS strip defaults.
 *
 * ⚠ never loops - a looping strip desyncs the active-thumb highlight from the
 * main swiper's realIndex. That is forced in buildThumbsParams(), not here, so
 * a caller's thumbsSwiper override cannot turn it back on.
 */
export const DEF_IMAGE_SLIDESHOW_THUMBS_SWIPER: SwiperOptions = {
    slidesPerView: 'auto',
    spaceBetween: 8,
    freeMode: true,
    watchSlidesProgress: true,
    slideToClickedSlide: true,
    // ⚠ loop: false is NOT set here - ImageSlideshowService.buildThumbsParams()
    // forces it after the caller's override, which is the copy that actually
    // holds. Two copies only invited one of them to be "fixed" on its own.

    /**
     * Centres the strip when the thumbs do not fill it - four thumbs in a wide
     * dialog sat against the start edge without this. Once they DO overflow it
     * stops applying on its own and the strip scrolls normally, which is the
     * behaviour we want at both ends.
     *
     * ⚠ works only because this strip has loop: false - the option is documented
     * as not for loop mode.
     */
    centerInsufficientSlides: true,

    /**
     * Prev/next arrows on the STRIP itself, so a thumb scrolled out of view is
     * reachable without dragging - at XS a six-image group only fits five.
     *
     * Costs no markup: the custom element already renders button-prev/button-next
     * in its shadow root (swiper-element.mjs:128) and wires them as soon as a
     * navigation param is present.
     *
     * ⚠ they hide themselves when the strip fits. Swiper adds swiper-button-lock
     * on isLocked (modules/navigation.mjs:62) and its css is display:none, so a
     * four-thumb strip in a wide dialog shows no arrows at all.
     */
    navigation: { enabled: true },

    /**
     * ⚠ do NOT try to carve a gutter for those arrows with slidesOffsetBefore /
     * slidesOffsetAfter. It was tried: centerInsufficientSlides does not account
     * for the offsets, so a four-thumb strip stopped being centred (556px one
     * side, 684px the other), and it does not even fix what it was for - a thumb
     * still passes UNDER the arrow while the strip is mid-scroll.
     *
     * The arrows overlay the strip, the way the main slider's arrows overlay the
     * image. style.scss gives them an opaque chip so they read as controls.
     */
};
