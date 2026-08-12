// file: src/app/area/guard.ts
import { inject } from "@angular/core";
import { type CanMatchFn, type CanActivateFn, type CanActivateChildFn, type CanDeactivateFn, type Route, type UrlSegment, type PartialMatchRouteSnapshot, type MaybeAsync, type GuardResult, Router, ActivatedRoute } from "@angular/router";
import { SLUG_FOUNDATION_MODULE_PARAM_PUBLICID } from "@libs/foundation-module/const";
import { ContextProfileService } from "@libs/context-profile/service";
import { DashboardRoute } from "@module/shared/onboarding/dashboard/route";
import { SigninRoute } from "@module/shared/onboarding/signin/route";
import { SLUG_SIGNOUT } from "@module/shared/onboarding/signout/slug";

export class AreaGuard {
    public static CanMatchUnauthenticated: CanMatchFn = async (
        route: Route,
        segments: UrlSegment[],
        currentSnapshot: PartialMatchRouteSnapshot
    ): Promise<GuardResult> => {
        const ctxp = inject(ContextProfileService);
        const router = inject(Router);

        // if already authenticated then use the saved destination or redirect to dashboard
        if (ctxp.state.authenticated()) {
            const redirectUrl = ctxp.state.useRedirectAfterAuth()
                ?? DashboardRoute.absolutePath();
            return router.parseUrl(redirectUrl);
        }

        // if not authenticated then return true
        return true;
    };

    public static CanMatchAuthenticated: CanMatchFn = async (
        route: Route,
        segments: UrlSegment[],
        currentSnapshot: PartialMatchRouteSnapshot
    ): Promise<GuardResult> => {
        const ctxp = inject(ContextProfileService);

        // if user is already authenticated then return true
        if (ctxp.state.authenticated()) {
            return true;
        }

        // if accessing authenticated route without being authenticated then redirect to home
        return false;
    };

    public static CanMatchAuthenticatedOrRedirect: CanMatchFn = async (
        route: Route,
        segments: UrlSegment[],
        currentSnapshot: PartialMatchRouteSnapshot
    ): Promise<GuardResult> => {
        const ctxp = inject(ContextProfileService);
        const router = inject(Router);

        // if user is already authenticated then return true
        if (ctxp.state.authenticated()) {
            return true;
        }

        // A protected deep link takes priority over the page remembered during sign out.
        // Do not remember signout page url itself as a post-authentication destination.
        if (route.path !== SLUG_SIGNOUT) {
            const attemptedUrl = router.currentNavigation()?.initialUrl;
            if (attemptedUrl) {
                ctxp.state.setRedirectAfterAuth(router.serializeUrl(attemptedUrl));
            }
        }

        // if accessing authenticated route without being authenticated then redirect to signin page
        return router.parseUrl(SigninRoute.absolutePath());
    };

    public static CanMatchPublicid: CanMatchFn = async (
        route: Route,
        segments: UrlSegment[],
        currentSnapshot: PartialMatchRouteSnapshot
    ): Promise<GuardResult> => {
        const ctxp = inject(ContextProfileService);

        const publicid = currentSnapshot.paramMap.get(SLUG_FOUNDATION_MODULE_PARAM_PUBLICID)?.trim();
        if (publicid) {
            const check = ctxp.state.validatePublicid(publicid);
            return check;
        }
        return false;
    };
}