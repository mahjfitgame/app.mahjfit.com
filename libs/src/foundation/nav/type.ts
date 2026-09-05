// file: libs/src/foundation/nav/type.ts
import { Signal } from '@angular/core';
import { FoundationModuleRouteNavType } from '../module/type';

/**
 * @FoundationNavNodeType
 * what the BUILDER emits, plain data, no DI and no signals
 *
 * ⚠ snake_case fields arrived as data, camelCase fields we derived. that is a
 * useful thing to be able to see at a glance (Rule 8)
 */
export interface FoundationNavNodeType extends FoundationModuleRouteNavType {
    /**
     * resolved by the builder, never declared
     * ⚠ null for a BORROWED row: another area owns the path and may not have
     * been built yet, so decorate() fills it in at mount
     */
    url: string | null;

    /** false for a GROUP, a panel rather than a link. derived from definition().component */
    routable: boolean;

    children: FoundationNavNodeType[];
}

/** every menu of one area, keyed by FoundationNavPositionEnum. START always present */
export type FoundationNavPositionMapType = Record<string, FoundationNavNodeType[]>;

/**
 * @FoundationNavItemType
 * what a nav module RENDERS, the node plus its highlight signal
 */
export interface FoundationNavItemType extends Omit<FoundationNavNodeType, 'children' | 'url'> {
    /** always resolved by the time a menu renders, so templates never null check */
    url: string;

    /** ⚠ `active` (boolean, from the row) and `selected` (signal) are different things */
    selected: Signal<boolean>;

    children: FoundationNavItemType[];
}

/** every decorated menu of one area */
export type FoundationNavItemPositionMapType = Record<string, FoundationNavItemType[]>;

/** registry_key -> user toggled expansion state */
export type FoundationNavExpandOverrideType = Record<string, boolean>;
