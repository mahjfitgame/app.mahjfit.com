// file: libs/src/auth-session/service.ts
import { inject, Service } from "@angular/core";
import { AuthSessionState } from "./state";


@Service()
export class AuthSessionService {
    public readonly state = inject(AuthSessionState);
    constructor() {
    }
}