// file: src/app/module/shared/http-status/service-unavailable/provider.ts
import { Provider } from '@angular/core';
import { HttpStatusServiceUnavailableRoute } from './route';
import { HttpStatusServiceUnavailableService } from './service';
import { HttpStatusServiceUnavailableState } from './state';

export const HTTP_STATUS_SERVICE_UNAVAILABLE_PROVIDER: Provider[] = [
    HttpStatusServiceUnavailableRoute,
    HttpStatusServiceUnavailableState,
    HttpStatusServiceUnavailableService,
];
