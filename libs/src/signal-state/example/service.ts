// file: ./libs/src/signal-state/example/service.ts
import { inject, Injectable, Service } from '@angular/core';
import { StateExample } from './state';
import { BfwApiService } from '@libs/third-party-apis/bfw-api/service';
import { Country, CountryFindInputDto, CountryFindOutputDto, CountryFindOutputSelectionSchema } from '@bfw/api-sdk/graphql/endpoints/shared';
import { RecordSortDirectionEnum } from '@bfw/api-sdk/graphql/libs/crud.enum';
// there is @Service(): https://angular.dev/essentials/dependency-injection#what-are-services

@Service({ autoProvided: false })
export class ServiceExample {
    public state = inject(StateExample);
    

    constructor() {

    }

    
}