// file: src/app/base/image-slideshow/dialog.ts
import { inject, inputBinding, Service } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BreakpointSizeEnum } from '@libs/breakpoint/enum';
import { ImageSlideshowModeEnum } from '@base/image-slideshow/enum';
import {
    ImageSlideshowDataType,
    ImageSlideshowDialogConfigType,
} from '@base/image-slideshow/type';
import { ImageSlideshowUtility } from '@base/image-slideshow/utility';

@Service()
export class ImageSlideshowDialog {
    private readonly dialog = inject(MatDialog);
    private readonly utility = inject(ImageSlideshowUtility);

    /**
     * The one open viewer, or null. Same intent as
     * CrudMutationService.activeMutationDialogRef - one at a time - but NOT the
     * same job: that one also exists so closeMutationAction() can close the
     * dialog from outside. Nothing closes this one from outside;
     * ImageSlideshowService.close() uses its OWN injected MatDialogRef, which is
     * why the service can stay per-instance while this stays root.
     *
     * ⚠ it holds a PROMISE, not the ref, and that is the whole point. open() has
     * an `await import()` in the middle, so a guard on a settled ref would let
     * two rapid clicks - a double-click on a crud thumb - both sail past it
     * while the chunk loads and stack two lightboxes. Holding the in-flight
     * promise closes that window: the second caller gets the first one's dialog.
     * CrudMutationService has no await, so it never faced this.
     */
    private activeOpenDialogRef: Promise<MatDialogRef<unknown>> | null = null;

    /**
     * Answers null when there is nothing to show, so callers can hand over a
     * possibly-empty list without guarding first.
     *
     * ⚠ deliberately NOT async - it must decide whether a viewer is already
     * being opened SYNCHRONOUSLY, before any await can yield the turn.
     */
    public open(
        data: ImageSlideshowDataType,
        config: ImageSlideshowDialogConfigType = {},
    ): Promise<MatDialogRef<unknown> | null> {
        if (!data.items.length) return Promise.resolve(null);

        if (this.activeOpenDialogRef) return this.activeOpenDialogRef;

        this.activeOpenDialogRef = this.openDialog(data, config);

        // a failed chunk load must not wedge the guard shut forever
        this.activeOpenDialogRef.catch(() => { this.activeOpenDialogRef = null; });

        return this.activeOpenDialogRef;
    }

    private async openDialog(
        data: ImageSlideshowDataType,
        config: ImageSlideshowDialogConfigType,
    ): Promise<MatDialogRef<unknown>> {
        /**
         * Lazy, and this is the whole reason swiper never reaches the main
         * bundle: component.ts statically imports swiper/element/bundle, so it
         * must never be statically importable from here.
         */
        const { ImageSlideshowComponent } = await import('@base/image-slideshow/component');

        const size = data.size ?? BreakpointSizeEnum.FULL;
        const sizing = this.utility.dialogSize(size);

        const dialogRef = this.dialog.open(ImageSlideshowComponent, {
            /**
             * The opening size goes in the CONFIG, the way every other sized
             * dialog here does it (crud/service/mutation.ts). Material applies
             * config.panelClass itself, so it is never lost - unlike an
             * addPanelClass() called right after open(), which Material
             * overwrites when it stamps its own classes onto the pane.
             *
             * Only the toolbar's size SWITCHER goes through
             * ImageSlideshowService.applyDialogSize(), and by then the pane is
             * long settled.
             */
            /**
             * ⚠ only the SIZE class. There is no marker class for styling any
             * more - theme/active/_component.scss reaches the pane's surface
             * with :has(> image-slideshow-component) instead, so the selector
             * names the component itself and cannot go stale.
             */
            panelClass: [sizing.panelClass],
            width: sizing.width,
            height: sizing.height,

            // the real cap is folded into the width/height strings above, so
            // these stay open and never need correcting on a resize
            maxWidth: '100vw',
            maxHeight: '100dvh',

            // a lightbox dismisses on backdrop click and ESC, unlike the crud
            // mutation dialog which guards unsaved input
            disableClose: false,
            autoFocus: 'dialog',

            /**
             * MatDialogConfig has no `providers`, but it does have `bindings`.
             * Feeding the component through its ORDINARY inputs means one input
             * surface for dialog and inline alike - no MAT_DIALOG_DATA, and so
             * no chance of an inline viewer nested in another dialog picking up
             * that ancestor's data.
             */
            bindings: [
                inputBinding('items', () => data.items),
                inputBinding('startIndex', () => data.startIndex ?? 0),
                inputBinding('size', () => size),
                inputBinding('swiper', () => data.swiper ?? {}),
                inputBinding('thumbsSwiper', () => data.thumbsSwiper ?? {}),
                inputBinding('showThumbs', () => data.showThumbs ?? true),
                inputBinding('showToolbar', () => data.showToolbar ?? true),
                // ⚠ ?? false, not ?? true - @see ImageSlideshowDataType
                inputBinding('showDownload', () => data.showDownload ?? false),
                inputBinding('mode', () => ImageSlideshowModeEnum.DIALOG),
            ],

            ...config,
        });

        dialogRef.afterClosed().subscribe(() => { this.activeOpenDialogRef = null; });

        return dialogRef;
    }
}
