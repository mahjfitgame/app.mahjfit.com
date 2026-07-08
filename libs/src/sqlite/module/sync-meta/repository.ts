// file: libs/src/sqlite/module/sync-meta/repository.ts

import { inject, Service } from '@angular/core';
import { eq } from 'drizzle-orm';
import { SqliteService } from '@libs/sqlite/service';
import { syncMetaEntity, SyncMetaRow } from './entity';
import { SyncMetaUpsertInputDto } from './dto';

@Service()
export class SyncMetaRepository {
  private readonly sqlite = inject(SqliteService);

  public async get(key: string): Promise<SyncMetaRow | null> {
    const rows = await this.sqlite.db
      .select()
      .from(syncMetaEntity)
      .where(eq(syncMetaEntity.key, key))
      .limit(1);

    return rows.length > 0 ? rows[0] : null;
  }

  public async upsert(input: SyncMetaUpsertInputDto): Promise<void> {
    const value = this.toUpsertValue(input);

    await this.sqlite.db
      .insert(syncMetaEntity)
      .values(value)
      .onConflictDoUpdate({
        target: syncMetaEntity.key,
        set: value,
      });
  }

  private toUpsertValue(input: SyncMetaUpsertInputDto) {
    return {
      key: input.key,
      bootstrapDone: input.bootstrap_done ? 1 : 0,
      lastPulled: input.last_pulled,
      cursor: input.cursor ?? null,
      updated: Date.now(),
    };
  }
}
