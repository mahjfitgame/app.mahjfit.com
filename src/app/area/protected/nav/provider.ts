// file: src/app/area/protected/nav/provider.ts
import { Provider } from '@angular/core';
import { ProtectedNavService } from './service';
import { ProtectedNavState } from './state';

export const PROTECTED_NAV_PROVIDER: Provider[] = [
    ProtectedNavState,
    ProtectedNavService
];
