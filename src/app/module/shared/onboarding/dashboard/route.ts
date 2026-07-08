// ./src/app/module/shared/onboarding/dashboard/route.ts
import { Routes } from '@angular/router';
import { SLUG_DASHBOARD } from '@module/shared/onboarding/dashboard/slug';

export const dashboardRoutes: Routes = [
     {
        path: SLUG_DASHBOARD,
        title: 'Dashboard',
        loadComponent: () => import('@module/shared/onboarding/dashboard/component').then((c) => c.DashboardComponent),
        data: {
            breadcrumb: {
                label: 'Dashboard',
                alias: 'dashboard',
                info: '',
                routeInterceptor: (routeLink: any, breadcrumb: any)=> {
                    return routeLink;
                }
            },
        },
    },
];
