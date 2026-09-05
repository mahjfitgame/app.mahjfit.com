// file: libs/src/web-page/title/strategy.ts
import { inject, Service } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { FoundationModuleRouteDataType } from '@libs/foundation/module/type';
import { WebPageTitleService } from './service';

/**
 * @WebPageTitleStrategy
 *
 * Router adapter. Holds no state and never touches document.title —
 * it only translates a RouterStateSnapshot into a call on the service.
 *
 * Angular calls updateTitle() at _router-chunk.mjs:3918, one line after
 * NavigationEnd, with the settled snapshot as an argument. So there is no
 * NavigationEnd subscription and no ActivatedRoute leaf walk here.
 *
 * autoProvided: false — this class is reachable ONLY through the TitleStrategy
 * token that provider.ts binds. Auto-providing it would create a second way to
 * get one, and a second instance for anyone who asked by class.
 */
@Service({ autoProvided: false })
export class WebPageTitleStrategy extends TitleStrategy {
    private readonly service = inject(WebPageTitleService);

    public override updateTitle(snapshot: RouterStateSnapshot): void {
        const title = this.resolveTitle(snapshot);

        if (title) {
            /**
             * setTitleKey() regardless of whether data.title holds a GL.* key
             * or a plain literal: transloco returns what it cannot resolve
             * unchanged, so a literal survives the round trip. Going through
             * the key path also means the tab re-renders on language change,
             * which setTitleText() deliberately does not.
             */
            this.service.setTitleKey(title);
            return;
        }

        /**
         * Fallback for routes with no data.title: buildTitle() is
         * TitleStrategy's own resolver for Angular's route-level `title`
         * property. Nothing in this app sets that any more, so this is a
         * safety net for a newly added route, not a second channel.
         */
        this.service.setTitleText(this.buildTitle(snapshot) ?? null);
    }

    /**
     * Deepest declared data.title down the primary chain.
     *
     * Walks and keeps the last hit rather than reading the leaf directly: that
     * is correct whether or not data inherits downward. It does today —
     * paramsInheritanceStrategy defaults to 'always' — but this does not depend
     * on it, which matters because `create` and `update/:id` are componentless
     * children that declare no data of their own and must show the parent's
     * title.
     */
    private resolveTitle(snapshot: RouterStateSnapshot): string | undefined {
        let route: ActivatedRouteSnapshot | null = snapshot.root;
        let title: string | undefined;

        while (route) {
            const data = route.data as FoundationModuleRouteDataType;

            if (data?.title) {
                title = data.title;
            }

            route = route.firstChild;
        }

        return title;
    }
}
