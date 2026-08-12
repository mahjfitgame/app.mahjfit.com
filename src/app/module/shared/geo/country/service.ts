// file: ./src/app/module/shared/geo/country/service.ts
import { inject, Service } from "@angular/core";
import { Country, CountryFindInputDto, CountryFindOutputDto, CountryFindOutputRowsDto, CountryFindOutputSelectionSchema } from "@bfw/api-sdk/graphql/endpoints/shared";
import { RecordSortDirectionEnum, RecordSortNullPositionEnum } from "@bfw/api-sdk/graphql/libs/crud.enum";
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { CrudDataLoadTypeEnum, CrudFieldUiTypeEnum, CrudActionUiLayoutEnum } from "@base/crud/enum";
import { CrudService } from "@base/crud/service";
import { CrudStateMutationFieldObjType, CrudStateListingFieldObjType, CrudStateSearchFilterFieldObjType, CrudFindInputType, CrudStateViewOptionFieldObjType, CrudStateListOperationFieldObjType, CrudSearchFilterInputType, CrudViewOptionInputType, CrudListOperationInputType } from "@base/crud/type";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { CRUD_DEF_PRIMARY_KEY_NAME } from "@base/crud/const";
import { GeoCountryMutationFormComponent } from "@module/shared/geo/country/mutation/form/component";
import { GeoCountryMutationPageComponent } from "@module/shared/geo/country/mutation/page/component";
import { SLUG_PRIVATE_AREA } from "@area/private/slug";
import { SLUG_GEO } from "@module/shared/geo/slug";
import { SLUG_GEO_COUNTRY } from "@module/shared/geo/country/slug";
import { I18nService } from "@base/internationalization/service";
import { GEO_COUNTRY_I18N_KEY } from "@module/shared/geo/country/const";
import { GeoCountryRoute } from "./route";
import { FoundationModuleServiceType } from "@libs/foundation-module/type/service";
import { GeoCountryState } from "./state";
import { CrudChildServiceType } from "src/app/base/crud/child/service";

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
        // set module info
        this.setModuleInfo();

        // alter breadcrumbs
        this.alterBreadcrumb();

        // some initialization as required
        this.crudInit();

        // set primary key
        this.setPrimaryKey();

        // set unique key
        this.setUniqueKey();

        // set listing, mutation and query fields + any modification as needed
        this.initFieldObj();

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

        // load the initial data, it has some dependencies call backs also inside
        if (this.crud.shouldLoadListingForCurrentRoute()) {
            this.initialLoad();
        }
    }
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
        this.crud.breadcrumb.set('geo-country', {
            // same options as we set in route
            // sample: src/app/module/shared/geo/route.ts
        })
        */
    }
    public initUrlSync(): void {
        this.crud.url.initUrlSync();
    }
    public enableUrlSync(flag: boolean = true): void {
        this.crud.url.enableUrlSync(flag);
    }
    public crudInit(): void {
        this.crud.init();
    }
    public setPrimaryKey(): void {
        this.crud.state.setPrimaryKey(CRUD_DEF_PRIMARY_KEY_NAME);
    }
    public setUniqueKey(): void {
        this.crud.state.setUniqueKey([CRUD_DEF_PRIMARY_KEY_NAME]);
    }
    public initFieldObj(): void {
        this.crud.setFieldObj(
            this.state.LISTING_FIELD_OBJ,
            this.state.SEARCH_FILTER_FIELD_OBJ,
            this.state.MUTATION_FIELD_OBJ
        );

        /**
         * As default set is initiated, we can perform any default modification here below this line
         * modify fields and update state
         * you can also modify default field object
         * 
         * ListOperationFieldObj & ViewOptionFieldObj
         * const listingFieldObj = this.crud.state.listingFieldObj();
         * const viewOptionFieldObj = this.crud.state.viewOptionFieldObj();
         * do changes and save updated state
         */
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
     * DATA LOAD FROM API 
     */
    public async find(input: CrudFindInputType, type: CrudDataLoadTypeEnum = CrudDataLoadTypeEnum.ACTION): Promise<boolean> {
        // get the primary key
        const pk = this.crud.state.primaryKey() as string;

        // set the targeted module for api call
        this.crud.api.sdk.graphql.use(Country);

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
