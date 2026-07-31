// ./src/app/module/shared/http-status/under-maintenance/route.ts
import { Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_UNDER_MAINTENANCE } from '@module/shared/http-status/under-maintenance/slug';

export class UnderMaintenanceRoute {
    public static readonly moduleLevel = [SLUG_UNDER_MAINTENANCE];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/open/route.ts]
     */
    public static routes(): Routes {
        
        const routes: Routes = [
            {
                path: SLUG_UNDER_MAINTENANCE,
                title: 'Under Maintenance',
                loadComponent: () => import('@module/shared/http-status/under-maintenance/component').then((c) => c.UnderMaintenanceComponent),
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