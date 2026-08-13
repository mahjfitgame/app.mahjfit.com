import { CanMatchFn, GuardResult, PartialMatchRouteSnapshot, Route, Router, UrlSegment } from "@angular/router";
import { SigninRoute } from "../../shared/onboarding/signin/route";
import { inject } from "@angular/core";
import { SLUG_OPEN_AREA } from "src/app/area/open/slug";
import { SLUG_GAME, SLUG_GAME_KEYID } from "./slug";
import { UrlService } from "@libs/url/service";
import { GameState } from "./state/state";

// file: src/app/module/business/game/gaurd.ts
export class GameGuard {
    public static CanMatchCreateNewAndRedirect: CanMatchFn = async (
        route: Route,
        segments: UrlSegment[],
        currentSnapshot: PartialMatchRouteSnapshot
    ): Promise<GuardResult> => {
        const state = inject(GameState);
        const router = inject(Router);

        const moduleLevel = [SLUG_OPEN_AREA, SLUG_GAME];

        const gameCreatedResp = await state.createGame();

        if (!gameCreatedResp) return false;

        const params = { [`:${SLUG_GAME_KEYID}`]: gameCreatedResp?.keyid };

        const redirect = UrlService.getAbsolutePath(moduleLevel, params);

        // if accessing authenticated route without being authenticated then redirect to signin page
        return router.parseUrl(redirect);
    };


    public static CanMatchVerifyStartGame: CanMatchFn = async (
        route: Route,
        segments: UrlSegment[],
        currentSnapshot: PartialMatchRouteSnapshot
    ): Promise<GuardResult> => {
        const state = inject(GameState);
        const router = inject(Router);

        const redirect = '/game';

        await state.whenReady();
        state.startGame();

        // verify game is started 
        return true;
    };
}