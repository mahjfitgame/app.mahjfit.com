// file: src/app/base/crud/sub/type/listing.ts
import { CrudFindInputType, CrudStateListingFieldObjType, CrudStateListOperationFieldObjType, CrudStateMutationFieldObjType, CrudStateSearchFilterFieldObjType, CrudStateViewOptionFieldObjType } from "../../type";

export interface CrudChildListingStateType {

    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    
    // CRUD OBJECTS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    LISTING_FIELD_OBJ: CrudStateListingFieldObjType;
    
    LIST_OPERATION_FIELD_OBJ?: CrudStateListOperationFieldObjType;
    VIEW_OPTION_FIELD_OBJ?: CrudStateViewOptionFieldObjType;
    
    // SIGNAL LISTING PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    

    // SIGNAL LISTING METHODS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // LISTING METHODS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
}