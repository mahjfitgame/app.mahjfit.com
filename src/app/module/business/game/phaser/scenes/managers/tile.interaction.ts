// file: src/app/module/business/game/phaser/scenes/managers/tile-interaction.ts
import Phaser from "phaser";
import { InteractionRect, TileInteractionCallbacks, TileRuntime } from "../type";

/**
 * Phaser-input boundary. It tracks generic pointer motion only; all gameplay
 * decisions are delegated to the constructor-injected TableScene callbacks.
 */
export class TileInteractionManager {
  private readonly dragStartByTileId = new Map<string, { x: number; y: number }>();

  constructor(readonly callbacks: TileInteractionCallbacks) { }

  public beginPointer(tileId: string, pointer: Phaser.Input.Pointer): void {
    this.dragStartByTileId.set(tileId, { x: pointer.worldX, y: pointer.worldY });
  }

  public pointerDistance(tileId: string, pointer: Phaser.Input.Pointer): number | undefined {
    const start = this.dragStartByTileId.get(tileId);
    if (!start) return undefined;

    return Phaser.Math.Distance.Between(start.x, start.y, pointer.worldX, pointer.worldY);
  }

  public hasReachedDragThreshold(
    tileId: string,
    pointer: Phaser.Input.Pointer,
    threshold: number,
  ): boolean {
    const distance = this.pointerDistance(tileId, pointer);
    return distance !== undefined && distance >= threshold;
  }

  public finishPointer(tileId: string): void {
    this.dragStartByTileId.delete(tileId);
  }

  public cancelDrag(tileId: string): void {
    this.finishPointer(tileId);
  }

  public handleDrop(
    runtime: TileRuntime,
    pointer: Phaser.Input.Pointer,
    onDrop: (x: number, y: number) => void,
  ): void {
    onDrop(pointer.worldX, pointer.worldY);
  }

  public cleanupDrop(tileId: string): void {
    this.finishPointer(tileId);
  }

  public toggleSelection(
    runtime: TileRuntime,
    selectedIds: Set<string>,
    canChangeSelection: (runtime: TileRuntime, selecting: boolean) => boolean,
    requestSelectionAnimation: (runtime: TileRuntime) => void,
    onSelectionChanged: () => void,
  ): void {
    const selecting = !runtime.selected;
    if (!canChangeSelection(runtime, selecting)) return;

    runtime.selected = selecting;

    if (selecting) {
      selectedIds.add(runtime.vm.id);
      runtime.image.setTint(0xe4f22c);
    } else {
      selectedIds.delete(runtime.vm.id);
      runtime.image.clearTint();
    }

    requestSelectionAnimation(runtime);
    onSelectionChanged();
  }

  public isPointInsideRect(rect: InteractionRect, x: number, y: number): boolean {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  public findTile<T>(tiles: ReadonlyMap<string, T>, tileId: string): T | undefined {
    return tiles.get(tileId);
  }

  public onPointerDown(
    image: Phaser.GameObjects.Image,
    handler: (pointer: Phaser.Input.Pointer) => void,
  ): void {
    image.on("pointerdown", handler);
  }

  public onPointerUp(
    image: Phaser.GameObjects.Image,
    handler: () => void,
  ): void {
    image.on("pointerup", handler);
  }

  public onPointerOver(
    image: Phaser.GameObjects.Image,
    handler: (pointer: Phaser.Input.Pointer) => void,
  ): void {
    image.on("pointerover", handler);
  }

  public onPointerOut(
    image: Phaser.GameObjects.Image,
    handler: (pointer: Phaser.Input.Pointer) => void,
  ): void {
    image.on("pointerout", handler);
  }

  public onPointerCancel(
    image: Phaser.GameObjects.Image,
    handler: (pointer: Phaser.Input.Pointer) => void,
  ): void {
    image.on("pointercancel", handler);
  }

  public onDragStart(image: Phaser.GameObjects.Image, handler: () => void): void {
    image.on("dragstart", handler);
  }

  public onDrag(
    image: Phaser.GameObjects.Image,
    handler: (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => void,
  ): void {
    image.on("drag", handler);
  }

  public onDragEnd(
    image: Phaser.GameObjects.Image,
    handler: (pointer: Phaser.Input.Pointer) => void,
  ): void {
    image.on("dragend", handler);
  }

  public removePointerHandler(
    image: Phaser.GameObjects.Image,
    event: string,
    handler: (...args: unknown[]) => void,
  ): void {
    image.off(event, handler);
  }
}
