// file: libs/src/foundation/type.ts

import { FoundationAreaEnum } from "./enum";

export type FoundationAreaType = Record<FoundationAreaEnum, unknown>;

export interface FoundationNavigationActionType {
    label: string;
    icon: string;
    routerLink: string[];
}
