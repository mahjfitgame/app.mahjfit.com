// file: src/app/module/shared/geo/country/service.ts
import { computed, inject, Service } from "@angular/core";
import { Country, CountryFindInputDto, CountryFindOutputDto, CountryFindOutputRowsDto, CountryFindOutputSelectionSchema } from "@bfw/api-sdk/graphql/endpoints/shared";
import { RecordSortDirectionEnum, RecordSortNullPositionEnum } from "@bfw/api-sdk/graphql/libs/crud.enum";
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { CrudDataLoadTypeEnum, CrudFieldUiTypeEnum, CrudActionUiLayoutEnum } from "@base/crud/enum";
import { CrudService } from "@base/crud/service";
import { CrudStateMutationFieldObjType, CrudStateListingFieldObjType, CrudStateSearchFilterFieldObjType, CrudFindInputType, CrudStateViewOptionFieldObjType, CrudStateListOperationFieldObjType, CrudSearchFilterInputType, CrudViewOptionInputType, CrudListOperationInputType } from "@base/crud/type";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { GeoCountryMutationFormComponent } from "@module/shared/geo/country/mutation/form/component";
import { GeoCountryMutationPageComponent } from "@module/shared/geo/country/mutation/page/component";
import { SLUG_GEO } from "@module/shared/geo/slug";
import { SLUG_GEO_COUNTRY } from "@module/shared/geo/country/slug";
import { I18nService } from "@base/internationalization/service";
import { GEO_COUNTRY_I18N_KEY } from "@module/shared/geo/country/const";
import { GeoCountryRoute } from "./route";
import { FoundationModuleServiceType } from "@libs/foundation/module/type";
import { GeoCountryState } from "./state";
import { CrudChildServiceType } from "src/app/base/crud/child/type/service";
import { FoundationFieldDefaultNameEnum } from "@libs/foundation/field/enum";

@Service({ autoProvided: false })
export class GeoCountryService implements FoundationModuleServiceType, CrudChildServiceType {
    public readonly crud = inject(CrudService);

    public readonly route = inject(GeoCountryRoute);
    public readonly state = inject(GeoCountryState);

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);

    public readonly PrivateAreaLayoutSlotEnum = PrivateAreaLayoutSlotEnum;

    constructor() {
        // some required initialization for the module

        // █████ FoundationModuleServiceType
        // load this module's translations first, so the i18n keys setModuleInfo() publishes below already resolve.
        // constructor, not component ngOnInit - see I18nService.useModule() for why
        this.initI18n();

        // set module info
        this.setModuleInfo();

        // alter breadcrumbs
        this.alterBreadcrumb();

        // █████ CrudChildServiceType 
        this.crudInit();

        // claims URL + enables
        this.initUrlSync();

        // [optional, per-module choice
        this.enableUrlSync();

        // set primary key
        this.setPrimaryKey();

        // set secondary key
        this.setSecondaryKey();

        // set unique key
        this.setUniqueKey();

        // set well known field names
        this.setUrlSlugField();
        this.setIsMainField();
        this.setRecordPositionField();
        this.setActiveField();
        this.setDeletedField();

        // set listing, mutation and query fields + any modification as needed
        this.setFieldObj();

        // set mutation action layout type
        this.setMutationActionUiLayout();

        // [optional] set mutation form custom component
        this.setMutationFormCustomComponent();

        // [optional] set mutation page custom component
        this.setMutationPageCustomComponent();

        // set selected rows
        this.setListingSelectedRowsInitialSource();

        // register the find method
        this.registerFind();

        // apply URL Matrix Params before initial load. Position must stay before load().
        this.initCrudStateFromUrl();

        // set the search form layout
        this.setSearchFormLayout();

        // load the initial data, it has some dependencies call backs also inside
        if (this.crud.shouldLoadListingForCurrentRoute()) {
            this.initialLoad();
        }
    }
    // █████ FoundationModuleServiceType 

    public initI18n(): void {
        this.i18n.useModule(GEO_COUNTRY_I18N_KEY);
    }
    public setModuleInfo(): void {
        this.crud.paLayout.state.setModuleInfo({
            icon: 'globe',
            url: GeoCountryRoute.absolutePath(),
            title: null, //'Geo Country',
            hint: null, //'Manage world country data.',
            i18n: {
                title: 'GEO_COUNTRY.MODULE.TITLE',
                hint: 'GEO_COUNTRY.MODULE.HINT',
            }
        });
    }
    public alterBreadcrumb(): void {
        /*
        // the '@' prefix makes the key match breadcrumbAlias from the route.
        // without it the key is read as a routeLink ('/geoCountry') and nothing matches.
        this.crud.breadcrumb.set('@geoCountry', {
            // same options as we set in route
            // sample: src/app/module/shared/geo/route.ts
        })
        */
    }

    // █████ CrudChildServiceType 
    public crudInit(): void {
        this.crud.defaultInit();
    }
    public initUrlSync(): void {
        this.crud.url.initUrlSync();
    }
    public enableUrlSync(flag: boolean = true): void {
        this.crud.url.enableUrlSync(flag);
    }
    public setPrimaryKey(): void {
        this.crud.state.setPrimaryKey(FoundationFieldDefaultNameEnum.ID);
    }
    public setSecondaryKey(): void {
        this.crud.state.setSecondaryKey(FoundationFieldDefaultNameEnum.KEYID);
    }
    public setUniqueKey(): void {
        this.crud.state.setUniqueKey([FoundationFieldDefaultNameEnum.ID]);
    }
    public setUrlSlugField(): void {
        this.crud.state.setUrlSlugField(FoundationFieldDefaultNameEnum.URL_SLUG);
    }
    public setIsMainField(): void {
        this.crud.state.setIsMainField(FoundationFieldDefaultNameEnum.IS_MAIN);
    }
    public setRecordPositionField(): void {
        this.crud.state.setRecordPositionField(FoundationFieldDefaultNameEnum.RECORD_POSITION);
    }
    public setActiveField(): void {
        this.crud.state.setActiveField(FoundationFieldDefaultNameEnum.ACTIVE);
    }
    public setDeletedField(): void {
        this.crud.state.setDeletedField(FoundationFieldDefaultNameEnum.DELETED);
    }
    public setFieldObj(): void {
        this.crud.setFieldObj(
            this.state.LISTING_FIELD_OBJ,
            this.state.SEARCH_FILTER_FIELD_OBJ,
            this.state.MUTATION_FIELD_OBJ,

            // if you have a complete new field object, use this by passing here
            // this.state.LIST_OPERATION_FIELD_OBJ,
            // this.state.VIEW_OPTION_FIELD_OBJ
        );

        /**
         * If default set is initiated or complete new, we can perform any modification here below this line
         * 
         * default will use
         * this.crud.state.DEFAULT_LIST_OPERATION_FIELD_OBJ,
         * this.crud.state.DEFAULT_VIEW_OPTION_FIELD_OBJ
         * 
         * modify fields are from child module state
         * 
         * ListOperationFieldObj & ViewOptionFieldObj
         * If you using default or complete new but after set if you want to modify then do as below
         * 
         * const listingFieldObj = this.crud.state.listingFieldObj();
         * perform modification
         * this.crud.state.setListingFieldObj(listingFieldObj);
         * 
         * const viewOptionFieldObj = this.crud.state.viewOptionFieldObj();
         * perform modification
         * this.crud.state.setViewOptionFieldObj(viewOptionFieldObj);
         * 
         * do changes and save updated state
         * in case of chnage you cannot add new field in viewOptionFieldObj or listingFieldObj
         * you can delete it, if you want to add new then the add in SEARCH_FILTER_FIELD_OBJ
         * you cannot add new field in any defaults, this is a rule of thumb
         */
        // MODIFY FIELD OBJ
        //const listingFieldObj = this.crud.state.listingFieldObj();
        //this.crud.state.setListingFieldObj(listingFieldObj);

        //const viewOptionFieldObj = this.crud.state.viewOptionFieldObj();
        //this.crud.state.setViewOptionFieldObj(viewOptionFieldObj);
    }
    public setSearchFormLayout(): void {
        // change search form layout: search filter first, then view option 
        // if you want default keep this method blank
        // must set in computed()

        // for now we need to keep default, but keep this code for future reference
        // this.crud.state.setSearchFormLayout(computed(() => [
        //     this.crud.state.searchFilterFieldObj(),
        //     this.crud.state.viewOptionFieldObj(),
        // ]));  
    }
    public setMutationActionUiLayout(): void {
        // set mutation action ui layout or leave it blank to stay with crud auto detection
        this.crud.state.setMutationActionUiLayout(CrudActionUiLayoutEnum.DIALOG);
    }
    public setMutationFormCustomComponent(): void {
        // set mutation form custom component or leave it blank to stay with crud default
        //this.crud.state.setMutationFormCustomComponent(GeoCountryMutationFormComponent);
    }
    public setMutationPageCustomComponent(): void {
        // set mutation page custom component or leave it blank to stay with crud default
        //this.crud.state.setMutationPageCustomComponent(GeoCountryMutationPageComponent);
    }
    public setListingSelectedRowsInitialSource(): void {
        this.crud.state.setListingSelectedRowsValue<CountryFindOutputRowsDto>();
    }
    public registerFind(): void {
        this.crud.registerFind(async (input: CrudFindInputType, type: CrudDataLoadTypeEnum) => await this.find(input, type));
    }
    public initCrudStateFromUrl(): void {
        this.crud.url.initCrudStateFromUrlState();
    }
    public async initialLoad(): Promise<boolean> {
        const loaded = await this.crud.loadListing({}, CrudDataLoadTypeEnum.INITIAL);
        return loaded;
    }
    public syncCrudStateFromUrlState(): void {
        this.crud.url.syncCrudStateFromUrlState();
    }
    public syncUrlStateFromCrudState(): void {
        this.crud.url.syncUrlStateFromCrudState();
    }
    /**
     * LOAD DATA FROM API
     */
    public async find(
        input: CrudFindInputType,
        type: CrudDataLoadTypeEnum = CrudDataLoadTypeEnum.ACTION
    ): Promise<boolean> {
        // get the primary key
        const pk = this.crud.state.primaryKey() as string;

        // get the secondary key
        const sk = this.crud.state.secondaryKey() as string;

        // set the targeted module for api call
        this.crud.api.sdk.graphql.initialize(Country);

        const {
            SEARCH_FILTER_INPUT: sfIn,
            VIEW_OPTION_INPUT: voIn,
            LIST_OPERATION_INPUT: loIn,
            SKIP: skip,
        }: CrudFindInputType = input;

        const fetch = async (
            sfIn: CrudSearchFilterInputType,
            voIn: CrudViewOptionInputType,
            loIn: CrudListOperationInputType,
            skip: number
        ) => {
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
                    [pk]: true,
                    [sk]: true,

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
                take: loIn.rows_per_page as number,
                skip: skip as number,
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

            return await this.crud.api.sdk.graphql.country.find({
                selection: selection,
                filter: filter,
            });
        };

        const http = await fetch(sfIn, voIn, loIn, skip);
        let data: CountryFindOutputDto = http.data;

        // ████ VERIFY THE RESPONSE  ██████████████████████████████████████
        /**
         * Need to validate the data as per request
         * We need various validation as we have data source from url matrix params
         * Any malicious data might be there
         */


        const normalizedInput = this.crud.normalizeFindInputAfterFind(input, Number(data.total ?? 0));
        const {
            SEARCH_FILTER_INPUT: nsfIn,
            VIEW_OPTION_INPUT: nvfIn,
            LIST_OPERATION_INPUT: nloIn,
            SKIP: nskip
        }: CrudFindInputType = normalizedInput;

        // if mismatch then place new call but do not intrrupt existing call
        if (nloIn?.current_page !== loIn?.current_page) {
            const http = await fetch(nsfIn, nvfIn, nloIn, nskip);
            data = http.data;
        }

        // ████ NEW STATE BEGINS FROM THIS LINE  ██████████████████████████████████████

        // set full data
        this.crud.state.setListingData(data);

        // set data source
        this.crud.state.setListingDataSource<CountryFindOutputRowsDto>(data.rows);

        // on initial load we need to process inpuut after data received
        if (type === CrudDataLoadTypeEnum.INITIAL) {
            /**
             * now data is set in state so we might need to update few things as per url state
             * this is required to perform fieldpsecific normalisation process which required data to be loaded
             * this has been done at initial page load in constructor
             * major state update must set after this line
             * 
             * action such as selected rows sync from url to show it as selected on screen
             */
            this.initCrudStateFromUrl();
        }

        // set pagination
        this.crud.state.setTotalRecords(Number(data.total ?? 0));
        this.crud.state.setCurrentPageValue(Number(data.pagination?.current.page ?? 1));
        this.crud.state.setRowsPerPageValue(Number(data.take));

        return true;
    }
}
