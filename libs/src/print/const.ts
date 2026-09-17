// file: libs/src/print/const.ts
export const PRINT_STATE_STORE_KEY = 'print' as const;

/** id of the offscreen iframe the web path builds its print document in. */
export const PRINT_IFRAME_ID = 'bfw-print-frame' as const;

/**
 * id of the detached copy the native path mounts on <body>. Native printing
 * renders the LIVE document, so the content has to be isolated there —
 * see `src/theme/active/_print.scss`.
 */
export const PRINT_ROOT_ID = 'bfw-print-root' as const;

/** Cap on waiting for the print document's stylesheets — one dead <link> must not hang the button. */
export const PRINT_STYLE_WAIT_MS = 1000;

/**
 * Cap on waiting for `afterprint`, which every target browser fires — this is a
 * last resort for one that does not. Kept short deliberately: until it expires
 * the job counts as running and the print button does nothing, and a user
 * staring at a dead button is a worse failure than a print job cut short.
 */
export const PRINT_CLEANUP_MS = 15000;

/**
 * Always applied last, after the app's own CSS. The print body inherits the
 * app shell's classes/attributes (that is what makes theme tokens resolve),
 * and that shell is a fixed-height, scroll-clipped layout — a printed
 * document has to flow across pages instead.
 */
export const PRINT_BASE_CSS = `
html, body {
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
    margin: 0 !important;
    background: #fff !important;
}
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
@page { margin: 10mm; }
`;
