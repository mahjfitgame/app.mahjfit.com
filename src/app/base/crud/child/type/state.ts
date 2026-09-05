// file: src/app/base/crud/sub/state.ts

import { CrudChildListingStateType } from "./listing.state";
import { CrudChildMutationStateType } from "./mutation.state";
import { CrudChildSearchFilterStateType } from "./search.filter.state";

export interface CrudChildStateType extends CrudChildListingStateType, CrudChildSearchFilterStateType, CrudChildMutationStateType {

}