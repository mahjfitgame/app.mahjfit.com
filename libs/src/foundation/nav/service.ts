// file: libs/src/foundation/nav/service.ts
import { inject, isDevMode, Service, Signal } from '@angular/core';
import { isActive, Router } from '@angular/router';
import { FoundationAreaEnum } from '../enum';
import { FoundationModulePath } from '../module/path';
import { FoundationAreaRegistryClassType } from '../area/type';
import { FoundationNavPositionEnum } from './enum';
import { FoundationNavItemPositionMapType, FoundationNavItemType, FoundationNavNodeType } from './type';
import { FoundationNavState } from './state';

/**
 * @FoundationNavService
 * turns one area's build output into renderable menus
 *
 * the builder already produced the tree. this only attaches the two things it
 * could not: a `selected` signal needs a Router which does not exist at
 * provideRouter() time, and a borrowed row's url belongs to an area that may
 * not have been built when its own area was
 */
@Service()
export class FoundationNavService {
    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly state = inject(FoundationNavState);
    private readonly router = inject(Router);

    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** per area, decorated on first mount. not a signal, there is no reactive input */
    private readonly _trees = new Map<FoundationAreaEnum, FoundationNavItemPositionMapType>();

    // READS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** every menu of an area, decorated once. all five positions share one build */
    public positions(registry: FoundationAreaRegistryClassType): FoundationNavItemPositionMapType {
        const cached = this._trees.get(registry.key);

        if (cached) return cached;

        /** registry.build() is itself cached, so this is the tree the routes came from */
        const built = registry.build().nav;
        const decorated: FoundationNavItemPositionMapType = {};

        for (const position in built) {
            decorated[position] = FoundationNavService.decorate(built[position], this.router);
        }

        this._trees.set(registry.key, decorated);

        return decorated;
    }

    /**
     * one menu. `position` is the ONLY thing a nav component chooses, which rows
     * are in it, in what order and under which parent is entirely data
     *
     * an unused position returns [] rather than undefined, so a template can
     * bind all five and render nothing where there is nothing
     */
    public items(
        registry: FoundationAreaRegistryClassType,
        position: FoundationNavPositionEnum = FoundationNavPositionEnum.START,
    ): FoundationNavItemType[] {
        return this.positions(registry)[position] ?? [];
    }

    // EXPANSION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** a panel follows its route UNLESS the user has toggled it */
    public isExpanded(item: FoundationNavItemType): boolean {
        return this.state.expandOverride()[item.registry_key] ?? item.selected();
    }

    public onExpandedChange(item: FoundationNavItemType, expanded: boolean): void {
        this.state.setExpandOverride(item.registry_key, expanded);
    }

    // DECORATE ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** static so a spec can call it with a literal tree and a stub Router, no TestBed */
    public static decorate(
        nodes: FoundationNavNodeType[],
        router: Router,
    ): FoundationNavItemType[] {
        return nodes.map((node) => {
            /**
             * ⚠ THE DEAD LINK GUARANTEE, moved here from the builder. by mount
             * every area has merged its paths, so a key that still resolves to
             * nothing is owned by no area at all: a typo or a stale db row
             */
            const url = node.url ?? FoundationModulePath.of(node.registry_key);

            if (isDevMode() && (!url || url === '/')) {
                console.error(`[nav] "${node.registry_key}" resolves to no path, no area owns it`);
            }

            return {
                ...node,
                url,
                selected: FoundationNavService.selectedFor(url, router),
                children: FoundationNavService.decorate(node.children, router),
            };
        });
    }

    private static selectedFor(url: string, router: Router): Signal<boolean> {
        return isActive(url, router, {
            /** ⚠ '/' MUST be exact, the root UrlTree is contained in every url */
            paths: url === '/' ? 'exact' : 'subset',
            /** load bearing: geo/country writes ;cp=3 into its own segment */
            matrixParams: 'ignored',
            queryParams: 'ignored',
            fragment: 'ignored',
        });
    }
}
