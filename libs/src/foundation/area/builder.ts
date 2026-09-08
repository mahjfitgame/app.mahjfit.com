// file: libs/src/foundation/module/builder.ts
import { isDevMode } from '@angular/core';
import { Routes } from '@angular/router';
import { FoundationActionEnum } from '../action/enum';
import { FoundationActionRoute } from '../action/route';
import { FoundationAreaEnum } from '../enum';
import { FoundationNavPositionEnum } from '../nav/enum';
import { FoundationNavNodeType, FoundationNavPositionMapType } from '../nav/type';
import { FoundationModuleRouteDataType, FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '../module/type';
import { FoundationAreaBuildType, FoundationAreaRegistryType } from './type';

/**
 * @FoundationAreaBuilder
 * flat rows + a flat registry -> routes, every menu, and every path
 *
 * no DI, no Router, no signals. it runs at provideRouter() time and is callable
 * from a spec with literal rows and no TestBed
 */
export class FoundationAreaBuilder {
    // BUILD ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static build(
        area: FoundationAreaEnum,
        modules: FoundationAreaRegistryType,
        rows: FoundationModuleRouteNavType[],
    ): FoundationAreaBuildType {
        /**
         * PASS 1 — group by parent_key, once
         *
         * ⚠ performance: the obvious shape is rows.filter(r => r.parent_key === k)
         * inside the recursion, which is O(n²). one Map up front makes the whole
         * build O(n), and n grows with every module the app ever gains
         */
        const byParent = new Map<string | null, FoundationModuleRouteNavType[]>();

        for (const row of rows) {
            if (row.active === false) continue;
            if (row.area_key !== area) continue;

            /**
             * VALIDATION — the dead link guarantee. the registry is COMPLETE:
             * it holds every module this area's menus name, borrowed included.
             * so a key that is not in it is a typo or a stale db row, and
             * dropping it means neither can render a link to nothing
             *
             * ⚠ this is NOT the borrowed check, that is module.area !== area
             * in walk(), and a borrowed module IS in the registry
             */
            if (!modules[row.registry_key]) {
                if (isDevMode()) {
                    console.error(`[area] row "${row.registry_key}" is not registered in area "${area}"`);
                }

                continue;
            }

            /**
             * VALIDATION — the identity guarantee. registryKey is INHERITED from
             * FoundationModuleRoute now, so a module that never declares its own
             * still satisfies FoundationModuleRouteType and the missing key is no
             * longer a compile error. this is where that error moved to.
             *
             * ⚠ dev only, and definition() is called an extra time per row to get
             * it. that is an object literal and a lazy import closure, not a load
             */
            if (isDevMode() && modules[row.registry_key].definition().registryKey !== row.registry_key) {
                console.error(
                    `[area] row "${row.registry_key}" and its definition() disagree on registryKey`,
                );
            }

            const siblings = byParent.get(row.parent_key);

            siblings ? siblings.push(row) : byParent.set(row.parent_key, [row]);
        }

        // sort each level once, not on every visit
        byParent.forEach((siblings) => siblings.sort((a, b) => a.sort_order - b.sort_order));

        // PASS 2 — one recursion, emitting routes + every menu + paths together
        const paths = new Map<string, string>();
        const routes: Routes = [];
        /** START always exists, the others appear only if a row asks for them */
        const nav: FoundationNavPositionMapType = { [FoundationNavPositionEnum.START]: [] };
        const rootPositions = [FoundationNavPositionEnum.START];

        this.walk(
            byParent.get(null) ?? [], byParent, modules, area,
            '', rootPositions, paths, routes, nav[FoundationNavPositionEnum.START], nav,
        );

        return { routes, nav, paths };
    }

    // WALK ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private static walk(
        siblings: FoundationModuleRouteNavType[],
        byParent: Map<string | null, FoundationModuleRouteNavType[]>,
        modules: FoundationAreaRegistryType,
        area: FoundationAreaEnum,
        parentPath: string,
        /** positions inherited from the parent, a row's nav_position overrides them downward */
        positions: FoundationNavPositionEnum[],
        paths: Map<string, string>,
        routesOut: Routes,
        navOut: FoundationNavNodeType[],
        nav: FoundationNavPositionMapType,
    ): void {
        for (const row of siblings) {
            const module = modules[row.registry_key];

            /**
             * WHICH MENU(S). a row's nav_position overrides the inherited list
             * for itself AND everything below it, so a group is declared once.
             * omit it and the node stays wherever its parent is
             *
             * ⚠ it is an ARRAY: one entry can render in several menus at once,
             * [START, BOTTOM] puts it in the sidebar AND the footer bar
             */
            const rowPositions = row.nav_position?.length ? row.nav_position : positions;

            /**
             * ⚠ BY VALUE, never by reference. every module declares its own
             * nav_position: [START] literal, so `rowPositions === positions`
             * is false even when they mean the same thing — and the child then
             * gets pushed to the TOP of the position instead of nesting under
             * its parent. that flattens geo/country and geo/state out of the
             * Geo panel, which is how this was caught
             */
            const inherited = rowPositions === positions
                || (rowPositions.length === positions.length
                    && rowPositions.every((position) => positions.includes(position)));

            /**
             * where this node's menu entry lands. inherited = the array already
             * being filled, no lookup. overridden = one array per position,
             * created on demand
             */
            const targets: FoundationNavNodeType[][] = inherited
                ? [navOut]
                : rowPositions.map((position) => (nav[position] ??= []));

            /**
             * BORROWED — the registry holds every module this area's menus name
             * and `module.area` says who owns the route. a foreign one gets a
             * menu entry and nothing else, so no duplicate route can exist
             *
             * ⚠ DERIVED, never declared. nobody writes "this row is borrowed",
             * SignoutRoute.area is AUTH and that is the whole answer
             *
             * url stays null because that area may not have been built yet,
             * FoundationNavService.decorate() resolves it at mount
             */
            if (module.area !== area) {
                if (!row.hidden) {
                    const borrowed: FoundationNavNodeType = {
                        ...row, url: null, routable: true, children: [],
                    };

                    targets.forEach((target) => target.push(borrowed));
                }

                continue;
            }

            const definition = module.definition();
            const path = row.url_slug ? `${parentPath}/${row.url_slug}` : parentPath;

            /**
             * ⚠ paths is a Map, so a duplicate key OVERWRITES: the loser's
             * absolutePath() then answers the winner's url and navigation lands on
             * the wrong page, silently. the other half of the inherited-registryKey
             * guard above — that one catches "never declared", this one catches
             * "two the same"
             */
            if (isDevMode() && paths.has(row.registry_key)) {
                console.error(
                    `[area] duplicate registryKey "${row.registry_key}" — absolutePath() will be wrong`,
                );
            }

            paths.set(row.registry_key, path || '/');

            const childRoutes: Routes = [];
            const childNav: FoundationNavNodeType[] = [];

            // DEFAULT CHILD, = te_access_area_navigation.defaultChildId
            if (row.default_child_key) {
                const target = byParent.get(row.registry_key)
                    ?.find((child) => child.registry_key === row.default_child_key);

                if (target) {
                    childRoutes.push({ path: '', redirectTo: target.url_slug, pathMatch: 'full' });
                }
            }

            // ACTION CHILDREN — static segments, before nested modules
            childRoutes.push(
                ...FoundationActionRoute.routesFor(
                    this.effectiveActions(definition, row),
                    definition.breadcrumbAlias ?? row.registry_key,
                ),
            );

            this.walk(
                byParent.get(row.registry_key) ?? [],
                byParent, modules, area, path, rowPositions, paths, childRoutes, childNav, nav,
            );

            /**
             * PASS THROUGH GROUP — empty slug and no component, e.g. ONBOARDING.
             * it exists to give rows a parent_key and a nav_position, not to add
             * a url level, so its children splice into the parent's own children
             *
             * ⚠ not cosmetic. angular does not backtrack out of an empty path
             * parent it has already matched: emit `{ path: '', children }` and a
             * url that misses every child fails the navigation instead of trying
             * the next sibling. splicing sidesteps the question entirely
             */
            if (row.url_slug === '' && !definition.component) {
                /**
                 * ⚠ its own route is never emitted, so a resolver declared here
                 * would never run and read() would answer null forever. the
                 * children are spliced into the PARENT, whose resolver they DO
                 * inherit — move it there, or give this row a url_slug
                 */
                if (isDevMode() && Object.keys(definition.resolve ?? {}).length) {
                    console.error(
                        `[area] "${row.registry_key}" is a pass-through group; its resolve() cannot run`,
                    );
                }

                routesOut.push(...childRoutes);
            } else {
                /**
                 * ⚠ everything ELSE Route allows (title, matcher, outlet,
                 * loadChildren, runGuardsAndResolvers, providers) rides through
                 * in `passThrough` untouched. pulled out by name rather than
                 * spreading `definition` wholesale so the builder-owned fields
                 * below (path/pathMatch/component→loadComponent/guards/resolve/
                 * data/children) always win, never a module's
                 */
                const {
                    registryKey: _registryKey, component, breadcrumbAlias, actions: _actions,
                    canMatch, canActivate, canActivateChild, canDeactivate, resolve, loadChildren,
                    ...passThrough
                } = definition;

                routesOut.push({
                    ...passThrough,
                    path: row.url_slug,
                    /**
                     * an empty slug must be exact or it prefix matches every url
                     * ⚠ but ONLY on a leaf. pathMatch:'full' on a node with
                     * children never matches, and the open area's slug is ''
                     */
                    ...(row.url_slug === '' && childRoutes.length === 0 ? { pathMatch: 'full' as const } : {}),
                    ...(component ? { loadComponent: component } : {}),
                    canMatch: canMatch ?? [],
                    canActivate: canActivate ?? [],
                    canActivateChild: canActivateChild ?? [],
                    canDeactivate: canDeactivate ?? [],
                    /**
                     * ⚠ navigation WAITS on this. the payload lands in this
                     * route's snapshot.data under FoundationModuleRoute.resolvedKey,
                     * and angular's default paramsInheritanceStrategy of 'always'
                     * carries it down to the action children too — read it back
                     * with FoundationModuleRoute.read()
                     */
                    resolve: resolve ?? {},
                    data: {
                        title: row.label,
                        breadcrumb: {
                            label: row.label,
                            alias: breadcrumbAlias,
                            /**
                             * ⚠ a GROUP's crumb must not be a link. geo used to
                             * say `disable: true` by hand. derive it, or the geo
                             * crumb links to /private/geo which matches a
                             * componentless route with no default child, fails,
                             * and falls through to '**' -> /404
                             */
                            disable: !component,
                            info: { icon: row.icon },
                        },
                    } satisfies FoundationModuleRouteDataType,
                    /**
                     * ⚠ angular throws at runtime if both are present, even an
                     * empty `children: []` — arrays are always truthy. loadChildren
                     * takes over the whole sub-router, so it wins outright; a module
                     * using it gets none of the nav-row children (default child
                     * redirect, action routes, nested modules)
                     */
                    ...(loadChildren ? { loadChildren } : { children: childRoutes }),
                });
            }

            /**
             * ⚠ hidden = TRANSPARENT, not absent. children rise to the level
             * above instead of sitting inside a node nobody renders — every
             * area row is hidden, so burying them would empty every menu
             */
            if (row.hidden) {
                targets.forEach((target) => target.push(...childNav));
            } else {
                /**
                 * ONE node object, pushed into each position. sharing is safe,
                 * nav nodes are immutable plain data, so a two position entry
                 * costs one extra array push and never a second subtree
                 */
                const node: FoundationNavNodeType = {
                    ...row,
                    url: path || '/',
                    /** no component = a GROUP: a panel, not a link. derived, never declared */
                    routable: !!definition.component,
                    children: childNav,
                };

                targets.forEach((target) => target.push(node));
            }
        }
    }

    // ACTIONS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * Rule 6. definition = what EXISTS, row = what is ALLOWED, intersection wins
     */
    public static effectiveActions(
        definition: FoundationModuleRouteDefinitionType,
        row: FoundationModuleRouteNavType,
    ): FoundationActionEnum[] {
        return definition.actions.filter((action) => row.actions.includes(action));
    }
}
