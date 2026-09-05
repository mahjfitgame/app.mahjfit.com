// file: src/app/base/crud/utility.ts
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
    /**
     * ⚠ PARKED, NOT DEAD. Nothing calls these at runtime right now.
     *
     * They only ever ran behind `apply_enc: true`, and the one field that set
     * it — listing_selected_rows — now carries the SECONDARY key in the clear,
     * because that key is already opaque and needs no alias in front of it.
     * CrudValidation's encIfNeeded / decryptOneSafe / encryptOneSafe all
     * short-circuit on `!fi.apply_enc`, so this whole layer is bypassed.
     *
     * Kept, deliberately and primary-key salted, for the day a field needs
     * primary-key values in the url again. Set apply_enc back to true on that
     * field and this wakes up unchanged.
     *
     * ⚠ the primary key NAME is baked into the salt below — changing which key
     * feeds encId invalidates every alias already handed out in a bookmarked
     * or shared url.
     */

    public encPrimaryKey(id: string): string {
        // checking with signature character
        if(this.sign.isEndStableShortAlias(id)) {
            return id;
        }

        const primaryKey = this.state.primaryKey() ?? '';
        const prefix = primaryKey + '~crud';

        const salt = this.ump.getRouteBasedModuleAlias(prefix);
        return this.sign.createStableShortAlias(`${salt}~${id}`);
    }
    public descPrimaryKey(alias: string, rowIdKey?: string): string | null {
        const normalizedAlias = String(alias ?? '').trim();

        if (!normalizedAlias) {
            return null;
        }

        const matchedRow = this.state.listingDataSource().data.find((row) => {
            const rowId = this.state.getRecordPrimaryKeyValue(row, rowIdKey);

            if (!rowId) {
                return false;
            }

            return this.encPrimaryKey(rowId) === normalizedAlias;
        });

        return matchedRow
            ? this.state.getRecordPrimaryKeyValue(matchedRow, rowIdKey)
            : null;
    }
    public descPrimaryKeys(
        aliases: string[] | null | undefined,
        rowIdKey?: string,
    ): string[] | null {
        if (!aliases || aliases.length === 0) {
            return null;
        }

        const ids = aliases
            .map((alias) => this.descPrimaryKey(alias, rowIdKey))
            .filter((id): id is string => !!id);

        const uniqueIds = [...new Set(ids)];

        return uniqueIds.length > 0 ? uniqueIds : null;
    }
}