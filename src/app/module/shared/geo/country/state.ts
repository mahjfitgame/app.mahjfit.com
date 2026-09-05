import { effect, inject, Service } from "@angular/core";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignalStateService } from "@libs/signal-state/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { FoundationModuleStateType } from "@libs/foundation/module/type";
import { GEO_COUNTRY_STATE_STORE_KEY } from "./const";
import { CrudChildStateType } from "src/app/base/crud/child/type/state";
import { CrudStateListingFieldObjType, CrudStateListOperationFieldObjType, CrudStateMutationFieldObjType, CrudStateSearchFilterFieldObjType, CrudStateViewOptionFieldObjType } from "src/app/base/crud/type";
import { CrudFieldUiTypeEnum } from "src/app/base/crud/enum";

@Service({ autoProvided: false })
export class GeoCountryState extends SignalStateService implements FoundationModuleStateType  { // CrudChildStateType

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
            label: 'GEO_COUNTRY.FIELD_OBJ.NAME.LABEL',
            type: CrudFieldUiTypeEnum.TEXT,
            sort: true,
            mat_icon_prepend: 'info',
            sub: {
                capital: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.CAPITAL.LABEL',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                },
                nationality: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.NATIONALITY.LABEL',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                },
                native: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.NATIVE.LABEL',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                }
            }
        },
        currency: {
            label: 'GEO_COUNTRY.FIELD_OBJ.CURRENCY.LABEL',
            type: CrudFieldUiTypeEnum.TEXT,
            sort: true,
            sub: {
                currency_name: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.CURRENCY_NAME.LABEL',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                },
                currency_symbol: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.CURRENCY_SYMBOL.LABEL',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                }
            }
        },
        metadata: {
            label: 'GEO_COUNTRY.GROUP_OBJ.METADATA.LABEL',
            type: CrudFieldUiTypeEnum.NONE,
            sort: false,
            slot: true,
            sub: {
                emoji: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.EMOJI.LABEL',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: false,
                },
                emoji_u: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.EMOJI_U.LABEL',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: false,
                },
                iso_ii: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.ISO_II.LABEL',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                },
                iso_iii: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.ISO_III.LABEL',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                },
                tld: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.TLD.LABEL',
                    type: CrudFieldUiTypeEnum.TEXT,
                    sort: true,
                }
            }
        },
        location: {
            label: 'GEO_COUNTRY.GROUP_OBJ.LOCATION.LABEL',
            type: CrudFieldUiTypeEnum.NONE,
            sort: false,
            sub: {
                region_id: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.REGION_ID.LABEL',
                    type: CrudFieldUiTypeEnum.SELECT,
                    sort: true,
                    fr_field: 'fr_region.name',
                },
                subregion_id: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.SUBREGION_ID.LABEL',
                    type: CrudFieldUiTypeEnum.SELECT,
                    sort: true,
                    fr_field: 'fr_subregion.name',
                },
                latitude: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.LATITUDE.LABEL',
                    type: CrudFieldUiTypeEnum.NUMBER,
                    sort: true,
                },
                longitude: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.LONGITUDE.LABEL',
                    type: CrudFieldUiTypeEnum.NUMBER,
                    sort: true,
                },
                numeric_code: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.NUMERIC_CODE.LABEL',
                    type: CrudFieldUiTypeEnum.NUMBER,
                    sort: true,
                }
            }
        },
        audit: {
            label: 'GEO_COUNTRY.GROUP_OBJ.AUDIT.LABEL',
            type: CrudFieldUiTypeEnum.NONE,
            sort: false,
            sub: {
                created: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.CREATED.LABEL',
                    type: CrudFieldUiTypeEnum.DATETIME,
                    sort: true,
                    mat_icon_prepend: 'calendar_clock',
                },
                updated: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.UPDATED.LABEL',
                    type: CrudFieldUiTypeEnum.FLAG,
                    sort: true,
                    flag_label: {
                        is_null: 'GEO_COUNTRY.FIELD_OBJ.UPDATED.FLAG_LABEL.IS_NULL',
                        // empty on purpose - no prefix in front of the date, so
                        // there is nothing to translate. The FLAG formatter
                        // leaves an empty string alone rather than looking it up.
                        is_datetime: '',
                    }
                },
                deleted: {
                    label: 'GEO_COUNTRY.FIELD_OBJ.DELETED.LABEL',
                    type: CrudFieldUiTypeEnum.FLAG,
                    sort: true,
                    flag_label: {
                        is_null: 'GEO_COUNTRY.FIELD_OBJ.DELETED.FLAG_LABEL.IS_NULL',
                        is_datetime: '',
                    }
                },
            }
        }
    };

    // will be used from crud.state.ts DEFAULT_LIST_OPERATION_FIELD_OBJ
    // if you add or modify the filed key name, then need to setup its setter and relevent methods
    // public readonly LIST_OPERATION_FIELD_OBJ: CrudStateListOperationFieldObjType = {};

    // will be used from crud.state.ts DEFAULT_VIEW_OPTION_FIELD_OBJ
    // if you add or modify the filed key name, then need to setup its setter and relevent methods
    // public readonly VIEW_OPTION_FIELD_OBJ: CrudStateViewOptionFieldObjType = {};

    public readonly MUTATION_FIELD_OBJ: CrudStateMutationFieldObjType = {
        name: {
            label: 'GEO_COUNTRY.FIELD_OBJ.NAME.LABEL',
            type: CrudFieldUiTypeEnum.TEXT,
            placeholder: 'GEO_COUNTRY.FIELD_OBJ.NAME.PLACEHOLDER',
            hint: 'GEO_COUNTRY.FIELD_OBJ.NAME.HINT',
            url_matrix_param: 'name',
            value: null,
            validation: {
                min_length: {
                    value: 3,
                    message: 'GEO_COUNTRY.FIELD_OBJ.NAME.VALIDATION.MIN_LENGTH'
                },
                max_length: {
                    value: 50,
                    message: 'GEO_COUNTRY.FIELD_OBJ.NAME.VALIDATION.MAX_LENGTH'
                }
            }
        },
        region_id: {
            label: 'GEO_COUNTRY.FIELD_OBJ.REGION_ID.LABEL',
            type: CrudFieldUiTypeEnum.SELECT,
            fr_field: 'fr_region.name',
            url_matrix_param: 'region',
            value: null,
            option: {
                // TODO: need to sync from api call
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
    };

    // TODO: once i finish sign in setup i need to start with mutation form and after search form and after apply finter in listing
    // switching work due to requirement in game project
    // after finish entire crud setup with this module so it can be used as reference

    public readonly SEARCH_FILTER_FIELD_OBJ: CrudStateSearchFilterFieldObjType = {
        search_field: {
            label: 'GEO_COUNTRY.GROUP_OBJ.ADVANCE_SEARCH.LABEL',
            type: CrudFieldUiTypeEnum.NONE,
            url_matrix_param: null,
            mat_icon_append: 'search_insights',
        },

        ...this.MUTATION_FIELD_OBJ,

        test_hidden: {
            label: 'GEO_COUNTRY.FIELD_OBJ.TEST_HIDDEN.LABEL',
            type: CrudFieldUiTypeEnum.HIDDEN,
            url_matrix_param: 'test_hidden',
        },
        // TODO: need to implement update late rone with valid module that as upload end point
        test_file: {
            label: 'GEO_COUNTRY.FIELD_OBJ.TEST_FILE.LABEL',
            type: CrudFieldUiTypeEnum.FILE,
            placeholder: 'GEO_COUNTRY.FIELD_OBJ.TEST_FILE.PLACEHOLDER',
            hint: 'GEO_COUNTRY.FIELD_OBJ.TEST_FILE.HINT',
            url_matrix_param: 'test_image_file',
            value: null,
            default: null,
            validation: {
                extension: {
                    message: 'GEO_COUNTRY.FIELD_OBJ.TEST_FILE.VALIDATION.EXTENSION',
                    value: this.conf.fileFormatImage,
                }
            }
        },
        test_color: {
            label: 'Color',
            type: CrudFieldUiTypeEnum.COLOR,
            hint: 'After manual code entry, click outside for preview.',
            url_matrix_param: 'test_color',
            value: null,
            validation: {
                 pattern: {
                    value: /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/,
                    message: 'GEO_COUNTRY.FIELD_OBJ.TEST_COLOR.VALIDATION.COLOR'
                }
            }
        },
        /**
         * RANGE = one two thumb slider over TWO fields.
         * this key renders the control, test_range_to is skipped in the UI but keeps its own
         * url_matrix_param / validation / value, so the API receives both numbers.
         */
        test_range_from: {
            label: 'Range',
            type: CrudFieldUiTypeEnum.RANGE,
            hint: 'This is a hint for test_range',
            url_matrix_param: 'test_range_from',
            value: null,
            default: 1,
            step: 0.5,
            range_field: {
                from: 'test_range_from',
                to: 'test_range_to'
            },
            validation: {
                min: {
                    value: 1,
                    message: 'Min is 1'
                },
                max: {
                    value: 100,
                    message: 'Max is 100'
                }
            }
        },
        test_range_to: {
            label: 'Range To',
            type: CrudFieldUiTypeEnum.NUMBER,
            url_matrix_param: 'test_range_to',
            value: null,
            default: 100,
            // drawn by test_range_from's control, so no control of its own
            skip: true,
            validation: {
                min: {
                    value: 1,
                    message: 'Min is 1'
                },
                max: {
                    value: 100,
                    message: 'Max is 100'
                }
            }
        },
        test_slider: {
            label: 'Slider',
            type: CrudFieldUiTypeEnum.SLIDER,
            hint: 'This is a hint for test_slider',
            url_matrix_param: 'test_slider',
            value: null,
            step: 5,
            //mat_icon_prepend: 'currency_exchange',
            //mat_icon_append: 'info',
            validation: {
                min: {
                    value: 0,
                    message: 'Min is 0'
                },
                max: {
                    value: 100,
                    message: 'Max is 100'
                }
            }
        },
        test_tel: {
            label: 'Phone',
            type: CrudFieldUiTypeEnum.TEL,
            hint: 'This is a hint for test_tel',
            url_matrix_param: 'test_tel',
            value: null,
            validation: {
                min_length: {
                    value: 3,
                    message: 'Min length is 3'
                },
                max_length: {
                    value: 100,
                    message: 'Max length is 100'
                }
            }
        },
        test_url: {
            label: 'URL',
            type: CrudFieldUiTypeEnum.URL,
            hint: 'This is a hint for test_url',
            url_matrix_param: 'test_url',
            value: null,
            validation: {
                min_length: {
                    value: 3,
                    message: 'Min length is 3'
                },
                max_length: {
                    value: 100,
                    message: 'Max length is 100'
                }
            }
        },
        test_email: {
            label: 'Email',
            type: CrudFieldUiTypeEnum.EMAIL,
            hint: 'This is a hint for test_email',
            url_matrix_param: 'test_email',
            value: null,
            validation: {
                min_length: {
                    value: 3,
                    message: 'Min length is 3'
                },
                max_length: {
                    value: 100,
                    message: 'Max length is 100'
                }
            }
        },
        test_password: {
            label: 'Password',
            type: CrudFieldUiTypeEnum.PASSWORD,
            hint: 'This is a hint for test_password',
            url_matrix_param: 'test_password',
            value: null,
            validation: {
                min_length: {
                    value: 3,
                    message: 'Min length is 3'
                },
                max_length: {
                    value: 100,
                    message: 'Max length is 100'
                }
            }
        },
        test_flag: {
          label: 'Test Flag',
          type: CrudFieldUiTypeEnum.FLAG,
          url_matrix_param: 'test_flag',
          flag_label: {
            is_null: 'Yes',
            is_datetime: '',
          }  
        },
        test_textarea: {
            label: 'Test Textarea Label',
            placeholder: 'Test Textarea Placeholder',
            hint: 'This is a hint for test_textarea',
            type: CrudFieldUiTypeEnum.TEXTAREA,
            url_matrix_param: 'test_textarea',
            value: null,
            validation: {
                min_length: {
                    value: 3,
                    message: 'Min length is 3'
                },
                max_length: {
                    value: 100,
                    message: 'Max length is 100'
                }
            }
        },
        test_radio: {
            label: 'GEO_COUNTRY.FIELD_OBJ.TEST_RADIO.LABEL',
            placeholder: 'GEO_COUNTRY.FIELD_OBJ.TEST_RADIO.PLACEHOLDER',
            hint: 'GEO_COUNTRY.FIELD_OBJ.TEST_RADIO.HINT',
            type: CrudFieldUiTypeEnum.RADIO,
            url_matrix_param: 'test_radio',
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
            label: 'GEO_COUNTRY.FIELD_OBJ.TEST_CHECKBOX.LABEL',
            placeholder: 'GEO_COUNTRY.FIELD_OBJ.TEST_CHECKBOX.PLACEHOLDER',
            hint: 'GEO_COUNTRY.FIELD_OBJ.TEST_CHECKBOX.HINT',
            type: CrudFieldUiTypeEnum.CHECKBOX,
            url_matrix_param: 'test_checkbox',
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
            label: 'GEO_COUNTRY.FIELD_OBJ.TEST_NUMBER.LABEL',
            type: CrudFieldUiTypeEnum.NUMBER,
            placeholder: 'GEO_COUNTRY.FIELD_OBJ.TEST_NUMBER.PLACEHOLDER',
            hint: 'GEO_COUNTRY.FIELD_OBJ.TEST_NUMBER.HINT',
            url_matrix_param: 'test_number',
            value: null,
            default: null,
            validation: {
                min: {
                    message: 'GEO_COUNTRY.FIELD_OBJ.TEST_NUMBER.VALIDATION.MIN',
                    value: 1,
                },
                max: {
                    message: 'GEO_COUNTRY.FIELD_OBJ.TEST_NUMBER.VALIDATION.MAX',
                    value: 10,
                }
            }
        },
        test_date: {
            label: 'GEO_COUNTRY.FIELD_OBJ.TEST_DATE.LABEL',
            type: CrudFieldUiTypeEnum.DATE,
            placeholder: 'GEO_COUNTRY.FIELD_OBJ.TEST_DATE.PLACEHOLDER',
            hint: 'GEO_COUNTRY.FIELD_OBJ.TEST_DATE.HINT',
            url_matrix_param: 'test_date',
            value: null,
            default: null,
            validation: {
                min: {
                    message: 'GEO_COUNTRY.FIELD_OBJ.TEST_DATE.VALIDATION.MIN',
                    value: new Date('2026-05-01'),
                },
                max: {
                    message: 'GEO_COUNTRY.FIELD_OBJ.TEST_DATE.VALIDATION.MAX',
                    value: new Date(),
                }
            }
        },
        test_time: {
            label: 'GEO_COUNTRY.FIELD_OBJ.TEST_TIME.LABEL',
            type: CrudFieldUiTypeEnum.TIME,
            placeholder: 'GEO_COUNTRY.FIELD_OBJ.TEST_TIME.PLACEHOLDER',
            hint: 'GEO_COUNTRY.FIELD_OBJ.TEST_TIME.HINT',
            url_matrix_param: 'test_time',
            value: null,
            default: null,
        },
        test_datetime: {
            label: 'GEO_COUNTRY.FIELD_OBJ.TEST_DATETIME.LABEL',
            type: CrudFieldUiTypeEnum.DATETIME,
            placeholder: 'GEO_COUNTRY.FIELD_OBJ.TEST_DATETIME.PLACEHOLDER',
            hint: 'GEO_COUNTRY.FIELD_OBJ.TEST_DATETIME.HINT',
            url_matrix_param: 'test_datetime',
            value: null,
            default: null,
        },
        test_slot: {
            label: 'GEO_COUNTRY.FIELD_OBJ.TEST_SLOT.LABEL',
            type: CrudFieldUiTypeEnum.TEXT,
            placeholder: 'GEO_COUNTRY.FIELD_OBJ.TEST_SLOT.PLACEHOLDER',
            hint: 'GEO_COUNTRY.FIELD_OBJ.TEST_SLOT.HINT',
            url_matrix_param: 'test_slot',
            slot: true,
            value: null,
            default: null,
            validation: {
                required: {
                    message: 'GL.VALIDATION.REQUIRED',
                    value: true,
                }
            }
        },
    };

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
