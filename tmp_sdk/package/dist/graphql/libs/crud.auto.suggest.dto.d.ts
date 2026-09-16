import { WithDeletedInputDto } from './crud.with.deleted.dto.js';

declare class AutoSuggestInputPaginationOptionsDtoWithWithDeletedInputDto extends WithDeletedInputDto {
    take?: number;
}
declare class AutoSuggestOutputRowsDto {
    match?: string[];
    score?: number;
}
declare class AutoSuggestOutputRowsSelectionSchema {
    match?: boolean;
    score?: boolean;
}

export { AutoSuggestInputPaginationOptionsDtoWithWithDeletedInputDto, AutoSuggestOutputRowsDto, AutoSuggestOutputRowsSelectionSchema };
