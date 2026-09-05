import { Provider } from '@angular/core';
import { PrivateNavService } from './service';
import { PrivateNavState } from './state';

export const PRIVATE_NAV_PROVIDER: Provider[] = [
    PrivateNavState,
    PrivateNavService
];
