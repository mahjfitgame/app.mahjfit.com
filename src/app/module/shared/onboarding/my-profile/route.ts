// ./src/app/module/shared/onboarding/my-profile/route.ts

import { inject, Service } from '@angular/core';
import { ActivatedRoute, Router, Routes } from '@angular/router';
import { FoundationModuleRouteType } from '@libs/foundation-module/type/route';
import { UrlService } from '@libs/url/service';
import { SLUG_MY_PROFILE } from '@module/shared/onboarding/my-profile/slug';
import { SLUG_PRIVATE_AREA } from 'src/app/area/private/slug';

@Service({ autoProvided: false })
export class MyProfileRoute implements FoundationModuleRouteType {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly moduleLevel = [SLUG_PRIVATE_AREA, SLUG_MY_PROFILE];

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly activeRoute = inject(ActivatedRoute);
    public readonly router = inject(Router);

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/private/route.ts]
     */
    public static routes(): Routes {

        const routes: Routes = [
            {
                path: SLUG_MY_PROFILE,
                title: 'My Profile',
                loadComponent: () => import('@module/shared/onboarding/my-profile/component').then((c) => c.MyProfileComponent),
                data: {
                    breadcrumb: {
                        label: 'My Profile',
                        alias: 'myProfile',
                        info: '',
                        routeInterceptor: (routeLink: any, breadcrumb: any) => {
                            return routeLink;
                        }
                    },
                },
            },
        ];

        return routes;
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
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

    // NAVIGATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
}
