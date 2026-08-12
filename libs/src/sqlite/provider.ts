// file: libs/src/sqlite/provider.ts
import { inject, provideAppInitializer } from "@angular/core";
import { SqliteService } from "./service";

export function provideSqliteModule() {
    return [
        provideAppInitializer(() => {
            const sqlite = inject(SqliteService);
            return sqlite.init();
        })
    ];
}