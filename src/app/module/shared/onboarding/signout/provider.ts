import { Provider } from '@angular/core';
import { SignoutRoute } from './route';
import { SignoutService } from './service';
import { SignoutState } from './state';

export const SIGNOUT_PROVIDER: Provider[] = [
    SignoutRoute,
    SignoutState,
    SignoutService,
];
