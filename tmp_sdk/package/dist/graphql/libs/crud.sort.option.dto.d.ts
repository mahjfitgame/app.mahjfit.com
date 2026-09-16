import { RecordSortDirectionEnum, RecordSortNullPositionEnum } from './crud.enum.js';

declare class SortOrderOption {
    direction?: RecordSortDirectionEnum;
    nulls?: RecordSortNullPositionEnum;
}

export { SortOrderOption };
