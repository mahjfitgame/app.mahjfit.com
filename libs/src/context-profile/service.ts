// file: libs/src/context-profile/service.ts
import { inject, Service } from "@angular/core";
import { ContextProfileState } from "./state";


@Service()
export class ContextProfileService {
    public readonly state = inject(ContextProfileState);
    constructor() {
    }
}