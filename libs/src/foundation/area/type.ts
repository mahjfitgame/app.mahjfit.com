// file: libs/src/foundation/module/type.ts
import { Routes } from '@angular/router';
import { FoundationAreaEnum } from '../enum';
import { FoundationNavPositionMapType } from '../nav/type';
import { FoundationModuleRouteNavType, FoundationModuleRouteType } from '../module/type';

/**
 * @FoundationAreaRegistryType
 * = te_authorisation_module, one area's slice of it
 *
 * ⚠ FLAT and COMPLETE. every module any of this area's menus names, borrowed
 * ones included. hierarchy is row.parent_key and order is row.sort_order, both
 * data, so a code declared shape would become a lie the moment someone
 * re-parents a module
 *
 * ⚠ assigning a class value into this record is what type checks its STATIC
 * shape — `implements` cannot, see FoundationModuleRouteType
 */
export type FoundationAreaRegistryType = Record<string, FoundationModuleRouteType>;

/** what one area's build() returns, routes and every menu from a single pass */
export interface FoundationAreaBuildType {
    /** ready for angular, the area node and everything under it */
    routes: Routes;
    /** ready for the nav modules, same tree, split by position */
    nav: FoundationNavPositionMapType;
    /** registry_key -> absolute path, merged into FoundationModulePath */
    paths: ReadonlyMap<string, string>;
}

/** the static shape of an area registry, what FoundationNavService consumes */
export interface FoundationAreaRegistryClassType {
    key: FoundationAreaEnum;
    modules: FoundationAreaRegistryType;
    navs(): FoundationModuleRouteNavType[];
    build(): FoundationAreaBuildType;
}
