import { Provider } from '@angular/core';
import { HttpStatusNotFoundRoute } from './route';
import { HttpStatusNotFoundService } from './service';
import { HttpStatusNotFoundState } from './state';

export const HTTP_STATUS_NOT_FOUND_PROVIDER: Provider[] = [
    HttpStatusNotFoundRoute,
    HttpStatusNotFoundState,
    HttpStatusNotFoundService,
];
