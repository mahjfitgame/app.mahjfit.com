// ./src/app/area/private/route.ts

import { Routes } from '@angular/router';
import { UrlService } from '@libs/url/service';
import { SLUG_PRIVATE_AREA } from '@area/private/slug';
import { SLUG_DASHBOARD } from '@module/shared/onboarding/dashboard/slug';
import { DashboardRoute } from '@module/shared/onboarding/dashboard/route';
import { MyProfileRoute } from '@module/shared/onboarding/my-profile/route';
import { GeoRoute } from '@module/shared/geo/route';
import { GameRoute } from '@module/business/game/route';

export class PrivateAreaRoute {
    public static readonly moduleLevel = [SLUG_PRIVATE_AREA];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/open/route.ts]
     */
    public static routes(): Routes {
        
        const routes: Routes = [
            {
                path: SLUG_PRIVATE_AREA,
                canActivate: [], // protects all children at once
                loadComponent: () => import('@area/private/component').then((c) => c.PrivateAreaLayoutComponent),
                data: {
                    breadcrumb: {
                        info: { 
                            icon: 'home', 
                            iconOnly: true
                        },
                    },
                },
                children: [
                    {
                        path: "",
                        redirectTo: SLUG_DASHBOARD,
                        pathMatch: "full",
                    },
                    // SHARED MODULE ROUTES
                    ...DashboardRoute.routes(),
                    ...MyProfileRoute.routes(),
                    ...GeoRoute.routes(),


                    // BUSINESS MODULE ROUTES
                    
                ]
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