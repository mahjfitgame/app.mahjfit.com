// file: ./src/app/base/pagination/type.ts
export interface AppPaginationEvent {
  previousPageIndex: number;
  pageIndex: number; // 1-based for parent
  pageSize: number;
  totalRecords: number;
}