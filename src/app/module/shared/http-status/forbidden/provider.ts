// file: src/app/module/shared/http-status/forbidden/provider.ts
import { Provider } from '@angular/core';
import { HttpStatusForbiddenRoute } from './route';
import { HttpStatusForbiddenService } from './service';
import { HttpStatusForbiddenState } from './state';

export const HTTP_STATUS_FORBIDDEN_PROVIDER: Provider[] = [
    HttpStatusForbiddenRoute,
    HttpStatusForbiddenState,
    HttpStatusForbiddenService,
];
