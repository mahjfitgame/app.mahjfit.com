import { WithDeletedInputDto } from './crud.with.deleted.dto.js';

declare class FindOutputPage {
    page: number;
    count: number;
    skip: number;
}
declare class FindOutputPageSelectionSchema {
    page?: boolean;
    count?: boolean;
    skip?: boolean;
}
declare class FindOutputPaginationDto {
    first: FindOutputPage;
    previous: FindOutputPage;
    current: FindOutputPage;
    next: FindOutputPage;
    last: FindOutputPage;
}
declare class FindOutputPaginationSelectionSchema {
    first?: typeof FindOutputPageSelectionSchema | FindOutputPageSelectionSchema | false;
    previous?: typeof FindOutputPageSelectionSchema | FindOutputPageSelectionSchema | false;
    current?: typeof FindOutputPageSelectionSchema | FindOutputPageSelectionSchema | false;
    next?: typeof FindOutputPageSelectionSchema | FindOutputPageSelectionSchema | false;
    last?: typeof FindOutputPageSelectionSchema | FindOutputPageSelectionSchema | false;
}
declare class FindInputPaginationOptionsDto {
    skip?: number;
    take?: number;
}
declare class FindInputPaginationOptionsDtoWithWithDeletedInputDto extends WithDeletedInputDto {
    skip?: number;
    take?: number;
}
declare class FindOutputPaginationOptionsDto {
    total?: number;
    remain?: number;
    pages?: number;
    take?: number;
    pagination?: FindOutputPaginationDto;
}
declare class FindOutputPaginationOptionsSelectionSchema {
    total?: boolean;
    remain?: boolean;
    pages?: boolean;
    take?: boolean;
    pagination?: typeof FindOutputPaginationSelectionSchema | FindOutputPaginationSelectionSchema | false;
}

export { FindInputPaginationOptionsDto, FindInputPaginationOptionsDtoWithWithDeletedInputDto, FindOutputPage, FindOutputPageSelectionSchema, FindOutputPaginationDto, FindOutputPaginationOptionsDto, FindOutputPaginationOptionsSelectionSchema, FindOutputPaginationSelectionSchema };
