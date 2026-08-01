import { TablePhase } from "../../model/table-phase";
import { TileVm } from "../../model/tile";
import { GameHapticType } from "../../platform/haptics.service";
import { DeviceLayoutState } from "../device-layout.service";
import { PassDirection } from "../models/pass-animation.model";
import { TableLayout } from "../type";


export type TableSeat = "top" | "right" | "bottom" | "left";

export interface TileRuntime {
  readonly vm: TileVm;
  readonly image: Phaser.GameObjects.Image;
  slotIndex: number;
  selected: boolean;
  isDragging: boolean;
  zone: "rack" | "discard" | "pass";
}


export interface TableSceneCallbacks {
  readonly onSelectionChanged: (ids: readonly string[]) => void;
  readonly onPassCompleted: (payload: { readonly tileIds: readonly string[]; readonly direction: PassDirection }) => void;
  onHaptic?: (type: GameHapticType) => void;
  readonly getDeviceLayout: (width: number, height: number) => DeviceLayoutState;
  readonly onMobileHeaderChanged: (collapsed: boolean) => void;
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
  readonly onPrimaryAction?: () => void;
  readonly onPickSeatChange?: (seat: TableSeat) => void;
  readonly onHamburgerMenuAction?: (action: HamburgerMenuActionKey) => void;
  readonly logoTextureKey?: string;
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
