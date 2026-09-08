// file: libs/src/foundation/action/route.ts
import { Routes } from '@angular/router';
import { FoundationModuleRouteDataType } from '../module/type';
import { FOUNDATION_ACTION_ROUTE_CONFIG } from './const';
import { FoundationActionEnum } from './enum';

export class FoundationActionRoute {
    // TESTS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** first segment test, used by CrudRoute's live route reads */
    public static isRoutable(value: string): value is FoundationActionEnum {
        return value in FOUNDATION_ACTION_ROUTE_CONFIG;
    }

    // SLUGS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * the route segment for one action, '' when it has no route
     *
     * used by FoundationModulePath.ofAction() so a module can expose
     * absolutePathView() / absolutePathUpdate() without hand building a path
     */
    public static slugOf(action: FoundationActionEnum): string {
        return FOUNDATION_ACTION_ROUTE_CONFIG[action]?.slug ?? '';
    }

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routesFor()
     * the action children of one module
     *
     * ⚠ ORDER IS EXPLICIT: walks `actions` in the order GIVEN, never
     * FOUNDATION_ACTION_ROUTE_CONFIG's own key order — that array arrives from
     * an api and route order is matching semantics
     *
     * ⚠ componentless is load bearing on every emitted route, the parent
     * listing component is never torn down so `country;cp=3` survives the
     * overlay. children: [] because angular requires one of
     * component / loadComponent / redirectTo / children / loadChildren
     */
    public static routesFor(actions: FoundationActionEnum[], alias: string): Routes {
        return actions.reduce<Routes>((routes, action) => {
            const config = FOUNDATION_ACTION_ROUTE_CONFIG[action];

            if (!config) {
                return routes;
            }

            routes.push({
                path: config.slug,
                data: {
                    breadcrumb: { label: config.labelKey, alias: `${alias}${config.aliasSuffix}` },
                } satisfies FoundationModuleRouteDataType,
                children: [],
            });

            return routes;
        }, []);
    }
}
