// file: src/app/module/shared/geo/country/route.ts

import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { FoundationActionEnum } from '@libs/foundation/action/enum';
import { FoundationAreaEnum } from '@libs/foundation/enum';
import { FoundationModuleRouteDefinitionType, FoundationModuleRouteNavType } from '@libs/foundation/module/type';
import { FoundationModulePath } from '@libs/foundation/module/path';
import { FoundationNavPositionEnum } from '@libs/foundation/nav/enum';
import { UrlService } from '@libs/url/service';
import { SLUG_GEO_COUNTRY } from '@module/shared/geo/country/slug';
import { GeoRoute } from '@module/shared/geo/route';
import { FoundationFieldDefaultNameEnum } from '@libs/foundation/field/enum';

@Service({ autoProvided: false })
export class GeoCountryRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static readonly registryKey = 'GEO_COUNTRY';
    public static readonly area = FoundationAreaEnum.PRIVATE;

    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public readonly url = inject(UrlService);
    public readonly router = inject(Router);

    // DEFINITION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * CODE OWNED. `actions` is authoritative (Rule 6): an api's list is
     * filtered against it, so a policy row can never expose a capability with
     * no implementation behind it
     *
     * ⚠ this list also drives the absolutePath*() helpers below — declare an
     * action here or its route was never generated
     */
    public static definition(): FoundationModuleRouteDefinitionType {
        return {
            registryKey: this.registryKey,
            component: () => import('@module/shared/geo/country/component').then((c) => c.GeoCountryComponent),
            canMatch: [],
            canActivate: [],
            canActivateChild: [],
            canDeactivate: [],
            breadcrumbAlias: 'geoCountry',
            actions: [
                FoundationActionEnum.LISTING,          // no route, matrix params
                FoundationActionEnum.CREATE,           // -> country/create
                FoundationActionEnum.UPDATE,           // -> country/update/:keyid
                FoundationActionEnum.QUICK_SEARCH,     // no route, matrix params
                FoundationActionEnum.COLUMN_POSITION,  // no route, matrix params
            ],
        };
    }

    // NAV ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static nav(): FoundationModuleRouteNavType {
        return {
            registry_key: this.registryKey,
            area_key: this.area,
            parent_key: GeoRoute.registryKey,
            url_slug: SLUG_GEO_COUNTRY,
            label: 'GL.MODULE.GEO.COUNTRY',
            icon: 'globe',
            sort_order: 10,
            nav_position: [FoundationNavPositionEnum.START],
        };
    }

    // PATHS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    public static absolutePathArr(): string[] {
        return FoundationModulePath.arrOf(this.registryKey);
    }
    public static absolutePath(): string {
        return FoundationModulePath.of(this.registryKey);
    }

    /**
     * @absolutePathCreate()
     * /private/geo/country/create
     *
     * ⚠ never hand build `${absolutePath()}/create` — that survives until
     * someone re-parents the module or renames the action slug
     */
    public static absolutePathCreate(): string {
        return FoundationModulePath.ofAction(this.registryKey, FoundationActionEnum.CREATE);
    }

    /** /private/geo/country/update/42 */
    public static absolutePathUpdate(keyid: string | number): string {
        return FoundationModulePath.ofAction(this.registryKey, FoundationActionEnum.UPDATE, {
            [`:${FoundationFieldDefaultNameEnum.KEYID}`]: keyid,
        });
    }

    // NAVIGATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

    // PARAM GETTERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
}
