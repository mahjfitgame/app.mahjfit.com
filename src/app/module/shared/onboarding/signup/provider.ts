import { Provider } from '@angular/core';
import { SignupRoute } from './route';
import { SignupService } from './service';
import { SignupState } from './state';

export const SIGNUP_PROVIDER: Provider[] = [
    SignupRoute,
    SignupState,
    SignupService,
];
