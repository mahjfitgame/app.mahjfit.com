// file: libs/src/signal-state/example/state.ts
import {
  DestroyRef,
  Injectable,
  ResourceRef,
  Service,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  resource,
  signal,

} from '@angular/core';
import { PreferencesLocalStorageService } from '../../preferences-local-storage/service';
import { AppConfigRepository } from '../../sqlite/module/app-config/repository';
import { SignalStateService } from '../service';
import { BrowserTabsSyncService } from '@libs/browser-tabs-sync/service';
import { Country, CountryFindInputDto, CountryFindOutputDto, CountryFindOutputSelectionSchema, UserCreateOutputDto, UserWsToken } from '@bfw/api-sdk/graphql/endpoints/shared';
import { BfwApiService } from '@libs/third-party-apis/bfw-api/service';
import { RecordSortDirectionEnum, RecordSortNullPositionEnum, YesNoEnum } from '@bfw/api-sdk/graphql/libs/crud.enum';
import { PlatformAdapter } from '@libs/platform/adapter';
import { PLATFORM_ADAPTER } from '@libs/platform/provider';
import { SIGNAL_STATE_EXAMPLE_STATE_STORE_KEY } from './const';

type ThemeMode = 'light' | 'dark' | 'system';
@Service({ autoProvided: false })
export class StateExample extends SignalStateService {
  protected override readonly storeKey = SIGNAL_STATE_EXAMPLE_STATE_STORE_KEY;

  //private override readonly destroyRef = inject(DestroyRef);
  private readonly ls = inject(PreferencesLocalStorageService);
  private readonly browserTabsSync = inject(BrowserTabsSyncService);
  private readonly adapter: PlatformAdapter = inject(PLATFORM_ADAPTER);

  public readonly api = inject(BfwApiService);
  private readonly appConfigRepository = inject(AppConfigRepository);

  // Used to avoid saving/broadcasting while initial state is loading from storage.
  private themeModeLoaded = false;

  // Used to avoid broadcasting again when update came from another tab.
  private themeModeSyncingFromOtherTab = false;

  /**
   * SCREEN_WIDTH: Runtime state
   * input: user input | event
   * storage: in memory only
   * 
   * @screenWidthStore: WritableSignal
   * @screenWidth: ReadonlySignal
   * @screenWidthIsXs: computed ReadonlySignal
   * @setScreenWidth: set method
   * @syncScreenWidth: sync state from source
   * @listenScreenWidth: listen to event
   */
  private readonly screenWidthStore: WritableSignal<number> = signal(this.getWindowWidth());
  public readonly screenWidth: Signal<number> = this.screenWidthStore.asReadonly();
  public readonly screenWidthIsXs: Signal<boolean> = computed(() => this.screenWidth() < 600);

  /**
   * THEME_MODE: Persisted state
   * input: user input
   * storage: local storage
   *
   * @themeModeStore: WritableSignal
   * @themeMode: ReadonlySignal
   * @themeModeIsDark: computed ReadonlySignal
   * @loadThemeMode: load state from storage
   * @setThemeMode: set method
   * @listenThemeModeLocalStorage: listen to local storage
   * @listenThemeModeBroadcast: listen to broadcast
   * @effectThemeMode: effect to react to user input or state change
   */

  private readonly themeModeStore: WritableSignal<ThemeMode | null> = signal<ThemeMode | null>(null);
  public readonly themeMode: Signal<ThemeMode | null> = this.themeModeStore.asReadonly();
  public readonly themeModeIsDark: Signal<boolean> = computed(() => this.themeMode() === 'dark');

  /**
   * GEO_CONTRY: Persisted state
   * input: user input
   * storage: server side cache using api
   * 
   * @geoCountryIdStore: WritableSignal
   * @geoCountryId: ReadonlySignal
   * @geoCountryNextPage: computed ReadonlySignal
   * @geoCountryResource: Resource retrival from server using api
   * @setGeoCountryId: set method
   * @loadGeoCountry: load state from storage
   */
  private readonly geoCountryIdStore: WritableSignal<number> = signal<number>(0);
  public readonly geoCountryId: Signal<number> = this.geoCountryIdStore.asReadonly();
  public readonly geoCountryNextPage: Signal<number> = computed(() => this.geoCountryId() + 1);
  private readonly countryNameStore = this.serverSyncSignal<string | null>(
    'countryName',
    null,
    {

      validate: (value): value is string | null => value === null || typeof value === 'string',
      source: {
        getValue: async <T>(_key: string): Promise<T | null> => {
          const response = await this.loadGeoCountry(this.geoCountryId());
          return (response.rows?.[0]?.name ?? null) as T | null;
        },
        setValue: async <T>(_key: string, _value: T): Promise<void> => {
          // Add API update call here when country name should sync back to the server.
        },
        deleteKey: async (_key: string): Promise<void> => {
          // Add API delete/reset call here when the server supports it.
        },
      },
    },
  );
  public readonly countryName: Signal<string | null> = this.countryNameStore.asReadonly();
  public readonly geoCountryResource: ResourceRef<CountryFindOutputDto | undefined> = resource({
    params: () => {
      const id = this.geoCountryId();
      return typeof id === 'number' ? { id } : undefined;
    },
    loader: async ({ params, abortSignal }): Promise<CountryFindOutputDto> => {

      const resp: CountryFindOutputDto = await this.loadGeoCountry(params.id, abortSignal);

      // const response = await fetch(`/api/countries/${params.id}`, {
      //   signal: abortSignal,
      // });

      if (!resp.rows) {
        throw new Error('Country load failed');
      }

      return resp;
    },
  });

  /**
   * USER: Persisted state
   * input: user input
   * storage: server side  api 
   * 
   * @userIdStore: WritableSignal
   * @userId: ReadonlySignal
   * @unsubscribeUserCreate: unknown
   * @setUserId: set method
   * @userCreatePub: listen to web socket publisher
   * @publishUserCreate: subscriber to web socket subscribe service
   * @subscribeUserCreate: listen to web socket subscriber
   * @cleanupUserCreatePub: cleanup web socket subscriber
   */
  private readonly userIdStore: WritableSignal<number> = signal<number>(0);
  public readonly userId: Signal<number> = this.userIdStore.asReadonly();
  private unsubscribeUserCreate: unknown = null;

  /**
   * https://angular.dev/guide/signals/debounced
   * 
   * SEARCH: Persisted state
   * input: user input
   * storage: server side api 
   * 
   * @searchStore: WritableSignal
   * @search: ReadonlySignal
   * @searchDebounce: unknown
   * @searchResource: Resource retrival from server using api
   * 
   * @setSearch: set method
   */
  private readonly searchStore: WritableSignal<string> = signal<string>('');
  public readonly search: Signal<string> = this.searchStore.asReadonly();

  // availabe in angular 22 and e have 21 version
  // private searchDebounce = debounce(this.searchStore, 300);

  // public readonly searchResource = resource({
  //   request: () => ({ query: this.searchDebounce.value() }),
  //   loader: ({ request, abortSignal }) => {
  //     if (!request.query.trim()) return Promise.resolve([]);

  //     // api call will be placed here
  //   }
  // });

  /**
   * UI: Runtime state for group
   * 
   *  
   */
  private readonly uiStore: WritableSignal<any> = signal<any>({
    theme: 'light',
    bidi: 'ltr',
    notification: true
  });
  // create readonly signal for each field in group
  public readonly theme = computed(() => this.uiStore().theme);
  public readonly bidi = computed(() => this.uiStore().bidi);
  public readonly notification = computed(() => this.uiStore().notification);

  /**
   * DID: Persisted state
   * input: user input
   * storage: local database using default AppStateRepository
   */
  private readonly _did = this.localDbPersistSignal<string | null>(
    'did',
    null,
    {
      validate: (value): value is string | null => value === null || typeof value === 'string',
    }
  );
  public readonly did = this._did.asReadonly();

  /**
   * DID_CUSTOM: Persisted state
   * input: user input
   * storage: custom local database source using AppConfigRepository
   */
  private readonly _didCustom = this.localDbPersistSignal<string | null>(
    'didCustom',
    null,
    {
      validate: (value): value is string | null => value === null || typeof value === 'string',
      source: {
        getValue: <T>(key: string) => this.appConfigRepository.getValue(key) as Promise<T | null>,
        setValue: <T>(key: string, value: T) => this.appConfigRepository.setValue(key, value),
      },
    });
  public readonly didCustom = this._didCustom.asReadonly();

  constructor() {
    super();
    // activate relevent web socket service to use in this state
    this.api.sdk.graphql.ws.initialize(UserWsToken);

    /**
     * If we have @Injectable({ providedIn: 'root' })
     * means and you are using service and state coponenet wise
     * then do not write any thing in constructor insted use indiciual component ngOnInit and ngOnDestroy
     * or 
     * keep serivice and state @Injectable() load where you need it so on compo-nenent chnage it get distroyed
     * this is important when we have stream and subscribe    
     * so, on componenet distory it stop stream and subscribe
     * for performanc epoint of view this is so imortnt
     * 
     * so if service and state are really global then only use @Injectable({ providedIn: 'root' })
     */
    void this.loadThemeMode();

    this.listenWindowResize();

    // use any one of the following
    //this.listenThemeModeLocalStorage();
    this.listenThemeModeBroadcast();
    //this.effectThemeMode(); // use only when you choose listenThemeModeBroadcast() and want to keep the setThemeMode() clear

    this.subscribeUserCreate();
    this.initializeSignalState();
  }

  public setDid(value: string | null): void {
    this._did.set(value);
  }

  public setDidCustom(value: string | null): void {
    this._didCustom.set(value);
  }

  // SCREEN_WIDTH
  public getWindowWidth(): number {
    // SSR cannot have window available, so testing, or non-browser context this is required
    return typeof window !== 'undefined' ? window.innerWidth : 0;
  }
  public setScreenWidth(width: number): void {
    this.screenWidthStore.set(width);
  }
  public loadScreenWidth(): void {
    this.screenWidthStore.set(this.getWindowWidth());
  }
  private listenWindowResize(): void {
    const onResize = () => {
      this.loadScreenWidth();
    };

    window.addEventListener('resize', onResize);
    const remove = async () => window.removeEventListener('resize', onResize);
    this.registerAsyncCleanup(remove, 'window resize listener');
  }

  private async safeInvoke<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      console.warn(`[ExampleState] ${operationName} failed`, error);
      return null;
    }
  }

  private registerAsyncCleanup(cleanup: () => Promise<void>, name: string): void {
    this.registerDeactivationCleanup(() => {
      void cleanup().catch((error) => {
        console.warn(`[ExampleState] ${name} cleanup failed`, error);
      });
    });
  }

  // THEME_MODE
  public async loadThemeMode(): Promise<void> {
    const saved = await this.ls.get<ThemeMode>('theme-mode');

    // Use saved value if available, otherwise fallback to default.
    this.themeModeStore.set(saved ?? 'system');

    this.themeModeLoaded = true;
  }
  public async setThemeMode(mode: ThemeMode): Promise<void> {
    // Only update the signal if you use effectThemeMode()
    // Persistence and tab sync should be handled by effectThemeMode().
    void await this.ls.set<ThemeMode>('theme-mode', mode);

    this.themeModeStore.set(mode);

    // notify other opened tabs, use if you want listenThemeModeBroadcast() to use
    // comment below if you use effectThemeMode() keep this method clener
    this.browserTabsSync.sendBroadcast('theme-mode');
  }
  private listenThemeModeLocalStorage(): void {
    // user either this method or listenThemeModeBroadcast()
    // we can also listen to local storage change trigger by other tabs
    this.browserTabsSync.listenLocalStorage((event) => {
      if (!this.browserTabsSync.matchesLocalStorageKey(event.key, 'theme-mode')) {
        return;
      }

      void this.loadThemeMode();
    });
  }
  private listenThemeModeBroadcast(): void {
    // user either this method or listenThemeModeLocalStorage()
    // listen to message from other tabs
    this.browserTabsSync.listenBroadcast((message) => {
      if (message.key !== 'theme-mode') {
        return;
      }

      this.themeModeSyncingFromOtherTab = true;
      void this.loadThemeMode();
    });
  }
  private effectThemeMode(): void {
    // this is not wokring proper with corss-tab sync due to timing
    // logical flow is correct but execution time is not aligned so behavior is annonymous

    // listen to theme mode change from user input
    // this is neeed if we use listenThemeModeBroadcast() and want to keep setThemeMode() clear
    effect(() => {
      const mode = this.themeModeStore();

      if (!mode) {
        return;
      }

      // Do not save/broadcast before initial storage load is completed.
      if (!this.themeModeLoaded) {
        return;
      }

      /**
       * If this signal update came from another tab, do not send it back again.
       * Otherwise tabs can keep politely yelling the same state at each other.
       */
      if (this.themeModeSyncingFromOtherTab) {
        this.themeModeSyncingFromOtherTab = false;
        return;
      }

      // Save latest theme mode to local storage.
      void this.ls.set<ThemeMode>('theme-mode', mode);

      // Notify other tabs.
      this.browserTabsSync.sendBroadcast('theme-mode');
    });
  }

  // GEO_COUNTRY
  public setGeoCountryId(id: number): void {
    this.geoCountryIdStore.set(id);
  }
  public setCountryName(name: string | null): void {
    this.countryNameStore.set(name);
  }
  public async loadGeoCountry(skip: number, abortSignal?: AbortSignal): Promise<CountryFindOutputDto> {
    // set the targeted module for api call
    this.api.sdk.graphql.initialize(Country);

    const fetchData = async (skip: number) => {
      // create a reusable find call
      const selection: CountryFindOutputSelectionSchema = {
        total: true,
        take: true,
        remain: true,
        pages: true,
        pagination: {
          first: {
            count: true,
            page: true,
            skip: true
          },
          previous: {
            count: true,
            page: true,
            skip: true
          },
          current: {
            count: true,
            page: true,
            skip: true
          },
          next: {
            count: true,
            page: true,
            skip: true
          },
          last: {
            count: true,
            page: true,
            skip: true
          }
        },
        rows: {
          id: true,
          name: true,
          capital: true,
          currency: true,
          currency_name: true,
          currency_symbol: true,
          emoji: true,
          iso_ii: true,
          iso_iii: true,
          numeric_code: true,
          created: true,
          updated: true,
          deleted: true,
        }
      };

      const filter: CountryFindInputDto = {
        take: 1,
        skip: skip,
        order: {
          name: {
            direction: RecordSortDirectionEnum.ASC,
            nulls: RecordSortNullPositionEnum.LAST
          }
        },
        withDeleted: false,
        where: [
          {

          }
        ]
      };

      const http = await this.api.sdk.graphql.country.find({
        selection: selection,
        filter: filter,
        signal: abortSignal,
      });
      return http.data;
    };

    let data: CountryFindOutputDto = await fetchData(skip);

    return data;
  }

  // USER
  public setUserId(id: number): void {
    if (isNaN(Number(id)))
      return

    this.userIdStore.set(id);
  }
  public async publishUserCreate(): Promise<void> {
    const uniqueValue = `${this.userId()}_${Date.now()}`;
    console.log("PUBLISHING:" + uniqueValue);

    await this.api.sdk.graphql.ws.user?.publishCreate({
      input: {
        username: uniqueValue,
        primary_email: `${uniqueValue}@example.com`,
        has_two_factor_auth: YesNoEnum.NO,
      }
    }
    );
  }

  private async subscribeUserCreate(): Promise<void> {
    try {
      this.unsubscribeUserCreate = await this.api.sdk.graphql.ws.user?.subscribeCreate({
        response: (data: UserCreateOutputDto) => {
          // This updates UI whenever server sends data.
          this.setUserId(data.id)
        },
      });



      const remove = async () => this.cleanupUserCreatePub();
      this.registerAsyncCleanup(remove, 'window resize listener');

    } catch (error) {
      console.error('[user.pub.create.error]', error);
    }
  }
  private async cleanupUserCreatePub(): Promise<void> {
    if (!this.unsubscribeUserCreate) {
      return;
    }

    if (typeof this.unsubscribeUserCreate === 'function') {
      this.unsubscribeUserCreate();
      this.unsubscribeUserCreate = null;
      return;
    }

    if (
      typeof this.unsubscribeUserCreate === 'object' &&
      'unsubscribe' in this.unsubscribeUserCreate &&
      typeof this.unsubscribeUserCreate.unsubscribe === 'function'
    ) {
      this.unsubscribeUserCreate.unsubscribe();
      this.unsubscribeUserCreate = null;
    }
  }

  // SEARCH
  public setSearch(search: string): void {
    this.searchStore.set(search);
  }

  // UI
  public setTheme(theme: any): void {
    // Update only theme and keep other fields unchanged.
    this.uiStore.update((current) => ({
      ...current,
      theme,
    }));
  }
  public setBidi(bidi: any): void {
    // Update only layout direction.
    this.uiStore.update((current) => ({
      ...current,
      bidi,
    }));
  }

  public setNotification(notification: any): void {
    // Update only notification setting and keep other fields unchanged.
    this.uiStore.update((current) => ({
      ...current,
      notification,
    }));
  }

  public uiReset(): void {
    // Restore defau`lt user state.
    this.uiStore.set({
      theme: 'light',
      bidi: 'ltr',
      notification: true,
    });
  }



}
/*
i am understanding the concept of signal in angular . nowi discovered many ways to do it and need some clearification.

i need a state like...

UC1: rutime state -> save in memory
UC2: persitant state -> save in local storage
UC3: persistant state -> source on service using api call
UC4: stream state -> web socket is the source for continuous data

now hve discovered all below 
signal()
computed()
linkedSignal()
effect() 
afterRenderEffect()
 isSignal()
isWritableSignal()

-- up to this all celar andI know how to use it and how it can implemented with various use cases.

now confusion with all below .. as per my use case (UC) 1,2,3,4 i am not sure where i need to use what or how cna i take decision whether i should use toSignal and toObservale or go for resource or rxResource() or Direct signal update from data source retrial such as after api call or in ws publisher.

toSignal()
toObservable()
resource()
rxResource()
Direct signal update, i think this is fastest and simplest.

major confusion with persistant and there are multiple type of persistant .

so need to undersyand thus wih clear. my intension is keep th code minima, no complexity at all and keep th performce at higest, and dev4elop some kind of pattern so th can be used in entire framework to work with sstate management.

I am not sure but api calls and web socket publisher listen should bein observable? so how to take desion.

i am devleoping busines sframwrok that allow to develop various f4eatures and functionlity and provide standard patten to work for developer wh8cih 9is easy to copy and understand and perform at highest level no compomise iwth performanc .


SOME HINTS:
Use rxResource() if your data services rely on Angular's built-in HttpClient (which uses RxJS Observables under the hood).
Use resource() if your data services rely on standard async/await functions, native fetch(), or a third-party Promise-based SDK (like standard GraphQL clients or Firebase SDKs).

RxJS based implementation is mostly for older version of Angular
Recent version 22+ suggest use of resource()

in component we have
checked = input<boolean>(false);
checkedChange = output<boolean>();
now we have
// One single line replaces input, output, and emitter logic!
checked = model<boolean>(false);

https://gemini.google.com/app/67373b9350ebd1e9

*/