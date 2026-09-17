// file: src/app/base/image-slideshow/utility.ts
import { Service } from '@angular/core';
import { BREAKPOINT_WIDTH } from '@libs/breakpoint/const';
import { BreakpointSizeEnum } from '@libs/breakpoint/enum';
import {
    IMAGE_SLIDESHOW_FULLSCREEN_PANEL_CLASS,
    IMAGE_SLIDESHOW_INSET_PANEL_CLASS,
} from '@base/image-slideshow/const';
import { ImageSlideshowDialogSizeType } from '@base/image-slideshow/type';

/**
 * Stateless shape converters for this module - no signal, no element handle, no
 * injected service. Same charter as CrudUtility.
 *
 * It exists because BOTH sides of the sizing story need the same answer:
 * ImageSlideshowDialog computes it once for the open() config, and
 * ImageSlideshowService recomputes it on every toolbar size change. A function
 * parked in const.ts served them before, which broke the rule that const.ts
 * holds constants only.
 *
 * ⚠ root @Service(), not autoProvided:false - ImageSlideshowDialog is itself
 * root and could not reach a scoped provider. @Service() is tree-shaken, so
 * nothing ships unless something injects it. Same reasoning as the dialog's.
 */
@Service()
export class ImageSlideshowUtility {

    // ████████████████████████████████████████████████████████████████████
    // ███ DIALOG SIZING ██████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * One size -> one set of dialog dimensions, for the open() config AND the
     * toolbar's size switcher, so the two cannot drift.
     *
     * ⚠ the viewport cap is folded INTO the width/height strings with CSS min()
     * rather than living in maxWidth/maxHeight. MatDialogRef.updateSize() can
     * only change width and height, so a cap kept in maxWidth would be set at
     * open and never corrected on a later resize.
     */
    public dialogSize(size: BreakpointSizeEnum): ImageSlideshowDialogSizeType {
        const fullscreen = size === BreakpointSizeEnum.FULL;

        return {
            width: fullscreen ? '100vw' : `min(${BREAKPOINT_WIDTH[size]}, calc(100vw - 2rem))`,
            height: fullscreen ? '100dvh' : 'min(90dvh, calc(100dvh - 2rem))',
            panelClass: fullscreen
                ? IMAGE_SLIDESHOW_FULLSCREEN_PANEL_CLASS
                : IMAGE_SLIDESHOW_INSET_PANEL_CLASS,
        };
    }
}
