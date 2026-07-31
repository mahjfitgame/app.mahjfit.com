// file: src/app/module/business/game/phaser/scenes/managers/animation.ts
import Phaser from "phaser";
import { PassAnimationManager } from "../../animations/pass-animation.manager";
import type { PassAnimationItem } from "../../models/pass-animation.model";
import { TableLayout } from "../../type";

export interface PassWaitingTileAnimation {
  readonly id: string;
  readonly image?: Phaser.GameObjects.Image;
}

export interface AnimationPoint { readonly x: number; readonly y: number; }
export interface AnimationSize { readonly width: number; readonly height: number; }
type WallPickClone = Phaser.GameObjects.Image | Phaser.GameObjects.Container;

/** Owns visual-only pass-waiting animations. */
export class AnimationManager {
  private readonly charlestonAnimation: PassAnimationManager;

  constructor(private readonly scene: Phaser.Scene) {
    this.charlestonAnimation = new PassAnimationManager(scene);
  }

  playCharlestonRound(
    items: readonly PassAnimationItem[],
    layout: TableLayout,
    onFinished: () => void,
  ): void {
    this.charlestonAnimation.play(items, layout, onFinished);
  }

  animateRackTileSelection(
    image: Phaser.GameObjects.Image,
    x: number,
    y: number,
  ): void {
    this.scene.tweens.killTweensOf(image);
    this.scene.tweens.add({
      targets: image,
      x,
      y,
      angle: 0,
      duration: 110,
      ease: "Sine.easeOut",
    });
  }

  animateRackTileReturn(
    image: Phaser.GameObjects.Image,
    x: number,
    y: number,
    duration: number,
  ): void {
    this.scene.tweens.killTweensOf(image);
    this.scene.tweens.add({
      targets: image,
      x,
      y,
      angle: 0,
      duration,
      ease: "Back.easeOut",
    });
  }

  layoutRackTile(
    image: Phaser.GameObjects.Image,
    width: number,
    height: number,
    x: number,
    y: number,
    animate: boolean,
  ): void {
    image.setDisplaySize(width, height);
    this.scene.tweens.killTweensOf(image);

    if (animate) {
      this.scene.tweens.add({
        targets: image,
        x,
        y,
        angle: 0,
        duration: 140,
        ease: "Sine.easeOut",
      });
      return;
    }

    image.setPosition(x, y);
    image.setAngle(0);
  }

  animateDiscardDrop(
    image: Phaser.GameObjects.Image,
    x: number,
    y: number,
  ): void {
    this.scene.tweens.killTweensOf(image);
    this.scene.tweens.add({
      targets: image,
      x,
      y,
      angle: 0,
      duration: 160,
      ease: "Sine.easeOut",
    });
  }

  layoutDiscardTile(
    image: Phaser.GameObjects.Image,
    width: number,
    height: number,
    x: number,
    y: number,
    animate: boolean,
  ): void {
    image.setDisplaySize(width, height);

    if (animate) {
      this.scene.tweens.add({
        targets: image,
        x,
        y,
        angle: 0,
        duration: 140,
        ease: "Sine.easeOut",
      });
      return;
    }

    image.setPosition(x, y);
    image.setAngle(0);
  }

  animateWallPick(
    clone: WallPickClone,
    target: AnimationPoint,
    angle: number,
    duration: number,
    startScale: number,
    isBottomSeat: boolean,
    onFinished: () => void,
    finalScale: number = 1,
    growStart: number = 0.62,
  ): void {
    clone.setScale(startScale);
    clone.setAlpha(1);
    clone.setDepth(190);

    const progress = { value: 0 };

    this.scene.tweens.add({
      targets: progress,
      value: 1,
      duration,
      ease: "Cubic.easeInOut",
      onUpdate: () => {
        if (isBottomSeat) {
          const growProgress = Phaser.Math.Clamp(
            (progress.value - growStart) / (1 - growStart),
            0,
            1,
          );

          const easedGrow = Phaser.Math.Easing.Sine.Out(growProgress);
          clone.setScale(
            Phaser.Math.Linear(startScale, finalScale, easedGrow),
          );

          return;
        }

        clone.setScale(
          Phaser.Math.Linear(
            startScale,
            finalScale,
            Phaser.Math.Easing.Sine.Out(progress.value),
          ),
        );
      },
    });

    this.scene.tweens.add({
      targets: clone,
      x: Math.round(target.x),
      y: Math.round(target.y),
      angle,
      duration,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        clone.destroy();
        onFinished();
      },
    });
  }
  animateWallPickOLD(
    clone: WallPickClone,
    target: AnimationPoint,
    angle: number,
    duration: number,
    startScale: number,
    isBottomSeat: boolean,
    onFinished: () => void,
  ): void {
    clone.setScale(startScale);
    clone.setAlpha(1);
    clone.setDepth(190);

    const progress = { value: 0 };
    this.scene.tweens.add({
      targets: progress,
      value: 1,
      duration,
      ease: "Cubic.easeInOut",
      onUpdate: () => {
        if (isBottomSeat) {
          const growProgress = Phaser.Math.Clamp((progress.value - 0.62) / 0.38, 0, 1);
          clone.setScale(Phaser.Math.Linear(startScale, 1, Phaser.Math.Easing.Sine.Out(growProgress)));
          return;
        }

        clone.setScale(Phaser.Math.Linear(startScale, 1, Phaser.Math.Easing.Sine.Out(progress.value)));
      },
    });

    this.scene.tweens.add({
      targets: clone,
      x: Math.round(target.x),
      y: Math.round(target.y),
      angle,
      duration,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        clone.destroy();
        onFinished();
      },
    });
  }

  layoutPassWaitingTiles(items: readonly PassWaitingTileAnimation[], targets: readonly AnimationPoint[], size: AnimationSize, angle: number, animate: boolean, onPositionCloseButton: (tileId: string) => void): void {
    items.forEach((item, index) => {
      const target = targets[index];
      if (!target || !item.image) return;
      item.image.setDisplaySize(size.width, size.height);
      item.image.setDepth(95);
      if (animate) {
        this.scene.tweens.killTweensOf(item.image);
        this.scene.tweens.add({ targets: item.image, x: target.x, y: target.y, angle, duration: 180, ease: "Sine.easeOut", onUpdate: () => onPositionCloseButton(item.id), onComplete: () => onPositionCloseButton(item.id) });
        return;
      }
      item.image.setPosition(target.x, target.y);
      item.image.setAngle(angle);
      onPositionCloseButton(item.id);
    });
  }

  animatePassWaitingTilesIntoSeatRack(items: readonly PassWaitingTileAnimation[], targets: readonly AnimationPoint[], size: AnimationSize, endAngle: number, onCloneCreated: (clone: Phaser.GameObjects.Container) => void, onFinished: () => void): void {
    if (!items.length) { onFinished(); return; }
    let completed = 0;
    const completeOne = (): void => { completed++; if (completed === items.length) onFinished(); };
    items.forEach((item, index) => {
      const target = targets[index];
      if (!target || !item.image) { completeOne(); return; }
      const tileBack = this.createTileBackClone(item.image.x, item.image.y, size.width, size.height, item.image.angle);
      onCloneCreated(tileBack);
      item.image.setDepth(181);
      this.scene.tweens.add({ targets: item.image, scaleX: 0, duration: 110, ease: "Sine.easeIn", onComplete: () => {
        item.image?.setVisible(false);
        this.scene.tweens.add({ targets: tileBack, scaleX: 1, duration: 110, ease: "Sine.easeOut", onComplete: () => {
          this.scene.tweens.add({ targets: tileBack, x: target.x, y: target.y, angle: endAngle, alpha: 0, scaleX: 0.82, scaleY: 0.82, duration: 520, ease: "Cubic.easeInOut", onComplete: () => { tileBack.destroy(); completeOne(); } });
        } });
      } });
    });
  }

  private createTileBackClone(x: number, y: number, width: number, height: number, angle: number): Phaser.GameObjects.Container {
    const radius = Math.max(4, Math.min(width, height) * 0.12);
    const strokeWidth = Math.max(1, Math.round(Math.min(width, height) * 0.045));
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
    graphics.lineStyle(strokeWidth, 0xd9d9d9, 1);
    graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
    const innerInset = Math.max(3, Math.min(width, height) * 0.08);
    const innerRadius = Math.max(3, radius - innerInset * 0.35);
    graphics.lineStyle(1, 0xf1f5f9, 1);
    graphics.strokeRoundedRect(-width / 2 + innerInset, -height / 2 + innerInset, width - innerInset * 2, height - innerInset * 2, innerRadius);
    return this.scene.add.container(x, y, [graphics]).setAngle(angle).setDepth(180).setScale(0, 1).setAlpha(1);
  }
}
