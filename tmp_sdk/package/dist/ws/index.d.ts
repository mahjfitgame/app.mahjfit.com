import { K as WsOptions, J as JwtAuthorization, A as ApiOptions, E as WsConnectionState, W as WsConnectOptions, H as WsEventHandler, V as WsUnsubscribeType } from '../jwt.authorization-BzVAMORw.js';

type WsClientOptions = Omit<WsOptions, 'baseUrl'>;
type WsDomain = 'graphql' | 'rest';
declare class WsClient {
    private readonly domain;
    private readonly baseUrl;
    private readonly wsOptions;
    private readonly jwtAuthorization;
    private readonly config?;
    private readonly stateListeners;
    private readonly bufferedListeners;
    private socket;
    private state;
    constructor(domain: WsDomain, baseUrl: string, wsOptions: WsClientOptions | undefined, jwtAuthorization: JwtAuthorization, config?: ApiOptions['config']);
    get connectionState(): WsConnectionState;
    /** Allow clients to check the ws state connecting, connectedm idele, disconneced, reconnecting etc.. */
    onStateChange(handler: (state: WsConnectionState) => void): () => void;
    /** Connect to the websocket */
    connect(_options?: WsConnectOptions): Promise<void>;
    private connectOnce;
    /** Disconnect from the websocket */
    disconnect(): void;
    /** emit an event */
    emit(event: string, payload?: unknown): void;
    /** subscribe to an event */
    subscribe(event: string, handler: WsEventHandler): WsUnsubscribeType;
    resolveEventName(suffix: string): string;
    private flushBufferedListeners;
    private createSocket;
    private buildSocketOptions;
    private getAccessToken;
    private canRefreshAfterConnectError;
    private setState;
}

/**
 * Payload the server publishes when one of its event handlers throws.
 * Shared by every module, there is no per module error shape.
 */
declare class WsErrorOutputDto {
    /** The published event that failed, e.g. `game.subscribe.action.charlestone`. */
    event: string;
    /** Reason the event failed. */
    message: string;
}
/** Transport facade for one API domain's realtime connection. */
declare class WsTransport {
    private readonly client;
    constructor(client: WsClient);
    get connectionState(): WsConnectionState;
    onStateChange(handler: (state: WsConnectionState) => void): WsUnsubscribeType;
    connect(options?: WsConnectOptions): Promise<void>;
    disconnect(): void;
    emit(event: string, payload?: unknown): void;
    subscribe(event: string, handler: WsEventHandler): WsUnsubscribeType;
    resolveEventName(suffix: string): string;
    /**
     * Subscribe to server side failures of any event published on this connection.
     *
     * A published event has no response to reject, so when a server handler throws
     * it answers on one shared error event instead. This is connection level and
     * not tied to any module, read `event` to know which call failed.
     */
    subscribeError(args: {
        response: (data: WsErrorOutputDto) => void;
    }): WsUnsubscribeType;
}

export { WsClient, WsErrorOutputDto, WsTransport };
