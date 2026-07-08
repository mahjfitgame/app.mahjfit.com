// file: ./src/app/base/crud/utility.ts
import { inject, Service } from "@angular/core";
import { CrudState } from "@base/crud/state";
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { SignatureService } from "@libs/signature/service";
import { UrlService } from "@libs/url/service";

@Service({ autoProvided: false })
export class CrudUtility {
    public readonly state = inject(CrudState);
    private readonly sign = inject(SignatureService);

    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    private readonly ump = inject(UrlService);

    constructor() {}

    // █████ GENERAL ████████████████████████████████████████████████
    public isArray(options: any): options is Array<any> {
        return Array.isArray(options);
    }
    public parseKey(key: string | number | symbol): any {
        const keyStr = String(key); // Safely convert to string format
        
        if (keyStr === 'true') return true;
        if (keyStr === 'false') return false;
        if (!isNaN(Number(keyStr)) && keyStr.trim() !== '') return Number(keyStr);
        return keyStr;
    }
    
    

    // █████ ENCRYPTION ████████████████████████████████████████████████
    

    public encId(id: string): string {
        // checking with signature character
        if(this.sign.isEndStableShortAlias(id)) {
            return id;
        }

        const primaryKey = this.state.primaryKey() ?? '';
        const prefix = primaryKey + '~crud';

        const salt = this.ump.getRouteBasedModuleAlias(prefix);
        return this.sign.createStableShortAlias(`${salt}~${id}`);
    }
    public descId(alias: string, rowIdKey?: string): string | null {
        const normalizedAlias = String(alias ?? '').trim();

        if (!normalizedAlias) {
            return null;
        }

        const matchedRow = this.state.listingDataSource().data.find((row) => {
            const rowId = this.state.getRecordId(row, rowIdKey);

            if (!rowId) {
                return false;
            }

            return this.encId(rowId) === normalizedAlias;
        });

        return matchedRow
            ? this.state.getRecordId(matchedRow, rowIdKey)
            : null;
    }
    public descIds(
        aliases: string[] | null | undefined,
        rowIdKey?: string,
    ): string[] | null {
        if (!aliases || aliases.length === 0) {
            return null;
        }

        const ids = aliases
            .map((alias) => this.descId(alias, rowIdKey))
            .filter((id): id is string => !!id);

        const uniqueIds = [...new Set(ids)];

        return uniqueIds.length > 0 ? uniqueIds : null;
    }
}