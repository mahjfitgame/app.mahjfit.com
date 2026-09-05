// file: src/app/base/crud/route.ts
import { inject, Service } from "@angular/core";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { FoundationActionRoute } from "@libs/foundation/action/route";
import { CrudActionRecordPrimaryKeyValueType, CrudActionRecordSecondaryKeyValueType } from "@base/crud/type";
import { UrlService } from "@libs/url/service";
import { FoundationFieldDefaultNameEnum } from "@libs/foundation/field/enum";

/**
 * @CrudRoute
 *
 * The CRUD layer's URL surface, same role a module's *Route class plays:
 * it knows how a CRUD action URL is shaped and how to read one back.
 *
 * Deliberately depends on nothing inside CRUD — no CrudState, no CrudUrl,
 * no CrudUtility. That is what lets both CrudState and CrudUrl inject it
 * without a DI cycle, and what keeps route.ts out of every import cycle.
 * Do not add a CRUD dependency here.
 */
@Service({ autoProvided: false })
export class CrudRoute {
    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly url = inject(UrlService);

    // PARSING ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * One copy of the parse, used by both readers:
     *   CrudState — inside its route computeds (tier 3-4)
     *   CrudRoute — inside the live read*() methods below (tier 1-2)
     * so the signal form and the live form cannot drift.
     */
    /**
     * ⚠ delegates. the ROUTABLE subset is foundation's answer, not CRUD's —
     * only 12 of the 30 actions produce a url segment, the rest are matrix
     * param listing state or record mutations with no surface of their own
     */
    public isCrudActionValue(value: string): value is FoundationActionEnum {
        return FoundationActionRoute.isRoutable(value);
    }

    /**
     * PARKED. Parses a ':id' segment — see CrudState for why the two key
     * chains read different params.
     */
    public toCrudActionRecordPrimaryKey(id: string | null): CrudActionRecordPrimaryKeyValueType {
        if (!id) {
            return [];
        }

        const ids = id.split(',').map((id) => id.trim());

        return ids.length === 1 ? ids[0] : ids;
    }

    /**
     * LIVE. Parses a ':keyid' segment, the param every record-scoped slug in
     * FoundationActionSlugEnum declares. Same comma-separated multi-record
     * shape as the primary parse.
     */
    public toCrudActionRecordSecondaryKey(key: string | null): CrudActionRecordSecondaryKeyValueType {
        if (!key) {
            return [];
        }

        const keys = key.split(',').map((key) => key.trim());

        return keys.length === 1 ? keys[0] : keys;
    }

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * LIVE snapshot reads, deliberately not the route signals.
     *
     * These run during route activation (tier 1-2), one step before the route
     * signals settle. A signal read here returns the PREVIOUS navigation.
     *
     * They stay live permanently. The signal equivalents are on CrudState
     * (crudAction / crudActionRecord*Key). See docs/route-phase-2.md.
     */
    public readCrudActionFromRoute(): FoundationActionEnum | null {
        const firstPath = this.url.state.getActivatedRouteSnapshot().url.at(0)?.path ?? null;

        if (!firstPath) {
            return null;
        }

        return this.isCrudActionValue(firstPath) ? firstPath : null;
    }

    // PARKED — mirrors crudActionRecordPrimaryKeyFromRoute, reads ':id'
    public readCrudActionRecordPrimaryKeyFromRoute(): CrudActionRecordPrimaryKeyValueType {
        // live read, same reason as readCrudActionFromRoute() above
        return this.toCrudActionRecordPrimaryKey(
            this.url.state.getActivatedRouteSnapshot().paramMap.get(FoundationFieldDefaultNameEnum.ID),
        );
    }

    // LIVE — mirrors crudActionRecordSecondaryKeyFromRoute, reads ':keyid'
    public readCrudActionRecordSecondaryKeyFromRoute(): CrudActionRecordSecondaryKeyValueType {
        // live read, same reason as readCrudActionFromRoute() above
        return this.toCrudActionRecordSecondaryKey(
            this.url.state.getActivatedRouteSnapshot().paramMap.get(FoundationFieldDefaultNameEnum.KEYID),
        );
    }

    public readIsCrudActionRoute(): boolean {
        return this.readCrudActionFromRoute() !== null;
    }

    public readIsMutationActionRoute(): boolean {
        const action = this.readCrudActionFromRoute();

        return action === FoundationActionEnum.CREATE || action === FoundationActionEnum.UPDATE;
    }
}