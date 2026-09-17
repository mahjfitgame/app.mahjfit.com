// file: libs/src/print/service.ts
import { CSP_NONCE, inject, Service } from '@angular/core';
import { Printer } from '@capgo/capacitor-printer';
import { LogService } from '@libs/log/service';
import { PlatformService } from '@libs/platform/service';
import {
    PRINT_BASE_CSS,
    PRINT_CLEANUP_MS,
    PRINT_IFRAME_ID,
    PRINT_ROOT_ID,
    PRINT_STYLE_WAIT_MS,
} from './const';
import { PrintSourceEnum } from './enum';
import { PrintState } from './state';
import type { PrintOptionsType, PrintResultType } from './type';

/**
 * App-wide print engine. Inject it anywhere and call one of the methods under
 * PUBLIC API — nothing else in the app should talk to window.print() or to the
 * Capacitor printer plugin directly.
 *
 * Two paths, picked by platform:
 * - web: a print document is built in an offscreen iframe (this is what the
 *   removed `ngx-print` dependency used to do, minus its bugs — see the notes
 *   on buildPrintDocument()).
 * - native: a bare Capacitor WebView silently swallows window.print(), so the
 *   OS prints the LIVE document instead — see printLive().
 *
 * Every method resolves with PrintResultType instead of throwing, so a caller
 * never needs try/catch; failures are logged here and the message is handed
 * back for the caller to show however it likes.
 */
@Service()
export class PrintService {

    // ████████████████████████████████████████████████████████████████████
    // ███ DEPENDENCIES ███████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private readonly log = inject(LogService);
    private readonly platform = inject(PlatformService);

    /**
     * Only set when the app runs under a nonce-based Content-Security-Policy
     * (Angular's CSP_NONCE / the ngCspNonce attribute). Null otherwise, which
     * makes every nonce line below a no-op — see applyNonce().
     */
    private readonly nonce = inject(CSP_NONCE, { optional: true });

    public readonly state = inject(PrintState);

    private defaults: PrintOptionsType = {
        useAppStyles: true,
        syncFormValues: true,
        canvasToImage: false,
        delay: 0,
    };

    /** Called once at bootstrap so every caller inherits the same paper defaults. */
    public setDefaults(options: PrintOptionsType): void {
        this.defaults = { ...this.defaults, ...options };
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ PUBLIC API █████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████

    /**
     * Print one element of the live page.
     *
     * `target` is the element itself, its id, or any CSS selector. Prefer the
     * element (or a selector unique to it) whenever a page can show more than
     * one printable area — an id is only as reliable as its uniqueness.
     */
    public async element(target: string | HTMLElement, options?: PrintOptionsType): Promise<PrintResultType> {
        const source = this.resolveTarget(target);

        if (!source) {
            return this.fail(PrintSourceEnum.ELEMENT, `Print target "${String(target)}" not found.`);
        }

        const opt = { ...this.defaults, ...options };
        const clone = this.cloneForPrint(source, opt);

        return this.platform.isNative
            ? this.printLive(clone, opt)
            : this.printInIframe(clone, opt);
    }

    /** Print a ready-made HTML string (report template, receipt, …). */
    public async html(html: string, options?: PrintOptionsType): Promise<PrintResultType> {
        const opt = { ...this.defaults, ...options };

        return this.platform.isNative
            ? this.wrap(PrintSourceEnum.HTML, () => Printer.printHtml({ name: this.jobName(opt), html }))
            : this.printInIframe(html, opt);
    }

    /** Print the whole current screen — @media print rules in the app CSS decide what shows. */
    public async page(options?: PrintOptionsType): Promise<PrintResultType> {
        return this.wrap(PrintSourceEnum.PAGE, () => Printer.printWebView({ name: this.jobName(options) }));
    }

    // ███ EXISTING DOCUMENTS ████████████████████████████████████████████
    //
    // The three below print a document that ALREADY EXISTS — they never create
    // one. Nothing here generates a PDF: to print one, something else (normally
    // the API) has to produce it first. To turn the SCREEN into a PDF, print the
    // DOM with element()/html() and let the print dialog "Save as PDF" instead.
    //
    // Only `title` is read from `options`; the rest describe how a DOM document
    // is built, and these documents are printed exactly as they already are.

    /**
     * Print an existing PDF.
     *
     * `path` is where the PDF is READ FROM — an input, never an output; nothing
     * is written to it. On web it is fetched as a URL (same-origin only: the
     * app's CSP allows `child-src 'self' blob:`). On native it must be a real
     * device path, which this app cannot currently produce — @capacitor/filesystem
     * is not installed, so prefer base64() on device.
     */
    public async pdf(path: string, options?: PrintOptionsType): Promise<PrintResultType> {
        return this.wrap(PrintSourceEnum.PDF, () => Printer.printPdf({ name: this.jobName(options), path }));
    }
    /**
     * Print an existing file — PDF, JPEG or PNG. Same `path` rules as pdf().
     * `mimeType` is required for Android `content://` URIs.
     */
    public async file(path: string, mimeType?: string, options?: PrintOptionsType): Promise<PrintResultType> {
        return this.wrap(PrintSourceEnum.FILE, () => Printer.printFile({ name: this.jobName(options), path, mimeType }));
    }
    /**
     * Print a document held in memory — the usual way to print something the API
     * generated, with no file involved. `data` is raw base64 with no
     * `data:...;base64,` prefix. Works the same on web and native, which the two
     * path-based methods above do not; keep it under ~5MB, since decoding a large
     * base64 string can exhaust memory on a device.
     */
    public async base64(data: string, mimeType: string, options?: PrintOptionsType): Promise<PrintResultType> {
        return this.wrap(PrintSourceEnum.BASE64, () => Printer.printBase64({ name: this.jobName(options), data, mimeType }));
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ WEB PATH ███████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private async printInIframe(content: HTMLElement | string, opt: PrintOptionsType): Promise<PrintResultType> {
        if (this.state.isPrinting()) {
            return { ok: false, busy: true };
        }
        this.state.setIsPrinting(true);

        // Offscreen, NOT display:none — a hidden iframe never lays out, and a
        // document with no layout prints blank in WebKit.
        const frame = document.createElement('iframe');
        frame.id = PRINT_IFRAME_ID;
        frame.ariaHidden = 'true';
        frame.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;border:0;';
        document.body.appendChild(frame);

        try {
            const doc = frame.contentDocument;
            const win = frame.contentWindow;

            if (!doc || !win) {
                return this.fail(PrintSourceEnum.ELEMENT, 'Could not open the print document.');
            }

            this.buildPrintDocument(doc, content, opt);
            await this.whenReadyToPrint(doc, opt);

            doc.title = this.jobName(opt);

            // Keep the iframe alive until the dialog closes — removing it while the
            // browser is still rendering pages cancels the job in Firefox.
            await this.printAndWait(win);

            return { ok: true };
        } catch (error: unknown) {
            return this.fail(PrintSourceEnum.ELEMENT, error);
        } finally {
            frame.remove();
            this.state.setIsPrinting(false);
        }
    }
    private buildPrintDocument(doc: Document, content: HTMLElement | string, opt: PrintOptionsType): void {
        // 1. RTL-scoped styles (html[dir='rtl'], tailwind rtl:) only match if these are copied.
        doc.documentElement.lang = document.documentElement.lang;
        doc.documentElement.dir = document.documentElement.dir;

        // 2. Styles. Nodes are IMPORTED, not serialised through innerHTML: <style> text is
        //    already in memory, and an imported <link> keeps its href so the browser
        //    serves it straight from cache. One append, not one head re-parse per tag.
        if (opt.useAppStyles) {
            const nodes = document.head.querySelectorAll('base, link[rel="stylesheet"], style');
            doc.head.append(...Array.from(nodes, (node) => this.applyNonce(doc.importNode(node, true))));
        }

        // 3. Our own sheet reset, then the caller's CSS — both after the app's, so both win.
        doc.head.append(
            this.styleTag(doc, PRINT_BASE_CSS),
            ...(opt.css ? [this.styleTag(doc, opt.css)] : []),
        );

        // 4. Body class + attributes carry the theme (body[data-bfw-theme-mode] in _color.scss).
        //    Without them every CSS custom property in the sheet resolves to nothing.
        for (const attr of Array.from(document.body.attributes)) {
            doc.body.setAttribute(attr.name, attr.value);
        }
        for (const [name, value] of Object.entries(opt.bodyAttributes ?? {})) {
            doc.body.setAttribute(name, value);
        }
        if (opt.bodyClass) {
            doc.body.classList.add(...opt.bodyClass.split(' '));
        }

        if (typeof content === 'string') {
            doc.body.innerHTML = content;
        } else {
            doc.body.appendChild(doc.importNode(content, true));
        }
    }
    /**
     * Waits for the copied stylesheets rather than for a fixed delay. A <link>
     * that is already cached and parsed exposes `.sheet` immediately, so a warm
     * cache waits for nothing at all.
     */
    private async whenReadyToPrint(doc: Document, opt: PrintOptionsType): Promise<void> {
        const pending = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
            .filter((link) => !link.sheet)
            .map((link) => new Promise<void>((resolve) => {
                link.addEventListener('load', () => resolve(), { once: true });
                link.addEventListener('error', () => resolve(), { once: true });
            }));

        if (pending.length) {
            // The cap keeps one unreachable stylesheet from hanging the print button forever.
            await Promise.race([Promise.all(pending), this.wait(PRINT_STYLE_WAIT_MS)]);
        }

        if (opt.delay) {
            await this.wait(opt.delay);
        }
    }
    /**
     * Prints, and resolves once the browser is done with the document.
     *
     * The listener has to be attached BEFORE print(): in Chrome and Safari
     * print() blocks until the dialog is dismissed and `afterprint` fires
     * during that call, so a listener attached after it returns misses the
     * event completely and the job stays "running" until the fallback fires.
     * Firefox prints asynchronously instead, which is why this waits at all.
     */
    private printAndWait(win: Window): Promise<void> {
        const closed = this.whenPrintDialogClosed(win);

        win.focus();
        win.print();

        return closed;
    }
    private whenPrintDialogClosed(win: Window): Promise<void> {
        return new Promise<void>((resolve) => {
            let timer: ReturnType<typeof setTimeout>;

            const finish = () => {
                clearTimeout(timer);
                win.removeEventListener('afterprint', finish);
                // Guard against the two listeners being the same object in
                // browsers where the frame shares the top window's event target.
                window.removeEventListener('afterprint', finish);
                resolve();
            };

            // Fallback only: a browser that never fires afterprint anywhere must
            // still release the job and let the iframe be cleaned up.
            timer = setTimeout(finish, PRINT_CLEANUP_MS);

            win.addEventListener('afterprint', finish);
            // Some browsers dispatch it on the top window rather than the frame.
            window.addEventListener('afterprint', finish);
        });
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ NATIVE PATH ████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * printWebView prints the LIVE document, so the content has to sit directly
     * on <body> for the isolation in `src/theme/active/_print.scss` to work: the
     * real element can be nested inside a drawer / dialog / bottom-sheet (cdk
     * overlay), and a transformed, fixed or scroll-clipped ancestor makes both
     * WebKit and the Android WebView clip the printed output to a single page.
     */
    private async printLive(clone: HTMLElement, opt: PrintOptionsType): Promise<PrintResultType> {
        if (this.state.isPrinting()) {
            return { ok: false, busy: true };
        }
        this.state.setIsPrinting(true);

        // Dropping the id keeps getElementById() pointing at the one live element.
        clone.removeAttribute('id');

        const root = document.createElement('div');
        root.id = PRINT_ROOT_ID;
        root.appendChild(clone);
        document.body.appendChild(root);

        try {
            // Resolves only once the print sheet is dismissed, printed or cancelled.
            // Both platforms render lazily from the live web view, so the clone has to
            // stay mounted until then — hence the await, with removal left to `finally`.
            await Printer.printWebView({ name: this.jobName(opt) });

            return { ok: true };
        } catch (error: unknown) {
            return this.fail(PrintSourceEnum.ELEMENT, error);
        } finally {
            root.remove();
            this.state.setIsPrinting(false);
        }
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ SHARED █████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    /**
     * An element is used as-is. A string is read as an id first (the common
     * case, and the fastest lookup there is), then as a CSS selector — which is
     * what lets a page with several print areas target one of them precisely,
     * e.g. '#invoice-2' or '[data-print="summary"]'.
     */
    private resolveTarget(target: string | HTMLElement): HTMLElement | null {
        if (typeof target !== 'string') {
            return target;
        }

        const byId = document.getElementById(target);
        if (byId) {
            return byId;
        }

        try {
            return document.querySelector<HTMLElement>(target);
        } catch {
            // Not an id and not a valid selector — treated as "not found" below.
            return null;
        }
    }
    /**
     * cloneNode() keeps every class and Angular's _ngcontent-* attributes, so
     * emulated-encapsulation component styles still match on the copy. What it
     * does NOT keep is live form values (it copies the `value` attribute, not
     * the property) and canvas pixels — hence the two fixes below.
     */
    private cloneForPrint(source: HTMLElement, opt: PrintOptionsType): HTMLElement {
        const clone = source.cloneNode(true) as HTMLElement;

        if (opt.syncFormValues) {
            const sourceFields = source.querySelectorAll('input, select, textarea');
            const cloneFields = clone.querySelectorAll('input, select, textarea');

            sourceFields.forEach((field, index) => {
                const copy = cloneFields[index];

                if (field instanceof HTMLInputElement && copy instanceof HTMLInputElement) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        copy.toggleAttribute('checked', field.checked);
                    } else if (field.type !== 'file') {
                        // A file input's value cannot be set programmatically, so it is skipped.
                        copy.setAttribute('value', field.value);
                    }
                } else if (field instanceof HTMLTextAreaElement && copy) {
                    copy.textContent = field.value;
                } else if (field instanceof HTMLSelectElement && copy instanceof HTMLSelectElement) {
                    Array.from(copy.options).forEach((option, optionIndex) => {
                        option.toggleAttribute('selected', optionIndex === field.selectedIndex);
                    });
                }
            });
        }

        if (opt.canvasToImage) {
            const sourceCanvases = source.querySelectorAll('canvas');
            const cloneCanvases = clone.querySelectorAll('canvas');

            sourceCanvases.forEach((canvas, index) => {
                try {
                    const image = document.createElement('img');
                    image.src = canvas.toDataURL(); // throws if the canvas is tainted
                    image.style.width = `${canvas.getBoundingClientRect().width}px`;
                    image.style.maxWidth = '100%';
                    cloneCanvases[index]?.replaceWith(image);
                } catch (error: unknown) {
                    // Keep the blank canvas rather than failing the whole print job.
                    this.log.warn('[PRINT CANVAS SNAPSHOT FAILED]', error);
                }
            });
        }

        return clone;
    }

    // ████████████████████████████████████████████████████████████████████
    // ███ HELPERS ████████████████████████████████████████████████████████
    // ████████████████████████████████████████████████████████████████████
    private async wrap(source: PrintSourceEnum, run: () => Promise<void>): Promise<PrintResultType> {
        this.state.setIsPrinting(true);

        try {
            await run();
            return { ok: true };
        } catch (error: unknown) {
            return this.fail(source, error);
        } finally {
            this.state.setIsPrinting(false);
        }
    }
    private fail(source: PrintSourceEnum, error: unknown): PrintResultType {
        // Surfaced rather than left as a silent rejection — a native plugin call
        // failing (e.g. the plugin is not registered in the installed build)
        // otherwise looks identical to the print button doing nothing at all.
        this.log.error(`[PRINT ${source.toUpperCase()} FAILED]`, error);

        return {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
    private jobName(opt?: PrintOptionsType): string {
        return opt?.title ?? document.title;
    }
    private styleTag(doc: Document, css: string): HTMLStyleElement {
        const style = doc.createElement('style');
        style.textContent = css;
        this.applyNonce(style);
        return style;
    }
    /**
     * Stamps the app's CSP nonce on a <style>/<link> going into the print document.
     *
     * Why a copy needs it even though the original was allowed: once a CSP with
     * a nonce is delivered by HTTP header, the browser EMPTIES the nonce content
     * attribute and keeps the value only on the element's `nonce` property. So
     * importNode() hands back a copy with no nonce at all, and under a
     * nonce-based `style-src` such a stylesheet is refused — leaving a print
     * sheet with no CSS, which just looks like a broken page.
     *
     * Measured in Chrome, so the limits are worth stating: attribute hiding only
     * kicks in for a header-delivered CSP (a <meta> policy leaves the attribute
     * readable), and Chrome does not currently enforce the parent policy inside
     * this scripted about:blank iframe at all — an unstamped copy still applies
     * there today. This is therefore insurance, not a fix for a live bug: the
     * spec has the initial about:blank inherit its creator's policy, other
     * engines may enforce it, and stamping costs one attribute per stylesheet.
     *
     * A no-op when the app sets no nonce, which is the case today — this app's
     * policy in `src/index.html` still uses `style-src 'unsafe-inline'`.
     */
    private applyNonce(node: Node): Node {
        const element = node as Element;

        // nodeType instead of `instanceof Element`: these nodes belong to the
        // iframe's document, a separate realm where that check is always false.
        if (this.nonce && element.nodeType === Node.ELEMENT_NODE && element.nodeName !== 'BASE') {
            element.setAttribute('nonce', this.nonce);
        }

        return node;
    }
    private wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
