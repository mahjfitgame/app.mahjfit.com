// file: libs/src/web-page/title/provider.ts
import { Provider } from '@angular/core';
import { TitleStrategy } from '@angular/router';
import { WebPageTitleStrategy } from './strategy';

/**
 * Overrides the router's DefaultTitleStrategy. Must be registered AFTER
 * provideRouter(...) so the later provider wins.
 *
 * WebPageTitleService is NOT listed: it is @Service() (auto-provided in root),
 * matching its two siblings in libs/src/web-page. Only the strategy needs an
 * explicit entry, because it is bound to a token rather than to itself.
 */
export function provideWebPageTitleModule(): Provider[] {
    return [
        { provide: TitleStrategy, useClass: WebPageTitleStrategy },
    ];
}
