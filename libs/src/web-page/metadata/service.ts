import {DOCUMENT} from '@angular/common';
import {Injectable, Renderer2, RendererFactory2, inject} from '@angular/core';
import {Meta} from '@angular/platform-browser';
import {PreconnectLink, WebAppMetadataType} from './type';

@Injectable({providedIn: 'root'})
export class WebPageMetadataService {
    private readonly document = inject(DOCUMENT);
    private readonly meta = inject(Meta);
    private readonly renderer: Renderer2;

    private readonly preconnectAttribute = 'data-app-preconnect';

    public constructor(rendererFactory: RendererFactory2) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    public init(metadata: WebAppMetadataType): void {
        this.updateApplicationMetadata(metadata);
        this.updateThemeColor(metadata.themeColor);
        this.updateManifest(metadata.manifestUrl);
        this.updateIcons(metadata);
        this.updatePreconnect(metadata.preconnect);
    }

    public updateApplicationMetadata(metadata: WebAppMetadataType): void {
        if (metadata.applicationName) {
            this.meta.updateTag({
                name: 'application-name',
                content: metadata.applicationName,
            });
        }

        if (metadata.shortName) {
            this.meta.updateTag({
                name: 'apple-mobile-web-app-title',
                content: metadata.shortName,
            });
        }
    }

    public updateThemeColor(color?: string): void {
        if (!color) {
            return;
        }

        this.meta.updateTag({
            name: 'theme-color',
            content: color,
        });
    }

    public updateManifest(url?: string): void {
        if (!url) {
            return;
        }

        let link = this.document.head.querySelector(
            'link[rel="manifest"]',
        ) as HTMLLinkElement | null;

        if (!link) {
            link = this.renderer.createElement('link') as HTMLLinkElement;
            link.setAttribute('rel', 'manifest');
            this.renderer.appendChild(this.document.head, link);
        }

        link.setAttribute('href', url);
    }

    public updateIcons(metadata: WebAppMetadataType): void {
        for (const icon of metadata.icons ?? []) {
            let selector = `link[rel="${icon.rel}"][href="${icon.href}"]`;

            if (icon.rel === 'apple-touch-icon') {
                selector = `link[rel="apple-touch-icon"]`;
            }

            let link = this.document.head.querySelector(selector) as HTMLLinkElement | null;

            if (!link) {
                link = this.renderer.createElement('link') as HTMLLinkElement;
                this.renderer.appendChild(this.document.head, link);
            }

            link.setAttribute('rel', icon.rel);
            link.setAttribute('href', icon.href);

            if (icon.sizes) {
                link.setAttribute('sizes', icon.sizes);
            }

            if (icon.type) {
                link.setAttribute('type', icon.type);
            }

            if (icon.color) {
                link.setAttribute('color', icon.color);
            }
        }
    }

    public updatePreconnect(links?: PreconnectLink[]): void {
        this.clearPreconnect();

        if (!links?.length) {
            return;
        }

        for (const item of links) {
            const link = this.renderer.createElement('link') as HTMLLinkElement;
            link.setAttribute('rel', 'preconnect');
            link.setAttribute('href', item.href);
            link.setAttribute(this.preconnectAttribute, 'true');

            if (item.crossorigin !== undefined) {
                link.setAttribute('crossorigin', item.crossorigin);
            }

            this.renderer.appendChild(this.document.head, link);
        }
    }

    public clearPreconnect(): void {
        const existing = this.document.head.querySelectorAll(
            `link[${this.preconnectAttribute}="true"]`,
        );

        existing.forEach((element) => {
            this.renderer.removeChild(this.document.head, element);
        });
    }
}