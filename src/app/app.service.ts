import { DOCUMENT, inject, Service } from "@angular/core";
import { BfwApiService } from "@libs/third-party-apis/bfw-api/service";
import { ConfService } from "@libs/conf/service";
import { CookieService } from "@libs/cookie/service";
import { LogService } from "@libs/log/service";
import { PlatformService } from "@libs/platform/service";
import { ScrollDirectionService } from "@libs/scroll-direction/service";
import { I18nService } from "@base/internationalization/service";
import { SplashScreenService } from "@base/splash-screen/service";
import { GlobalProgressBarService } from "@base/global-progress-bar/service";
import { Router } from "@angular/router";
import { UserDevice, UserDeviceHandShakeInputDto, UserDeviceHandShakeOutputDto, UserDeviceHandShakeOutputSelectionSchema, UserWsToken } from "@bfw/api-sdk/graphql/endpoints/shared";
import { AuthSessionService } from "@libs/auth-session/service";

@Service()
export class AppService {
    private readonly router = inject(Router);
    public readonly document = inject(DOCUMENT);

    public readonly conf = inject(ConfService);
    public readonly log = inject(LogService);
    
    public readonly cookie = inject(CookieService);
    public readonly scroll = inject(ScrollDirectionService);
    public readonly ps = inject(PlatformService);
    public readonly splash = inject(SplashScreenService);
    public readonly gpbs = inject(GlobalProgressBarService);
    public readonly session = inject(AuthSessionService);

    public readonly i18n = inject(I18nService);
    public readonly api = inject(BfwApiService);

    // state
    
    constructor() {}

    public onWindowScroll(): void {
        this.scroll.updateScrollDirection(this.document, {
            applyTo: this.document.body,
        });
    }

    public async clientServerHandShake(): Promise<string | false> {
        // TODO: need to add or setup logic when user logged in or already logged in we might need to update token with logged in user id
        // need to find some way and work around for this
        try {
            // load api service
            this.api.sdk.graphql.use(UserDevice);

            // if token is not exist, get required data
            const hsi = await this.ps.handShakeInfo();

            // set handshake api response
            const selection: UserDeviceHandShakeOutputSelectionSchema = {
                id: true,
                keyid: true,
                u_id: true,
                device_id: true,
                dtoken: true,
                dpid: true,
            };

            // set input for new hand shake
            const input: UserDeviceHandShakeInputDto = {
                dtoken: hsi.dtoken ?? '0',
                dpid: hsi.dpid ?? '0',

                //u_id: 0,
                //user_defined_id: hsi.user_defined_id,
                //user_defined_name: hsi.user_defined_name,

                from_ip_address: hsi.from_ip_address,
                mac_address: hsi.mac_address,

                avatar: hsi.avatar,
                useragent: hsi.useragent,
                platform: hsi.platform,
                language: hsi.language,
                timezone: hsi.timezone,
                screen_width: Number(hsi.screen_width),
                screen_height: Number(hsi.screen_height),
                device_pixel_ratio: Number(hsi.device_pixel_ratio),
                hardware_concurrency:hsi.hardware_concurrency,
                max_touch_points: hsi.max_touch_points,
                device_memory: hsi.device_memory,
            };

            // if token is alreadu exist
            if(this.ps.state.dtoken() && this.ps.state.dtoken() !== null && this.ps.state.dtoken() !== ''){
                this.log.info('[AppService] Client/Server Handshake Token Found.');
                // set input for found token hand shake
                input.dtoken = this.ps.state.dtoken() as string;
                input.dpid = this.ps.state.dpid() as string;
            }
            
            // api handshake: check if existing or add new both in one request
            const resp: UserDeviceHandShakeOutputDto[] = await this.api.sdk.graphql.userDevice.handShake({
                selection: selection,
                input: input
            });

            const data = resp?.[0];

            // set hand shake identity
            if (data && Object.keys(data).length > 0 && data.dtoken) {
                this.ps.state.setDtoken(data.dtoken);
                this.ps.state.setDpid(data.dpid ?? null);
                return data?.dtoken ?? null;
            }

            // handshake failed so do not allow app to run
            this.log.error('Client/Server hand shake failed.');
        } catch (e: any) {
            this.log.error(e);
        }
        return false;
    }
    /**
     * After client/server handshake
     * This is used to initialize various process which require API calls and required data from servver
     * As hand shake is done we can start data retrival and many othe rprocess like web socket etc
     * 
     * Withouth hand shake do not perform any server side operation, so this methos is required
     */
    public async afterClientServerHandShake(): Promise<void> {
        // connect to web socket
        //await this.api.sdk.graphql.ws.connect();
    }
}