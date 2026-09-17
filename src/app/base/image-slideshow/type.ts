// file: src/app/base/image-slideshow/type.ts
import { Signal } from '@angular/core';
import type { MatDialogConfig } from '@angular/material/dialog';
import type { SwiperOptions } from 'swiper/types';
import { BreakpointSizeEnum } from '@libs/breakpoint/enum';
import { ImageSlideshowModeEnum } from '@base/image-slideshow/enum';

export interface ImageSlideshowItemType {
    /**
     * src: string
     * Full-size url the slide draws. An item without one is dropped by the
     * caller - CrudListingService.openFileFieldSlideshow() skips such rows
     * rather than pushing a blank slide.
     */
    src: string;

    /**
     * thumb: string
     * Small url the thumbs strip draws. Falls back to [src] when blank, which
     * is only wasteful, never broken.
     */
    thumb?: string;

    /** alt text. Already translated. */
    alt?: string;

    /** file name offered to the download button. Falls back to nothing. */
    name?: string;
}

export interface ImageSlideshowDataType {
    items: ImageSlideshowItemType[];

    /** slide shown first. Clamped into range by state. Default 0. */
    startIndex?: number;

    /** DIALOG only - opening size, and the first stop of the size switcher. Default FULL. */
    size?: BreakpointSizeEnum;

    /**
     * Caller's Swiper params, SHALLOW-merged over DEF_IMAGE_SLIDESHOW_SWIPER.
     * Swiper's own type, so anything Swiper accepts is accepted here and
     * nothing has to be re-declared when Swiper adds a param.
     *
     * ⚠ [thumbs] and [initialSlide] are overwritten afterwards - the thumbs
     * instance does not exist until runtime, and the start index has its own
     * input.
     *
     * ⚠ [rtl] does NOT exist in SwiperOptions. Direction is read off the
     * element's dir attribute, which this module owns - see
     * ImageSlideshowService.dir().
     */
    swiper?: SwiperOptions;

    /** same, for the thumbs strip, over DEF_IMAGE_SLIDESHOW_THUMBS_SWIPER */
    thumbsSwiper?: SwiperOptions;

    /** draw the thumbs strip. Read ONCE at attach time - see state.showThumbs. Default true. */
    showThumbs?: boolean;

    /** draw the overlay toolbar. Default true. */
    showToolbar?: boolean;

    /**
     * draw the toolbar's download button. Default FALSE.
     *
     * ⚠ the only one of these flags that defaults OFF, and deliberately. The
     * button is a plain <a download> straight to [src], so it hands the viewer
     * the original file - that has to be opted INTO, not remembered as
     * something to switch off. It is why crud's listing slideshow passes no
     * config for it at all.
     */
    showDownload?: boolean;
}

export interface ImageSlideshowConfigType {
    items: Signal<ImageSlideshowItemType[]>;
    startIndex: Signal<number>;
    mode: Signal<ImageSlideshowModeEnum>;
    size: Signal<BreakpointSizeEnum>;
    swiper: Signal<SwiperOptions>;
    thumbsSwiper: Signal<SwiperOptions>;
    showThumbs: Signal<boolean>;
    showToolbar: Signal<boolean>;
    showDownload: Signal<boolean>;
}

/**
 * What a caller may still set on ImageSlideshowDialog.open()'s MatDialogConfig.
 *
 * ⚠ [width] and [height] are omitted alongside the obvious three. They are
 * computed from [size] by ImageSlideshowUtility.dialogSize(), and `...config`
 * is spread LAST in open() - so a caller setting either used to win silently
 * and leave the pane at a size state.dialogSize() disagreed with, which the
 * first toolbar resize then snapped away.
 */
export type ImageSlideshowDialogConfigType = Omit<
    MatDialogConfig,
    'data' | 'bindings' | 'panelClass' | 'width' | 'height'
>;

/**
 * What ImageSlideshowUtility.dialogSize() answers: everything MatDialog needs
 * to size the pane, for the open() config and for a later updateSize() alike.
 */
export interface ImageSlideshowDialogSizeType {
    /** css length, viewport cap already folded in with min() */
    width: string;
    height: string;
    /** the ONE size-dependent overlay-pane class, swapped when the size changes */
    panelClass: string;
}
