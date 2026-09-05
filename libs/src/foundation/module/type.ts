// file: libs/src/foundation/module/type.ts
import { Signal, Type } from "@angular/core";
import { CanActivateChildFn, CanActivateFn, CanDeactivateFn, CanMatchFn, Data } from "@angular/router";
import { FoundationAreaEnum } from "../enum";
import { FoundationActionEnum } from "../action/enum";
import { FoundationNavPositionEnum } from "../nav/enum";
import { SignalStateService } from "@libs/signal-state/service";
import { ConfService } from "@libs/conf/service";
import { ContextProfileService } from "@libs/context-profile/service";
import { LogService } from "@libs/log/service";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { GlobalProgressBarService } from "src/app/base/global-progress-bar/service";

/**
 * █████████████████████████████████████████████████████████████
 * █ ROUTE █████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████
**/
/**
 * @FoundationModuleRouteType
 * the STATIC side of a *Route class, what a registry consumes
 *
 * ⚠ there is no routes() any more. a module does not know its own path, the
 * builder assembles it from rows
 *
 * ⚠ NEVER write `class GeoRoute implements FoundationModuleRouteType`.
 * typescript's `implements` checks the INSTANCE side and every member here is
 * static, so the class would be reported as missing all of them (TS2420). the
 * static shape is checked where it is used instead: assigning the class value
 * into FoundationAreaRegistryType in the area registry, which is what raises
 * TS2418 the moment a *Route class drifts from this shape
 *
 * ⚠ the INSTANCE side has no interface, on purpose. it used to, and every leaf
 * module carried `implements FoundationModuleRouteInstanceType` — dropped
 * because the two cannot be one type and the instance half was enforcing DI
 * that most modules never read:
 *
 *   - the two describe DIFFERENT OBJECTS, the constructor and the instance, so
 *     no single interface serves both call sites. statics folded into an
 *     implemented interface break every `implements` (TS2420), instance members
 *     folded in here break every registry entry (TS2418)
 *   - a `new (): { url, router }` construct signature does not rescue it: the
 *     registry is a SUPERSET of the instantiated modules. group and area routes
 *     (GeoRoute, OnboardingRoute, AuthAreaRoute, ...) are pure static holders
 *     that DI never constructs, so any instance requirement fails them
 *
 * a *Route class now injects only the DI it actually consumes, the way CrudRoute
 * always has: `url` where param getters read the URL back, `router` where a
 * sibling service reaches through it to navigate
 */
export interface FoundationModuleRouteType {
    /**
     * = mod_regisyry_index
     *
     * ⚠ A PUBLISHED CONTRACT. it becomes a row value, so renaming it is a
     * migration. SCREAMING_SNAKE, unique within its area
     */
    registryKey: string;

    /** = mod_ararea_id. also decides route ownership: a foreign area's module is nav only */
    area: FoundationAreaEnum;

    /** CODE OWNED, camelCase */
    definition(): FoundationModuleRouteDefinitionType;

    /**
     * DATA OWNED, snake_case. ⚠ THE SEAM, later an api returns this shape
     *
     * ⚠ named nav() but it is NOT menu-only. url_slug, parent_key,
     * default_child_key and active drive ROUTE GENERATION in
     * FoundationAreaBuilder — a hidden module renders in no menu and still
     * needs this. never skip it because "this module is not in a menu"
     */
    nav(): FoundationModuleRouteNavType;

    /** resolved from FoundationModulePath after the build */
    absolutePath(): string;
    absolutePathArr(): string[];
}

// ████ ROUTE NAV TYPE ██████████████████████████████████████████████
// ⚠ moved here from libs/src/foundation/module/nav.ts and renamed from
// FoundationModuleNavRowType, so every type a *Route class returns lives in one
// file. its accessor went from row() to nav() in the same change.
//
// ⚠ the "row" it describes has NOT changed meaning: this is still one record of
// te_access_area_navigation, and FoundationNavNodeType still extends it.

/**
 * @FoundationModuleRouteNavType
 * ONE row of te_access_area_navigation, joined to its te_authorisation_module
 *
 * deliberately shaped so the array a *Route class returns today and the array
 * an api returns later are the same type, with no mapping layer between them
 *
 * ⚠ snake_case (Rule 8), because this is an api payload shape. everything the
 * code owns stays camelCase
 *
 * ⚠ no `url` field, here or from an api. a url is RESOLVED from the row tree,
 * never declared, which is what stops a stale row rendering a dead link
 */
export interface FoundationModuleRouteNavType {
    /** = mod_regisyry_index, the code ⟷ db join key */
    registry_key: string;

    /** = acar_id */
    area_key: FoundationAreaEnum;

    /**
     * = parent_id, expressed as the parent's registry_key because code has no
     * row ids. null = top level, which only an area's own route should be
     *
     * ⚠ the ONLY source of hierarchy. a module never declares its own children:
     * re-parenting must be a data change, not a code change
     */
    parent_key: string | null;

    /** = url_slug, the route's `path` segment. '' = adds no url level */
    url_slug: string;

    /** = label. a GL.* key (Rule 4) or a literal */
    label: string;

    /** = icon */
    icon: string;

    /** = sort_order, within its own level only. spaced by 10 */
    sort_order: number;

    /**
     * = hidden. routed, but kept out of every menu
     *
     * ⚠ TRANSPARENT, not absent: the children rise to the level above. every
     * area row is hidden, so burying them would empty every menu
     */
    hidden?: boolean;

    /** = active. a false row is dropped entirely, no route and no menu entry */
    active?: boolean;

    /**
     * = defaultChildId. the child this node redirects to when hit bare,
     * /private -> /private/dashboard
     *
     * ⚠ parent_key CANNOT do this. they answer different questions:
     *   parent_key        "who is above me"
     *   default_child_key "which of my children is my landing page"
     * every child of an area names it as parent, so nothing in parent_key says
     * which one /private should show
     */
    default_child_key?: string | null;

    /**
     * = nav_position. WHICH menu(s) this node renders in. absent = START
     *
     * ⚠ INHERITED. declared once on a grouping row and every descendant
     * follows, because the builder carries the list down the walk
     *
     * ⚠ AN ARRAY. one entry can render in several menus at once, e.g.
     * [START, BOTTOM] puts it in the sidebar AND the footer bar from one row
     */
    nav_position?: FoundationNavPositionEnum[];

    /**
     * = te_user_authorisation_policy ⋈ te_authorisation_module_action
     * what this USER may do, a filter over definition().actions and never a
     * source. absent (no api yet) = everything the definition declares
     */
    actions?: FoundationActionEnum[];

    // PRESENTATION ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    // no column yet, add one if it ever matters
    divider?: boolean;
    css_class?: string;
}

// ████ ROUTE DEFINITION TYPE ███████████████████████████████████████
// ⚠ moved here from libs/src/foundation/module/definition.ts and renamed from
// FoundationModuleDefinitionType: it is the return type of one member of
// FoundationModuleRouteType and has no other consumer, so a file of its own was
// a hop with nothing in it. the Route prefix now matches every sibling type
// declared here.

/**
 * @FoundationModuleRouteDefinitionType
 * the CODE OWNED half of a module (Rule 6)
 *
 * the component it lazy loads, the guards that gate it, the actions it actually
 * implements. nothing here can ever come from an api, and nothing an api sends
 * can add to it
 *
 * ⚠ camelCase, unlike FoundationModuleRouteNavType which is snake_case (Rule 8)
 * the casing is the tell: camel means we own it, snake means it arrived as data
 */
export interface FoundationModuleRouteDefinitionType {
    /** = mod_regisyry_index, repeated here so the definition is self describing */
    registryKey: string;

    /**
     * absent = a GROUP: it renders as a menu panel and a componentless route,
     * never as a link. derived into `routable`, never declared
     */
    component?: () => Promise<Type<unknown>>;

    canMatch?: CanMatchFn[];
    canActivate?: CanActivateFn[];
    canActivateChild?: CanActivateChildFn[];
    canDeactivate?: CanDeactivateFn<unknown>[];

    /** breadcrumb alias, kept out of the row because xng-breadcrumb is a code concern */
    breadcrumbAlias?: string;

    /**
     * what this module CAN do
     *
     * ⚠ AUTHORITATIVE (Rule 6). an api's action list is filtered against this,
     * so a policy row can never expose a capability that has no implementation
     * see FoundationAreaBuilder.effectiveActions()
     */
    actions: FoundationActionEnum[];
}

// ████ ROUTE DATA TYPES ████████████████████████████████████████████
// The shape a route's `data` is expected to carry. `Data` in @angular/router is
// a type alias, not an interface, so declaration merging is unavailable and a
// route's `data` stays loosely typed at the definition site — consumers cast to
// FoundationModuleRouteDataType when reading it (UrlState.routeData,
// WebPageTitleStrategy).
//
// ⚠ moved here from libs/src/url/type.ts: route data is a module concern, and
// the builder is the only thing that writes it now.

export interface FoundationModuleRouteBreadcrumbType {
    label?: string;
    alias?: string;
    /** ⚠ derived by the builder as !definition.component — a group is not a link */
    disable?: boolean;
    skip?: boolean;
    info?: { icon?: string; iconOnly?: boolean };
    routeInterceptor?: (
        routeLink: unknown[] | null,
        breadcrumb: FoundationModuleRouteBreadcrumbType,
    ) => unknown[] | null;
}

/** declared and unconsumed, the attachment point for te_user_authorisation_policy (Rule 3) */
export interface FoundationModuleRouteAccessType {
    roles: string[];
}

export interface FoundationModuleRouteDataType extends Data {
    breadcrumb?: FoundationModuleRouteBreadcrumbType;
    access?: FoundationModuleRouteAccessType;

    /**
     * Browser tab title for this route, resolved by WebPageTitleStrategy.
     *
     * Takes EITHER a GL.* key or a plain literal. The service runs it through
     * transloco, which returns anything it cannot resolve unchanged.
     *
     * Prefer a GL.* key, and it must be a GL.* key never a module key: the
     * title is set BEFORE the routed component's ngOnInit calls initI18n(), so
     * the module bundle is not loaded yet.
     *
     * ⚠ written by FoundationAreaBuilder from row.label — not by hand.
     */
    title?: string;
}

/**
 * █████████████████████████████████████████████████████████████
 * █ SERVICE ███████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████
**/

export interface FoundationModuleServiceType {
    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** Module-owned state */
    state: SignalStateService;

    // METHODS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** 
     * Initialize the module's internationalization resources. 
     * Rule of thumb: 
     * - autoProvided: false => use service constructor to load
     * - autoProvided: true => use component ngOnInit to load
     */
    initI18n(): void;

    /** Set module information in the layout. */
    setModuleInfo(): void;

    /** Alter the module breadcrumbs. */
    alterBreadcrumb(): void;
}

/**
 * █████████████████████████████████████████████████████████████
 * █ STATE █████████████████████████████████████████████████████
 * █████████████████████████████████████████████████████████████
**/

export interface FoundationModuleStateType {
    // DEPENDENCIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    conf: ConfService;
    log: LogService;
    gpbs: GlobalProgressBarService;
    ctxp: ContextProfileService;
    api: BfwApiService;

    // CLASS PROPERTIES ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** Persistent state storage key for module */
    storeKey: string;

    /**
     * Debug helper (template-friendly): shows the state info as set.
     * Comment this property in production mode to reduce memory usage and browser load.
     */
    debugState?: Signal<unknown>;

    // LISTENERS ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
    /** Lifecycle hook invoked once after this state is initialized */
    onActivate(): void;
    /** Lifecycle hook invoked once when Angular destroys this state */
    onDeactivate(): void;
}