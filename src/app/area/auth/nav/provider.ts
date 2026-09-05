import { Provider } from '@angular/core';
import { AuthNavService } from './service';
import { AuthNavState } from './state';

export const AUTH_NAV_PROVIDER: Provider[] = [
    AuthNavState,
    AuthNavService
];
