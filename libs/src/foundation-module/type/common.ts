// file: libs/src/base-module/type/common.ts

import { FoundationModuleAreaEnum } from "../enum";

export type FoundationModuleAreaType = Record<FoundationModuleAreaEnum, unknown>;

export interface FoundationModuleNavigationActionType {
    label: string;
    icon: string;
    routerLink: string[];
}
