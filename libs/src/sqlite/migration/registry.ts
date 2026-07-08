// file: libs/src/sqlite/migration/registry.ts

import { LocalMigrationType } from "../module/_local_migrations/type";
import { MIGRATION_1_0_1_UPDATE_AND_ADD_INDEXES } from "./upgrade/1.0.1-update-and-add-indexes";
import { MIGRATION_1_0_2_UPDATE_LOCAL_MIGRATIONS_SQL_COLUMNS } from "./upgrade/1.0.2-update-local-migrations-sql-columns";
import { MIGRATION_1_0_3_ADD_SYNC_META_LAST_PULLED_INDEX } from "./upgrade/1.0.3-add-sync-meta-last-pulled-index";
import { MIGRATION_1_0_4_ADD_INDEXES } from "./upgrade/1.0.4-add-indexes";

/**
 * Add migration files here in any order.
 * MigrationRunner will sort them by semantic version.
 */

// MIGRATION STEP 6: REGISTER MIGRATION (keep older migrations as it is)
export const LOCAL_MIGRATION_REGISTRY: LocalMigrationType[] = [
    // keep adding new migraion at bottom
    MIGRATION_1_0_1_UPDATE_AND_ADD_INDEXES,
    MIGRATION_1_0_2_UPDATE_LOCAL_MIGRATIONS_SQL_COLUMNS,
    MIGRATION_1_0_3_ADD_SYNC_META_LAST_PULLED_INDEX,
    MIGRATION_1_0_4_ADD_INDEXES,
];
