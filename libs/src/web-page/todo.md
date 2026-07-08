Yes, that split is much better.

A sane architecture is:

* **`PageHeadService (OnPageSeo)`** for page-level head tags that can change per route
* **`WebAppMetadataService`** for app-level static metadata and icons
* **`AnalyticsTrackingHooksService`** for page views, events, consent-aware adapters
* **`WebContentPrivacyService`** for consent, legal links, region-aware gating
* **`WebPageLocalizationService`** for `lang`, `dir`, locale formatting, localized URL helpers

That matches how browsers and crawlers actually consume this stuff. `manifest.webmanifest` is a document-level install file linked from the page, while canonical, robots, hreflang, JSON-LD, and most OG/Twitter tags live in the document head. `preconnect` is just a connection hint, not content metadata. Google’s docs also treat robots, canonical, structured data, and hreflang as separate signals with different jobs. ([MDN Web Docs][1])

Below is a full Angular pattern you can drop into your app.

---

# Recommended folder structure

```txt
src/app/core/web/
  head/
    page-head.types.ts
    page-head.config.ts
    page-head.service.ts
    page-head.route-sync.service.ts

  metadata/
    web-app-metadata.types.ts
    web-app-metadata.config.ts
    web-app-metadata.service.ts

  analytics/
    analytics.types.ts
    analytics.tokens.ts
    analytics-tracking-hooks.service.ts
    adapters/
      ga4.adapter.ts
      gtm.adapter.ts
      custom-console.adapter.ts

  privacy/
    web-content-privacy.types.ts
    web-content-privacy.service.ts

  localization/
    web-page-localization.types.ts
    web-page-localization.service.ts

  web-bootstrap.service.ts
```

---

# 1) PageHeadService

This handles:

* title
* description / keywords / robots
* canonical
* hreflang
* JSON-LD
* OG / Twitter
* theme-color
* preconnect
* defaults / cleanup

## `page-head.types.ts`

```ts
export interface HreflangLink {
    hreflang: string;
    href: string;
}

export interface JsonLdObject {
    [key: string]: unknown;
}

export interface OpenGraphHead {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    image?: string;
    siteName?: string;
    locale?: string;
}

export interface TwitterHead {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
}

export interface PreconnectLink {
    href: string;
    crossorigin?: '' | 'anonymous' | 'use-credentials';
}

export interface PageHeadState {
    title?: string;
    description?: string;
    keywords?: string;
    robots?: string;
    canonicalUrl?: string;
    hreflang?: HreflangLink[];
    jsonLd?: JsonLdObject | JsonLdObject[];
    openGraph?: OpenGraphHead;
    twitter?: TwitterHead;
    themeColor?: string;
    preconnect?: PreconnectLink[];
}
```

## `page-head.config.ts`

```ts
import {InjectionToken} from '@angular/core';
import {PageHeadState} from './page-head.types';

export interface PageHeadGlobalConfig {
    appName: string;
    defaultTitle?: string;
    titleSeparator?: string;
    defaultDescription?: string;
    defaultRobots?: string;
    defaultThemeColor?: string;
    defaultOgImage?: string;
    defaultTwitterCard?: string;
    defaultPreconnect?: {href: string; crossorigin?: '' | 'anonymous' | 'use-credentials'}[];
}

export const PAGE_HEAD_GLOBAL_CONFIG = new InjectionToken<PageHeadGlobalConfig>(
    'PAGE_HEAD_GLOBAL_CONFIG',
);
```

## `page-head.service.ts`

```ts
import {DOCUMENT} from '@angular/common';
import {Injectable, Renderer2, RendererFactory2, inject} from '@angular/core';
import {Meta, Title} from '@angular/platform-browser';
import {PAGE_HEAD_GLOBAL_CONFIG, PageHeadGlobalConfig} from './page-head.config';
import {HreflangLink, JsonLdObject, PageHeadState, PreconnectLink} from './page-head.types';

@Injectable({providedIn: 'root'})
export class PageHeadService {
    private readonly titleService = inject(Title);
    private readonly meta = inject(Meta);
    private readonly document = inject(DOCUMENT);
    private readonly config = inject(PAGE_HEAD_GLOBAL_CONFIG);

    private readonly renderer: Renderer2;

    private readonly canonicalId = 'app-head-canonical';
    private readonly jsonLdId = 'app-head-jsonld';
    private readonly preconnectAttr = 'data-app-preconnect';
    private readonly hreflangAttr = 'data-app-hreflang';

    public constructor(rendererFactory: RendererFactory2) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    public apply(state: PageHeadState): void {
        const merged = this.mergeWithDefaults(state);

        this.setTitle(merged.title);
        this.setMetaTag('description', merged.description);
        this.setMetaTag('keywords', merged.keywords);
        this.setMetaTag('robots', merged.robots);

        this.setCanonical(merged.canonicalUrl);
        this.setHreflangLinks(merged.hreflang);
        this.setJsonLd(merged.jsonLd);

        this.setThemeColor(merged.themeColor);
        this.setPreconnectLinks(merged.preconnect);

        this.setOpenGraph(merged);
        this.setTwitter(merged);
    }

    public clearDynamic(): void {
        this.removeCanonical();
        this.removeJsonLd();
        this.removeDynamicHreflang();
        this.removeDynamicPreconnect();
    }

    public setTitle(title?: string): void {
        if (!title) {
            return;
        }

        this.titleService.setTitle(title);
    }

    public setCanonical(url?: string): void {
        this.removeCanonical();

        if (!url) {
            return;
        }

        const link = this.renderer.createElement('link') as HTMLLinkElement;
        link.id = this.canonicalId;
        link.rel = 'canonical';
        link.href = url;

        this.renderer.appendChild(this.document.head, link);
    }

    public setHreflangLinks(links?: HreflangLink[]): void {
        this.removeDynamicHreflang();

        if (!links?.length) {
            return;
        }

        for (const item of links) {
            const link = this.renderer.createElement('link') as HTMLLinkElement;
            link.rel = 'alternate';
            link.hreflang = item.hreflang;
            link.href = item.href;
            link.setAttribute(this.hreflangAttr, 'true');

            this.renderer.appendChild(this.document.head, link);
        }
    }

    public setJsonLd(data?: JsonLdObject | JsonLdObject[]): void {
        this.removeJsonLd();

        if (!data) {
            return;
        }

        const script = this.renderer.createElement('script') as HTMLScriptElement;
        script.id = this.jsonLdId;
        script.type = 'application/ld+json';
        script.text = JSON.stringify(data);

        this.renderer.appendChild(this.document.head, script);
    }

    public setThemeColor(color?: string): void {
        if (!color) {
            return;
        }

        this.meta.updateTag({
            name: 'theme-color',
            content: color,
        });
    }

    public setPreconnectLinks(links?: PreconnectLink[]): void {
        this.removeDynamicPreconnect();

        if (!links?.length) {
            return;
        }

        for (const item of links) {
            const link = this.renderer.createElement('link') as HTMLLinkElement;
            link.rel = 'preconnect';
            link.href = item.href;
            link.setAttribute(this.preconnectAttr, 'true');

            if (item.crossorigin !== undefined) {
                link.setAttribute('crossorigin', item.crossorigin);
            }

            this.renderer.appendChild(this.document.head, link);
        }
    }

    private setOpenGraph(state: PageHeadState): void {
        const og = state.openGraph;

        if (!og) {
            return;
        }

        this.updatePropertyTag('og:title', og.title);
        this.updatePropertyTag('og:description', og.description);
        this.updatePropertyTag('og:type', og.type);
        this.updatePropertyTag('og:url', og.url);
        this.updatePropertyTag('og:image', og.image);
        this.updatePropertyTag('og:site_name', og.siteName);
        this.updatePropertyTag('og:locale', og.locale);
    }

    private setTwitter(state: PageHeadState): void {
        const twitter = state.twitter;

        if (!twitter) {
            return;
        }

        this.setMetaTag('twitter:card', twitter.card);
        this.setMetaTag('twitter:title', twitter.title);
        this.setMetaTag('twitter:description', twitter.description);
        this.setMetaTag('twitter:image', twitter.image);
    }

    private setMetaTag(name: string, content?: string): void {
        if (!content) {
            return;
        }

        this.meta.updateTag({name, content});
    }

    private updatePropertyTag(property: string, content?: string): void {
        if (!content) {
            return;
        }

        this.meta.updateTag({property, content});
    }

    private mergeWithDefaults(state: PageHeadState): PageHeadState {
        const appName = this.config.appName;
        const separator = this.config.titleSeparator ?? ' | ';

        const resolvedTitle = state.title
            ? `${state.title}${separator}${appName}`
            : this.config.defaultTitle ?? appName;

        const resolvedDescription = state.description ?? this.config.defaultDescription;
        const resolvedRobots = state.robots ?? this.config.defaultRobots;
        const resolvedThemeColor = state.themeColor ?? this.config.defaultThemeColor;

        const resolvedOgImage = state.openGraph?.image ?? this.config.defaultOgImage;
        const resolvedTwitterCard = state.twitter?.card ?? this.config.defaultTwitterCard;
        const resolvedPreconnect = state.preconnect?.length
            ? state.preconnect
            : this.config.defaultPreconnect;

        return {
            ...state,
            title: resolvedTitle,
            description: resolvedDescription,
            robots: resolvedRobots,
            themeColor: resolvedThemeColor,
            preconnect: resolvedPreconnect,
            openGraph: {
                ...state.openGraph,
                title: state.openGraph?.title ?? resolvedTitle,
                description: state.openGraph?.description ?? resolvedDescription,
                image: resolvedOgImage,
            },
            twitter: {
                ...state.twitter,
                card: resolvedTwitterCard,
                title: state.twitter?.title ?? resolvedTitle,
                description: state.twitter?.description ?? resolvedDescription,
                image: state.twitter?.image ?? resolvedOgImage,
            },
        };
    }

    private removeCanonical(): void {
        const existing = this.document.getElementById(this.canonicalId);
        if (existing) {
            this.renderer.removeChild(this.document.head, existing);
        }
    }

    private removeJsonLd(): void {
        const existing = this.document.getElementById(this.jsonLdId);
        if (existing) {
            this.renderer.removeChild(this.document.head, existing);
        }
    }

    private removeDynamicHreflang(): void {
        const nodes = this.document.head.querySelectorAll(`link[${this.hreflangAttr}="true"]`);

        nodes.forEach((node) => {
            this.renderer.removeChild(this.document.head, node);
        });
    }

    private removeDynamicPreconnect(): void {
        const nodes = this.document.head.querySelectorAll(`link[${this.preconnectAttr}="true"]`);

        nodes.forEach((node) => {
            this.renderer.removeChild(this.document.head, node);
        });
    }
}
```

## `page-head.route-sync.service.ts`

```ts
import {Injectable, inject} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {PageHeadService} from './page-head.service';
import {PageHeadState} from './page-head.types';

@Injectable({providedIn: 'root'})
export class PageHeadRouteSyncService {
    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly pageHead = inject(PageHeadService);

    public init(): void {
        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe(() => {
                const route = this.getLeafRoute(this.activatedRoute);
                const pageHead = route.snapshot.data['pageHead'] as PageHeadState | undefined;

                this.pageHead.clearDynamic();

                if (pageHead) {
                    this.pageHead.apply(pageHead);
                }
            });
    }

    private getLeafRoute(route: ActivatedRoute): ActivatedRoute {
        let current = route;

        while (current.firstChild) {
            current = current.firstChild;
        }

        return current;
    }
}
```

---

# 2) WebAppMetadataService

This handles mostly app-level, mostly static document metadata:

* `manifest.webmanifest`
* app name / application-name
* favicon
* SVG favicon
* Apple touch icon
* mask icon
* pinned tab
* static global `theme-color`
* default OG image source for head defaults
* static preconnect if you want them globally

The manifest is a JSON file linked from the page, and its common job is install metadata like app name and icons. ([MDN Web Docs][1])

## `web-app-metadata.types.ts`

```ts
export interface AppIconLink {
    rel: string;
    href: string;
    sizes?: string;
    type?: string;
    color?: string;
}

export interface WebAppMetadataConfig {
    manifestUrl: string;
    applicationName: string;
    shortName?: string;
    themeColor?: string;
    icons?: AppIconLink[];
    staticPreconnect?: {href: string; crossorigin?: '' | 'anonymous' | 'use-credentials'}[];
    defaultOgImage?: string;
}
```

## `web-app-metadata.config.ts`

```ts
import {InjectionToken} from '@angular/core';
import {WebAppMetadataConfig} from './web-app-metadata.types';

export const WEB_APP_METADATA_CONFIG = new InjectionToken<WebAppMetadataConfig>(
    'WEB_APP_METADATA_CONFIG',
);
```

## `web-app-metadata.service.ts`

```ts
import {DOCUMENT} from '@angular/common';
import {Injectable, Renderer2, RendererFactory2, inject} from '@angular/core';
import {Meta} from '@angular/platform-browser';
import {WEB_APP_METADATA_CONFIG} from './web-app-metadata.config';

@Injectable({providedIn: 'root'})
export class WebAppMetadataService {
    private readonly document = inject(DOCUMENT);
    private readonly meta = inject(Meta);
    private readonly config = inject(WEB_APP_METADATA_CONFIG);

    private readonly renderer: Renderer2;

    public constructor(rendererFactory: RendererFactory2) {
        this.renderer = rendererFactory.createRenderer(null, null);
    }

    public init(): void {
        this.ensureManifest();
        this.ensureApplicationName();
        this.ensureThemeColor();
        this.ensureIcons();
        this.ensurePreconnect();
    }

    private ensureManifest(): void {
        this.ensureLink({
            rel: 'manifest',
            href: this.config.manifestUrl,
            id: 'app-manifest-link',
        });
    }

    private ensureApplicationName(): void {
        this.meta.updateTag({
            name: 'application-name',
            content: this.config.applicationName,
        });

        if (this.config.shortName) {
            this.meta.updateTag({
                name: 'apple-mobile-web-app-title',
                content: this.config.shortName,
            });
        }
    }

    private ensureThemeColor(): void {
        if (!this.config.themeColor) {
            return;
        }

        this.meta.updateTag({
            name: 'theme-color',
            content: this.config.themeColor,
        });
    }

    private ensureIcons(): void {
        for (const icon of this.config.icons ?? []) {
            this.ensureLink({
                rel: icon.rel,
                href: icon.href,
                sizes: icon.sizes,
                type: icon.type,
                color: icon.color,
            });
        }
    }

    private ensurePreconnect(): void {
        for (const item of this.config.staticPreconnect ?? []) {
            this.ensureLink({
                rel: 'preconnect',
                href: item.href,
                crossorigin: item.crossorigin,
            });
        }
    }

    private ensureLink(input: {
        rel: string;
        href: string;
        id?: string;
        sizes?: string;
        type?: string;
        color?: string;
        crossorigin?: '' | 'anonymous' | 'use-credentials';
    }): void {
        const selector = input.id
            ? `link#${input.id}`
            : `link[rel="${input.rel}"][href="${input.href}"]`;

        let link = this.document.head.querySelector(selector) as HTMLLinkElement | null;

        if (!link) {
            link = this.renderer.createElement('link') as HTMLLinkElement;
            if (input.id) {
                link.id = input.id;
            }
            this.renderer.appendChild(this.document.head, link);
        }

        link.rel = input.rel;
        link.href = input.href;

        if (input.sizes) {
            link.setAttribute('sizes', input.sizes);
        }

        if (input.type) {
            link.setAttribute('type', input.type);
        }

        if (input.color) {
            link.setAttribute('color', input.color);
        }

        if (input.crossorigin !== undefined) {
            link.setAttribute('crossorigin', input.crossorigin);
        }
    }
}
```

## Example `manifest.webmanifest`

```json
{
  "name": "BFW Web",
  "short_name": "BFW",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "icons": [
    {
      "src": "/assets/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

# 3) AnalyticsTrackingHooksService

This handles:

* page view tracking
* event tracking
* consent-aware tracking
* structured page names
* campaign attribution
* multiple adapters: GA4, GTM, Meta Pixel, LinkedIn, custom

## `analytics.types.ts`

```ts
export interface AnalyticsPageView {
    path: string;
    title?: string;
    pageType?: string;
    locale?: string;
    campaign?: string | null;
}

export interface AnalyticsEventPayload {
    name: string;
    category?: string;
    label?: string;
    value?: number;
    params?: Record<string, unknown>;
}

export interface AnalyticsAdapter {
    readonly name: string;
    init?(): void;
    trackPageView(payload: AnalyticsPageView): void;
    trackEvent(payload: AnalyticsEventPayload): void;
}
```

## `analytics.tokens.ts`

```ts
import {InjectionToken} from '@angular/core';
import {AnalyticsAdapter} from './analytics.types';

export const ANALYTICS_ADAPTERS = new InjectionToken<AnalyticsAdapter[]>(
    'ANALYTICS_ADAPTERS',
);
```

## `analytics-tracking-hooks.service.ts`

```ts
import {Injectable, inject} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {ANALYTICS_ADAPTERS} from './analytics.tokens';
import {AnalyticsEventPayload, AnalyticsPageView} from './analytics.types';
import {WebContentPrivacyService} from '../privacy/web-content-privacy.service';
import {WebPageLocalizationService} from '../localization/web-page-localization.service';

@Injectable({providedIn: 'root'})
export class AnalyticsTrackingHooksService {
    private readonly router = inject(Router);
    private readonly adapters = inject(ANALYTICS_ADAPTERS, {optional: true}) ?? [];
    private readonly privacy = inject(WebContentPrivacyService);
    private readonly localization = inject(WebPageLocalizationService);

    public init(): void {
        for (const adapter of this.adapters) {
            adapter.init?.();
        }

        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe(() => {
                if (!this.privacy.canTrackAnalytics()) {
                    return;
                }

                const pageView: AnalyticsPageView = {
                    path: this.router.url,
                    title: document.title,
                    locale: this.localization.currentLocale(),
                    campaign: this.getCampaignSource(),
                };

                this.trackPageView(pageView);
            });
    }

    public trackPageView(payload: AnalyticsPageView): void {
        if (!this.privacy.canTrackAnalytics()) {
            return;
        }

        for (const adapter of this.adapters) {
            adapter.trackPageView(payload);
        }
    }

    public trackEvent(payload: AnalyticsEventPayload): void {
        if (!this.privacy.canTrackAnalytics()) {
            return;
        }

        for (const adapter of this.adapters) {
            adapter.trackEvent(payload);
        }
    }

    private getCampaignSource(): string | null {
        const url = new URL(window.location.href);
        return url.searchParams.get('utm_source');
    }
}
```

## Example adapter: GA4

```ts
import {Injectable} from '@angular/core';
import {AnalyticsAdapter, AnalyticsEventPayload, AnalyticsPageView} from '../analytics.types';

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

@Injectable()
export class Ga4Adapter implements AnalyticsAdapter {
    public readonly name = 'ga4';

    public trackPageView(payload: AnalyticsPageView): void {
        window.gtag?.('event', 'page_view', {
            page_location: window.location.href,
            page_path: payload.path,
            page_title: payload.title,
            locale: payload.locale,
            campaign: payload.campaign,
        });
    }

    public trackEvent(payload: AnalyticsEventPayload): void {
        window.gtag?.('event', payload.name, {
            event_category: payload.category,
            event_label: payload.label,
            value: payload.value,
            ...payload.params,
        });
    }
}
```

## Example adapter: custom console

```ts
import {Injectable} from '@angular/core';
import {AnalyticsAdapter, AnalyticsEventPayload, AnalyticsPageView} from '../analytics.types';

@Injectable()
export class CustomConsoleAnalyticsAdapter implements AnalyticsAdapter {
    public readonly name = 'custom-console';

    public trackPageView(payload: AnalyticsPageView): void {
        console.log('[analytics:page_view]', payload);
    }

    public trackEvent(payload: AnalyticsEventPayload): void {
        console.log('[analytics:event]', payload);
    }
}
```

---

# 4) WebContentPrivacyService

This handles:

* consent state
* cookie categories
* legal links
* region-aware behavior
* consent-based analytics

## `web-content-privacy.types.ts`

```ts
export type ConsentRegion = 'eu' | 'uk' | 'us' | 'in' | 'unknown';

export interface PrivacyLinks {
    privacyPolicyUrl: string;
    termsUrl: string;
    cookiePolicyUrl?: string;
}

export interface ConsentState {
    necessary: true;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
    updatedAt: string | null;
}

export interface PrivacyConfig {
    links: PrivacyLinks;
    requireConsentRegions: ConsentRegion[];
    defaultRegion: ConsentRegion;
    storageKey?: string;
}
```

## `web-content-privacy.service.ts`

```ts
import {Injectable, signal} from '@angular/core';
import {ConsentRegion, ConsentState, PrivacyConfig} from './web-content-privacy.types';

@Injectable({providedIn: 'root'})
export class WebContentPrivacyService {
    private readonly config: PrivacyConfig = {
        links: {
            privacyPolicyUrl: '/privacy',
            termsUrl: '/terms',
            cookiePolicyUrl: '/cookies',
        },
        requireConsentRegions: ['eu', 'uk'],
        defaultRegion: 'unknown',
        storageKey: 'web-consent-state',
    };

    private readonly consentStateSignal = signal<ConsentState>(this.loadInitialState());
    private readonly regionSignal = signal<ConsentRegion>(this.config.defaultRegion);

    public consentState = this.consentStateSignal.asReadonly();
    public region = this.regionSignal.asReadonly();

    public setRegion(region: ConsentRegion): void {
        this.regionSignal.set(region);
    }

    public acceptAll(): void {
        this.saveState({
            necessary: true,
            analytics: true,
            marketing: true,
            preferences: true,
            updatedAt: new Date().toISOString(),
        });
    }

    public rejectOptional(): void {
        this.saveState({
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false,
            updatedAt: new Date().toISOString(),
        });
    }

    public setGranular(input: Omit<ConsentState, 'necessary' | 'updatedAt'>): void {
        this.saveState({
            necessary: true,
            analytics: input.analytics,
            marketing: input.marketing,
            preferences: input.preferences,
            updatedAt: new Date().toISOString(),
        });
    }

    public canTrackAnalytics(): boolean {
        if (!this.requiresConsent()) {
            return true;
        }

        return this.consentStateSignal().analytics;
    }

    public shouldShowConsentBanner(): boolean {
        if (!this.requiresConsent()) {
            return false;
        }

        return this.consentStateSignal().updatedAt === null;
    }

    public privacyPolicyUrl(): string {
        return this.config.links.privacyPolicyUrl;
    }

    public termsUrl(): string {
        return this.config.links.termsUrl;
    }

    public cookiePolicyUrl(): string | undefined {
        return this.config.links.cookiePolicyUrl;
    }

    private requiresConsent(): boolean {
        return this.config.requireConsentRegions.includes(this.regionSignal());
    }

    private saveState(state: ConsentState): void {
        this.consentStateSignal.set(state);
        localStorage.setItem(this.config.storageKey ?? 'web-consent-state', JSON.stringify(state));
    }

    private loadInitialState(): ConsentState {
        const raw = localStorage.getItem(this.config.storageKey ?? 'web-consent-state');

        if (!raw) {
            return {
                necessary: true,
                analytics: false,
                marketing: false,
                preferences: false,
                updatedAt: null,
            };
        }

        try {
            return JSON.parse(raw) as ConsentState;
        } catch {
            return {
                necessary: true,
                analytics: false,
                marketing: false,
                preferences: false,
                updatedAt: null,
            };
        }
    }
}
```

---

# 5) WebPageLocalizationService

This handles:

* `<html lang>`
* `dir="ltr|rtl"`
* locale-aware formatting
* localized URL builders
* hreflang generation
* current locale state

Google notes that `hreflang` is for telling Google about localized variations, while language detection itself is not based on `hreflang` or the HTML `lang` attribute alone. Each page version should point to the others, including itself, and `x-default` is recommended for a generic fallback page. ([Google for Developers][2])

## `web-page-localization.types.ts`

```ts
export type Direction = 'ltr' | 'rtl';

export interface LocaleDefinition {
    code: string;
    htmlLang: string;
    direction: Direction;
    basePath: string;
    label: string;
}

export interface LocalizedPathMap {
    [localeCode: string]: string;
}
```

## `web-page-localization.service.ts`

```ts
import {DOCUMENT} from '@angular/common';
import {Injectable, inject, signal} from '@angular/core';
import {HreflangLink} from '../head/page-head.types';
import {LocaleDefinition, LocalizedPathMap} from './web-page-localization.types';

@Injectable({providedIn: 'root'})
export class WebPageLocalizationService {
    private readonly document = inject(DOCUMENT);

    private readonly locales: LocaleDefinition[] = [
        {code: 'en', htmlLang: 'en', direction: 'ltr', basePath: '/en', label: 'English'},
        {code: 'en-in', htmlLang: 'en-IN', direction: 'ltr', basePath: '/in', label: 'English (India)'},
        {code: 'ar', htmlLang: 'ar', direction: 'rtl', basePath: '/ar', label: 'Arabic'},
    ];

    private readonly currentLocaleSignal = signal<string>('en');

    public currentLocale = this.currentLocaleSignal.asReadonly();

    public setLocale(localeCode: string): void {
        const locale = this.locales.find((item) => item.code === localeCode) ?? this.locales[0];

        this.currentLocaleSignal.set(locale.code);
        this.document.documentElement.lang = locale.htmlLang;
        this.document.documentElement.dir = locale.direction;
    }

    public currentLocaleCode(): string {
        return this.currentLocaleSignal();
    }

    public currentLocale(): string {
        return this.currentLocaleSignal();
    }

    public formatDate(input: Date | string, options?: Intl.DateTimeFormatOptions): string {
        const value = typeof input === 'string' ? new Date(input) : input;
        return new Intl.DateTimeFormat(this.resolveIntlLocale(), options).format(value);
    }

    public formatNumber(input: number, options?: Intl.NumberFormatOptions): string {
        return new Intl.NumberFormat(this.resolveIntlLocale(), options).format(input);
    }

    public formatCurrency(input: number, currency: string): string {
        return new Intl.NumberFormat(this.resolveIntlLocale(), {
            style: 'currency',
            currency,
        }).format(input);
    }

    public localizedUrl(path: string, localeCode?: string): string {
        const locale = this.locales.find((item) => item.code === (localeCode ?? this.currentLocaleSignal()))
            ?? this.locales[0];

        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `${locale.basePath}${normalizedPath}`;
    }

    public buildHreflangLinks(
        origin: string,
        localizedPaths: LocalizedPathMap,
        xDefaultPath?: string,
    ): HreflangLink[] {
        const links: HreflangLink[] = Object.entries(localizedPaths).map(([hreflang, path]) => ({
            hreflang,
            href: `${origin}${path}`,
        }));

        if (xDefaultPath) {
            links.push({
                hreflang: 'x-default',
                href: `${origin}${xDefaultPath}`,
            });
        }

        return links;
    }

    private resolveIntlLocale(): string {
        const current = this.locales.find((item) => item.code === this.currentLocaleSignal());
        return current?.htmlLang ?? 'en';
    }
}
```

---

# 6) One bootstrap service to initialize all of it

## `web-bootstrap.service.ts`

```ts
import {Injectable, inject} from '@angular/core';
import {AnalyticsTrackingHooksService} from './analytics/analytics-tracking-hooks.service';
import {PageHeadRouteSyncService} from './head/page-head.route-sync.service';
import {WebAppMetadataService} from './metadata/web-app-metadata.service';
import {WebPageLocalizationService} from './localization/web-page-localization.service';

@Injectable({providedIn: 'root'})
export class WebBootstrapService {
    private readonly metadata = inject(WebAppMetadataService);
    private readonly pageHeadSync = inject(PageHeadRouteSyncService);
    private readonly analytics = inject(AnalyticsTrackingHooksService);
    private readonly localization = inject(WebPageLocalizationService);

    public init(): void {
        this.metadata.init();
        this.localization.setLocale('en');
        this.pageHeadSync.init();
        this.analytics.init();
    }
}
```

## `app.component.ts`

```ts
import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {WebBootstrapService} from './core/web/web-bootstrap.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    template: `<router-outlet />`,
})
export class AppComponent {
    private readonly webBootstrap = inject(WebBootstrapService);

    public constructor() {
        this.webBootstrap.init();
    }
}
```

---

# 7) app.config.ts providers

## `app.config.ts`

```ts
import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';

import {PAGE_HEAD_GLOBAL_CONFIG} from './core/web/head/page-head.config';
import {WEB_APP_METADATA_CONFIG} from './core/web/metadata/web-app-metadata.config';
import {ANALYTICS_ADAPTERS} from './core/web/analytics/analytics.tokens';
import {Ga4Adapter} from './core/web/analytics/adapters/ga4.adapter';
import {CustomConsoleAnalyticsAdapter} from './core/web/analytics/adapters/custom-console.adapter';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),

        {
            provide: PAGE_HEAD_GLOBAL_CONFIG,
            useValue: {
                appName: 'BFW Web',
                defaultTitle: 'BFW Web',
                titleSeparator: ' | ',
                defaultDescription: 'Default app description',
                defaultRobots: 'index,follow',
                defaultThemeColor: '#0f172a',
                defaultOgImage: 'https://example.com/assets/og/default.jpg',
                defaultTwitterCard: 'summary_large_image',
                defaultPreconnect: [
                    {href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'},
                    {href: 'https://www.googletagmanager.com'},
                ],
            },
        },

        {
            provide: WEB_APP_METADATA_CONFIG,
            useValue: {
                manifestUrl: '/manifest.webmanifest',
                applicationName: 'BFW Web',
                shortName: 'BFW',
                themeColor: '#0f172a',
                icons: [
                    {rel: 'icon', href: '/favicon.ico'},
                    {rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml'},
                    {rel: 'apple-touch-icon', href: '/assets/icons/apple-touch-icon.png', sizes: '180x180'},
                    {rel: 'mask-icon', href: '/assets/icons/safari-pinned-tab.svg', color: '#0f172a'},
                ],
                staticPreconnect: [
                    {href: 'https://fonts.gstatic.com', crossorigin: 'anonymous'},
                    {href: 'https://www.googletagmanager.com'},
                ],
                defaultOgImage: 'https://example.com/assets/og/default.jpg',
            },
        },

        Ga4Adapter,
        CustomConsoleAnalyticsAdapter,
        {
            provide: ANALYTICS_ADAPTERS,
            multi: true,
            useExisting: Ga4Adapter,
        },
        {
            provide: ANALYTICS_ADAPTERS,
            multi: true,
            useExisting: CustomConsoleAnalyticsAdapter,
        },
    ],
};
```

---

# 8) Route usage example

## `app.routes.ts`

```ts
import {Routes} from '@angular/router';
import {PageHeadState} from './core/web/head/page-head.types';

const homePageHead: PageHeadState = {
    title: 'Home',
    description: 'Modern enterprise software and automation platform.',
    robots: 'index,follow',
    canonicalUrl: 'https://example.com/',
    hreflang: [
        {hreflang: 'en', href: 'https://example.com/en/'},
        {hreflang: 'en-in', href: 'https://example.com/in/'},
        {hreflang: 'x-default', href: 'https://example.com/'},
    ],
    openGraph: {
        type: 'website',
        url: 'https://example.com/',
    },
    twitter: {},
    jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'BFW Web',
        url: 'https://example.com/',
    },
};

const signinPageHead: PageHeadState = {
    title: 'Sign In',
    description: 'Secure sign in to your account.',
    robots: 'noindex,nofollow',
    canonicalUrl: 'https://example.com/signin',
    openGraph: {
        type: 'website',
        url: 'https://example.com/signin',
    },
    twitter: {},
};

export const routes: Routes = [
    {
        path: '',
        data: {
            pageHead: homePageHead,
        },
        loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
    },
    {
        path: 'signin',
        data: {
            pageHead: signinPageHead,
        },
        loadComponent: () => import('./signin/signin.component').then((m) => m.SigninComponent),
    },
];
```

---

# 9) A few rules so this does not become nonsense

**What belongs in `PageHeadService`:**

* things that change per route or page
* canonical, robots, hreflang, JSON-LD, OG/Twitter, title, description

**What belongs in `WebAppMetadataService`:**

* app-level document links and defaults
* manifest, favicons, apple-touch-icon, mask-icon, static preconnect, application-name, theme-color default

**What belongs in `AnalyticsTrackingHooksService`:**

* page views, events, campaign parsing, adapter fan-out, consent gate

**What belongs in `WebContentPrivacyService`:**

* consent state, region-aware blocking, privacy/terms links

**What belongs in `WebPageLocalizationService`:**

* html `lang`, `dir`, locale formatting, localized URLs, hreflang builders

That split keeps you from building a single mega-service that knows about crawlers, cookies, Arabic text direction, Safari pinned tabs, and marketing pixels all at once. Even software deserves better than that.

---

# 10) Standards notes worth keeping in mind

* `manifest.webmanifest` is mainly install/app metadata, not route SEO. ([MDN Web Docs][1])
* `theme-color` is a document-level hint for browser UI. ([MDN Web Docs][3])
* `preconnect` is a performance hint for likely-needed origins, so it belongs at app shell level unless a specific page truly needs something extra. ([MDN Web Docs][4])
* Google recommends page-specific robots directives in the `<head>`, and combining values in one robots meta tag avoids conflicts. ([Google for Developers][5])
* Canonical is for choosing the preferred URL among duplicate or near-duplicate versions, while `hreflang` is for localized alternatives. They are not the same tool wearing different hats. ([Google for Developers][6])
* JSON-LD is a standard way to expose structured data to search engines and is commonly placed in a `<script type="application/ld+json">` block. ([Google for Developers][7])

---

# 11) One practical improvement you should add later

For production, move hardcoded values into config files:

* `environment.web.ts`
* domain/origin config
* locale map
* analytics IDs
* legal URLs
* icon URLs
* OG default image URL

That way your app does not become a shrine to string literals.

If you want, next I’ll turn this into **exact files with your preferred naming style and route helpers** for `buildCanonical`, `buildHreflang`, and `buildJsonLdWebPage`.

[1]: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest?utm_source=chatgpt.com "Web application manifest - Progressive web apps - MDN"
[2]: https://developers.google.com/search/docs/specialty/international/localized-versions?utm_source=chatgpt.com "Localized Versions of your Pages | Google Search Central"
[3]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color?utm_source=chatgpt.com "<meta name=\"theme-color\"> - HTML | MDN"
[4]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preconnect?utm_source=chatgpt.com "rel=\"preconnect\" - HTML - MDN - Mozilla"
[5]: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?utm_source=chatgpt.com "Robots Meta Tags Specifications | Google Search Central"
[6]: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?utm_source=chatgpt.com "How to specify a canonical URL with rel=\"canonical\" and ..."
[7]: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?utm_source=chatgpt.com "Intro to How Structured Data Markup Works"
