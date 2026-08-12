import { Provider } from '@angular/core';
import { GeoCountryRoute } from './route';
import { GeoCountryService } from './service';
import { GeoCountryState } from './state';

export const GEO_COUNTRY_PROVIDER: Provider[] = [
    GeoCountryRoute,
    GeoCountryState,
    GeoCountryService,
];
