import { DOCUMENT, ElementRef, inject, Renderer2, RendererFactory2, Service } from "@angular/core";

@Service()
export class UtilityService {
    private readonly document = inject(DOCUMENT);
    private readonly rendererFactory = inject(RendererFactory2);
    private readonly renderer: Renderer2 = this.rendererFactory.createRenderer(null, null);

    private processedImages = new WeakSet<HTMLElement>();

    constructor() {
    }

    public processCoverImages(dom: HTMLElement): void {
        const selCover = ".coverimg";
        const coverImages = dom.querySelectorAll(selCover);

        coverImages.forEach((node) => {
            const cover = node as HTMLElement;

            // skip if already processed
            if (this.processedImages.has(cover)) {
                return;
            }

            const img = cover.querySelector('img');
            const src = img?.getAttribute('src');

            if (!img || !src) {
                return;
            }

            this.renderer.setStyle(cover, 'background-image', `url('${src}')`);
            this.renderer.removeChild(cover, img);
            this.processedImages.add(cover);
        });
    }
}