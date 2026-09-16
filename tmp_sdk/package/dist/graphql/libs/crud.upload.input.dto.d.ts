import { CrudAffectedSelectionSchema, CrudAffectedDto } from './crud.affected.dto.js';
import { UploadFileAccessUrlSelectionSchema, UploadFileAccessUrlDto } from './crud.upload.file.access.url.dto.js';
import './crud.snapshot.dto.js';

declare class UploadInputDto {
    ref_id: string;
    id?: string;
}
declare class UploadOutputDto {
    id?: string;
    ref_id?: string;
    file_name?: string;
    access_url?: UploadFileAccessUrlDto;
}
declare class UploadOutputSelectionSchema {
    id?: boolean;
    ref_id?: boolean;
    file_name?: boolean;
    access_url?: typeof UploadFileAccessUrlSelectionSchema | UploadFileAccessUrlSelectionSchema | boolean;
}
declare class UploadOutputDtoWithAffectedDto extends CrudAffectedDto {
    id?: string;
    ref_id?: string;
    file_name?: string;
    access_url?: UploadFileAccessUrlDto;
}
declare class UploadOutputDtoWithAffectedDtoSelectionSchema extends CrudAffectedSelectionSchema {
    id?: boolean;
    ref_id?: boolean;
    file_name?: boolean;
    access_url?: typeof UploadFileAccessUrlSelectionSchema | UploadFileAccessUrlSelectionSchema | boolean;
}
declare class UploadDeleteInputDto extends UploadInputDto {
    id?: string;
    rmdir_record?: boolean;
}
declare class UploadDeleteOutputDto extends CrudAffectedDto {
    id?: string;
    ref_id?: string;
}
declare class UploadDeleteOutputSelectionSchema extends CrudAffectedSelectionSchema {
    id?: boolean;
    ref_id?: boolean;
}

export { UploadDeleteInputDto, UploadDeleteOutputDto, UploadDeleteOutputSelectionSchema, UploadInputDto, UploadOutputDto, UploadOutputDtoWithAffectedDto, UploadOutputDtoWithAffectedDtoSelectionSchema, UploadOutputSelectionSchema };
