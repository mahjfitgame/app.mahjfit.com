// file: src/app/module/shared/preboarding/recover-password/provider.ts
import { Provider } from "@angular/core";
import { RecoverPasswordRoute } from "./route";
import { RecoverPasswordState } from "./state";
import { RecoverPasswordService } from "./service";

export const RECOVER_PASSWORD_PROVIDER: Provider[] = [
    RecoverPasswordRoute,
    RecoverPasswordState,
    RecoverPasswordService,
];