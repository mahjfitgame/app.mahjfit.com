// file: libs/src/sqlite/module/sync-queue/dto.ts

import { SyncQueueStatusEnum } from './enum';

export interface SyncQueueAddInputDto {
  operation: string;
  payload: unknown;
}

export interface SyncQueueSetStatusInputDto {
  id: string;
  status: SyncQueueStatusEnum;
  retry_count?: number;
}
