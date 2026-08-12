// file: src/app/base/crud/sub/type/mutation.ts

import { Signal, WritableSignal } from "@angular/core";
import { CrudStateMutationFieldObjType } from "../../type";
import { FieldTree } from "@angular/forms/signals";

export interface CrudChildMutationStateType {

    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    
    // CRUD OBJECTS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    MUTATION_FIELD_OBJ: CrudStateMutationFieldObjType;

    // SIGNAL FORM PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    //_mutationFieldObj: WritableSignal<CrudStateMutationFieldObjType>;
    mutationFieldObj: Signal<CrudStateMutationFieldObjType>;

    //_mutationFormError: WritableSignal<Record<string, any>>;
    mutationFormError: Signal<Record<string, any>>;

    //_mutationFormModel: WritableSignal<Record<string, any>>;
    mutationFormModel: Signal<Record<string, any>>;

    //_mutationFormProcessing: WritableSignal<boolean>;
    mutationFormProcessing: Signal<boolean>;

    mutationForm: FieldTree<unknown>;

    // SIGNAL FORM METHODS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    setMutationFieldObj(mutationFieldObj: CrudStateMutationFieldObjType): void;

    setMutationFormError(error: Record<string, any>): void;

    updateMutationFormError(error: Partial<Record<string, any>>): void;

    clearMutationFormError(): void;

    setMutationFormModel(input: Record<string, any>): void;

    updateMutationFormModel(input: Partial<Record<string, any>>): void;

    clearMutationFormModel(): void;

    setMutationFormProcessing(processing: boolean): void;

    resetMutationForm(): void;
}