// file: src/app/area/private/type.ts
import { Portal } from "@angular/cdk/portal";

export interface PrivateAreaModuleInfoType {
    icon: string | null,
    url: string | null,
    title: string | null, 
    hint: string | null,
    i18n: null | {
        title: string | null,
        hint: string | null
    }
}

export type SlotEndSideBarTabLabelType = Portal<any>;
export type SlotEndSideBarTabBodyType = Portal<any>;
export type EndSideBarOnCloseType = Record<string, (() => void) | null> | null;