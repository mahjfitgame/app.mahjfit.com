import { inject, Service } from "@angular/core";
import { io } from 'socket.io-client';
import { BfwApiSdk } from "@bfw/api-sdk/core";
import { GraphSigninOutputDto, GraphSignupOutputDto } from '@bfw/api-sdk/graphql/endpoints/shared';
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";

/*
i have a api sdk package
@bfw/api-sdk

and i have created a global class which can be used through the app
libs/src/third-party-apis/bfw-api/service.ts
this class connect with server and allow developers to acess api easely

you can find use cases in module such as 

src/app/module/shared/preboarding/signin/service.ts
stepUsername()
stepPassword()
stepMfaOption()
stepVerify()

src/app/module/shared/geo/country/service.ts
find()

in both cases you can see how calss in injected using angular DI and used
this makes standard way to use api.

now i was thinking to have serate web worker for api
so all api calles will be handeled by seperate thread in browser and also in native app as its PWA.

now i cam not sure how we can do this with easy integration which help use to improve performanc and developer experience also.

i have used web worker in 
libs/src/sqlite/web-worker/sqlocal.ts
used in libs/src/sqlite/driver/opfs.web.ts > init()
now this is different use case and api is different.

so i need some robust solution which improve performance and setup standes to use api through the application.
*/
@Service()
export class BfwApiService {
    public readonly conf: ConfService = inject(ConfService);
    public readonly log: LogService = inject(LogService);

    public sdk!: BfwApiSdk;
    constructor() {
        this.init();
    }
    private async init(): Promise<void> {
        try{
            this.sdk = new BfwApiSdk({
                graphql: {
                    baseUrl: this.conf.bfwApiSdkGraphqlUrl,
                    browserCookie: true,
                    signinCredentials: {
                        username: this.conf.bfwApiSdkSigninUsername,
                        identify: this.conf.bfwApiSdkSigninIdentify,
                    },
                    ws: {
                        baseUrl: this.conf.bfwApiSdkWsUrl,
                        eventPrefix: '',
                        socket: {
                            path: '/socket.io',
                            transports: ['polling', 'websocket'],
                            withCredentials: true,
                        },
                        auth: {
                            socketAuthTokenPrefix: 'Bearer ',
                        },
                        socketFactory: ({ url, options }) => io(url, options),
                    },
                    /*fetchImpl: async (url, init) => {
                        console.log('[SDK fetch debug]', {
                            url,
                            credentials: init?.credentials,
                            headers: init?.headers,
                        });
                        return fetch(url, init);
                    },*/
                },
                rest: { 
                    baseUrl: this.conf.bfwApiSdkRestUrl, 
                    browserCookie: true
                },
                config: {
                    tokenStore: {
                        persistentStorageStrategy: "browserLocalStorage"
                    },
                    logRequest: this.conf.debug,
                    logResponse: this.conf.debug,
                    headers: {
                        // TODO: we can to add required common headers as needed 
                        // such as tenant id later on if its direct and no process required
                        // there are some headers set from respective state list is as below
                    }
                },
            });

            const jwt = {
                jwt_access_token: this.conf.bfwApiSdkJwtAccessToken,
                jwt_refresh_token: this.conf.bfwApiSdkJwtRefreshToken,
            };
            
            this.sdk.graphql.jwtAuthorization.initializeTokens(jwt);
            this.sdk.rest.jwtAuthorization.initializeTokens(jwt);

            // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
            // EXTERNAL REGISTRATION
            // There are many external registrations are availabe as below
            // all of them are provided by specific module and that module controllers that process
            // these has to stay in individual module not here, keep adding comments to keep watch on all implementations
            // ----------------------------------------------------------
            // ▬ setHeaderCtxs | jwtHostAuthorization | jwtStatefulAuthorization
            // file: libs/src/context-profile/state.ts
            //
            // ▬ setHeaderAcceptLanguage | setHeaderCurrentBidi
            // file: src/app/base/internationalization/state.ts
            //
            // ▬ appClientServerHandShake | registerAfterResponseInterceptor | registerBeforeRequestInterceptor
            // file: src/app/app.service.ts
            //
            // ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

            // perform test call
            //const hello = await this.sdk.graphql.graph.hello();
            //this.log.info(hello);
        } catch (error: any) {
            this.log.error(error);
        }
    }
    public async refreshJwt(refreshToken: string): Promise<GraphSigninOutputDto> {
        const http = await this.sdk.graphql.graph.refreshJWT({
            input: {
                jwtRefreshToken: refreshToken,
            },
            selection: {
                jwt_access_token: true,
                jwt_refresh_token: true,
                },
            });
        return http.data;
    }
    public async whoAmI(): Promise<GraphSignupOutputDto> {
        const http = await this.sdk.graphql.graph.whoAmI({
            selection: {
                username: true,
                email: true,
                created: true,
                jwt_access_token: true,
                jwt_refresh_token: true,
            }
        });
        return http.data;
    }
}