import { DOCUMENT, ElementRef, inject, Renderer2, RendererFactory2, Service } from "@angular/core";
import { SignatureService } from "@libs/signature/service";

@Service()
export class UtilityService {
    private readonly document = inject(DOCUMENT);
    private readonly rendererFactory = inject(RendererFactory2);
    private readonly renderer: Renderer2 = this.rendererFactory.createRenderer(null, null);

    private processedImages = new WeakSet<HTMLElement>();

    private sign = inject(SignatureService);

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
    public splitStringInHalf(str: string, strategy: 'ceil' | 'floor' = 'ceil'): [string, string] {
        let middle;
        if(strategy === 'ceil') {
            // Math.ceil puts the extra character in the first half if odd (e.g., 4 + 3)
            middle = Math.ceil(str.length / 2); 
        } else {
            // Use Math.floor if you want the extra character in the second half (e.g., 3 + 4)
            middle = Math.floor(str.length / 2);
        }
        
        const firstHalf = str.slice(0, middle);
        const secondHalf = str.slice(middle);
        
        return [firstHalf, secondHalf];
    }
    public packString(input: string): string {
        let pack: any = input.split('').reverse().join('');
        pack = this.sign.toBase64(pack);
        pack = this.splitStringInHalf(pack, 'ceil');
        pack = `${pack[1]}${pack[0]}$`;

        return pack as string;
    }
    public unpackString(input: string): string {
        let unpack: any = input.slice(0, -1);
        unpack = this.splitStringInHalf(unpack, 'floor'); // make sur eyou use reverse strategy then client side
        unpack = `${unpack[1]}${unpack[0]}`;
        unpack = this.sign.fromBase64(unpack);
        unpack = unpack.split('').reverse().join('');

        return unpack as string;
    }
}