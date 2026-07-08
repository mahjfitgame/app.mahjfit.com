// ./src/app/area/open/route.ts
import { Routes } from '@angular/router';
import { SLUG_OPEN_AREA } from './slug';
import { authAreaRoutes } from '../auth/route';
import { privateAreaRoutes } from '../private/route';
import { underMaintenanceRoutes } from '../../module/shared/http-status/under-maintenance/route';
import { bussAreaRoutes } from 'src/app/module/business/route';

// need to merge with app routes [src/app/app.routes.ts] 
export const openAreaRoutes: Routes = [
     {
        path: SLUG_OPEN_AREA, // this can be like "admin" or "" (empty) as per project base but will be fixed for each project
        children: [
            ...authAreaRoutes, // has its own layout to match auth screens
            ...privateAreaRoutes, // has its own layout to match logged in account
            ...bussAreaRoutes,
            {
                path: '', // has its own layout to match general pages
                loadComponent: () => import('@area/open/layout.component').then((c) => c.OpenAreaLayoutComponent),
                children: [
                    ...underMaintenanceRoutes
                ],
            },
        ],
    },
];
