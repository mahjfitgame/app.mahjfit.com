import { FileRelocationTypeEnum } from './crud.enum.js';
import { UploadOutputDtoWithAffectedDto, UploadOutputDtoWithAffectedDtoSelectionSchema } from './crud.upload.input.dto.js';
import './crud.affected.dto.js';
import './crud.snapshot.dto.js';
import './crud.upload.file.access.url.dto.js';

declare class FileRelocationInputDto {
    source_id: string;
    destination_id?: string;
    source_ref_id?: string;
    destination_ref_id?: string;
    relocation_type: FileRelocationTypeEnum;
}
declare class FileRelocationOutputDto extends UploadOutputDtoWithAffectedDto {
    relocation_type?: FileRelocationTypeEnum;
}
declare class FileRelocationOutputSelectionSchema extends UploadOutputDtoWithAffectedDtoSelectionSchema {
    relocation_type?: boolean;
}

export { FileRelocationInputDto, FileRelocationOutputDto, FileRelocationOutputSelectionSchema };
