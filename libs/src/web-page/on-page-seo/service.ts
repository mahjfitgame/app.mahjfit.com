import {DOCUMENT} from '@angular/common';
import {Injectable, Renderer2, RendererFactory2, inject} from '@angular/core';
import {Meta, Title} from '@angular/platform-browser';
import {
    HreflangLink,
    JsonLdObject,
    OnPageSeoType,
} from './type';

@Injectable({providedIn: 'root'})
export class WebPageOnPageSeoService {
    private readonly document = inject(DOCUMENT);
    public readonly title = inject(Title);
    public readonly meta = inject(Meta);

    private readonly renderer: Renderer2;

    private readonly canonicalElementId = 'app-seo-canonical';
    private readonly jsonLdElementId = 'app-seo-jsonld';
    private readonly hreflangAttribute = 'data-app-seo-hreflang';

    public constructor(rendererFactory: RendererFactory2) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    public update(seo: OnPageSeoType): void {
        this.updateBasicSeo(seo);
        this.updateOpenGraph(seo);
        this.updateTwitter(seo);
        this.updateCanonical(seo.canonicalUrl);
        this.updateHreflang(seo.hreflang);
        this.updateJsonLd(seo.jsonLd);
    }

    public updateBasicSeo(seo: OnPageSeoType): void {
        if (seo.title) {
            this.title.setTitle(seo.title);
        }

        if (seo.description) {
            this.meta.updateTag({
                name: 'description',
                content: seo.description,
            });
        }

        if (seo.keywords) {
            this.meta.updateTag({
                name: 'keywords',
                content: seo.keywords,
            });
        }

        if (seo.robots) {
            this.meta.updateTag({
                name: 'robots',
                content: seo.robots,
            });
        }
    }

    public updateOpenGraph(seo: OnPageSeoType): void {
        if (!seo.openGraph) {
            return;
        }

        if (seo.openGraph.title) {
            this.meta.updateTag({
                property: 'og:title',
                content: seo.openGraph.title,
            });
        }

        if (seo.openGraph.description) {
            this.meta.updateTag({
                property: 'og:description',
                content: seo.openGraph.description,
            });
        }

        if (seo.openGraph.type) {
            this.meta.updateTag({
                property: 'og:type',
                content: seo.openGraph.type,
            });
        }

        if (seo.openGraph.url) {
            this.meta.updateTag({
                property: 'og:url',
                content: seo.openGraph.url,
            });
        }

        if (seo.openGraph.image) {
            this.meta.updateTag({
                property: 'og:image',
                content: seo.openGraph.image,
            });
        }
    }

    public updateTwitter(seo: OnPageSeoType): void {
        if (!seo.twitter) {
            return;
        }

        if (seo.twitter.card) {
            this.meta.updateTag({
                name: 'twitter:card',
                content: seo.twitter.card,
            });
        }

        if (seo.twitter.title) {
            this.meta.updateTag({
                name: 'twitter:title',
                content: seo.twitter.title,
            });
        }

        if (seo.twitter.description) {
            this.meta.updateTag({
                name: 'twitter:description',
                content: seo.twitter.description,
            });
        }

        if (seo.twitter.image) {
            this.meta.updateTag({
                name: 'twitter:image',
                content: seo.twitter.image,
            });
        }
    }

    public updateCanonical(url?: string | null): void {
        this.removeCanonical();

        if (!url) {
            return;
        }

        const link = this.renderer.createElement('link') as HTMLLinkElement;
        link.id = this.canonicalElementId;
        link.setAttribute('rel', 'canonical');
        link.setAttribute('href', url);

        this.renderer.appendChild(this.document.head, link);
    }

    public updateHreflang(links?: HreflangLink[] | null): void {
        this.removeHreflang();

        if (!links?.length) {
            return;
        }

        for (const item of links) {
            const link = this.renderer.createElement('link') as HTMLLinkElement;
            link.setAttribute('rel', 'alternate');
            link.setAttribute('hreflang', item.hreflang);
            link.setAttribute('href', item.href);
            link.setAttribute(this.hreflangAttribute, 'true');

            this.renderer.appendChild(this.document.head, link);
        }
    }

    public updateJsonLd(schema?: JsonLdObject | JsonLdObject[] | null): void {
        this.removeJsonLd();

        if (!schema) {
            return;
        }

        const script = this.renderer.createElement('script') as HTMLScriptElement;
        script.id = this.jsonLdElementId;
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);

        this.renderer.appendChild(this.document.head, script);
    }

    public clearDynamicSeo(): void {
        this.removeCanonical();
        this.removeHreflang();
        this.removeJsonLd();
    }

    private removeCanonical(): void {
        const existing = this.document.getElementById(this.canonicalElementId);
        if (existing) {
            this.renderer.removeChild(this.document.head, existing);
        }
    }

    private removeJsonLd(): void {
        const existing = this.document.getElementById(this.jsonLdElementId);
        if (existing) {
            this.renderer.removeChild(this.document.head, existing);
        }
    }

    private removeHreflang(): void {
        const existing = this.document.head.querySelectorAll(
            `link[${this.hreflangAttribute}="true"]`,
        );

        existing.forEach((element) => {
            this.renderer.removeChild(this.document.head, element);
        });
    }    
}