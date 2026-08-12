// file: src/app/module/business/home/provider.ts
import { Provider } from '@angular/core';
import { HomeService } from './service';
import { HomeState } from './state';

export const HOME_PROVIDER: Provider[] = [
    HomeState,
    HomeService,
];
