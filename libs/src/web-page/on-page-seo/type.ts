import { RI_FOLLOW_ONLY_PAGE, RI_INDEX_ONLY_PAGE, RI_PRIVATE_PAGE, RI_PUBLIC_PAGE } from './const';

export type ROBOTS_INSTRUCTION = typeof RI_PUBLIC_PAGE | typeof RI_PRIVATE_PAGE | typeof RI_FOLLOW_ONLY_PAGE | typeof RI_INDEX_ONLY_PAGE;
export interface JsonLdObject {
    [key: string]: unknown;
}

export interface HreflangLink {
    hreflang: string;
    href: string;
}

export interface OpenGraphSeo {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    image?: string;
}

export interface TwitterSeo {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
}

export interface OnPageSeoType {
    title?: string;
    description?: string;
    keywords?: string;
    robots?: ROBOTS_INSTRUCTION;

    canonicalUrl?: string;

    hreflang?: HreflangLink[];

    openGraph?: OpenGraphSeo;
    twitter?: TwitterSeo;

    jsonLd?: JsonLdObject | JsonLdObject[];
}