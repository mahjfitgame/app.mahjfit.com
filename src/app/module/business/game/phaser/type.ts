import { ScreenOrientationResult } from "@capacitor/screen-orientation";
import { GameTileEntity, GameDeadHandReasonEnum } from "@bfw/api-sdk/graphql/endpoints/business";
import { CallCombination, TableSeat } from "./scenes/type";

export type ExposurePanelMode =
  | "desktop"
  | "tablet"
  | "mobile-portrait"
  | "mobile-landscape";

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


import { GamePhaseEnum } from "@bfw/api-sdk/graphql/endpoints/business";

export type TableSfxId = "tile-select" | "tile-pass-waiting" | "tile-return" | "tile-drop" | "pass";

export type TableSfxConfig = {
  key: string;
  urls: string[];
  volume: number;
  poolSize: number;
  throttleMs?: number;
};




/**
 * Direction used by Charleston.
 *
 * RIGHT
 * LEFT
 * ACROSS
 */
import { GamePhaseFirstRoundDirectionEnum, GamePhaseSecondRoundDirectionEnum } from "@bfw/api-sdk/graphql/endpoints/business";
export type PassDirection = GamePhaseFirstRoundDirectionEnum | GamePhaseSecondRoundDirectionEnum;

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





/** A discard announced by the future game API/WebSocket for the local player to evaluate. */
export interface TileCallOffer {
  readonly discard: GameTileEntity;
  readonly discardedBy: Exclude<TableSeat, "bottom">;
}

/** Client-side intent only; the backend remains responsible for accepting the call. */
export interface TileCallDecision {
  readonly discardId: number;
  readonly discardedBy: Exclude<TableSeat, "bottom">;
  readonly action: "call" | "skip";
  readonly combination?: CallCombination;
  readonly tileIds?: readonly number[];
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

export type DeadHandReason = GameDeadHandReasonEnum;

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
  readonly vm: GameTileEntity;
  readonly image: Phaser.GameObjects.Image;
  slotIndex: number;
  selected: boolean;
  isDragging: boolean;
  zone: "rack" | "discard" | "pass" | "exposure";
}




/**
 * Scene-owned decisions and external effects used by the future pass flow.
 */
export interface PassFlowCallbacks {
  readonly isPassPhaseAllowed: () => boolean;
  readonly getTablePhase: () => GamePhaseEnum;
  readonly onPassWaitingStateChanged: (payload: {
    readonly tileIds: readonly number[];
  }) => void;
  readonly validateSubmission: () => boolean;
  readonly approveSubmission: () => boolean;
  readonly onPassCompleted: (payload: {
    readonly tileIds: readonly number[];
    readonly direction: PassDirection;
  }) => void;
  readonly notifyNetworking: (payload: {
    readonly tileIds: readonly number[];
    readonly direction: PassDirection;
  }) => void;
  readonly emitExternalEvent: (event: string, payload?: unknown) => void;
  readonly requestPassUiUpdate: () => void;
}

export interface PassResultCallbacks {
  readonly onTileRemoved: (runtime: TileRuntime) => void;
  readonly onCloseButtonRemoved: (tileId: number) => void;
  readonly onSelectionChanged: () => void;
  readonly onPassCompleted: (payload: {
    readonly tileIds: readonly number[];
    readonly direction: PassDirection;
  }) => void;
  readonly onLayoutRequested: () => void;
}


export interface PassWaitingTileAnimation {
  readonly id: number;
  readonly image?: Phaser.GameObjects.Image;
}

export interface BotPassVisualTile {
  readonly id: number;
  readonly from: TableSeat;
  readonly to: TableSeat;
  readonly image: Phaser.GameObjects.Container;
}

export interface AnimationPoint { readonly x: number; readonly y: number; }
export interface AnimationSize { readonly width: number; readonly height: number; }
export type WallPickClone = Phaser.GameObjects.Image | Phaser.GameObjects.Container;
