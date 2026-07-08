// file: libs/src/sqlite/module/sync-meta/dto.ts

export interface SyncMetaUpsertInputDto {
  key: string;
  bootstrap_done: boolean;
  last_pulled: number;
  cursor?: string | null;
}
