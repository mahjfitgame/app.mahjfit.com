import { FindInputPaginationOptionsDto } from './crud.pagination.dto.js';
import { WithDeletedInputDto } from './crud.with.deleted.dto.js';

declare class FindInputDto<TWhere> extends WithDeletedInputDto {
    pagination?: FindInputPaginationOptionsDto;
    where?: TWhere[];
}

export { FindInputDto };
