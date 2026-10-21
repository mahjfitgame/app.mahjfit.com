# System Architecture: Mahjfit Client

## 1. Architectural Topology

Mahjfit employs a **Hybrid Web Architecture** uniting three core paradigms:
1. **Host Application Shell (Angular 22)**: Manages routing, application boot, client-server handshake, authentication, modal dialogs, and reactive state stores using Angular Signals.
2. **Graphics & Audio Engine (Phaser 4)**: Renders the 2.5D wooden Mahjong table surface, tile sprites from packed texture atlases, drag-and-drop mechanics, discard grids, tweened animations, and low-latency audio sprites.
3. **HTML/CSS Overlay Layer (Angular Component Template)**: High-resolution UI controls, responsive instruction panels, HUD action icons, call/pass prompt buttons, and celebratory modals rendered as absolute HTML elements above the Phaser canvas, positioned via coordinates computed by the layout subsystem.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Angular Host Application                         │
│                                                                             │
│  [AppService / AppState] ── Client-Server Handshake & Session               │
│                                                                             │
│  [AreaRoute / OpenAreaRegistry] ── Routes to /game / /game/:gkeyid          │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                            GameComponent                              │  │
│  │                                                                       │  │
│  │  Providers: [GAME_PROVIDER] (GameState, GameService, GameHeptic)      │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────┐           ┌───────────────────────────┐  │  │
│  │  │        GameState        │           │     Angular HTML Overlay  │  │  │
│  │  │ (SignalStateService)    │           │                           │  │  │
│  │  │                         │           │ - Instruction Panel       │  │  │
│  │  │ * _game, _play,         │           │ - Claim/Pass Buttons      │  │  │
│  │  │   _personal signals     │           │ - Wall Count & Points HUD │  │  │
│  │  │ * Computed rules & turn │           │ - Game Over / Win Modals  │  │  │
│  │  │ * WS publish actions    │           │ - Debug Inspection Panel  │  │  │
│  │  └───────────┬─────────────┘           └─────────────▲─────────────┘  │  │
│  │              │                                       │                │  │
│  │              │ Signals / Events                      │ Overlay State  │  │
│  │              ▼                                       │ Signals        │  │
│  │  ┌───────────────────────────────────────────────────┴─────────────┐  │  │
│  │  │                        PhaserComponent                          │  │  │
│  │  │                                                                 │  │  │
│  │  │  Layout: PhaserLayoutGame / PhaserLayoutDevice / PhaserLayoutUi  │  │  │
│  │  │                                                                 │  │  │
│  │  │  ┌───────────────────────────────────────────────────────────┐  │  │  │
│  │  │  │                    Phaser.Game Canvas                     │  │  │  │
│  │  │  │                                                           │  │  │  │
│  │  │  │  [PhaserScene]                                            │  │  │  │
│  │  │  │  * Table Background & Discard Container                   │  │  │  │
│  │  │  │  * Bottom Rack (14 tile slots, user hand)                 │  │  │  │
│  │  │  │  * Opponent Racks (Top, Left, Right)                      │  │  │  │
│  │  │  │  * Exposure Melds (Pung, Kong, Quint, Sextet)             │  │  │  │
│  │  │  │  * Discard Scrolling Grid (Masked)                        │  │  │  │
│  │  │  │  * Tween Animations (Charleston, Flights, Joker Swap)     │  │  │  │
│  │  │  │  * Audio Sprites & Tile Voices (PhaserSound)              │  │  │  │
│  │  │  └───────────────────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                      WebSocket / GraphQL (Socket.IO)
                                       │
                                       ▼
                       [@bfw/api-sdk / NestJS Backend]
```

---

## 2. Area Architecture & Routing Hierarchy

The application partitions its routes into four distinct top-level **Areas** defined under `src/app/area/route.ts` via `FoundationAreaRegistry`:

1. **`AuthAreaRegistry` (`@area/auth`)**: Houses user sign-in, account creation, multi-factor authentication, and password recovery.
2. **`PrivateAreaRegistry` (`@area/private`)**: Houses backoffice administration tools and operator dashboards.
3. **`ProtectedAreaRegistry` (`@area/protected`)**: Houses logged-in user profiles, history, and personal settings.
4. **`OpenAreaRegistry` (`@area/open`)**: The public surface of the application:
   - `HomeRoute` (`/` and `/home`): Marketing, home screen, game launch entry.
   - `GameRoute` (`/game`): Game creation redirector.
   - `GameInstanceRoute` (`/game/:gkeyid`): Active game session with keyid parameter.
   - `HttpStatusNotFoundRoute` (`/404`) and `HttpStatusServiceUnavailableRoute` (`/503`).

### Guard Enforcement
`GameRoute` and `GameInstanceRoute` declare:
```ts
canMatch: [AreaGuard.CanMatchAuthenticatedOrRedirect]
```
If an unauthenticated user attempts to access `/game/:gkeyid`, `AreaGuard` caches the intended deep link in `ContextProfileState.setRedirectAfterAuth()` and issues a replacement navigation redirect to `SigninRoute`.

---

## 3. Game Component and Provider Scoping

The game subsystem is strictly scoped to the `GameComponent` lifecycle via `GAME_PROVIDER`:
```ts
// src/app/module/business/game/provider.ts
export const GAME_PROVIDER: Provider[] = [
    GameRoute,
    GameState,
    GameHeptic,
    GameService,
];
```

### Critical Consequence
`GameState` and `GameService` are **NOT root singletons**. They are instantiated afresh whenever `GameComponent` mounts, and destroyed when `GameComponent` unmounts. Navigating away from the game tears down the state, unbinds WebSocket subscriptions, and ensures no stale session state bleeds across different game instances.

---

## 4. State Ownership and Mutation Patterns

### Single Source of Truth
The server is the absolute authority on all gameplay state. The client maintains reactive mirrors and derived computations:

1. **Authoritative Raw Signals** in `GameState` (`src/app/module/business/game/state/state.ts`):
   - `_game`: Holds `GameStateGameOutputDto` (game identity, mode, rules, bot profile, `all_tiles` dictionary).
   - `_play`: Holds `GameStatePlayOutputDto` (public game state: phase, turn stage, current seat/rack ID, wall count, discard tiles, active claim offer).
   - `_personal`: Holds `GameStatePersonalOutputDto` (private player state: user's rack hand, secret tiles, pass submissions, personal claim options).
   - `_development`: Debug payload containing full table private hands (active only when `environment.DEBUG === true`).
2. **Derived Computed Signals**:
   - `canDiscard`: Computed based on current turn seat matching personal seat AND turn stage equals `DISCARD` or `NEED_EXPOSURE`.
   - `canPickTile`: Computed based on turn seat matching personal seat AND turn stage equals `PICK`.
   - `charlestonState`: Computed from pass stage, round, and direction.
   - `all_seat_exposures`: Computed dictionary of exposed melds for all 4 seats.
   - `all_seat_dead_states`: Computed dictionary of dead-hand statuses for each seat.
3. **Intent-Driven Actions**:
   User actions in the UI or Phaser scene **NEVER directly mutate game state**. They emit intent calls to `GameState` WebSocket publishers:
   - `publishDiscardTile(tileId)`
   - `publishPickTile()`
   - `publishCharlestone(tileIds)`
   - `publishClaimAction(action, tileId)`
   - `publishJokerExchange(targetJokerId, rackReplacementId, ...)`
   - `publishMahjongDeclare()`
   The client waits for the server to process the action and emit a new state payload over the WebSocket.

---

## 5. WebSocket Event Flows and Synchronization

Real-time communication is handled by `@bfw/api-sdk/graphql/ws` using `Socket.IO`:

1. **Connection & Room Joining (`GameState.afterGameStart`)**:
   ```ts
   await this.api.sdk.graphql.ws.connect();
   await this.api.sdk.graphql.ws.gameEngine.joinGroup(this.game_keyid());
   await this.api.sdk.graphql.ws.gameEngine.joinSubject(this.game_keyid() + "-" + this.personal_seat_u_id());
   ```
2. **Public Table Stream (`subscribePlay`)**:
   - Listens to global game updates (turn changes, discards, wall count decrements, phase shifts).
   - Validates incoming `game_id` against active `game_id` to prevent cross-game state pollution.
   - Updates `_play` signal and increments `_playRevision`.
3. **Private Seat Stream (`subscribePersonal`)**:
   - Listens on the personal room subject for secret player state (private rack hand, tiles drawn, passing results).
   - Updates `_personal` signal.

---

## 6. Phaser & Angular Integration Lifecycle

```text
GameComponent (ngOnInit)
  │
  ├─► GameState.whenReady()
  ├─► GameState.startGame() (Fetches initial state via GraphQL & joins WS rooms)
  │
  ▼
GameComponent (ngAfterViewInit)
  │
  └─► Mounts <app-phaser>
        │
        ▼
      PhaserComponent (ngAfterViewInit)
        │
        ├─► Measures host DOM element and safe-area insets
        ├─► Computes initial layout via PhaserLayoutGame
        ├─► Instantiates `new Phaser.Game({...})` with PhaserScene
        │
        ▼
      PhaserScene (create)
        │
        ├─► Builds Graphics, Discard Container, Masking, and Sound Manager
        ├─► Emits `table:ready` on `game.events`
        │
        ▼
      PhaserComponent catches `table:ready`
        │
        ├─► Sets `sceneReady = true`
        ├─► Emits `allTiles:set` with complete tile dictionary
        ├─► Emits `rack:set` with user's sorted rack tiles
        └─► Subscribes to Angular effect() pipes
```

### 6.1 Angular Zone Management (`NgZone.runOutsideAngular`)
Phaser's core engine executes an internal continuous animation loop using `requestAnimationFrame` running at 60 frames per second. If `Phaser.Game` were instantiated directly inside the Angular zone, every frame render, tween tick, and internal timer would trigger global Angular change detection across the entire component tree, causing catastrophic CPU throttling and frame drops.

To prevent this:
1. **Instantiation Outside Zone**: `PhaserComponent.ngAfterViewInit` wraps the instantiation of `PhaserScene` and `new Phaser.Game({...})` inside `this.zone.runOutsideAngular(() => { ... })` (`src/app/module/business/game/phaser/component.ts:805`).
2. **Selective Zone Re-Entry**: When an action originating in Phaser must update Angular state, emit an Angular component `@Output()`, or trigger navigation, it explicitly re-enters Angular's zone using `this.zone.run(...)`:
   - `onSelectionChanged`: `this.zone.run(() => this.selectionChanged.emit(ids))`
   - `onTileCallDecision`: `this.zone.run(() => this.tileCallDecision.emit(decision))`
   - `onPlayerRemovalRequested`: `this.zone.run(() => this.playerRemovalRequested.emit(request))`
   - `onRestartGame`: `this.zone.run(() => this.onStartNewGame())`
   - `onQuitGame`: `this.zone.run(() => this.onExitGame())`

### 6.2 Angular Dependency Injection & `runInInjectionContext`
`PhaserScene` is not an Angular `@Component` or `@Injectable`; it is a native Phaser class instantiated imperatively via `new PhaserScene(...)`. However, `PhaserScene` relies on Angular services and calls `inject(PhaserLayoutGame)` directly in its field initializers (`src/app/module/business/game/phaser/scenes/scene.ts:25`).

In Angular, calling `inject()` outside an active injection context throws error `NG0203: inject() must be called from an injection context`. To bridge this gap:
```typescript
// src/app/module/business/game/phaser/component.ts:806-808
this.zone.runOutsideAngular(() => {
  let scene!: PhaserScene;
  runInInjectionContext(this.injector, () => {
    scene = new PhaserScene(this.gameService, { ...callbacks... });
  });
  this.phaser = new Phaser.Game({ ... scene: [scene] });
});
```
**Mandatory Constraint**: Any future agent adding dependencies to `PhaserScene` or instantiating Phaser managers must preserve the `runInInjectionContext(this.injector, ...)` wrapper and must only call `inject()` during class instantiation/construction time.

### 6.3 Dual-Channel Communication Architecture
Communication between Phaser and Angular operates across two distinct, non-interchangeable channels:

1. **Constructor Callbacks (`TableSceneCallbacks`) — Phaser to Angular Overlays**:
   - `PhaserScene` receives a strongly-typed callback bag (`TableSceneCallbacks`, defined in `src/app/module/business/game/phaser/scenes/type.ts:230-265`) in its constructor.
   - Purpose: Synchronously delivers layout coordinates, bounding boxes, and visibility flags computed by `PhaserLayoutUi` to Angular Signals that drive HTML overlays.
   - Representative Callbacks:
     - `onInstructionPanelState`: Positions and styles the top instruction panel.
     - `onClaimPanelState`: Positions the action buttons (CALL, PASS, PICK) and discarded tile preview.
     - `onWallCountOverlayState` / `onPointsOverlayState`: Positions HUD metric overlays.
     - `onMahjongButtonOverlay`: Positions the Mahjong declare button.
     - `onDeadHandSeatSelection`: Opens the dead hand challenge modal.
     - `onLocalPlayerDiscard`: Dispatches local discard intents to `GameState`.

2. **Phaser Game Event Emitter (`this.game.events`) — Angular to Phaser Gameplay Stream**:
   - `PhaserComponent` listens to reactive Angular Signals and dispatches game events down into Phaser using `this.phaser?.events.emit(...)`.
   - Purpose: Drives table lifecycle, animations, and external player state changes inside the canvas.
   - Representative Events:
     - `"table:ready"`: Emitted once by `PhaserScene.create()` when scene and graphics are initialized.
     - `"allTiles:set"`: Passes the complete 152-tile metadata dictionary.
     - `"rack:set"`: Passes the human player's active tile array to be rendered in the bottom rack.
     - `"rack:order"`: Supplies the server-sorted hand order array for animated slot reindexing.
     - `"pass:direction"`: Updates Charleston direction indicator and passing targets.
     - `"table:phase"` / `"table:turn_stage"`: Informs the scene of phase shifts (Charleston, Turn, Finished).
     - `"opponent:discard"`, `"exposures:update"`, `"joker:exchange"`, `"mahjong:win"`: Drives remote player animations.

### 6.4 Sequential Event Queue & Reconciliation Pipeline
Incoming WebSocket updates (especially against fast bot players) arrive in rapid succession. To ensure animations remain coherent:
1. `PhaserScene` queues event steps and processes them sequentially with accelerated delays (`stepDelayMs = Math.min(stepDelayMs, 120)`) when backlogs develop.
2. When `"rack:order"` arrives from `this.gameState.personal_seat_rack_first_hand_order()`, `PhaserScene` reconciles missing or newly drawn tiles against active exposure melds, reindexes runtime slots via `reindexRackRuntimeSlots()`, and smoothly tweens tiles to their new slots via `layoutRackTiles(true)`.

---

## 7. Responsive Layout and Viewport Coordinate System

The game layout is calculated deterministically across 5 device modes by `PhaserLayoutGame` (`src/app/module/business/game/phaser/layout/game.ts`):
- `phone-portrait` (< 520px width, portrait)
- `phone-landscape` (< 960px width, landscape)
- `tablet-portrait`
- `tablet-landscape`
- `desktop` (>= 960px width, landscape)

### Safe Area Inset Handling
Mobile devices with notches or home indicator bars (iOS Home Bar, Android System Navigation) are measured dynamically via `#safeAreaProbe` (`src/app/module/business/game/phaser/template.html`). Insets (`top`, `bottom`, `left`, `right`) are injected into layout calculations to prevent rack tiles, header controls, or instruction panels from colliding with hardware bezels.

---

## 8. Cleanup and Resource Disposal

Strict resource disposal is enforced to prevent WebGL context leaks, zombie audio sprites, and hanging timers:

1. **`PhaserComponent.destroyRef.onDestroy`**:
   - Disconnects `ResizeObserver`.
   - Removes `orientationchange` listener.
   - Clears popup and debug refresh timers.
   - Calls `this.phaser?.destroy(true)` (destroying WebGL canvas, shaders, and textures).
   - Resets `sceneReady` to `false`.
2. **`PhaserScene.SHUTDOWN`**:
   - Removes all event listeners registered on `this.game.events` (`rack:set`, `table:resize`, `table:phase`, etc.).
   - Calls `soundManager.destroy()` (stopping all audio sprites and releasing Web Audio buffers).
   - Resets claim presentation and closes celebratory popups.
3. **`GameState.registerAsyncCleanup`**:
   - Automatically invokes `subscribePlayCleanup()` and `subscribePersonalCleanup()` on deactivation, tearing down Socket.IO listeners.
