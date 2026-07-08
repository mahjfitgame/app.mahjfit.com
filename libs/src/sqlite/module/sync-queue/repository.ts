// file: libs/src/sqlite/module/sync-queue/repository.ts

import { inject, Service } from '@angular/core';
import { asc, eq } from 'drizzle-orm';
import { SqliteService } from '@libs/sqlite/service';
import { syncQueueEntity, SyncQueueRow } from './entity';
import { SyncQueueStatusEnum } from './enum';
import { SyncQueueAddInputDto, SyncQueueSetStatusInputDto } from './dto';

@Service()
export class SyncQueueRepository {
  private readonly sqlite = inject(SqliteService);

  public async add(input: SyncQueueAddInputDto): Promise<void> {
    const value = this.toInsertValue(input);

    await this.sqlite.db
      .insert(syncQueueEntity)
      .values(value);
  }

  public async getPending(limit = 50): Promise<SyncQueueRow[]> {
    return this.sqlite.db
      .select()
      .from(syncQueueEntity)
      .where(eq(syncQueueEntity.status, SyncQueueStatusEnum.PENDING))
      .orderBy(asc(syncQueueEntity.created))
      .limit(limit);
  }

  public async setStatus(
    id: string,
    status: SyncQueueStatusEnum,
    retry_count?: number,
  ): Promise<void> {
    await this.updateStatus({
      id,
      status,
      retry_count,
    });
  }

  public async updateStatus(input: SyncQueueSetStatusInputDto): Promise<void> {
    await this.sqlite.db
      .update(syncQueueEntity)
      .set({
        status: input.status,
        retryCount: input.retry_count ?? 0,
        updated: Date.now(),
      })
      .where(eq(syncQueueEntity.id, input.id));
  }

  private toInsertValue(input: SyncQueueAddInputDto) {
    const now = Date.now();

    return {
      id: crypto.randomUUID(),
      operation: input.operation,
      payload: JSON.stringify(input.payload),
      status: SyncQueueStatusEnum.PENDING,
      retryCount: 0,
      created: now,
      updated: now,
    };
  }
}
