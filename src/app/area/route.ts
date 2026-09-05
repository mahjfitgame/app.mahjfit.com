// file: src/app/area/route.ts
import { Routes } from '@angular/router';
import { FoundationModulePath } from '@libs/foundation/module/path';
import { FoundationAreaRegistryClassType } from '@libs/foundation/area/type';
import { SLUG_AREA } from '@area/slug';
import { AuthAreaRegistry } from '@area/auth/registry';
import { OpenAreaRegistry } from '@area/open/registry';
import { PrivateAreaRegistry } from '@area/private/registry';
import { ProtectedAreaRegistry } from '@area/protected/registry';
import { HttpStatusNotFoundRoute } from '@module/shared/http-status/not-found/route';

export class AreaRoute {
    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/app.routes.ts]
     *
     * single entry point that collects every area, each area owns its own
     * layout and children, none of them nests inside another
     *
     * ⚠ ORDER MATTERS: the open area is matched last because its slug is ''
     * which prefix matches every url. every other area owns a real segment
     * ('auth', 'private', 'account') so their order between themselves is free
     *
     * ⚠ this is also where FoundationModulePath is filled, so no absolutePath()
     * may be called at module scope anywhere in the app (Rule 7)
     */
    public static routes(): Routes {
        const areas: FoundationAreaRegistryClassType[] = [
            AuthAreaRegistry,      // has its own layout to match auth screens
            PrivateAreaRegistry,   // has its own layout, the back office master admin shell
            ProtectedAreaRegistry, // has its own layout, the website user's signed in shell
            OpenAreaRegistry,      // has its own layout to match general pages, keep last
        ];

        const children: Routes = [];

        for (const area of areas) {
            const built = area.build();

            FoundationModulePath.merge(built.paths);
            children.push(...built.routes);
        }

        const routes: Routes = [
            {
                path: SLUG_AREA, // app base, '' for this project but can be like "admin" for a mounted app
                children: [
                    ...children,
                    /**
                     * ⚠ OWNED HERE, so no module can ever place a route after it.
                     * a module contributing '**' mid array is what made /503
                     * unreachable on 2026-08-16
                     *
                     * safe to resolve now: every area merged its paths above
                     */
                    { path: '**', redirectTo: HttpStatusNotFoundRoute.absolutePath() },
                ],
            },
        ];

        return routes;
    }

    // ABSOLUTE PATH ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static absolutePathArr(): string[] {
        return ['/'];
    }
    public static absolutePath(): string {
        return '/';
    }
}
