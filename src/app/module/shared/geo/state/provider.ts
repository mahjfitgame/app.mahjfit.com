import { Provider } from '@angular/core';
import { GeoStateRoute } from './route';
import { GeoStateService } from './service';
import { GeoStateState } from './state';

export const GEO_STATE_PROVIDER: Provider[] = [
    GeoStateRoute,
    GeoStateState,
    GeoStateService,
];
