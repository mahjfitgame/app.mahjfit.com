// file: libs/src/sqlite/module/_local_migrations/dto.ts

import { LocalMigrationStatusEnum } from "./enum";

export interface LocalMigrationsCreateInputDto {
  version: string;
  name: string;
  sql_up: string[];
  sql_down: string[];
  checksum: string;
  status: LocalMigrationStatusEnum;
}