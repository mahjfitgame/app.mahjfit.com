export interface PreconnectLink {
    href: string;
    crossorigin?: '' | 'anonymous' | 'use-credentials';
}

export interface AppIconLink {
    rel: string;
    href: string;
    sizes?: string;
    type?: string;
    color?: string;
}

export interface WebAppMetadataType {
    applicationName?: string;
    shortName?: string;
    manifestUrl?: string;
    themeColor?: string;
    icons?: AppIconLink[];
    preconnect?: PreconnectLink[];
    defaultOgImage?: string;
}