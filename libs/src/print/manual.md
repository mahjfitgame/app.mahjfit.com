# PrintService — developer manual

One print engine for the whole app. Inject it and call a method.

> **Rule:** nothing outside this folder calls `window.print()` or `@capgo/capacitor-printer` directly. If printing needs something it cannot do yet, add it here.

```ts
import { PrintService } from '@libs/print/service';

private readonly print = inject(PrintService);
```

---

## 1. The five-second version

```ts
// Print one area of the current screen (the common case).
await this.print.element(invoiceEl, { title: 'Invoice #123' });
```

Every method returns a result instead of throwing, so **you never need try/catch**:

```ts
const result = await this.print.element(invoiceEl, { title: 'Invoice #123' });

if (!result.ok) {
    // PrintService already logged the technical cause.
    this.notify.error(result.error ?? this.i18n.translate('GL.MODULE.HTTP_STATUS.NOT_FOUND'));
}
```

`result` is `{ ok: boolean; error?: string }`. `ok: true` means the print dialog opened and was dismissed — printed or cancelled, the OS does not tell us which, and no app needs to know.

---

## 2. Pass the element, not an id

`element()` accepts three kinds of target:

```ts
await this.print.element(someElement);            // ✅ best — always exactly this element
await this.print.element('[data-print="sale"]');  // ✅ CSS selector
await this.print.element('invoice-2');            // ⚠️  element id
```

Prefer the element. A page can show more than one printable area (two `<app-crud>` hosts, a report with several sections), and an id only works while it is unique — `getElementById` silently returns whichever comes first in the DOM.

The easiest way to get the element is a **template reference variable**, passed straight into the click handler — no `viewChild`, no ids:

```html
<button (click)="print(area)">Print</button>

<div #area>
    ...the thing to print...
</div>
```

```ts
public async print(area: HTMLElement): Promise<void> {
    const result = await this.printService.element(area, { title: 'Sales report' });
    ...
}
```

This works even when the button sits in a different part of the template from the content (a toolbar portal, for example) — the reference still resolves, as long as both are declared in the same template file. That is exactly how CRUD's five View layouts do it:

```html
<!-- src/app/base/crud/component/view/dialog/template.html -->
<button (click)="service.view.printRecord(printArea)">…</button>
...
<div #printArea>
    <ng-container *ngComponentOutlet="service.view.getViewRecordComponent(); …"></ng-container>
</div>
```

### When there is no template to pass from

If the print is triggered by something other than a click — a route, a timer, a websocket message — the trigger has no element. Hand one over ahead of time and keep the reference on the service, the way CRUD's `/print/:keyid` route does:

```ts
// component.ts — the host that renders the content
private readonly printAreaRef = viewChild.required<ElementRef<HTMLElement>>('printArea');

constructor() {
    afterNextRender(() => this.service.setAutoPrintArea(this.printAreaRef().nativeElement));

    // Always clear it, or a later print reaches DOM that is no longer on screen.
    inject(DestroyRef).onDestroy(() => this.service.setAutoPrintArea(null));
}
```

See [`src/app/base/crud/component/view/page/component.ts`](../../../src/app/base/crud/component/view/page/component.ts) and `CrudViewService.setAutoPrintArea()`.

---

## 3. Every method

> **Read this first — it is the one thing people get wrong.**
> `PrintService` **never creates** a PDF or any other file. It only sends something that already exists to the printer. Split the methods in two:
>
> - **`element` / `html` / `page`** — you give it **content**, it builds the printable document for you. *This is what you want 95% of the time.*
> - **`pdf` / `file` / `base64`** — you give it a **document that already exists**, it hands that to the printer untouched.
>
> In `pdf(path)` and `file(path)`, **`path` is an INPUT — the location of a document to read and print. It is not an output path, and nothing is written to it.**

| Method | You provide | Prints |
|---|---|---|
| `element(target, options?)` | a DOM element | that element of the live page |
| `html(html, options?)` | an HTML string | that HTML |
| `page(options?)` | nothing | the whole current screen |
| `pdf(path, options?)` | where an **existing** PDF is | that PDF |
| `file(path, mimeType?, options?)` | where an **existing** file is | that file (PDF, JPEG, PNG…) |
| `base64(data, mimeType, options?)` | the **bytes** of an existing file | that file |

### "I want to print a PDF — where does the PDF come from?"

Not from here. Something else has to produce it first:

| Where the PDF comes from | How to print it | Works on |
|---|---|---|
| **Your API generates it** and returns base64 | `print.base64(data, 'application/pdf')` | web + native ✅ **best fit for this app** |
| **Your API generates it** and returns a same-origin URL | `print.file(url, 'application/pdf')` | web only |
| A file already on the device | `print.pdf(deviceFilePath)` | native (needs a path from somewhere) |
| **Nothing — you just want a PDF of the screen** | `print.element(...)` and choose *Save as PDF* in the print dialog | web + native ✅ |

That last row is usually the real answer. If the goal is "give the user a PDF of this record", print the DOM and let the OS print dialog produce the PDF — no PDF library, no API work, and it stays in sync with the screen automatically.

**Two limits in this codebase right now:**
- Nothing generates PDFs client-side — no `jspdf`, `pdfmake` or similar is installed, and none is needed for the flows above.
- `@capacitor/filesystem` is **not installed**, so on native the app cannot write a downloaded PDF to disk. That makes `pdf(path)` / `file(path)` unusable on device today; use `base64()`, which needs no file at all.

### `element()` — print part of the screen

```ts
await this.print.element(receiptEl, { title: 'Receipt' });
```

### `html()` — print something the screen never showed

Useful for a layout meant for paper only, so you are not fighting screen CSS. Turn app styles off and bring your own:

```ts
const html = `
    <h1>${escapeHtml(order.number)}</h1>
    <table>${rows}</table>
`;

await this.print.html(html, {
    title: `Order ${order.number}`,
    useAppStyles: false,
    css: `
        body { font: 12pt/1.4 serif; }
        table { width: 100%; border-collapse: collapse; }
        td { border-bottom: 1px solid #ddd; padding: 4px 0; }
    `,
});
```

⚠️ `html` is written into the print document as-is. Never pass unescaped server or user text into it.

### `page()` — print the whole screen

The app's own `@media print` rules decide what is hidden.

```ts
await this.print.page({ title: 'Dashboard' });
```

### `base64()` — print a document the API gave you ✅ recommended

The API generates the PDF, returns it as base64, you print it. No file is written, nothing to clean up, and it is the only one of these three that works the same on web and native today.

```ts
const response = await this.api.getStatementPdf(id);   // returns base64 (no "data:...;base64," prefix)

await this.print.base64(response.pdf_base64, 'application/pdf', { title: 'Statement' });
```

Also takes `image/jpeg`, `image/png`. Keep it under ~5 MB — decoding a large base64 string can exhaust memory on a device; for anything bigger, serve a URL and use `file()`.

### `file()` / `pdf()` — print a document that already exists somewhere

`path` says **where to read the document from**. Nothing is written to it.

```ts
// WEB: `path` is treated as a URL and loaded into an iframe.
// Must be same-origin — the app's CSP allows child-src 'self' blob: only,
// so a cross-origin URL is blocked.
await this.print.file('/api/report/123.pdf', 'application/pdf', { title: 'Report' });

// NATIVE: `path` must be a real device path (file:// or, on Android, content://).
// mimeType is required for content:// URIs on Android.
await this.print.pdf('file:///.../Documents/statement.pdf', { title: 'Statement' });
```

⚠️ On native this app **cannot produce such a path today** — `@capacitor/filesystem` is not installed, so there is no way to save an API response to disk. Use `base64()` on device until that changes.

`options` here only uses `title` — the other options describe how a DOM document is built and are ignored, because the file is printed exactly as it already is.

---

## 4. Options

```ts
await this.print.element(area, {
    title: 'Invoice #123',      // print job / save-as name. Default: document.title
    useAppStyles: true,         // copy the app's <style>/<link>/<base>. Default true
    css: '.total { font-weight: 700; }',  // extra CSS, wins over app styles
    bodyClass: 'print-compact', // extra class(es) on the print <body>
    bodyAttributes: { 'data-bfw-theme-mode': 'light' },  // forced <body> attributes
    syncFormValues: true,       // copy live input/select/textarea values. Default true
    canvasToImage: false,       // snapshot <canvas> into <img>. Default false
    delay: 0,                   // extra ms before printing, for late images/fonts
});
```

**`syncFormValues`** is on because cloning an element copies the `value` *attribute*, not what the user actually typed — without it every input, textarea and select prints blank. Leave it on unless you are printing an area with hundreds of fields and have measured that it matters.

**`canvasToImage`** is off because a snapshot costs a `toDataURL()` per canvas. Turn it on when printing charts, or they print blank:

```ts
await this.print.element(chartEl, { canvasToImage: true, delay: 100 });
```

**`delay`** is a last resort. Stylesheets are already waited for; use this only for images or fonts that load late.

### App-wide defaults

`AppService` sets these once at startup, so no caller has to remember them:

```ts
this.print.setDefaults({
    bodyAttributes: { [THEME_MODE_ATTRIBUTE]: ThemeModeEnum.LIGHT },
});
```

That is why printing in dark mode still produces a light sheet. Per-call options override defaults.

---

## 5. Showing that a print is running

`state.isPrinting()` is a signal — a job is running from the moment the document starts building until the dialog closes.

```html
<button
    mat-icon-button
    [disabled]="print.state.isPrinting()"
    (click)="print.element(area)"
>
    <mat-icon>print</mat-icon>
</button>
```

A second `element()` / `html()` call while one is running returns `{ ok: false, busy: true }` rather than opening two dialogs. **`busy` is not an error** — it is a second click while the dialog is open. Nothing is logged for it, and callers should stay silent:

```ts
if (!result.ok && !result.busy) {
    this.notify.error(result.error ?? …);
}
```

---

## 6. Styling for paper

The print document inherits the app's CSS, `<body>` classes and `data-bfw-theme*` attributes, so what you see is what prints. Three ways to change that, cheapest first:

**1. Tailwind's `print:` variant**, right in the template:

```html
<div class="tw:grid tw:grid-cols-1 tw:print:grid-cols-12">
<button class="tw:print:hidden">Edit</button>
```

**2. `@media print` in the component's `style.scss`** — component styles are copied along with everything else.

**3. The `css` option** for one-off, caller-specific rules.

Page-level rules that apply to every print (white background, `@page` margins, flowing layout instead of the app's fixed-height shell) already live in `PRINT_BASE_CSS` in [`const.ts`](./const.ts) and are always applied last.

---

## 7. Web vs native — what actually happens

You do not need to branch on platform; `element()` and `html()` already do. It is worth knowing why:

- **Web** — the content is cloned into an offscreen iframe that gets its own document: `<html lang/dir>` copied (RTL prints correctly), the head's `<style>`/`<link>` nodes imported, `<body>`'s classes and theme attributes copied (this is what makes CSS custom properties resolve). Then it waits for those stylesheets — on a warm cache that is no wait at all — and prints.
- **Native (iOS/Android)** — a Capacitor WebView ignores `window.print()`, so there is no iframe to print. The OS prints the **live** document instead: the clone is mounted as `#bfw-print-root` on `<body>` and [`src/theme/active/_print.scss`](../../../src/theme/active/_print.scss) hides everything else, then `Printer.printWebView()` runs. The clone stays mounted until the print sheet closes, because both platforms render it lazily.

That second path is also why the printable content must survive being detached from its place in the layout. Keep print areas self-contained: styles that depend on a scrolling ancestor, a drawer, or a dialog wrapper will not be there on paper.

---

## 8. Content-Security-Policy

**Nothing to do — printing is unaffected by the app's CSP, and needs no maintenance here.**

The app runs a **hash-based** strict policy (`security.autoCsp`, see [`docs/nonce-new.md`](../../../docs/nonce-new.md)), which sets `script-src`, `object-src` and `base-uri` — and **no** `style-src` or `default-src`. Two consequences for print, both good:

- **Scripts:** the print document contains none. `PrintService` copies stylesheets and content only, never a `<script>`, so the strict `script-src` has nothing to act on.
- **Styles:** that policy does not restrict styles at all, so the print document's CSS is governed only by the app's own `style-src`, which still allows `'unsafe-inline'`.

### If styles ever move to a nonce

`PrintService` is already prepared and stays dormant until then: it injects `CSP_NONCE` optionally, so with no nonce configured `applyNonce()` is a no-op.

This matters because **a copied stylesheet loses its nonce**. Once a policy is delivered as an HTTP header the browser empties the `nonce` attribute and keeps the value only on the element's `nonce` property, so `importNode()` returns a copy carrying no token — and under a nonce-based `style-src` that copy is refused, printing a page with no CSS at all.

Provide the nonce the normal Angular way and printing keeps working with no change here:

```html
<app-root ngCspNonce="{{ generatedNonce }}"></app-root>
```

---

## 9. Troubleshooting

| Symptom | Cause |
|---|---|
| Sheet is blank | Target resolved to an element with no laid-out content, or the content renders after the click — load first, then print (`afterNextRender`) |
| Colours/borders missing | Something stripped `<body>`'s theme attributes, or `useAppStyles: false` without replacement CSS |
| Prints LTR in an RTL language | Content was not printed through `PrintService` |
| Inputs print empty | `syncFormValues: false` |
| Charts print blank | Needs `canvasToImage: true` |
| Images missing | They loaded after printing — add a small `delay` |
| Nothing happens, no error | Check the console: the cause is always logged as `[PRINT … FAILED]` |
| Nothing happens on native only | The plugin may not be in the installed build — rebuild with `npm run debug.android` / `debug.ios`, do not just reload the web assets |
| Blank sheet on native, fine in the browser, and only from a dialog / bottom-sheet | Something put the document root into `position: fixed` — the CDK scroll lock does this while an overlay is open. Native prints the live document, so a fixed root is sized to the web view instead of the page. `_print.scss` already undoes `.cdk-global-scrollblock`; a new overlay that locks scrolling some other way needs the same treatment |

---

## 10. Verifying a change

The print dialog cannot be automated, so changes here are checked by hand. Worth covering all of these, because each one has broken before:

- **RTL** — switch to Arabic and print; the sheet must be RTL (the print document copies `<html lang/dir>`).
- **Dark mode** — the sheet must still come out light (`setDefaults` pins the theme mode).
- **Theme colours** — borders and surfaces must survive (the print `<body>` copies `data-bfw-theme*`, or every CSS variable resolves to nothing).
- **Print twice in a row** — the second click must open the dialog again, not go quiet (`isPrinting` has to be released when the dialog closes).
- **Every layout** — page, dialog, bottom-sheet, end-drawer, end-side-bar; the two overlay layouts lock page scrolling, which the native path has to undo.
- **A real device** — web and native take completely different paths (§7), so a browser check proves nothing about native. Rebuild with `npm run debug.android` / `debug.ios`; reloading web assets is not enough.
