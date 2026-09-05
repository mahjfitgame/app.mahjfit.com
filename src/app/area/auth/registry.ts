// file: src/app/area/auth/registry.ts

import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationAreaBuilder } from '@libs/foundation/area/builder';
import { FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationAreaBuildType, FoundationAreaRegistryType } from '@libs/foundation/area/type';
import { AuthAreaRoute } from '@area/auth/route';
import { ForgotPasswordRoute } from '@module/shared/preboarding/forgot-password/route';
import { RecoverPasswordRoute } from '@module/shared/preboarding/recover-password/route';
import { SigninRoute } from '@module/shared/preboarding/signin/route';
import { SignupRoute } from '@module/shared/preboarding/signup/route';
import { SignoutRoute } from '@module/shared/onboarding/signout/route';
import { HomeRoute } from '@module/business/home/route';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';

export class AuthAreaRegistry {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly key = FoundationAreaEnum.AUTH;

    public static readonly modules: FoundationAreaRegistryType = {
        [AuthAreaRoute.registryKey]: AuthAreaRoute,

        // SHARED MODULES
        [SignupRoute.registryKey]: SignupRoute,
        [SigninRoute.registryKey]: SigninRoute,
        [ForgotPasswordRoute.registryKey]: ForgotPasswordRoute,
        [RecoverPasswordRoute.registryKey]: RecoverPasswordRoute,
        [SignoutRoute.registryKey]: SignoutRoute,

        // BORROWED — the open area owns the route, this area shows a menu entry
        [HomeRoute.registryKey]: HomeRoute,               // .area = OPEN
    };

    // NAVS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** ⚠ THE SWAP POINT — the only method that changes when the api lands */
    public static navs(): FoundationModuleRouteNavType[] {
        return [
            ...Object.values(this.modules).map((module) => module.nav()),

            // BORROWED NAV OVERRIDES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
            {
                ...HomeRoute.nav(),
                area_key: this.key,
                parent_key: AuthAreaRoute.registryKey,
                sort_order: 0,
                /** the footer bar only — the auth area has no sidebar menu */
                nav_position: [FoundationNavPositionEnum.BOTTOM],
            },
        ];
    }

    // BUILD ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    private static built: FoundationAreaBuildType | null = null;

    public static build(): FoundationAreaBuildType {
        return (this.built ??= FoundationAreaBuilder.build(this.key, this.modules, this.navs()));
    }
}
