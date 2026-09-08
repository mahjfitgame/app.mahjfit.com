// file: libs/src/foundation/action/type.ts
/**
 * @FoundationActionRouteConfigType
 * one row = everything FoundationActionRoute needs for one routable action
 */
export interface FoundationActionRouteConfigType {
    /** the route `path` */
    slug: string;
    /** GL.* breadcrumb label key */
    labelKey: string;
    /** appended to the module's breadcrumbAlias, e.g. 'Create' -> countryCreate */
    aliasSuffix: string;
}