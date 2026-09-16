import { CrudSnapshotSelectionSchema, CrudSnapshotDto } from './crud.snapshot.dto.js';

declare class CrudAffectedDto extends CrudSnapshotDto {
    affected?: number;
}
declare class CrudAffectedSelectionSchema extends CrudSnapshotSelectionSchema {
    affected?: boolean;
}

export { CrudAffectedDto, CrudAffectedSelectionSchema };
