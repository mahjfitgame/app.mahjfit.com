// file: src/app/area/guard.ts
import { inject } from "@angular/core";
import { type CanMatchFn, type CanActivateFn, type CanActivateChildFn, type CanDeactivateFn, type Route, type UrlSegment, type PartialMatchRouteSnapshot, type GuardResult, Router, RedirectCommand } from "@angular/router";
import { SLUG_FOUNDATION_PARAM_PUBLICID } from "@libs/foundation/const";
import { ContextProfileService } from "@libs/context-profile/service";
import { DashboardRoute } from "src/app/module/shared/dashboard/route";
import { SigninRoute } from "@module/shared/preboarding/signin/route";
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
            const redirectUrl = 
                ctxp.state.useRedirectAfterAuth()
                ?? DashboardRoute.absolutePath();
            
            // do not allow to go back from browser back button as its unexpected
            return new RedirectCommand(
                router.parseUrl(redirectUrl), 
                { 
                    replaceUrl: true 
                }
            );
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
        if(ctxp.state.authenticated()){
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
        if(ctxp.state.authenticated()){
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
        // do not allow to go back using browser back button
        return new RedirectCommand(
            router.parseUrl(SigninRoute.absolutePath()), 
            { 
                replaceUrl: true 
            }
        );
    };

    public static CanMatchRemnantAuthenticated: CanMatchFn = async (
        route: Route,
        segments: UrlSegment[],
        currentSnapshot: PartialMatchRouteSnapshot
    ): Promise<GuardResult> => {
        const ctxp = inject(ContextProfileService);
        const router = inject(Router);

        // valid, expired or forged, if it is in the browser it must be clearable
        if (ctxp.state.sessionRemnant()) {
            return true;
        }

        // genuinely nothing left to sign out of
        return new RedirectCommand(
            router.parseUrl(SigninRoute.absolutePath()),
            { replaceUrl: true }
        );
    };

    public static CanMatchPublicid: CanMatchFn = async (
        route: Route,
        segments: UrlSegment[],
        currentSnapshot: PartialMatchRouteSnapshot
    ): Promise<GuardResult> => {
        const ctxp = inject(ContextProfileService);
        
    const publicid = currentSnapshot.paramMap.get(SLUG_FOUNDATION_PARAM_PUBLICID)?.trim();
        if(publicid){
            const check = ctxp.state.validatePublicid(publicid);
            return check;
        }
        return false;
    };
}