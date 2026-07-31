// ./src/app/area/auth/route.ts
import { Routes } from '@angular/router';
import { SLUG_AUTH_AREA } from '@area/auth/slug';
import { UrlService } from '@libs/url/service';
import { SigninRoute } from '@module/shared/onboarding/signin/route';
import { SLUG_SIGNIN } from '@module/shared/onboarding/signin/slug';
import { SignoutRoute } from '@module/shared/onboarding/signout/route';
import { ForgotPasswordRoute } from 'src/app/module/shared/onboarding/forgot-password/route';
import { SignupRoute } from 'src/app/module/shared/onboarding/signup/route';

export class AuthAreaRoute {
    public static readonly moduleLevel = [SLUG_AUTH_AREA];

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routes()
     * need to merge with app routes [src/app/area/open/route.ts]
     */
    public static routes(): Routes {
        
        const routes: Routes = [
            {
                path: SLUG_AUTH_AREA,
                loadComponent: () => import('@area/auth/component').then((c) => c.AuthAreaLayoutComponent),
                children: [
                    {
                        path: "",
                        redirectTo: SLUG_SIGNIN,
                        pathMatch: "full",
                    },
                    ...SignupRoute.routes(),
                    ...SigninRoute.routes(),
                    ...SignoutRoute.routes(),
                    ...ForgotPasswordRoute.routes(),
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