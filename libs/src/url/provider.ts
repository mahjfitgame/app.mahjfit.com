// file: ./libs/src/url/provider.ts
import { Provider } from "@angular/core";
import { UrlState } from "./state";
import { UrlService } from "./service";

export const URL_PROVIDER: Provider[] = [
    UrlState,
    UrlService,
];
