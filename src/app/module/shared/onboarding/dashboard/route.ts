// ./src/app/module/shared/onboarding/dashboard/route.ts
import { Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_DASHBOARD } from '@module/shared/onboarding/dashboard/slug';
import { SLUG_PRIVATE_AREA } from '@area/private/slug'

export class DashboardRoute {
    public static readonly moduleLevel = [SLUG_PRIVATE_AREA, SLUG_DASHBOARD];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/private/route.ts]
     */
    public static routes(): Routes {
        const routes: Routes = [
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