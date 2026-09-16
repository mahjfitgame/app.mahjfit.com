import { CrudAffectedSelectionSchema, CrudAffectedDto } from './crud.affected.dto.js';
import './crud.snapshot.dto.js';

declare class RecordPositionInputDto {
    from_record_id: string;
    from_record_position_id: string;
    to_record_id: string;
    to_record_position_id: string;
}
declare class RecordPositionOutputDto extends CrudAffectedDto {
    id?: string;
}
declare class RecordPositionOutputSelectionSchema extends CrudAffectedSelectionSchema {
    id?: boolean;
}

export { RecordPositionInputDto, RecordPositionOutputDto, RecordPositionOutputSelectionSchema };
