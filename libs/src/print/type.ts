// file: libs/src/print/type.ts
export type PrintOptionsType = {
    /** Print job / document title. The OS dialog shows it and uses it as the save-as name. */
    title?: string;
    /** Copy the live document's <base>/<link>/<style> into the print document. Default true. */
    useAppStyles?: boolean;
    /** Extra CSS, appended after app styles so it wins. */
    css?: string;
    /** Extra class(es) on the print <body>. */
    bodyClass?: string;
    /** Attributes forced on the print <body> — e.g. pin the light theme for paper. */
    bodyAttributes?: Record<string, string>;
    /** Copy live input/select/textarea values into the clone. Default true. */
    syncFormValues?: boolean;
    /** Replace <canvas> with a snapshot <img>. Default false — charts need it, plain records don't. */
    canvasToImage?: boolean;
    /** Extra ms to wait before printing, for late images/fonts. Default 0. */
    delay?: number;
};

/** Every PrintService method resolves with this — callers never need try/catch. */
export type PrintResultType = {
    ok: boolean;
    /**
     * A print job was already running, so this call did nothing. Not a failure:
     * it is a second click while the dialog is open, and showing an error for it
     * only annoys the user. Nothing is logged for it either.
     */
    busy?: boolean;
    error?: string;
};
