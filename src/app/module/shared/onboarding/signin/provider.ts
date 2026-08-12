import { Provider } from '@angular/core';
import { SigninRoute } from './route';
import { SigninService } from './service';
import { SigninState } from './state';

export const SIGNIN_PROVIDER: Provider[] = [
    SigninRoute,
    SigninState,
    SigninService,
];
