import { inject, Injectable } from "@angular/core";
import { io } from 'socket.io-client';
import { BfwApiSdk, DefaultHeaders } from "@bfw/api-sdk/core";
import { GraphLoginOutputDto, GraphSignupOutputDto } from '@bfw/api-sdk/graphql/endpoints/shared';
import { ConfService } from "@libs/conf/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { I18nService } from "@base/internationalization/service";
import { AuthSessionState } from "@libs/auth-session/state";

/*
i have a api sdk package
@bfw/api-sdk

and i have created a global class which can be used through the app
libs/src/third-party-apis/bfw-api/service.ts
this class connect with server and allow developers to acess api easely

you can find use cases in module such as 

src/app/module/shared/onboarding/signin/service.ts
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
@Injectable({providedIn: 'root'})
export class BfwApiService {
    public readonly conf: ConfService = inject(ConfService);
    public readonly log: LogService = inject(LogService);

    public readonly i18n: I18nService = inject(I18nService);
    public readonly ps: PlatformService = inject(PlatformService);
    
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
                },
                rest: { 
                    baseUrl: this.conf.bfwApiSdkRestUrl, 
                    browserCookie: true
                },
                config: {
                    tokenStore: {
                        persistentStorageStrategy: "browserLocalStorage"
                    },
                    logRequest: true,
                    logResponse: true,
                    headers: {
                        [DefaultHeaders.ACCEPT_LANGUAGE]: () => this.i18n.currentLang(),
                        [DefaultHeaders.CURRENT_BIDI]: () => this.i18n.state.bidi(),
                        [DefaultHeaders.DTOKEN]: () => this.ps.state.dtoken(),
                        // need to add tenant id later on
                    }
                },
            });

            const jwt = {
                jwt_access_token: this.conf.bfwApiSdkJwtAccessToken,
                jwt_refresh_token: this.conf.bfwApiSdkJwtRefreshToken,
            };
            
            this.sdk.graphql.authSession.initializeTokens(jwt);
            this.sdk.rest.authSession.initializeTokens(jwt);

            // perform test call
            //const hello = await this.sdk.graphql.graph.hello();
            //this.log.info(hello);
        } catch (error: any) {
            this.log.error(error);
        }
    }
    public async refreshJwt(refreshToken: string): Promise<GraphLoginOutputDto> {
        const refreshJwt = await this.sdk.graphql.graph.refreshJWT({
            input: {
                jwtRefreshToken: refreshToken,
            },
            selection: {
                jwt_access_token: true,
                jwt_refresh_token: true,
                },
            });
        return refreshJwt;
    }
    public async whoAmI(): Promise<GraphSignupOutputDto> {
        const whoAmI = await this.sdk.graphql.graph.whoAmI({
            selection: {
                username: true,
                email: true,
                created: true,
                jwt_access_token: true,
                jwt_refresh_token: true,
            }
        });
        return whoAmI;
    }
}