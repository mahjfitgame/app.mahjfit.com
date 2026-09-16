import { aS as ApiEndpointAuthEntity, bC as ApiEndpointAuthSelectionSchema, B8 as GraphqlBase, gT as BusinessGraphqlWsDomainAccessors, Vo as UserWs, FR as SharedGraphqlWsModuleFactories, gS as BusinessGraphqlDomainAccessors, bD as ApiEndpointAuthService, jx as ContextProfileService, Xn as WebhookResponseService, Wh as WebhookResponseDataService, L6 as UserAuthenticationService, ac as AlertDurationService, Dm as MultifactorAuthenticationTypeService, n5 as DeviceService, GJ as ThirdPartyPlatformService, YR as WorkStatusService, eI as AuthorisationRoleService, EA as QueueEmailService, TX as UserService, NS as UserDeviceService, rN as FaqService, qC as FaqCategoryService, Mo as UserAuthorisationService, lS as CountryService, l2 as CountryPhoneCodeService, FA as SessionService, C3 as LeadService, j3 as ConnectionSourceService, hM as ConnectionSourceCategoryService, Ba as GraphqlTransport, FQ as SharedGraphModuleFactories } from './domain-CwCU_D27.js';
import { f as BfwApiSdkResponse, J as JwtAuthorization } from './jwt.authorization-BzVAMORw.js';
import { EmailAddress, DateTime } from './graphql/libs/crud.scalar.js';
import { WsTransport } from './ws/index.js';
import { c as JwtStatefulAuthorization, J as JwtHostAuthorization } from './lazy-BET-tQmf.js';

declare class GraphEntity extends ApiEndpointAuthEntity {
    static metaname: string;
}
declare class GraphSelectionSchema extends ApiEndpointAuthSelectionSchema {
}

declare class GraphDto extends GraphEntity {
}
declare class GraphSignupDto extends GraphDto {
    static metaname: string;
}
declare class GraphSignupInputDto implements GraphSignupDto {
    username: string;
    identify: string;
    email: string;
}
declare class GraphSignupOutputDto {
    username?: string;
    email?: string;
    jwt_access_token?: string;
    jwt_refresh_token?: string;
    created?: string;
}
declare class GraphSignupOutputSelectionSchema {
    username?: boolean;
    email?: boolean;
    jwt_access_token?: boolean;
    jwt_refresh_token?: boolean;
    created?: boolean;
}
declare class GraphSigninDto extends GraphDto {
    static metaname: string;
}
declare class GraphSigninInputDto implements GraphSigninDto {
    username: string;
    identify: string;
}
declare class GraphSigninOutputDto extends GraphEntity {
    /**
     * Not allowed to search by this field
     * **/
    fr_api_endpoint_auth_files?: undefined;
}
declare class GraphSigninOutputSelectionSchema extends GraphSelectionSchema {
    /**
     * Not allowed to search by this field
     * **/
    fr_api_endpoint_auth_files?: undefined;
}
declare class GraphRefreshJWTDto extends GraphDto {
    static metaname: string;
}
declare class GraphRefreshJWTInputDto {
    jwtRefreshToken: string;
}
declare class GraphResetPasswordDto extends GraphDto {
    static metaname: string;
}
declare class GraphResetPasswordInputDto extends GraphResetPasswordDto {
    username: string;
    identify: string;
    jwt_refresh_token: string;
}
declare class GraphResetPasswordOutputDto {
    /** Required to gain access to API endpoint. */
    username?: string;
    /** Email is required for varification and communication. */
    email?: EmailAddress;
    /** Record created date time. */
    created?: DateTime;
    /** Record last updated date time. Update can be any. */
    updated?: DateTime;
}
declare class GraphResetPasswordOutputSelectionSchema {
    /** Required to gain access to API endpoint. */
    username?: boolean;
    /** Email is required for varification and communication. */
    email?: boolean;
    /** Record created date time. */
    created?: boolean;
    /** Record last updated date time. Update can be any. */
    updated?: boolean;
}
declare class GraphSignoutDto extends GraphDto {
    static metaname: string;
}
declare class GraphHelloDto extends GraphDto {
    static metaname: string;
}
declare class GraphHelloOutputDto {
    msg: string;
}
declare class GraphWhoAmIDto extends GraphDto {
    static metaname: string;
}
type GraphSignupResponse = {
    GraphSignup: GraphSignupOutputDto;
};
type GraphSigninResponse = {
    GraphSignin: GraphSigninOutputDto;
};
type GraphRefreshJWTResponse = {
    GraphRefreshJWT: GraphSigninOutputDto;
};
type GraphResetPasswordResponse = {
    GraphResetPassword: GraphResetPasswordOutputDto;
};
type GraphWhoAmIResponse = {
    GraphWhoAmI: GraphSignupOutputDto;
};
type GraphSignoutResponse = {
    GraphSignout: boolean;
};
type GraphHelloResponse = {
    GraphHello: string;
};

declare class GraphService extends GraphqlBase {
    hello(args?: {
        headers?: Record<string, string>;
        signal?: AbortSignal;
    }): Promise<BfwApiSdkResponse<string>>;
    signup(args: {
        input: GraphSignupInputDto;
        selection: GraphSignupOutputSelectionSchema;
        headers?: Record<string, string>;
        signal?: AbortSignal;
    }): Promise<BfwApiSdkResponse<GraphSignupOutputDto>>;
    signin(args: {
        input: GraphSigninInputDto;
        selection: GraphSigninOutputSelectionSchema;
        headers?: Record<string, string>;
        signal?: AbortSignal;
    }): Promise<BfwApiSdkResponse<GraphSigninOutputDto>>;
    refreshJWT(args: {
        input: GraphRefreshJWTInputDto;
        selection: GraphSigninOutputSelectionSchema;
        headers?: Record<string, string>;
        signal?: AbortSignal;
    }): Promise<BfwApiSdkResponse<GraphSigninOutputDto>>;
    resetPassword(args: {
        input: GraphResetPasswordInputDto;
        selection: GraphResetPasswordOutputSelectionSchema;
        headers?: Record<string, string>;
        signal?: AbortSignal;
    }): Promise<BfwApiSdkResponse<GraphResetPasswordOutputDto>>;
    whoAmI(args: {
        selection: GraphSignupOutputSelectionSchema;
        headers?: Record<string, string>;
        signal?: AbortSignal;
    }): Promise<BfwApiSdkResponse<GraphSignupOutputDto>>;
    signout(args?: {
        headers?: Record<string, string>;
        signal?: AbortSignal;
    }): Promise<BfwApiSdkResponse<boolean>>;
}

/** Bind shared GraphQL realtime modules to the owning GraphQL WsTransport. */
declare function createSharedGraphqlWsFactories(transport: WsTransport): SharedGraphqlWsModuleFactories;
/** Typed accessors for shared GraphQL realtime modules. */
declare abstract class SharedGraphqlWsDomainAccessors extends BusinessGraphqlWsDomainAccessors {
    /** Typed websocket module for shared user events. */
    get user(): UserWs;
}

declare function createSharedGraphqlFactories(transport: GraphqlTransport, jwtAuthorization: JwtAuthorization, jwtStatefulAuthorization?: JwtStatefulAuthorization, jwtHostAuthorization?: JwtHostAuthorization): SharedGraphModuleFactories;
declare abstract class SharedGraphqlDomainAccessors extends BusinessGraphqlDomainAccessors {
    /** Module: ApiEndpointAuth - API endpoint authentication insert, update, delete, restore, recover etc */
    get apiEndpointAuth(): ApiEndpointAuthService;
    /** Module: ContextProfile - Read-only lookups of the current express session context, such as session id (ctxs) and the signed in user profile basics. */
    get contextProfile(): ContextProfileService;
    /** Module: WebhookResponse - Webhook response management with find and CRUD operations. */
    get webhookResponse(): WebhookResponseService;
    /** Module: WebhookResponseData - Webhook response data management with find and CRUD operations. */
    get webhookResponseData(): WebhookResponseDataService;
    /** Module: User Authentication - User authentication insert, update, delete, restore, recover etc */
    get userAuthentication(): UserAuthenticationService;
    /** Module: Alert Duration - Master data of alert duration such as, daily, weekly, monthly etc. */
    get alertDuration(): AlertDurationService;
    /** Module: Multifactor Authentication Type - Master data of twofa authentication type. */
    get multifactorAuthenticationType(): MultifactorAuthenticationTypeService;
    /** Module: Device - Master data of devices such as, mobile, tablet, desktop etc. */
    get device(): DeviceService;
    /** Module: ThirdPartyPlatform - Master data of third party platforms such as, facebook, google etc. */
    get thirdPartyPlatform(): ThirdPartyPlatformService;
    /** Module: Work Status - Master data of work status such as, full-time, part-time, freelancer etc. */
    get workStatus(): WorkStatusService;
    /** Module: Authorisation Role - Master data of authorisation roles. */
    get authorisationRole(): AuthorisationRoleService;
    /** Module: Queue Email - Queue of email delivery records with find and CRUD operations. */
    get queueEmail(): QueueEmailService;
    /** Module: User - User management such as, create user, update user, delete user, restore user, recover user etc. */
    get user(): UserService;
    /** Module: UserDevice - User device management with find and CRUD operations. */
    get userDevice(): UserDeviceService;
    /** Module: Faq - Master data of faq. */
    get faq(): FaqService;
    /** Module: Faq Category - Master data of faq categories. */
    get faqCategory(): FaqCategoryService;
    get userAuthorisation(): UserAuthorisationService;
    /** Module: Country - Country management with find and CRUD operations. */
    get country(): CountryService;
    /** Module: CountryPhoneCode - Country phone code management with find and CRUD operations. */
    get countryPhoneCode(): CountryPhoneCodeService;
    /** Module: Session - User session management operations. */
    get session(): SessionService;
    /** Module: Lead - Lead management with find and CRUD operations. */
    get lead(): LeadService;
    /** Module: ConnectionSource - Connection source management with find and CRUD operations. */
    get connectionSource(): ConnectionSourceService;
    /** Module: ConnectionSourceCategory - Connection source category management with find and CRUD operations. */
    get connectionSourceCategory(): ConnectionSourceCategoryService;
}

export { GraphWhoAmIDto as A, type GraphWhoAmIResponse as B, SharedGraphqlWsDomainAccessors as C, createSharedGraphqlFactories as D, createSharedGraphqlWsFactories as E, GraphDto as G, SharedGraphqlDomainAccessors as S, GraphEntity as a, GraphHelloDto as b, GraphHelloOutputDto as c, type GraphHelloResponse as d, GraphRefreshJWTDto as e, GraphRefreshJWTInputDto as f, type GraphRefreshJWTResponse as g, GraphResetPasswordDto as h, GraphResetPasswordInputDto as i, GraphResetPasswordOutputDto as j, GraphResetPasswordOutputSelectionSchema as k, type GraphResetPasswordResponse as l, GraphSelectionSchema as m, GraphService as n, GraphSigninDto as o, GraphSigninInputDto as p, GraphSigninOutputDto as q, GraphSigninOutputSelectionSchema as r, type GraphSigninResponse as s, GraphSignoutDto as t, type GraphSignoutResponse as u, GraphSignupDto as v, GraphSignupInputDto as w, GraphSignupOutputDto as x, GraphSignupOutputSelectionSchema as y, type GraphSignupResponse as z };
