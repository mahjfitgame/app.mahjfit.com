// file: src/app/base/crud/child/type/state.ts

import { CrudStateListingFieldObjType, CrudStateListOperationFieldObjType, CrudStateMutationFieldObjType, CrudStateSearchFilterFieldObjType, CrudStateViewFieldObjType, CrudStateViewOptionFieldObjType } from "../../type";

/**
 * Complete contract for a CRUD child state: shared runtime state plus the
 * field definitions supplied by that child. Field definitions are optional so
 * focused modules (for example, mutation-only flows) can implement the same
 * contract without placeholder configuration.
 */
export interface CrudChildStateType {
    // CRUD OBJECTS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    SEARCH_FILTER_FIELD_OBJ?: CrudStateSearchFilterFieldObjType;

    LISTING_FIELD_OBJ?: CrudStateListingFieldObjType;
    LIST_OPERATION_FIELD_OBJ?: CrudStateListOperationFieldObjType;
    VIEW_OPTION_FIELD_OBJ?: CrudStateViewOptionFieldObjType;

    MUTATION_FIELD_OBJ?: CrudStateMutationFieldObjType;

    VIEW_FIELD_OBJ?: CrudStateViewFieldObjType;
}
