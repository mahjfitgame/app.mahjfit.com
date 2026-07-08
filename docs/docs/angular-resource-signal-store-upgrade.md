# Angular Resource API + NgRx Signal Store upgrade sketch

This repo is already on Angular `^21.2.x` and `@ngrx/signals` `^21.0.x`, so the Resource API can be evaluated without a framework upgrade. In Angular v21 the Resource APIs are still marked experimental, so this is a recommended pilot pattern for new read-only screens or dropdown/reference-data loaders before moving the shared CRUD engine.

## Why this is worth trying

Use Resource API where the async operation is a **read** and the request can be expressed from signals:

- `resource` / `rxResource` gives a first-class signal wrapper for `value`, `isLoading`, `error`, `status`, and `reload`.
- Request changes automatically cancel stale in-flight loads when a newer request is emitted.
- Components read signals directly instead of managing `loading` booleans, `subscribe`, and error state manually.
- NgRx Signal Store remains the state boundary; the resource can live in `withProps`, while `withComputed` exposes clean view-model signals.

Do **not** use `resource` for create/update/delete mutations. Angular documents `resource` as intended for reads, because it may cancel in-progress work when a new request arrives.

## Where it maps in the current code

Current country listing flow:

1. `GeoCountryService` registers a callback with `CrudService.registerFind(...)`.
2. `CrudService.loadListing(...)` prepares `CrudFindInputType`, starts the global progress bar, calls the registered `find`, then syncs URL state.
3. `GeoCountryService.find(...)` calls the GraphQL SDK, validates pagination, and manually patches CRUD state/data-source values.

A Resource/Signal Store version can keep the existing `CrudFindInputType` and SDK selection/filter shape, but move the read lifecycle into a feature-scoped store.

## Possible upgrade: module-level signal store for country listing

Create a store beside the country module, for example:

```ts
// src/app/module/shared/geo/country/country-listing.store.ts
import { computed, inject } from '@angular/core';
import { resource } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import {
  Country,
  CountryFindOutputDto,
  CountryFindOutputSelectionSchema,
} from '@bfw/api-sdk/graphql/endpoints/shared';
import { RecordSortDirectionEnum } from '@bfw/api-sdk/graphql/libs/crud.enum';
import { BfwApiService } from '@libs';
import { CRUD_DEF_PRIMARY_KEY_NAME } from 'src/app/base/crud/constant';

interface CountryListingRequest {
  currentPage: number;
  rowsPerPage: number;
  quickSearch: string | null;
}

interface CountryListingState {
  request: CountryListingRequest;
}

const initialState: CountryListingState = {
  request: {
    currentPage: 1,
    rowsPerPage: 10,
    quickSearch: null,
  },
};

export const CountryListingStore = signalStore(
  withState(initialState),
  withProps((store) => {
    const api = inject(BfwApiService);

    const listingResource = resource<CountryFindOutputDto, CountryListingRequest>({
      request: () => store.request(),
      defaultValue: {
        total: 0,
        take: store.request().rowsPerPage,
        remain: 0,
        pages: 0,
        pagination: null as any,
        rows: [],
      },
      loader: async ({ request }) => {
        api.sdk.graphql.use(Country);

        const pk = CRUD_DEF_PRIMARY_KEY_NAME;
        const skip = (request.currentPage - 1) * request.rowsPerPage;

        const selection: CountryFindOutputSelectionSchema = {
          total: true,
          take: true,
          remain: true,
          pages: true,
          pagination: {
            current: { count: true, page: true, skip: true },
            first: { count: true, page: true, skip: true },
            previous: { count: true, page: true, skip: true },
            next: { count: true, page: true, skip: true },
            last: { count: true, page: true, skip: true },
          },
          rows: {
            [pk]: true,
            name: true,
            capital: true,
            currency: true,
            currency_name: true,
            currency_symbol: true,
            emoji: true,
            iso_ii: true,
            iso_iii: true,
            fr_region: { id: true, name: true },
            fr_subregion: { id: true, name: true },
          },
        };

        return api.sdk.graphql.country.find({
          selection,
          filter: {
            take: request.rowsPerPage,
            skip,
            order: { name: RecordSortDirectionEnum.ASC },
            withDeleted: false,
            where: [
              request.quickSearch ? ({ name: { contains: request.quickSearch } } as any) : {},
            ],
          },
        });
      },
    });

    return { listingResource };
  }),
  withComputed((store) => ({
    listingData: computed(() => store.listingResource.value()),
    rows: computed(() => store.listingResource.value().rows ?? []),
    totalRecords: computed(() => Number(store.listingResource.value().total ?? 0)),
    isLoading: computed(() => store.listingResource.isLoading()),
    loadError: computed(() => store.listingResource.error()),
  })),
  withMethods((store) => ({
    setPage(currentPage: number, rowsPerPage = store.request().rowsPerPage): void {
      patchState(store, {
        request: {
          ...store.request(),
          currentPage,
          rowsPerPage,
        },
      });
    },
    setQuickSearch(quickSearch: string | null): void {
      patchState(store, {
        request: {
          ...store.request(),
          currentPage: 1,
          quickSearch,
        },
      });
    },
    reload(): void {
      store.listingResource.reload();
    },
  })),
);
```

Provide it at the module component level so each country page instance owns its own request/resource lifecycle:

```ts
@Component({
  // ...existing metadata
  providers: [
    URL_PROVIDER,
    CRUD_PROVIDER,
    GeoCountryStateRuntime,
    GeoCountryService,
    CountryListingStore,
  ],
})
export class GeoCountryComponent {}
```

Then the component or service can read the store directly:

```ts
export class GeoCountryComponent {
  public readonly countryListing = inject(CountryListingStore);

  public onPageChange(event: AppPaginationEvent): void {
    this.countryListing.setPage(event.pageIndex, event.pageSize);
  }
}
```

Template usage becomes declarative:

```html
@if (countryListing.isLoading()) {
<app-progress-bar />
} @if (countryListing.loadError(); as error) {
<app-notify-banner [message]="error.message" />
} @for (row of countryListing.rows(); track row.id) {
<div>{{ row.name }}</div>
}
```

## Bridge pattern for the existing CRUD engine

If you do not want to rewrite CRUD templates immediately, keep `CrudStateRuntime` as the view-model adapter and let the Resource store own the network read:

```ts
// inside GeoCountryService after injecting CountryListingStore
private readonly countryListing = inject(CountryListingStore);
private readonly syncListingResourceToCrudState = effect(() => {
    const data = this.countryListing.listingData();

    this.crud.state.setListingData(data);
    this.crud.state.setListingDataSource(data.rows ?? []);
    this.crud.state.setTotalRecords(Number(data.total ?? 0));
    this.crud.state.setRowsPerPageValue(Number(data.take ?? this.countryListing.request().rowsPerPage));
    this.crud.state.setCurrentPageValue(Number(data.pagination?.current?.page ?? 1));
});
```

In that bridge mode, replace `loadListing()` network calls with `countryListing.setPage(...)` / `countryListing.reload()`, but keep the current Material table, pagination, URL sync, and selection code untouched.

## `rxResource` option for HttpClient / Observables

Use `rxResource` when the loader is naturally an RxJS `Observable` (for example, `HttpClient.get`). This keeps cancellation/subscription cleanup automatic and avoids manual `takeUntilDestroyed` for simple reads:

```ts
import { rxResource } from '@angular/core/rxjs-interop';

const regionsResource = rxResource({
  request: () => ({ activeOnly: true }),
  defaultValue: [],
  loader: ({ request }) => this.http.get<RegionDto[]>('/api/regions', { params: request }),
});
```

## Recommended rollout

1. Start with a new small module or a read-only reference-data dropdown.
2. Use module-scoped Signal Store + `withProps` resource + `withComputed` view-model signals.
3. Keep mutations in explicit `withMethods` service calls, not `resource`.
4. For the current country CRUD screen, first try the bridge pattern so existing table/URL/selection logic remains stable.
5. After the API becomes stable in the Angular version you target, consider moving common listing request/resource behavior into a reusable CRUD Signal Store feature.

## Official references checked

- Angular `Resource` API: https://angular.dev/api/core/Resource
- Angular `resource` API: https://angular.dev/api/core/resource
- Angular `rxResource` API: https://angular.dev/api/core/rxjs-interop/rxResource
- NgRx Signal Store guide: https://ngrx.io/guide/signals/signal-store
