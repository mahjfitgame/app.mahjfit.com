// file: ./src/app/base/crud/route.ts
import { Route } from "@angular/router";
import { SLUG_CRUD, SLUG_CRUD_CREATE, SLUG_CRUD_UPDATE } from "@base/crud/slug";

export class CrudRoute {
    public static wildcard(routeInfo?: Partial<Route>): Route {
        const route: Partial<Route> = {
            path: SLUG_CRUD + '/**',
            ...routeInfo
        };
        return route;
    }
    public static create(routeInfo?: Partial<Route>): Route {
        const route: Partial<Route> = {
            path: SLUG_CRUD_CREATE,
            ...routeInfo
        };
        return route;
    }
    public static update(routeInfo?: Partial<Route>): Route {
        const route: Partial<Route> = {
            path: SLUG_CRUD_UPDATE,
            ...routeInfo
        };
        return route;
    }
}