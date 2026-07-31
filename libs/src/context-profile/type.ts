// file: libs/src/context-profile/type.ts

import type { JwtPayload } from "jwt-decode";

export interface ContextProfileSessionPayload extends JwtPayload {
    kl?: boolean;
}
