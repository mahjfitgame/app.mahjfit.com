import { Provider } from '@angular/core';
import { ForgotPasswordRoute } from './route';
import { ForgotPasswordService } from './service';
import { ForgotPasswordState } from './state';

export const FORGOT_PASSWORD_PROVIDER: Provider[] = [
    ForgotPasswordRoute,
    ForgotPasswordState,
    ForgotPasswordService,
];
