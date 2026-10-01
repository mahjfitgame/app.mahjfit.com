// file: src/app/base/form-fields/file/regular/type.ts
import { WritableSignal } from '@angular/core';
import { FileAccessUrlType } from '@base/form-fields/file/type';

/**
 * A persisted file's access-url variants. Aliases the canonical shape from
 * src/app/base/form-fields/file, which sits below both form-fields and crud - so
 * both @base/crud/type's CrudFieldFileShapeType and this one now point at
 * ONE declaration instead of two structurally-identical copies. Importing
 * from @base/form-fields/file does not create the form-fields -> crud edge
 * this used to avoid.
 */
export type FormFieldFileRegularAccessUrlType = FileAccessUrlType;

/**
 * █ INTERNAL ██████████████████████████████████████████████████████████
 * The component's whole input surface, handed to state.ts once from its constructor.
 * Accessors, not values, so everything stays live.
 */
export interface FormFieldFileRegularConfigType {
    /**
     * the picked file(s) - a single File, or File[] when [multiple] is set -
     * or, before anything new is picked, the persisted filename STRING for
     * an existing upload (validated identically to a File per this same
     * field's file_extension/file_size rules).
     */
    value: WritableSignal<File | File[] | string | null>;
}
