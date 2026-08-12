import { ScreenOrientationResult } from "@capacitor/screen-orientation";
import { GameHapticType, TileVm } from "../type";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface TileLayout {
  readonly width: number;
  readonly height: number;
  readonly gap: number;
  readonly slots: readonly Point[];
}

export interface ResponsiveMetrics {
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isPortrait: boolean;
  readonly uiScale: number;

  readonly playerLabelFont: number;
  readonly usernameFont: number;
  readonly hudFont: number;
  readonly hudCounterFont: number;
  readonly hudIconFont: number;
  readonly instructionFont: number;
  readonly passFont: number;

  readonly exposureThickness: number;
  readonly innerGap: number;
  readonly tableRackGap: number;
  readonly rackHeight: number;
  readonly hudHeight: number;
  readonly instructionHeight: number;
  readonly passButtonWidth: number;
  readonly passButtonHeight: number;

  readonly topExposureHeight: number;
  readonly bottomExposureHeight: number;
  readonly passGap: number;
}

export interface TableLayout {
  readonly canvas: Rect;
  readonly tableOuter: Rect;
  readonly discardArea: Rect;
  readonly topExposure: Rect;
  readonly rightExposure: Rect;
  readonly bottomExposure: Rect;
  readonly leftExposure: Rect;
  readonly hud: Rect;
  readonly instructionBar: Rect;
  readonly passButton: Rect;
  readonly bottomRack: Rect;
  readonly topLabel: Point;
  readonly leftLabel: Point;
  readonly rightLabel: Point;
  readonly username: Point;
  readonly bottomTileLayout: TileLayout;
  readonly isMobile: boolean;
  readonly metrics: ResponsiveMetrics;
}

export interface SafeAreaInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export type TablePhase = "playing" | "passing" | "discard";


/**
 * Direction used by Charleston.
 *
 * RIGHT
 * LEFT
 * ACROSS
 */
export type PassDirection =
  | "right"
  | "left"
  | "across";

/**
 * Represents one seat around the table.
 *
 * These ids never change.
 */
export type PlayerSeat =
  | "top"
  | "right"
  | "bottom"
  | "left";

/**
 * Data required to animate one player pass.
 */
export interface PassAnimationItem {

  /**
   * Which seat owns these tiles.
   */
  readonly from: PlayerSeat;

  /**
   * Destination seat.
   */
  readonly to: PlayerSeat;

  /**
   * Number of tiles.
   *
   * Normally
   * Charleston = 3
   *
   * Courtesy
   * 0-3
   */
  readonly tileCount: number;
}












export type TableSeat = "top" | "right" | "bottom" | "left";

export type CallCombination = "pung" | "kong" | "quint" | "sextet";

/** A discard announced by the future game API/WebSocket for the local player to evaluate. */
export interface TileCallOffer {
  readonly discard: TileVm;
  readonly discardedBy: Exclude<TableSeat, "bottom">;
}

/** Client-side intent only; the backend remains responsible for accepting the call. */
export interface TileCallDecision {
  readonly discardId: string;
  readonly discardedBy: Exclude<TableSeat, "bottom">;
  readonly action: "call" | "skip";
  readonly combination?: CallCombination;
  readonly tileIds?: readonly string[];
}

/** Temporary local-only trigger used to exercise the Call UI before WebSocket wiring. */
export interface DemoDiscardRequest {
  readonly seat: Exclude<TableSeat, "bottom">;
  readonly requestId: number;
}

/** UI-only win notification. The server remains the authority for a Mah Jongg win. */
export interface MahjongWinCelebration {
  readonly winner: TableSeat;
  readonly requestId: number;
}

/** Server-supplied away state for the local moderation prompt. */
export interface PlayerAwayNotice {
  readonly seat: Exclude<TableSeat, "bottom">;
  readonly playerName: string;
  readonly awaySinceMs: number;
  readonly requestId: number;
  readonly removeAfterMs?: number;
}

export interface PlayerRemovalRequest {
  /** The player chosen in the popup. The server must approve the removal. */
  readonly seat: Exclude<TableSeat, "bottom">;
  /** Matches the server notice that opened the popup. */
  readonly requestId: number;
}

export type DeadHandReason = "invalid-mahjong" | "hand-not-viable" | "incorrect-tile-count";

/** Client claim only; server validation determines whether either hand is dead. */
export interface DeadHandClaim {
  /** The opponent whose hand is being challenged. */
  readonly targetSeat: Exclude<TableSeat, "bottom">;
  /** The reason selected by the local player. */
  readonly reason: DeadHandReason;
}

/** A request from a waiting player. It is automatically removed after 15 seconds. */
export interface JoinTableRequest {
  readonly requestId: string;
  readonly playerName: string;
  readonly expiresAtMs?: number;
}

export interface JoinTableRequestDecision {
  readonly requestId: string;
  readonly action: "accept" | "decline";
}

export interface TileRuntime {
  readonly vm: TileVm;
  readonly image: Phaser.GameObjects.Image;
  slotIndex: number;
  selected: boolean;
  isDragging: boolean;
  zone: "rack" | "discard" | "pass" | "exposure";
}


export interface TableSceneCallbacks {
  readonly onSelectionChanged: (ids: readonly string[]) => void;
  readonly onPassCompleted: (payload: { readonly tileIds: readonly string[]; readonly direction: PassDirection }) => void;
  onHaptic?: (type: GameHapticType) => void;
  readonly getDeviceLayout: (width: number, height: number) => DeviceLayoutState;
  readonly onMobileHeaderChanged: (collapsed: boolean) => void;
  readonly onTileCallDecision: (decision: TileCallDecision) => void;
  readonly onPlayerRemovalRequested: (request: PlayerRemovalRequest) => void;
  /** Opens the native reason-selection dialog after a table seat is chosen. */
  readonly onDeadHandClaimPrompt: (targetSeat: Exclude<TableSeat, "bottom">) => void;
  readonly onTemporaryDiscardCompleted: () => void;
  /** Starts a new local table after the user selects Restart Game. */
  readonly onRestartGame: () => void;
  /** Leaves the game page after the user selects Quit Game. */
  readonly onQuitGame: () => void;
  /** Updates the crisp HTML wall-count label when its value or layout changes. */
  readonly onWallCountOverlay: (state: WallCountOverlayState) => void;
  /** Updates native mobile player-name labels while Phaser retains their layout. */
  readonly onPlayerLabelOverlay: (states: readonly PlayerLabelOverlayState[]) => void;
  /** Updates the crisp native points value beside the Phaser points icon. */
  readonly onPointsOverlay: (state: PointsOverlayState) => void;
  /** Positions the native mobile header toggle arrow. */
  readonly onMobileHeaderToggle: (state: MobileHeaderToggleState) => void;
  /** Lets native overlays yield while a mobile Phaser drawer is open. */
  readonly onMobileDrawerVisibilityChanged: (open: boolean) => void;
  readonly onMobileDrawerOverlay: (state: MobileDrawerOverlayState) => void;
  /** Renders the crisp native "YOUR TURN" card, its copy, and its button. */
  readonly onInstructionPanelOverlay: (state: InstructionPanelOverlayState) => void;
  /** Lets native overlays yield so a Phaser popup can sit above them. */
  readonly onTableOverlayBlocked: (level: TableOverlayBlockLevel) => void;
  /** Draws the native Dead Hand seat picker over the opponent exposures. */
  readonly onDeadHandSeatSelection: (state: DeadHandSeatSelectionState) => void;
  readonly onHeaderLogoLayout: (state: HeaderLogoLayoutState) => void;
}

export type TableSfxId =
  | "tile-select"
  | "tile-pass-waiting"
  | "tile-return"
  | "tile-drop"
  | "pass";

export type TableSfxConfig = {
  key: string;
  urls: string[];
  volume: number;
  poolSize: number;
  throttleMs?: number;
};

export interface DiscardGrid {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly paddingX: number;
  readonly paddingY: number;
  readonly gapX: number;
  readonly gapY: number;
  readonly columns: number;
}

export interface CharlestonVisualTransfer {
  readonly from: TableSeat;
  readonly to: TableSeat;
  readonly includeBottom: boolean;
}

export interface BotPassVisualTile {
  readonly id: string;
  readonly from: TableSeat;
  readonly to: TableSeat;
  readonly image: Phaser.GameObjects.Container;
}



/// UI LAYOUT MANAGER
export type HudActionKey =
  | "sort"
  | "hint"
  | "dead-hand"
  | "settings"
  | "help";


export type HamburgerMenuActionKey =
  | "gameplay-settings"
  | "play-history"
  | "account-billing"
  | "restart-game"
  | "quit-exit"
  | "log-out";

export interface HudImageButton {
  readonly key: string;
  readonly image: Phaser.GameObjects.Image;
  readonly normalTexture: string;
  readonly hoverTexture: string;
  readonly activeTexture: string;
  isPressed: boolean;
}
type OverlayMenuSide = "left" | "right";

export interface UiLayoutCallbacks {
  readonly onHudAction?: (action: HudActionKey) => void;
  /** Applies the explicit sort mode chosen from the Sort dropdown. */
  readonly onSortRequested?: (mode: "rank" | "suit") => void;
  readonly onPrimaryAction?: () => void;
  readonly onPickSeatChange?: (seat: TableSeat) => void;
  readonly onHamburgerMenuAction?: (action: HamburgerMenuActionKey) => void;
  /** Positions the native HTML wall-count label over the Phaser tile icon. */
  readonly onWallCountOverlay?: (state: WallCountOverlayState) => void;
  /** Positions native mobile player-name labels over the Phaser table. */
  readonly onPlayerLabelOverlay?: (states: readonly PlayerLabelOverlayState[]) => void;
  /** Positions the native mobile points value beside its Phaser icon. */
  readonly onPointsOverlay?: (state: PointsOverlayState) => void;
  /** Reports whether a hamburger or action drawer currently covers the table. */
  readonly onMobileDrawerVisibilityChanged?: (open: boolean) => void;
  readonly onMobileDrawerOverlay?: (state: MobileDrawerOverlayState) => void;
  /** Positions and fills the native instruction card over the table centre. */
  readonly onInstructionPanelOverlay?: (state: InstructionPanelOverlayState) => void;
  /** Positions the native mobile header toggle arrow. */
  readonly onMobileHeaderToggle?: (state: MobileHeaderToggleState) => void;
  readonly logoTextureKey?: string;
}

export interface WallCountOverlayState {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
  readonly visible: boolean;
  readonly iconX: number;
  readonly iconY: number;
  readonly iconSize: number;
}

export type PlayerLabelOverlayKey = "top" | "right" | "left" | "bottom";

/** Browser-native player label positioned from the Phaser table layout. */
export interface PlayerLabelOverlayState {
  readonly key: PlayerLabelOverlayKey;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
  readonly color: string;
  readonly angle: 0 | 90 | -90;
  readonly visible: boolean;
}

/** Browser-native mobile header toggle arrow. */
export interface MobileHeaderToggleState {
  readonly icon: string;
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

/** Browser-native points value positioned from the Phaser HUD layout. */
export interface PointsOverlayState {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
  readonly visible: boolean;
  readonly iconX: number;
  readonly iconY: number;
  readonly iconSize: number;
}

/**
 * Primary action button inside the instruction panel (PICK / PASS / DISCARD).
 * Coordinates are relative to the panel's top-left corner.
 */
export interface InstructionPanelButtonState {
  readonly label: string;
  readonly enabled: boolean;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly fontSize: number;
  readonly shadowY: number;
  readonly shadowBlur: number;
}

/**
 * The centre "YOUR TURN" card. Phaser owns every coordinate through the layout
 * engine; the browser paints the card, its text, and its button so the copy
 * stays sharp at any device pixel ratio.
 */
export interface InstructionPanelOverlayState {
  readonly visible: boolean;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly borderWidth: number;
  readonly shadowY: number;
  readonly shadowBlur: number;
  /** Emphasised heading line, e.g. "YOUR TURN". */
  readonly title: string;
  readonly titleFontSize: number;
  /** Remaining copy below the heading, newline separated. */
  readonly body: string;
  readonly bodyFontSize: number;
  /**
   * Vertical band reserved for the copy, relative to the card's top-left.
   * The copy is centred inside it, which keeps it clear of the button on
   * every screen size instead of relying on a fixed centre point.
   */
  readonly contentTop: number;
  readonly contentBottom: number;
  readonly titleGap: number;
  readonly button: InstructionPanelButtonState;
}

/** One selectable opponent hand in the Dead Hand seat step. */
export interface DeadHandSeatOption {
  readonly seat: Exclude<TableSeat, "bottom">;
  /** Highlight box over that seat's exposure, in CSS pixels. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Material Symbols ligature pointing at the seat. */
  readonly arrowIcon: string;
  readonly arrowX: number;
  readonly arrowY: number;
}

/**
 * First Dead Hand step: pick which opponent's hand to call dead.
 *
 * Phaser resolves the exposure boxes from the layout engine; the browser draws
 * the dimmer, highlights, arrows, and copy so the text stays sharp.
 */
export interface DeadHandSeatSelectionState {
  readonly visible: boolean;
  readonly instruction: string;
  readonly instructionFontSize: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly borderWidth: number;
  readonly arrowFontSize: number;
  readonly options: readonly DeadHandSeatOption[];
}

/**
 * How much of the native overlay layer a Phaser popup currently covers.
 *
 * HTML always composites above the Phaser canvas, so a Phaser popup can only
 * come forward if the native overlays it would sit under step aside.
 *
 * - `none`   nothing open
 * - `center` a centred panel (call/skip, joker swap) over the table middle
 * - `screen` a full-screen dimmer (Mah Jongg win, dead-hand seat selection)
 */
export type TableOverlayBlockLevel = "none" | "center" | "screen";

/** Native visual cover for a Phaser mobile drawer; Phaser retains click handling. */
export interface MobileDrawerOverlayState {
  readonly visible: boolean;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly title: string;
  readonly items: readonly string[];
}

/** Exact logo box supplied from the same Phaser HUD coordinates as the hamburger. */
export interface HeaderLogoLayoutState {
  readonly top: number;
  readonly height: number;
}

export interface LayoutStaticUiOptions {
  readonly layout: TableLayout;
  readonly renderDpr: number;
  readonly tablePhase: TablePhase;
  readonly pickTargetSeat: TableSeat;
  readonly passDirection: PassDirection;
  readonly wallTileCount: number;
  readonly passWaitingCount: number;
  readonly canSubmitPass: boolean;
  readonly isPassAnimating: boolean;
  readonly isPickAnimating: boolean;
  readonly activeSeat: TableSeat;
}

export interface PassButtonStateOptions {
  readonly layout: TableLayout;
  readonly tablePhase: TablePhase;
  readonly passWaitingCount: number;
  readonly canSubmitPass: boolean;
  readonly isPassAnimating: boolean;
  readonly isPickAnimating: boolean;
  readonly wallTileCount: number;
  /**
   * When supplied, allows Pick only when the rack and exposure total 13 tiles.
   * Optional so legacy scene callers keep their existing UI behaviour.
   */
  readonly canPickFromWall?: boolean;
}



//// TILE-INTERACTION

export interface TileInteractionCallbacks {
  readonly canSelectTile: (runtime: TileRuntime) => boolean;
  readonly canStartDrag: (runtime: TileRuntime) => boolean;
  readonly canDropTile: (runtime: TileRuntime, x: number, y: number) => boolean;
  readonly canDiscard: (runtime: TileRuntime, x: number, y: number) => boolean;
  readonly canPass: (runtime: TileRuntime, x: number, y: number) => boolean;
  readonly onTileSelected: (runtime: TileRuntime) => void;
  readonly onTileDropped: (runtime: TileRuntime, x: number, y: number) => void;
  readonly onDragFinished: (runtime: TileRuntime) => void;
  readonly requestAnimation: (runtime: TileRuntime) => void;
}

export interface InteractionRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}









export interface GameLayoutOptions {
  readonly mobileHeaderCollapsed?: boolean;
}

export type NativeOrientation = ScreenOrientationResult["type"];

export type DeviceLayoutMode =
  | "phone-portrait"
  | "phone-landscape"
  | "tablet-portrait"
  | "tablet-landscape"
  | "desktop";

export interface DeviceLayoutState {
  readonly width: number;
  readonly height: number;
  readonly orientation: "portrait" | "landscape";
  readonly nativeOrientation?: NativeOrientation;
  readonly layout: DeviceLayoutMode;
}

export type ExposurePanelMode =
  | "desktop"
  | "tablet"
  | "mobile-portrait"
  | "mobile-landscape";


export interface GameTableConfig {
  readonly colors: {
    readonly page: number;
    readonly exposure: number;
    readonly discard: number;
    readonly panel: number;
    readonly accent: number;
    readonly lime: string;
    readonly white: string;
  };
  readonly rack: {
    readonly tileAspect: number;
    readonly maxTileWidthDesktop: number;
    readonly maxTileWidthTablet: number;
    readonly maxTileWidthMobile: number;
    readonly minTileWidth: number;
    readonly gapRatio: number;
  };
  readonly animation: {
    readonly passDurationMs: number;
    readonly dragReturnMs: number;
  };
}

