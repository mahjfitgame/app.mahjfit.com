// file: libs/src/utility/directive/highlight.directive.ts
import {
  AfterViewInit,
  Directive,
  ElementRef,
  input,
  OnChanges,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[termHighlight]',
  standalone: true,
})
export class TermHighlightDirective implements OnChanges, AfterViewInit {
  public term = input<string | null>('', { alias: 'termHighlight' });
  public highlightClass = input('tw:px-1 tw:bg-yellow-200 tw:rounded-sm');

  private viewReady = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  public ngAfterViewInit(): void {
    this.viewReady = true;
    this.applyHighlight();
  }

  public ngOnChanges(): void {
    if (!this.viewReady) return;
    this.applyHighlight();
  }

  private applyHighlight(): void {
    const host = this.el.nativeElement;
    const term = this.term()?.trim();

    this.clearHighlight(host);

    if (!term) return;

    const regex = new RegExp(this.escapeRegExp(term), 'gi');
    this.highlightTextNodes(host, regex);
  }

  private highlightTextNodes(root: Node, regex: RegExp): void {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.textContent?.trim()) {
            return NodeFilter.FILTER_REJECT;
          }

          if (node.parentElement?.classList.contains('__term-highlight')) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    const textNodes: Text[] = [];

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    for (const textNode of textNodes) {
      this.highlightSingleTextNode(textNode, regex);
    }
  }

  private highlightSingleTextNode(textNode: Text, regex: RegExp): void {
    const text = textNode.textContent ?? '';

    if (!regex.test(text)) {
      regex.lastIndex = 0;
      return;
    }

    regex.lastIndex = 0;

    const fragment = document.createDocumentFragment();

    let lastIndex = 0;

    text.replace(regex, (match: string, ...args: any[]) => {
      const offset = args[args.length - 2] as number;

      if (offset > lastIndex) {
        fragment.appendChild(
          this.renderer.createText(text.slice(lastIndex, offset)),
        );
      }

      const span = this.renderer.createElement('span') as HTMLSpanElement;

      this.renderer.addClass(span, '__term-highlight');

      for (const cls of this.highlightClass().split(' ').filter(Boolean)) {
        this.renderer.addClass(span, cls);
      }

      span.appendChild(this.renderer.createText(match));
      fragment.appendChild(span);

      lastIndex = offset + match.length;

      return match;
    });

    if (lastIndex < text.length) {
      fragment.appendChild(
        this.renderer.createText(text.slice(lastIndex)),
      );
    }

    const parent = textNode.parentNode;

    if (parent) {
      parent.insertBefore(fragment, textNode);
      parent.removeChild(textNode);
    }
  }

  private clearHighlight(root: HTMLElement): void {
    const highlights = Array.from(
      root.querySelectorAll('span.__term-highlight'),
    );

    for (const span of highlights) {
      const parent = span.parentNode;

      if (!parent) continue;

      this.renderer.insertBefore(
        parent,
        this.renderer.createText(span.textContent ?? ''),
        span,
      );

      this.renderer.removeChild(parent, span);
      parent.normalize();
    }
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/*
// DO NOT HANDLE HTML BASED CONTENT, USE THIS TO HANDLE TEXT CONTENT
@Directive({
  selector: '[termHighlight]',
  standalone: true,
})
export class TermHighlightDirective implements OnChanges, AfterViewInit {
  public term = input<string | null>('', { alias: 'termHighlight' });
  public highlightClass = input('tw:px-1 tw:bg-yellow-200 tw:rounded-sm');

  private originalText = '';
  private viewReady = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  public ngAfterViewInit(): void {
    this.viewReady = true;
    this.originalText = this.el.nativeElement.textContent ?? '';
    this.applyHighlight();
  }

  public ngOnChanges(): void {
    if (!this.viewReady) return;
    this.applyHighlight();
  }

  private applyHighlight(): void {
    const text = this.originalText;
    const term = this.term()?.trim();

    if (!term) {
      this.renderer.setProperty(this.el.nativeElement, 'textContent', text);
      return;
    }

    const regex = new RegExp(this.escapeRegExp(term), 'gi');

    const highlighted = text.replace(regex, (match) => {
      return `<span class="${this.highlightClass()}">${match}</span>`;
    });

    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', highlighted);
  }

  private escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
*/