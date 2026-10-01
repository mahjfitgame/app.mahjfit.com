// file: src/app/base/crud/route.ts
import { inject, Service } from "@angular/core";
import { FoundationActionEnum } from "@libs/foundation/action/enum";
import { FoundationActionRoute } from "@libs/foundation/action/route";
import { CrudActionRecordIndexType } from "@base/crud/type";
import { UrlService } from "@libs/url/service";
import { FoundationRouteDefaultParamEnum } from "@libs/foundation/route/enum";

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
     * Parses the ':index' segment into the comma-separated multi-record shape.
     *
     * ⚠ SHAPE ONLY — which COLUMN that value addresses is CrudState's business
     * (setIndexColumn), and deliberately does not live here: CrudRoute depends
     * on nothing inside CRUD (see the class comment).
     */
    public toCrudActionRecordIndex(value: string | null): CrudActionRecordIndexType {
        if (!value) {
            return [];
        }

        const values = value.split(',').map((one) => one.trim());

        return values.length === 1 ? values[0] : values;
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

    /**
     * Mirrors CrudState.crudActionRecordIndexFromRoute, reads ':index'.
     *
     * One reader, because there is ONE record param and one column it
     * addresses. Kept as the live (tier 1-2) counterpart to the signal even
     * while nothing calls it — that symmetry is the point, see the block
     * comment above.
     */
    public readCrudActionRecordIndexFromRoute(): CrudActionRecordIndexType {
        // live read, same reason as readCrudActionFromRoute() above
        return this.toCrudActionRecordIndex(
            this.url.state.getActivatedRouteSnapshot().paramMap.get(
                FoundationRouteDefaultParamEnum.INDEX,
            ),
        );
    }

    public readIsCrudActionRoute(): boolean {
        return this.readCrudActionFromRoute() !== null;
    }

    public readIsMutationActionRoute(): boolean {
        const action = this.readCrudActionFromRoute();

        return action === FoundationActionEnum.CREATE
            || action === FoundationActionEnum.UPDATE
            || action === FoundationActionEnum.DUPLICATE;
    }
}
