// file: src/app/base/image-slideshow/component.ts
import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    effect,
    ElementRef,
    inject,
    input,
    viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// import { MatMenuModule } from '@angular/material/menu';   // @see the parked size menu below
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule } from '@jsverse/transloco';
import { register } from 'swiper/element/bundle';
import type { SwiperContainer } from 'swiper/element';
import type { SwiperOptions } from 'swiper/types';
import { BreakpointSizeEnum } from '@libs/breakpoint/enum';
import { IMAGE_SLIDESHOW_PROVIDERS } from '@base/image-slideshow/provider';
import { ImageSlideshowService } from '@base/image-slideshow/service';
import { ImageSlideshowModeEnum } from '@base/image-slideshow/enum';
import { ImageSlideshowItemType } from '@base/image-slideshow/type';

/**
 * Module scope, so it runs exactly once however many viewers render.
 * register() is itself guarded (window.customElements.get - see
 * swiper-element-bundle.mjs:292), so this is safe either way.
 */
register();

@Component({
    selector: 'image-slideshow-component',
    standalone: true,
    templateUrl: './template.html',
    styleUrl: './style.scss',
    imports: [
        TranslocoModule,
        MatButtonModule,
        MatIconModule,
        // ⚠ paired with the PARKED size menu in template.html - uncomment both
        // together or neither. Left here (rather than deleted) so restoring the
        // switcher is two uncomments and no hunting for what it needed.
        // MatMenuModule,
        MatToolbarModule,
        MatTooltipModule,
    ],
    providers: IMAGE_SLIDESHOW_PROVIDERS,
    /**
     * ⚠ this switches OFF template type-checking for <swiper-container> and
     * <swiper-slide> only, and the repo runs strictTemplates.
     *
     * Containment rule: NO Swiper param is ever written as a template
     * attribute, and NO Swiper event as a template binding. Params are built in
     * TS against SwiperOptions and events bound in TS against
     * SwiperContainerEventMap - see ImageSlideshowService. The only attribute
     * in the template is the static init="false" plus [attr.dir].
     */
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ImageSlideshowComponent {
    /**
     * This class declares ONLY what the framework will not let state.ts hold:
     * input() and viewChild(). Every computed lives in state.ts and reaches
     * these through bind() in the constructor.
     *
     * service.state is how the template reads state, matching every other
     * module here.
     */
    public readonly service = inject(ImageSlideshowService);

    // ████ DATA ██████████████████████████████████████████████████████████
    public readonly items = input<ImageSlideshowItemType[]>([]);
    public readonly startIndex = input<number>(0);

    // ████ CONFIG ████████████████████████████████████████████████████████
    /** merged over DEF_IMAGE_SLIDESHOW_SWIPER. Swiper's own type - anything goes. */
    public readonly swiper = input<SwiperOptions>({});
    public readonly thumbsSwiper = input<SwiperOptions>({});
    public readonly showThumbs = input<boolean>(true);
    public readonly showToolbar = input<boolean>(true);
    /** ⚠ FALSE by default, unlike the two above - see ImageSlideshowDataType */
    public readonly showDownload = input<boolean>(false);

    // ████ SHELL █████████████████████████████████████████████████████████
    /** ⚠ set to DIALOG only by ImageSlideshowDialog - never by a page */
    public readonly mode = input<ImageSlideshowModeEnum>(ImageSlideshowModeEnum.INLINE);

    /** DIALOG only, ignored inline */
    public readonly size = input<BreakpointSizeEnum>(BreakpointSizeEnum.FULL);

    // ████ VIEW ██████████████████████████████████████████████████████████
    /**
     * ⚠ NOT viewChild.required. Both containers live behind @if (hasItems()) in
     * the template, so with an async [items] input they do not exist on the
     * first render at all - required() would throw NG0951 the moment the
     * attach below read it.
     */
    private readonly mainSwiperRef = viewChild<ElementRef<SwiperContainer>>('mainSwiper');
    private readonly thumbsSwiperRef = viewChild<ElementRef<SwiperContainer>>('thumbsSwiper');
    private readonly ringRef = viewChild<ElementRef<HTMLElement>>('autoplayRing');

    constructor() {
        /**
         * Inputs are not readable while state.ts initialises its fields, so it
         * gets the signals themselves rather than their values - everything
         * stays live, and every computed in there runs after this point.
         */
        this.service.state.bind({
            items: this.items,
            startIndex: this.startIndex,
            mode: this.mode,
            size: this.size,
            swiper: this.swiper,
            thumbsSwiper: this.thumbsSwiper,
            showThumbs: this.showThumbs,
            showToolbar: this.showToolbar,
            showDownload: this.showDownload,
        });

        /**
         * init="false" on both containers means nothing initialises until the
         * @for slides exist. This is that moment.
         *
         * ⚠ an effect and NOT afterNextRender(): the containers appear only
         * once [items] is non-empty, which with async data is several renders
         * later - afterNextRender() fires once and would have missed it.
         * Reading the viewChild signals is what re-runs this. attach() guards
         * its own re-entry, so a later run is a no-op.
         *
         * @see CrudViewPageComponent for the same element handoff.
         */
        effect(() => {
            const mainEl = this.mainSwiperRef()?.nativeElement;

            if (!mainEl) return;

            this.service.setRingEl(this.ringRef()?.nativeElement ?? null);
            this.service.attach(mainEl, this.thumbsSwiperRef()?.nativeElement ?? null);
        });

        // ⚠ no onDestroy(detach()) here - ImageSlideshowService registers its
        // own on the SAME injector, so a second one only ran detach() twice.
    }
}
