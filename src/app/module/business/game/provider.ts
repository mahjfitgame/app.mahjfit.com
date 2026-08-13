import { Provider } from '@angular/core';
import { GameRoute } from './route';
import { GameService } from './service';
import { GameHeptic } from './haptics';
import { GameState } from './state/state';

export const GAME_PROVIDER: Provider[] = [
    GameRoute,
    GameState,
    GameHeptic,
    GameService,
];

export const GAME_ROUTE_PROVIDER: Provider[] = []
