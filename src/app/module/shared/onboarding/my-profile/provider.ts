import { Provider } from '@angular/core';
import { MyProfileRoute } from './route';
import { MyProfileService } from './service';
import { MyProfileState } from './state';

export const MY_PROFILE_PROVIDER: Provider[] = [
    MyProfileRoute,
    MyProfileState,
    MyProfileService,
];
