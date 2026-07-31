// ./src/app/area/open/route.ts
import { Routes } from '@angular/router';
import { SLUG_OPEN_AREA } from './slug';
import { AuthAreaRoute } from '../auth/route';
import { PrivateAreaRoute } from '../private/route';
import { UnderMaintenanceRoute } from '../../module/shared/http-status/under-maintenance/route';
import { UrlService } from '@libs/url/service';
import { GameRoute } from 'src/app/module/business/game/route';

export class OpenAreaRoute {
    public static readonly moduleLevel = [SLUG_OPEN_AREA];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/open/route.ts]
     */
    public static routes(): Routes {
        
        const routes: Routes = [
            {
                path: SLUG_OPEN_AREA, // this can be like "admin" or "" (empty) as per project base but will be fixed for each project
                children: [
                    ...AuthAreaRoute.routes(), // has its own layout to match auth screens
                    ...PrivateAreaRoute.routes(), // has its own layout to match logged in account

                    ...GameRoute.routes(),
                    {
                        path: '', // has its own layout to match general pages
                        loadComponent: () => import('@area/open/layout.component').then((c) => c.OpenAreaLayoutComponent),
                        children: [
                            ...UnderMaintenanceRoute.routes(), // has its own layout to match general pages
                        ],
                    },
                ],
            },
        ];

        return routes;
    }

    // ABSOLUTE PATH ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static absolutePathArr(): string[] {
        const moduleLevel = this.moduleLevel;
        const params = {};

        return UrlService.getAbsolutePathArr(this.moduleLevel, params);
    }
    public static absolutePath(): string {
        const moduleLevel = this.moduleLevel;
        const params = {};
        return UrlService.getAbsolutePath(moduleLevel, params);
    }
}