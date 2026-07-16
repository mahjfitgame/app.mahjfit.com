// file: libs/src/auth-session/service.ts
import { inject, Service } from "@angular/core";
import { ClientSessionState } from "./state";


@Service()
export class ClientSessionService {
    public readonly state = inject(ClientSessionState);
    constructor() {
    }
}