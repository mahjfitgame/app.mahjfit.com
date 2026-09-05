# Mahjong client architecture review

**Verdict: proceed with Angular Signals, but do not build on the current GameState shape unchanged.**

Signals are appropriate for a turn-based Mahjong client. They are not a network-sync mechanism by themselves. The current plan has too many writable mirrors of server state, no versioned realtime protocol, and a Phaser boundary that can mutate game facts locally. Fix the P0 items below first; then this will comfortably support 100 concurrent games from the client side.

## Decision in one screen

| Area | Decision |
| --- | --- |
| Signals | **Use them.** One authoritative server frame, derived computed selectors, small local UI signals. |
| linkedSignal | **Do not use for public/private server fields.** It is suitable only for resettable local drafts, such as a Charleston selection. |
| Game truth | The server is authoritative for turn, tiles, wall, claims, passes, scores, and legal actions. |
| Phaser | Renderer + input-intent emitter only. It must not decide or commit a discard/pick/call locally. |
| Realtime | Every state message needs gameKey, global revision, and eventId; reconnect must snapshot/replay. |
| 100 live games | Feasible. At roughly 400 players it is a realtime/backend topology concern, not a Signals performance concern. |

## P0: fix before feature development

| Finding | Why it matters | Required change |
| --- | --- | --- |
| state.ts mirrors _play / _personal into many writable linkedSignals. | A local write can diverge from its source and be overwritten by the next socket payload. More signals do **not** mean faster or safer state. | Replace mirrors with one immutable, versioned GameFrame; expose only computed selectors. |
| Public and personal socket streams are set independently. | A render can see a new public turn with an old private hand/claim. | Server sends an atomic per-player frame, or both streams carry the same revision and are committed together. |
| Current subscription setup does not initialize GameEngineWsToken; initialize() is not called by the normal route path; optional chaining can hide failed subscriptions. | Direct game entry can show no live updates. | Explicitly initialize the typed WS module, connect/join from enterGame(gameKey), and fail visibly on setup errors. |
| Route game key is stored but startGame() relies on a cookie-created game. | Opening a shared URL, second tab, or another device can join the wrong game or fail. | The URL gkeyid is the sole game identity. Do not persist live game identity/state cross-tab. |
| service.ts calls graphql.use(), while the installed SDK exposes initialize(). Phaser imports an SDK GameService that does not match the scene callback contract; scene callbacks are not initialized. | Baseline type-check already fails in game code. | Fix SDK initialization and inject a small local adapter/port into Phaser, not SDK services directly. |
| Phaser currently changes discard/pick/pass/call facts locally and has a no-op network callback. | A rejected action, race, reconnect, or malicious client can desync the board. | Phaser emits an intent; only an accepted server event changes confirmed game state. |
| Client payloads include game/user/seat/rack identifiers; planning data exposes broad seat/hand-shaped data. | This is a fairness/security boundary, not a UI concern. | Authenticate socket actor; server derives player/seat, authorizes every command, and returns only that player's private data. |
| PWA code caches successful GraphQL POST requests when enabled. Browser configuration also contains values that must not be treated as public. | Stale/private game data can be cached or shipped to every browser. | Before enabling PWA, cache static assets only—never GraphQL, mutations, game frames, or auth responses. Rotate/remove any committed browser-visible secrets; use short-lived user auth only. |

## Recommended client shape

~~~text
URL /game/:gkeyid
       |
GameSessionFacade.enterGame(gkeyid)
       |-- HTTP bootstrap / resync (optional)
       |-- BFW WS connect -> authorize -> join/resume(gkeyid, lastRevision)
       v
versioned GameFrame reducer  <-- accepted events / snapshot / replay
       |
       +--> computed BoardRenderModel --> Phaser adapter (imperative render)
       +--> computed Angular UI
       +--> local UI signal (selection, drag, popup, pending command)

Phaser input -> GameIntent -> command service -> server
                                         <- accepted/rejected result
~~~

Keep physical server caches separate if useful (static game metadata, public table state, per-seat private state), but deliver a **logically atomic per-player frame** to the browser.

~~~ts
type GameFrame = Readonly<{
  gameKey: string;
  revision: number;       // global, monotonic within this game
  serverNow: string;      // countdowns derive from deadline + this value
  game: GameStateGameOutputDto;
  play: GameStatePlayOutputDto;           // public data only
  personal: GameStatePersonalOutputDto;   // this player only
}>;

private readonly frame = signal<GameFrame | null>(null);
readonly connection = signal<'idle' | 'joining' | 'live' | 'reconnecting' | 'error'>('idle');
readonly ui = signal({ selectedTileIds: [] as number[], pendingCommandIds: new Set<string>() });

readonly phase = computed(() => this.frame()?.play.phase ?? null);
readonly board = computed(() => toBoardRenderModel(this.frame(), this.ui()));
~~~

**Signal rules**

| Use | For |
| --- | --- |
| signal() | frame, connection state, and independently editable UI interaction state. |
| computed() | All state-derived values: current player, rack view, legal controls, phase UI, board model. Keep it pure—no .set() inside a computed(). |
| linkedSignal() | A local draft that resets when its source changes, e.g. selected Charleston tiles when roundId changes. Never mirror socket fields. |
| effect() | Imperative boundaries only: apply the board model to Phaser, persistence of harmless UI preferences, analytics. Never use an effect to copy/propagate game state. |

The current state has examples to remove: writable linked copies of turn/rack/seat fields, a computed path that writes UI fallback state, and hand helpers that merge a rack property into a tile record rather than updating the record itself. Strong DTO types and null initial state will surface these issues; any and empty-object casts currently hide them.

## Realtime contract: required for a live game

Use a message envelope similar to this; exact DTO names can differ.

~~~ts
type GameEvent = {
  gameKey: string;
  revision: number;
  eventId: string;
  actionId?: string;
  serverNow: string;
  kind: 'snapshot' | 'patch' | 'action_rejected';
  frame?: GameFrame;
  patch?: unknown;
};

private applyEvent(event: GameEvent): void {
  const current = this.frame();
  if (!current || event.gameKey !== current.gameKey) return;
  if (event.revision <= current.revision) return;       // duplicate/out-of-order
  if (event.revision !== current.revision + 1) {
    void this.resync();                                  // gap
    return;
  }
  this.frame.set(reduceAcceptedEvent(current, event));
}
~~~

Required lifecycle:

1. Initialize HTTP APIs **and** GameEngineWsToken; register listeners before connection.
2. Connect, authenticate, then join/resume(gameKey, lastRevision).
3. Server returns an atomic latest snapshot or ordered replay, then marks the room live.
4. On disconnect, disable commands and show reconnecting; on reconnect run the same resume flow.
5. last_client_seq_by_player may acknowledge a player's commands, but it does not replace the global game revision.

Every command needs an idempotency key and base revision:

~~~ts
await commands.send({
  type: 'DISCARD',
  gameKey: frame.gameKey,
  baseRevision: frame.revision,
  commandId: crypto.randomUUID(),
  tileId,
});
~~~

The server must serialize mutations per game (transactional optimistic concurrency or a short per-game distributed lock), validate phase/membership/tile ownership, and derive actor/seat from the authenticated connection. The client may show a pending animation, but must roll it back on rejection and never commit facts before the accepted event.

Use deadline_at plus serverNow for a local countdown; do not send timer ticks or animation frames over WebSocket.

## Privacy/fairness contract

| Public table frame | Personal frame |
| --- | --- |
| phase, turn, seat positions, exposed melds, discards, score/public metadata, remaining wall **count** | own concealed hand, own legal actions, own pass/Charleston draft, private prompts |
| Never: wall order, any concealed hand, unrevealed claim intent | Never: another seat's concealed tiles or private options |

plan.txt and older data.txt contain broad seats/hand-shaped structures. Treat DTO names as insufficient proof of safety: test GraphQL and WebSocket payloads as each authenticated role and assert that opponent tiles and wall data never appear. Do not broadcast a server-private room to browsers.

## Phaser boundary and performance

Keep the useful keyed tile reconciliation already present in the scene, but move ownership outward:

~~~ts
// Angular adapter: one coherent render input, not several independent effects.
effect(() => this.phaserRenderer?.applySnapshot(this.board()));

// Phaser scene: intent only.
onDiscard(tileId: number) {
  this.intent.emit({ type: 'DISCARD', tileId });
}
~~~

- Replace the scene's SDK/local service dependency with narrow ports: applySnapshot(model), emitIntent(intent), showOverlay(...).
- Do not let scene code add/remove tiles, advance phase, pick a wall tile, or resolve a call as confirmed state.
- Key one-shot animations/popups by eventId; render the current board from revision.
- Clear removePlayerPopupTimer on teardown, retain/remove anonymous listeners on restart, coalesce ResizeObserver work with requestAnimationFrame, and allow one pending drag/action per player.
- The current component uses prototype-local rack/phase signals while the active template mounts &lt;app-phaser&gt; without its required rack input. Wire it only from board.

## 100-game production starting point

This target is modest if the server sends only game actions/state changes—not visual frames—and bot/AI work is isolated.

~~~text
TLS load balancer
  -> 2 stateless Nest API + Socket.IO instances (start: 2–4 vCPU, 4–8 GiB each)
  -> Redis: Socket.IO adapter/pub-sub, presence, short lock/lease
  -> PostgreSQL + connection pool/PgBouncer: durable game/action transaction log
  -> separate bot/AI worker(s), if applicable
~~~

- The current client permits polling and WebSocket. With multiple Socket.IO nodes, use WebSocket-only transport **or** configure load-balancer sticky sessions; Redis alone does not remove that requirement. See [Nest's WebSocket adapter guidance](https://docs.nestjs.com/websockets/adapter).
- Use authorized rooms such as conceptual game:{key}:public and game:{key}:seat:{seatId}. The server must verify membership before join/publish.
- Start load testing at **200 games / 800 connected sockets**, including reconnect storms and simultaneous turn deadlines, so 100 games has headroom.
- Track active sockets, p95 command-to-frame latency, event-loop lag, Redis/pub-sub lag, DB transaction/lock latency, memory, reconnect/resync rate, duplicate-event rate, and rejected-command rate.
- Exact instance count depends on bot calculation and payload size; prove it by load test rather than assuming a fixed server size.

## Delivery order

1. Make the game compile: correct SDK initialization, Phaser port/callback wiring, required input wiring.
2. Remove browser-visible secrets and prevent PWA/API caching of live/auth data.
3. Replace current server-state mirrors with GameFrame + pure selectors + local UI state.
4. Define and implement revisioned snapshot/replay, command acknowledgment/rejection, reconnect, and authorization contracts with the API team.
5. Refactor Phaser into a snapshot renderer and intent producer; add pending/rejection UX.
6. Add contract tests (privacy + command authorization), reducer tests (duplicate/gap/reconnect), then the 200-game load test.

## Evidence checked

- src/app/module/business/game/state/state.ts, state/plan.txt, state/data.txt
- src/app/module/business/game/component.ts, service.ts, phaser/component.ts, and phaser/scenes/scene.ts
- libs/src/third-party-apis/bfw-api/service.ts and installed @bfw/api-sdk WebSocket types/manual
- tsc --noEmit -p tsconfig.app.json currently fails, including the game SDK/Phaser wiring above; resolve that baseline before judging runtime performance.
- Current Angular guidance supports using computed for derived state, linkedSignal for dependent writable local state, and effects at imperative boundaries: [Signals](https://angular.dev/guide/signals), [linkedSignal](https://angular.dev/guide/signals/linked-signal), [effects](https://angular.dev/guide/signals/side-effects).
