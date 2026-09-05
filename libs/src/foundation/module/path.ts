// file: libs/src/foundation/module/path.ts
import { isDevMode } from '@angular/core';
import { FoundationActionEnum } from '../action/enum';
import { FoundationActionRoute } from '../action/route';

/**
 * @FoundationModulePath
 * registry_key -> absolute path, resolved once at provideRouter() time
 *
 * replaces the per class `moduleLevel` array. every absolutePath() is now an
 * O(1) Map.get instead of a join + filter on every call
 *
 * ⚠ RULE 7: never call any of this at module scope. AreaRoute.routes() fills
 * the map while app.routes.ts is being evaluated, so a top level
 * `const url = SomeRoute.absolutePath()` earlier in the import graph gets ''.
 * method bodies, class fields and templates are all safe
 */
export class FoundationModulePath {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private static readonly paths = new Map<string, string>();

    // MERGE ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** called once per area by AreaRoute.routes(), before the '**' is appended */
    public static merge(area: ReadonlyMap<string, string>): void {
        area.forEach((path, key) => this.paths.set(key, path));
    }

    /** every resolved path, for specs and debugging */
    public static all(): ReadonlyMap<string, string> {
        return this.paths;
    }

    // MODULE PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * the module's own url
     *
     * `params` is carried over from UrlService.getRelativePathArr: substitute
     * what was supplied, then DROP any :placeholder left unfilled. so
     * of('PREBOARDING_RECOVER_PASSWORD') gives /auth/recover-password exactly
     * as the old absolutePath() did
     */
    public static of(registryKey: string, params: Record<string, string | number> = {}): string {
        return '/' + this.segments(registryKey, params).join('/');
    }

    public static arrOf(registryKey: string, params: Record<string, string | number> = {}): string[] {
        return ['/', ...this.segments(registryKey, params)];
    }

    /** the same string with no leading '/', for [href] full page reloads */
    public static relativeOf(registryKey: string, params: Record<string, string | number> = {}): string {
        return this.segments(registryKey, params).join('/');
    }

    public static relativeArrOf(registryKey: string, params: Record<string, string | number> = {}): string[] {
        return this.segments(registryKey, params);
    }

    // ACTION PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * a module's url for ONE of its actions, /private/geo/country/view/42
     *
     * ⚠ the action must be in that module's definition().actions or the route
     * was never generated. the same list drives both, which is the point
     *
     * ⚠ never hand build `${absolutePath()}/view/${id}` — that survives until
     * someone re-parents the module or renames the action slug
     */
    public static ofAction(
        registryKey: string,
        action: FoundationActionEnum,
        params: Record<string, string | number> = {},
    ): string {
        const slug = FoundationActionRoute.slugOf(action);

        if (!slug) {
            if (isDevMode()) {
                console.error(`[path] action "${action}" has no route, it is matrix param state`);
            }

            return this.of(registryKey, params);
        }

        return '/' + this.segments(registryKey, params, slug).join('/');
    }

    public static arrOfAction(
        registryKey: string,
        action: FoundationActionEnum,
        params: Record<string, string | number> = {},
    ): string[] {
        const slug = FoundationActionRoute.slugOf(action);

        return ['/', ...this.segments(registryKey, params, slug)];
    }

    // INTERNAL ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private static segments(
        registryKey: string,
        params: Record<string, string | number>,
        suffix = '',
    ): string[] {
        let path = this.paths.get(registryKey) ?? '';

        if (suffix) {
            path = `${path}/${suffix}`;
        }

        // 1. substitute what was given
        Object.entries(params).forEach(([key, value]) => {
            path = path.replace(key, value.toString());
        });

        // 2. drop empties and any :placeholder still unfilled
        //    same rule as UrlService.getRelativePathArr, so absolutePath() keeps
        //    returning exactly what it returned before this phase
        return path.split('/').filter((seg) => seg && !seg.startsWith(':'));
    }
}
