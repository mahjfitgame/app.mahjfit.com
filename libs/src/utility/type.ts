// file: libs/src/utility/type.ts
import { SignalStateService } from "@libs/signal-state/service";
import { AppAreaEnum } from "./enum";
import { Signal } from "@angular/core";
import { Routes } from "@angular/router";

export type AppAreaType = Record<AppAreaEnum, unknown>;

export interface AppModuleStateType {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** Persistent state storage key for module */
    storeKey: string;

    /** 
     * Debug helper (template-friendly): shows the state info as set. 
     * Comment this property in production mode to reduce memory usage and browser load
     */
    debugState?: Signal<unknown>;

    // LISTENERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    onActivate(): void;
    onDeactivate(): void;
}
export interface AppModuleServiceType {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** Module owned state */
    state: SignalStateService;

    // METHODS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** Initialization i18n key setup */
    initI18n(): void

    /** Set module info in layout */
    setModuleInfo(): void;

    /** Alter breadcrumbs of modules */
    alterBreadcrumb(): void;
}