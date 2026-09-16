import { UpsertStatusEnum } from './crud.enum.js';

declare class UpsertOutputProcessStatusDto {
    upsert_process?: UpsertStatusEnum;
}
declare class UpsertOutputProcessStatusSelectionSchema {
    upsert_process?: boolean;
}

export { UpsertOutputProcessStatusDto, UpsertOutputProcessStatusSelectionSchema };
