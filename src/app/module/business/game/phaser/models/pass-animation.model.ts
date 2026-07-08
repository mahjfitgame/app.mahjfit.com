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