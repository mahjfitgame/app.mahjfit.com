// file: libs/src/web-page/title/service.ts
import { DestroyRef, inject, Service } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, of, switchMap } from 'rxjs';
import {
    WEB_PAGE_TITLE_APP_NAME_KEY,
    WEB_PAGE_TITLE_I18N_KEY_PREFIX,
    WEB_PAGE_TITLE_SEPARATOR,
} from './const';
import { WebPageTitleSourceType } from './type';

/**
 * @WebPageTitleService
 *
 * THE single owner of document.title. Nothing else in the app injects Title
 * or calls setTitle() — OnPageSeoType has no `title` field precisely so that
 * cannot happen. WebPageTitleStrategy feeds this from the router.
 *
 * Two ways in:
 *   setTitleKey('GL.MODULE.GEO.COUNTRY')  — route-driven, follows language
 *   setTitleText('Edit Country #7')       — imperative, for a title the route
 *                                           cannot express
 *
 * The next navigation reclaims the title either way, because the strategy calls
 * setTitleKey() on every NavigationEnd.
 */
@Service()
export class WebPageTitleService {
    private readonly title = inject(Title);
    private readonly transloco = inject(TranslocoService);
    private readonly destroyRef = inject(DestroyRef);

    private readonly source$ = new BehaviorSubject<WebPageTitleSourceType | null>(null);

    constructor() {
        /**
         * switchMap so a new source cancels the previous resolution — otherwise
         * a slow language load could win a race and title the wrong page.
         *
         * selectTranslate() rather than translate(): it re-emits on every
         * langChanges$ AND awaits transloco.load(lang) before translating
         * (jsverse-transloco.mjs:628-634). So switching language updates the tab
         * with no navigation and never flashes a raw key.
         */
        this.source$
            .pipe(
                switchMap((source) => {
                    if (!source) return of(null);

                    return source.kind === 'text'
                        ? of(source.value)
                        : this.transloco.selectTranslate(source.value);
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((label) => this.apply(label));
    }

    /** i18n key — a GL.* key from src/lang/i18n. Null clears to the app name. */
    public setTitleKey(key: string | null): void {
        this.source$.next(key ? { kind: 'key', value: key } : null);
    }

    /** already-resolved text. Does not follow language changes, by definition. */
    public setTitleText(text: string | null): void {
        this.source$.next(text ? { kind: 'text', value: text } : null);
    }

    private apply(label: string | null): void {
        const appName = this.transloco.translate(WEB_PAGE_TITLE_APP_NAME_KEY);

        /**
         * Transloco's default missing handler returns the KEY when a string is
         * absent, so a typo would put "GL.MODULE.GEO.COUNTRY | Bfw Angular PWA"
         * in the tab. Every route key is a GL.* key, so a value still carrying
         * that prefix can only be an echo. Degrade to the app name.
         */
        const resolved =
            label && !label.startsWith(WEB_PAGE_TITLE_I18N_KEY_PREFIX) ? label : null;

        this.title.setTitle(
            resolved ? `${resolved}${WEB_PAGE_TITLE_SEPARATOR}${appName}` : appName,
        );
    }
}
