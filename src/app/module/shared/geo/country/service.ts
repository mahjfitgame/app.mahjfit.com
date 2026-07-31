// file: ./src/app/module/shared/geo/country/service.ts
import { inject, Service } from "@angular/core";
import { Country, CountryFindInputDto, CountryFindOutputDto, CountryFindOutputRowsDto, CountryFindOutputSelectionSchema } from "@bfw/api-sdk/graphql/endpoints/shared";
import { RecordSortDirectionEnum, RecordSortNullPositionEnum } from "@bfw/api-sdk/graphql/libs/crud.enum";
import { PrivateAreaLayoutSlotEnum } from "@area/private/enum";
import { CrudServiceSubType } from "@base/crud/sub";
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
import { AppModuleServiceType } from "@libs/utility/type";
import { GeoCountryState } from "./state";

@Service({ autoProvided: false })
export class GeoCountryService implements AppModuleServiceType, CrudServiceSubType {
    public readonly crud = inject(CrudService);

    public readonly state = inject(GeoCountryState);

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly i18n = inject(I18nService);

    public readonly PrivateAreaLayoutSlotEnum = PrivateAreaLayoutSlotEnum;

    public readonly LISTING_FIELD_OBJ: CrudStateListingFieldObjType = {
        name: {
            label: 'Name',
            type: CrudFieldUiTypeEnum.TEXT,
            sort: true,  
            mat_icon_prepend: 'info',
            sub: {
                capital: {
                    label: 'Capital',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                },
                nationality: {
                    label: 'Nationality',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                },
                native: {
                    label: 'Native',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                }
            }
        },
        currency: {
            label: 'Currency',
            type: CrudFieldUiTypeEnum.TEXT,
            sort: true,
            sub: {
                currency_name: {
                    label: 'Currency Name',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                },
                currency_symbol: {
                    label: 'Currency Symbol',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                }
            }
        },
        metadata: {
            label: 'Metadata',
            type: CrudFieldUiTypeEnum.NONE,
            sort: false,
            slot: true,
            sub: {
                emoji: {
                    label: 'Flag',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: false,
                },
                emoji_u: {
                    label: 'Emoji U',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: false, 
                },
                iso_ii: {
                    label: 'ISO II',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                },
                iso_iii: {
                    label: 'ISO III',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                },
                tld: {
                    label: 'TLD',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                }
            }
        },
        location: {
            label: 'Location',
            type: CrudFieldUiTypeEnum.NONE,
            sort: false,
            sub: {
                region_id: {
                    label: 'Region',
                    type: CrudFieldUiTypeEnum.SELECT,
                    sort: true,
                    fr_field: 'fr_region.name',
                },
                subregion_id: {
                    label: 'Subregion',
                    type: CrudFieldUiTypeEnum.SELECT,
                    sort: true,
                    fr_field: 'fr_subregion.name',
                },
                latitude: {
                    label: 'Latitude',
                    type: CrudFieldUiTypeEnum.NUMBER,
                    sort: true,
                },
                longitude: {
                    label: 'Longitude',
                    type: CrudFieldUiTypeEnum.NUMBER,
                    sort: true,
                },
                numeric_code: {
                    label: 'Phone Code',
                    type: CrudFieldUiTypeEnum.NUMBER,
                    sort: true,
                }
            }
        },
        audit: {
            label: 'Audit',
            type: CrudFieldUiTypeEnum.NONE,
            sort: false,
            sub: {
                created: {
                    label: 'Created',
                    type: CrudFieldUiTypeEnum.DATETIME,
                    sort: true,
                    mat_icon_prepend: 'calendar_clock',
                },
                updated: {
                    label: 'Updated',
                    type: CrudFieldUiTypeEnum.FLAG,
                    sort: true,
                    flag_label: {
                        is_null: 'Not updated yet',
                        is_datetime: '',
                    }
                },
                deleted: {
                    label: 'Deleted',
                    type: CrudFieldUiTypeEnum.FLAG,
                    sort: true,
                    flag_label: {
                        is_null: 'No',
                        is_datetime: '',
                    }
                },
            }
        }
    };
    public readonly SEARCH_QUERY_FIELD_OBJ: CrudStateSearchFilterFieldObjType = {

        advance_search: {
            label: 'Advance Search',
            type: CrudFieldUiTypeEnum.NONE,
            url_matrix_param: null,
            mat_icon_append: 'search_insights',
        },
        name: {
            label: 'Name',
            type: CrudFieldUiTypeEnum.TEXT,
            placeholder: 'Enter country name',
            hint: 'Search by country name',
            url_matrix_param: 'name',
            value: null,
            validation: {
                min_length: {
                    value: 3,
                    message: 'Minimum length is 3 characters'
                },
                max_length: {
                    value: 50,
                    message: 'Maximum length is 50 characters'
                }
            }
        },
        region_id: {
            label: 'Region',
            type: CrudFieldUiTypeEnum.SELECT,
            fr_field: 'fr_region.name',
            url_matrix_param: 'region',
            value: null,
            option: {
                1: 'Asia',
                2: 'Europe',
                3: 'North America',
                4: 'South America',
                5: 'Africa',
                6: 'Oceania',
                7: 'Antarctica',
            },
            option_default: {
                '': 'Any',
            },
        },
        test_hidden: {
            label: 'Test Hidden',
            type: CrudFieldUiTypeEnum.HIDDEN,
            url_matrix_param: 'test',
        },
        test_radio: {
            label: 'Test Radio',
            hint: 'Choose any one country for test radio',
            type: CrudFieldUiTypeEnum.RADIO,
            url_matrix_param: 'test',
            option: {
                1: 'Asia',
                2: 'Europe',
                3: 'North America',
                4: 'Congo Republic of South America',
                5: 'Africa',
                6: 'Oceania',
                7: 'Antarctica',
            },
            option_default: {
                '': 'Any',
            },
        },
        test_checkbox: {
            label: 'Test Checkbox',
            hint: 'Choose any one or more countries for test checkbox',
            type: CrudFieldUiTypeEnum.CHECKBOX,
            url_matrix_param: 'test',
            option: {
                1: 'Asia',
                2: 'Europe',
                3: 'North America',
                4: 'Congo Republic of South America',
                5: 'Africa',
                6: 'Oceania',
                7: 'Antarctica',
            },
        },
        test_number: {
            label: 'Test Number',
            type: CrudFieldUiTypeEnum.NUMBER,
            hint: 'Enter any number for test number',
            url_matrix_param: 'test',
            value: null,
            default: null,
            validation: {
                min: {
                    message: 'Minimum value is 1',
                    value: 1,
                },
                max: {
                    message: 'Maximum value is 10',
                    value: 10,
                }
            }
        },
        test_date: {
            label: 'Test Date',
            type: CrudFieldUiTypeEnum.DATE,
            hint: 'Enter any date for test date',
            url_matrix_param: 'test_date',
            value: null,
            default: null,
            validation: {
                min: {
                    message: 'Minimum value is 01',
                    value: new Date('2026-05-01'),
                },
                max: {
                    message: 'Maximum value is today',
                    value: new Date(),
                }
            }
        },
        test_time: {
            label: 'Test Time',
            type: CrudFieldUiTypeEnum.TIME,
            hint: 'Enter any time for test',
            url_matrix_param: 'test_time',
            value: null,
            default: null,
        },
        test_datetime: {
            label: 'Test Datetime',
            type: CrudFieldUiTypeEnum.DATETIME,
            hint: 'Enter any datetime for test datetime',
            url_matrix_param: 'test_datetime',
            value: null,
            default: null,
        },
        test_slot: {
            label: 'Cdk Slot',
            type: CrudFieldUiTypeEnum.TEXT,
            url_matrix_param: 'test_slot',
            slot: true,
            value: null,
            default: null,
            validation: {
                required: {
                    message: 'Cdk Slot is required',
                    value: true,
                }
            }
        },
        test_file: {
            label: 'Test Image File',
            type: CrudFieldUiTypeEnum.FILE,
            hint: 'Upload Image file for test',
            url_matrix_param: 'test_image_file',
            value: null,
            default: null,
            validation: {
                extension: {
                    message: 'Allowed file extensions are ' + this.conf.fileFormatImage.join(', '),
                    value: this.conf.fileFormatImage,
                }
            }
        }
    };
    // TODO: once i finish sign in setup i need to start with mutation form and after search form and after apply finter in listing
    // switching work due to requirement in game project
    // after finish entire crud setup with this module so it can be used as reference

    public readonly MUTATION_FIELD_OBJ: CrudStateMutationFieldObjType = this.SEARCH_QUERY_FIELD_OBJ as any;

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
            this.LISTING_FIELD_OBJ,
            this.SEARCH_QUERY_FIELD_OBJ,
            this.MUTATION_FIELD_OBJ
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
                    first:{
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
        if(type === CrudDataLoadTypeEnum.INITIAL) {
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