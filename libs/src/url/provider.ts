// file: ./libs/src/url/provider.ts
import { Provider } from "@angular/core";
import { UrlState } from "./state";
import { UrlService } from "./service";

export const URL_PROVIDER: Provider[] = [
    UrlState,
    UrlService,
];

/**
 * App-wide URL module.
 *
 * Both classes stay @Service({ autoProvided: false }) so registration is
 * explicit here rather than implicit at the class.
 *
 * ⚠ Root scope only. Do NOT add URL_PROVIDER to a component's providers —
 * that shadows the singletons with a second set, and URL ownership plus the
 * route signals both assume exactly one instance.
 *
 * Deliberately no provideAppInitializer: UrlState injects ContextProfileService
 * and BfwApiService, so eager construction would pull that graph up ahead of
 * provideAppModule()'s initializer, which app.config.ts requires to run last.
 * Nothing in this phase needs the route signals before the first module calls
 * initUrlSync(). Phase 3 revisits this for the title strategy and sidenav.
 */
export function provideUrlModule(): Provider[] {
    return [
        ...URL_PROVIDER,
    ];
}
