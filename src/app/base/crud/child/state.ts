// file: src/app/base/crud/sub/state.ts

import { CrudChildListingStateType } from "./type/listing.state";
import { CrudChildMutationStateType } from "./type/mutation.state";
import { CrudChildSearchFilterStateType } from "./type/search.filter.state";

export interface CrudChildStateType extends CrudChildListingStateType, CrudChildSearchFilterStateType, CrudChildMutationStateType {

}