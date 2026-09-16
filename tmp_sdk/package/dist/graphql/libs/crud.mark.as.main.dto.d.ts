import { CrudAffectedSelectionSchema, CrudAffectedDto } from './crud.affected.dto.js';
import './crud.snapshot.dto.js';

declare class MarkAsMainInputDto {
    id: string;
    ref_group_relation_field_value: string;
}
declare class MarkAsMainOutputDto extends CrudAffectedDto {
    id?: string;
    ref_group_relation_field_value?: string;
}
declare class MarkAsMainOutputSelectionSchema extends CrudAffectedSelectionSchema {
    id?: boolean;
    ref_group_relation_field_value?: boolean;
}

export { MarkAsMainInputDto, MarkAsMainOutputDto, MarkAsMainOutputSelectionSchema };
