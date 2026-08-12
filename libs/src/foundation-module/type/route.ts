// file: libs/src/base-module/type/route.ts
import { ActivatedRoute, Router, Routes } from "@angular/router";

/**
 * @BaseModuleRouteType
 * NOT IN USE
 * not in use as in modules this class holds static properties and methods
 * we defined it to have a blue print some where as secure code
 */
export interface FoundationModuleRouteType {
    // ████ DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** holds active route DI */
    activeRoute: ActivatedRoute;

    /** holds router DI */
    router: Router;

    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // keep adding static properties as comment here
    /** STTAIC: holds where module is located in app area */
    //moduleLevel: string[];


    // METHODS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    /** STTAIC: returns module routes */
    //routes(): Routes;

    /** STTAIC: returns module absolute path as an array */
    //absolutePathArr(): string[];

    /** STTAIC: returns module absolute path as a string */
    //absolutePath(): string;
}