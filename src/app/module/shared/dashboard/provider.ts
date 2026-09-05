import { Provider } from '@angular/core';
import { DashboardService } from './service';
import { DashboardState } from './state';

export const DASHBOARD_PROVIDER: Provider[] = [
    DashboardState,
    DashboardService,
];
