import { DOCUMENT } from '@angular/common';
import { inject, Renderer2, RendererFactory2, Service } from '@angular/core';
import { ScrollDirectionEnum } from './enum';
import { ScrollDirectionOptions } from './type';

@Service()
export class ScrollDirectionService {
    public static readonly DATA_ATTR_NAME = 'data-scroll-direction';

    private readonly document = inject(DOCUMENT);
    private readonly rendererFactory = inject(RendererFactory2);
    private readonly renderer: Renderer2 = this.rendererFactory.createRenderer(null, null);
    private readonly scrollPositions = new WeakMap<object, number>();

    /**
     * 
     * # Usage with main body
     * 
     * ## directly in Component only
     * private readonly scrolld = inject(ScrollDirectionService);
     * 
     * @HostListener('window:scroll')
     * public onWindowScroll(): void {
     *  this.scroll.updateScrollDirection(this.document, {
     *      applyTo: this.document.body,
     *  });
     * }
     * 
     * # Usage with specific element
     * 
     * ## in HTML
     * <div #scrollBox class="tw:max-h-96 tw:overflow-y-auto">...</div>
     * 
     * ## in Component
     * export class DemoComponent implements AfterViewInit {
     *  private readonly scrolld = inject(ScrollDirectionService);
     *
     *  @ViewChild('scrollBox', { static: true })
     *  scrollBox!: ElementRef<HTMLElement>;
     *
     *  ngAfterViewInit(): void {
     *  const el = this.scrollBox.nativeElement;
     *
     *   el.addEventListener('scroll', () => {
     *      this.scrolld.updateScrollDirection(el, {
     *          applyTo: el,
     *      });
     *   });
     *  }
     * }
     * 
     */
    public updateScrollDirection(
        container: Document | HTMLElement, 
        options?: ScrollDirectionOptions,
        ): ScrollDirectionEnum {
        const attributeName = options?.attributeName ?? ScrollDirectionService.DATA_ATTR_NAME;
        const thresholdTop = options?.thresholdTop ?? 50;
        const thresholdBottomOffset = options?.thresholdBottomOffset ?? 50;

        const target =
        options?.applyTo ??
        (this.isDocument(container) ? this.document.body : container);

        const lastScrollTop = this.scrollPositions.get(container) ?? 0;
        const metrics = this.getScrollMetrics(container);
        const activeBottomLimit = metrics.scrollHeight - thresholdBottomOffset;

        let direction: ScrollDirectionEnum = ScrollDirectionEnum.UP;

        if (
            metrics.scrollTop + metrics.clientHeight <= activeBottomLimit &&
            metrics.scrollTop >= thresholdTop
        ) {
            direction = metrics.scrollTop > lastScrollTop ? ScrollDirectionEnum.DOWN : ScrollDirectionEnum.UP;
        }

        this.renderer.setAttribute(target, attributeName, direction);
        this.scrollPositions.set(container, metrics.scrollTop);

        return direction;
    }

    public clearScrollDirectionAttribute(
        target: HTMLElement,
        attributeName = ScrollDirectionService.DATA_ATTR_NAME,
    ): void {
        this.renderer.removeAttribute(target, attributeName);
    }

    public initScrollDirection(target: HTMLElement, attributeName = ScrollDirectionService.DATA_ATTR_NAME): void {
        this.renderer.setAttribute(target, attributeName, 'up');
    }

    private getScrollMetrics(container: Document | HTMLElement): {
        scrollTop: number;
        scrollHeight: number;
        clientHeight: number;
    } {
        if (this.isDocument(container)) {
            const docEl = container.documentElement;

            return {
                scrollTop: docEl.scrollTop,
                scrollHeight: docEl.scrollHeight,
                clientHeight: docEl.clientHeight,
            };
        }

        return {
            scrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
        };
    }

    private isDocument(value: Document | HTMLElement): value is Document {
        return 'documentElement' in value;
    }
}