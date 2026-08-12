import { effect, inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation-module/type/state";
import { GEO_COUNTRY_STATE_STORE_KEY } from "./const";
import { CrudChildStateType } from "src/app/base/crud/child/state";
import { CrudStateListingFieldObjType, CrudStateListOperationFieldObjType, CrudStateMutationFieldObjType, CrudStateSearchFilterFieldObjType, CrudStateViewOptionFieldObjType } from "src/app/base/crud/type";
import { CrudFieldUiTypeEnum } from "src/app/base/crud/enum";

@Service({ autoProvided: false })
export class GeoCountryState extends SignalStateService implements FoundationModuleStateType { // CrudChildStateType

    // ████ DEPENDENCIES ████████████████████████████████████████████████

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly ctxp = inject(ContextProfileService);
    public readonly api = inject(BfwApiService);

    // ████ CLASS PROPERTIES ████████████████████████████████████████████

    public override readonly storeKey = GEO_COUNTRY_STATE_STORE_KEY;

    // ████ CRUD OBJECTS ████████████████████████████████████████████████

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

    // will be used from crud.state.ts DEF_LIST_OPERATION_FIELD_OBJ
    // public readonly LIST_OPERATION_FIELD_OBJ: CrudStateListOperationFieldObjType = {};

    // will be used from crud.state.ts DEF_VIEW_OPTION_FIELD_OBJ
    // public readonly DEF_VIEW_OPTION_FIELD_OBJ: CrudStateViewOptionFieldObjType = {};

    public readonly SEARCH_FILTER_FIELD_OBJ: CrudStateSearchFilterFieldObjType = {
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

    public readonly MUTATION_FIELD_OBJ: CrudStateMutationFieldObjType = this.SEARCH_FILTER_FIELD_OBJ as any;

    // ████ SIGNAL FORM PROPERTIES ██████████████████████████████████████
    // n/a

    // ████ SIGNAL PROPERTIES ███████████████████████████████████████████
    // n/a

    // ████ STATE DEBUGGER ██████████████████████████████████████████████
    // n/a

    constructor() {
        super();
        this.initializeSignalState();
    }

    // ████ LISTENERS ███████████████████████████████████████████████████

    public override onActivate(): void {
        /*
        const registerEffect = effect(() => {
            if (!this.ready()) {
                return;
            }
        });

        this.registerDeactivationCleanup(() => registerEffect.destroy());
        */
    }

    public override onDeactivate(): void {

    }

    // ████ SIGNAL METHODS ██████████████████████████████████████████████
    // n/a

    // ████ SIGNAL DATA VALIDATORS ██████████████████████████████████████
    // n/a

    // ████ REGISTRATION AND CALLBACKS ██████████████████████████████████
    // n/a

    // ████ API CALLS ███████████████████████████████████████████████████
    // n/a

    // ████ WEB SOCKET CALLS ████████████████████████████████████████████
    // n/a
}
