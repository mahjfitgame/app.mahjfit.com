// ./src/app/module/shared/http-status/under-maintenance/route.ts
import { Routes } from '@angular/router';
import { SLUG_UNDER_MAINTENANCE } from '@module/shared/http-status/under-maintenance/slug';


// need to merge with app routes [src/app/app.routes.ts] 
export const underMaintenanceRoutes: Routes = [
     {
        path: SLUG_UNDER_MAINTENANCE,
        title: 'Under Maintenance',
        loadComponent: () => import('@module/shared/http-status/under-maintenance/component').then((c) => c.UnderMaintenanceComponent),
    },
];
