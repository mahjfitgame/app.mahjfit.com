// file: libs/src/foundation/action/route.ts
import { Routes } from '@angular/router';
import { FoundationModuleRouteDataType } from '../module/type';
import { FoundationActionEnum, FoundationActionSlugEnum } from './enum';

export class FoundationActionRoute {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * the actions that produce a route, the rest produce none
     *
     * most of the others are not "unimplemented", they are LISTING STATE
     * carried in matrix params on the module's own route: listing, quick-search,
     * advance-search, auto-suggest, column-position, display-fields, sorting,
     * alpha-sort, recycle-bin, quick-update. the remainder (soft-delete, delete,
     * restore, recover, mark-as-main, record-position, active-inactive,
     * bulk-action) are record mutations with no url surface of their own
     *
     * ⚠ stays in sync with the if chain in routesFor() and with slugOf()
     * three places on purpose, each answers a different question
     */
    public static readonly routable: readonly FoundationActionEnum[] = [
        FoundationActionEnum.CREATE,
        FoundationActionEnum.UPDATE,
        FoundationActionEnum.VIEW,
        FoundationActionEnum.UPLOAD,
        FoundationActionEnum.UPLOAD_DELETE,
        FoundationActionEnum.FILE_RELOCATION,
        FoundationActionEnum.IMPORT,
        FoundationActionEnum.EXPORT,
        FoundationActionEnum.INSIGHT,
        FoundationActionEnum.PRINT,
        FoundationActionEnum.SHARE,
        FoundationActionEnum.DUPLICATE,
    ];

    // TESTS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** first segment test, used by CrudRoute's live route reads */
    public static isRoutable(value: string): value is FoundationActionEnum {
        return (FoundationActionRoute.routable as readonly string[]).includes(value);
    }

    // SLUGS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * the route segment for one action, '' when it has no route
     *
     * used by FoundationModulePath.ofAction() so a module can expose
     * absolutePathView() / absolutePathUpdate() without hand building a path
     */
    public static slugOf(action: FoundationActionEnum): string {
        if (action === FoundationActionEnum.CREATE)          return FoundationActionSlugEnum.CREATE;
        if (action === FoundationActionEnum.UPDATE)          return FoundationActionSlugEnum.UPDATE;
        if (action === FoundationActionEnum.VIEW)            return FoundationActionSlugEnum.VIEW;
        if (action === FoundationActionEnum.UPLOAD)          return FoundationActionSlugEnum.UPLOAD;
        if (action === FoundationActionEnum.UPLOAD_DELETE)   return FoundationActionSlugEnum.UPLOAD_DELETE;
        if (action === FoundationActionEnum.FILE_RELOCATION) return FoundationActionSlugEnum.FILE_RELOCATION;
        if (action === FoundationActionEnum.IMPORT)          return FoundationActionSlugEnum.IMPORT;
        if (action === FoundationActionEnum.EXPORT)          return FoundationActionSlugEnum.EXPORT;
        if (action === FoundationActionEnum.INSIGHT)         return FoundationActionSlugEnum.INSIGHT;
        if (action === FoundationActionEnum.PRINT)           return FoundationActionSlugEnum.PRINT;
        if (action === FoundationActionEnum.SHARE)           return FoundationActionSlugEnum.SHARE;
        if (action === FoundationActionEnum.DUPLICATE)       return FoundationActionSlugEnum.DUPLICATE;

        return '';
    }

    // ROUTES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /**
     * @routesFor()
     * the action children of one module
     *
     * ⚠ ORDER IS EXPLICIT, never taken from the actions array
     * that array arrives from an api and route order is matching semantics
     */
    public static routesFor(actions: FoundationActionEnum[], alias: string): Routes {
        const routes: Routes = [];

        if (actions.includes(FoundationActionEnum.CREATE))          routes.push(...this.createRoutes(alias));
        if (actions.includes(FoundationActionEnum.UPDATE))          routes.push(...this.updateRoutes(alias));
        if (actions.includes(FoundationActionEnum.VIEW))            routes.push(...this.viewRoutes(alias));
        if (actions.includes(FoundationActionEnum.UPLOAD))          routes.push(...this.uploadRoutes(alias));
        if (actions.includes(FoundationActionEnum.UPLOAD_DELETE))   routes.push(...this.uploadDeleteRoutes(alias));
        if (actions.includes(FoundationActionEnum.FILE_RELOCATION)) routes.push(...this.fileRelocationRoutes(alias));
        if (actions.includes(FoundationActionEnum.IMPORT))          routes.push(...this.importRoutes(alias));
        if (actions.includes(FoundationActionEnum.EXPORT))          routes.push(...this.exportRoutes(alias));
        if (actions.includes(FoundationActionEnum.INSIGHT))         routes.push(...this.insightRoutes(alias));
        if (actions.includes(FoundationActionEnum.PRINT))           routes.push(...this.printRoutes(alias));
        if (actions.includes(FoundationActionEnum.SHARE))           routes.push(...this.shareRoutes(alias));
        if (actions.includes(FoundationActionEnum.DUPLICATE))       routes.push(...this.duplicateRoutes(alias));

        return routes;
    }

    /**
     * one method per action, no shared builder
     *
     * ⚠ componentless is load bearing on all of these, the parent listing
     * component is never torn down so `country;cp=3` survives the overlay
     * an action that needs its own page changes only its own method
     *
     * children: [] because angular requires one of
     * component / loadComponent / redirectTo / children / loadChildren
     */
    public static createRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.CREATE,
            data: { breadcrumb: { label: 'GL.ACTION.CREATE', alias: `${alias}Create` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
    public static updateRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.UPDATE,
            data: { breadcrumb: { label: 'GL.ACTION.UPDATE', alias: `${alias}Update` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
    public static viewRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.VIEW,
            data: { breadcrumb: { label: 'GL.ACTION.VIEW', alias: `${alias}View` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
    public static uploadRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.UPLOAD,
            data: { breadcrumb: { label: 'GL.ACTION.UPLOAD', alias: `${alias}Upload` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
    public static uploadDeleteRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.UPLOAD_DELETE,
            data: { breadcrumb: { label: 'GL.ACTION.UPLOAD_DELETE', alias: `${alias}UploadDelete` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
    public static fileRelocationRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.FILE_RELOCATION,
            data: { breadcrumb: { label: 'GL.ACTION.FILE_RELOCATION', alias: `${alias}FileRelocation` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
    public static importRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.IMPORT,
            data: { breadcrumb: { label: 'GL.ACTION.IMPORT', alias: `${alias}Import` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
    public static exportRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.EXPORT,
            data: { breadcrumb: { label: 'GL.ACTION.EXPORT', alias: `${alias}Export` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
    public static insightRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.INSIGHT,
            data: { breadcrumb: { label: 'GL.ACTION.INSIGHT', alias: `${alias}Insight` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
    public static printRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.PRINT,
            data: { breadcrumb: { label: 'GL.ACTION.PRINT', alias: `${alias}Print` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
    public static shareRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.SHARE,
            data: { breadcrumb: { label: 'GL.ACTION.SHARE', alias: `${alias}Share` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
    public static duplicateRoutes(alias: string): Routes {
        return [{
            path: FoundationActionSlugEnum.DUPLICATE,
            data: { breadcrumb: { label: 'GL.ACTION.DUPLICATE', alias: `${alias}Duplicate` } } satisfies FoundationModuleRouteDataType,
            children: [],
        }];
    }
}
