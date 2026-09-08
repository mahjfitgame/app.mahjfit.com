// file: src/app/base/global-progress-bar/provider.ts
import { inject, provideAppInitializer } from '@angular/core';
import {
    GuardsCheckEnd,
    GuardsCheckStart,
    NavigationCancel,
    NavigationEnd,
    NavigationError,
    NavigationSkipped,
    NavigationStart,
    ResolveEnd,
    ResolveStart,
    RouteConfigLoadEnd,
    RouteConfigLoadStart,
    RoutesRecognized,
    Router,
} from '@angular/router';
import { GlobalProgressBarService } from '@base/global-progress-bar/service';

/**
 * @provideNavigationProgressModule()
 * the global bar follows the router
 */
export function provideNavigationProgressModule() {
    return [
        provideAppInitializer(() => {
            const router = inject(Router);
            const gpbs = inject(GlobalProgressBarService);

            /**
             * no unsubscribe: Router is a root singleton that outlives every
             * component, so this subscription ends with the app itself
             */
            router.events.subscribe((event) => {
                if (event instanceof NavigationStart) {
                    gpbs.start();
                    gpbs.stream = 5;

                    return;
                }

                /**
                 * the lazy chunk download.
                 *
                 * ⚠ these two fire ONLY on a cache miss, so a second visit to the
                 * same module skips them entirely and the bar simply tops out lower.
                 * that is honest: there was no download to show.
                 *
                 * ⚠ READ HERE, but angular does NOT emit them here. with
                 * loadComponent the chunk is fetched AFTER the resolvers, not before
                 * recognition — only a loadChildren config loads this early. that
                 * ordering once ran the bar visibly BACKWARDS: absolute values of 20
                 * and 35 at this position landed after ResolveStart had already
                 * taken it to 65, MEASURED as 65 -> 20 -> 35.
                 *
                 * ⚠ the += form is what makes the position safe again. an increment
                 * cannot go backwards whatever order the router emits in, so these
                 * sit where they read naturally rather than where the events happen
                 * to land. do NOT reintroduce absolute values here.
                 */
                if (event instanceof RouteConfigLoadStart) {
                    gpbs.stream += 10;

                    return;
                }

                if (event instanceof RouteConfigLoadEnd) {
                    gpbs.stream += 10;

                    return;
                }

                if (event instanceof RoutesRecognized) {
                    gpbs.stream += 10;

                    return;
                }

                if (event instanceof GuardsCheckStart) {
                    gpbs.stream += 10;

                    return;
                }

                if (event instanceof GuardsCheckEnd) {
                    gpbs.stream += 10;

                    return;
                }

                /**
                 * ⚠ THE RESOLVER WINDOW: ResolveStart -> ResolveEnd is the span
                 * that waits on definition().resolve, and the one the user
                 * actually sits through. the router announces no finer step inside
                 * it, so the bar HOLDS on one value until every resolver on the
                 * route has settled - measured holding for the full 900ms of a
                 * deliberately slow probe resolver.
                 */
                if (event instanceof ResolveStart) {
                    gpbs.stream += 10;

                    return;
                }

                if (event instanceof ResolveEnd) {
                    gpbs.stream += 10;

                    return;
                }

                if (event instanceof NavigationEnd
                    || event instanceof NavigationCancel
                    || event instanceof NavigationError
                    || event instanceof NavigationSkipped) {
                    gpbs.stream = 100;
                    gpbs.stop();
                }
            });
        }),
    ];
}
