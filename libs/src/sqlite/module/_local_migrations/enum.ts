// file: libs/src/sqlite/module/_local_migrations/repository.ts

export enum LocalMigrationStatusEnum {
    APPLIED = 'applied',
    BASELINE = 'baseline',
    ROLLED_BACK = 'rolled_back',
}