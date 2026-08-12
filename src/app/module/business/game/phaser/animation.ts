import Phaser from "phaser";
import { Rect, TableLayout, PassAnimationItem, PlayerSeat } from "./type";
import { AnimationPoint, AnimationSize, PassWaitingTileAnimation, WallPickClone } from "./scenes/type";

export class GameAnimation {
    private readonly previews: Phaser.GameObjects.Container[] = [];

    constructor(private readonly scene: Phaser.Scene) { }

    /**
     * Plays one synchronized pass animation round.
     */
    public play(items: readonly PassAnimationItem[], layout: TableLayout, onFinished: () => void,): void {
        this.destroy();

        if (!items.length) {
            onFinished();
            return;
        }

        let completed = 0;

        for (const item of items) {
            const start = this.positionForSeat(item.from, layout);
            const end = this.positionForSeat(item.to, layout);
            const preview = this.createPreview(item.tileCount, item.from);

            preview.setPosition(start.x, start.y);
            preview.setDepth(150);

            this.previews.push(preview);

            this.scene.tweens.add({
                targets: preview,
                x: end.x,
                y: end.y,
                duration: 650,
                ease: "Sine.easeInOut",
                onComplete: () => {
                    preview.destroy();

                    completed++;

                    if (completed === items.length) {
                        this.previews.length = 0;
                        onFinished();
                    }
                },
            });
        }
    }
    /**
     * Creates temporary white placeholder tiles.
     */
    private createPreview(tileCount: number, seat: PlayerSeat): Phaser.GameObjects.Container {
        const container = this.scene.add.container(0, 0);
        const isHorizontal = seat === "top" || seat === "bottom";

        const tileWidth = 26;
        const tileHeight = 36;
        const overlap = 13;

        for (let index = 0; index < tileCount; index++) {
            const tile = this.scene.add.rectangle(
                isHorizontal ? index * overlap : 0,
                isHorizontal ? 0 : index * overlap,
                tileWidth,
                tileHeight,
                0xffffff,
                1,
            );

            tile.setStrokeStyle(2, 0xd9d9d9, 1);
            tile.setOrigin(0.5);

            container.add(tile);
        }

        return container;
    }

    /**
     * Calculates where the temporary pass stack should appear for each seat.
     */
    private positionForSeat(seat: PlayerSeat, layout: TableLayout): { x: number; y: number } {
        switch (seat) {
            case "top":
                return {
                    x: this.centerX(layout.topExposure),
                    y: this.bottom(layout.topExposure) + 18,
                };

            case "right":
                return {
                    x: layout.rightExposure.x - 18,
                    y: this.centerY(layout.rightExposure),
                };

            case "bottom":
                return {
                    x: this.centerX(layout.bottomExposure),
                    y: layout.bottomExposure.y - 18,
                };

            case "left":
                return {
                    x: this.right(layout.leftExposure) + 18,
                    y: this.centerY(layout.leftExposure),
                };
        }
    }

    /**
     * Removes all temporary pass previews.
     */
    private destroy(): void {
        for (const preview of this.previews) {
            preview.destroy();
        }

        this.previews.length = 0;
    }

    private centerX(rect: Rect): number {
        return rect.x + rect.width / 2;
    }

    private centerY(rect: Rect): number {
        return rect.y + rect.height / 2;
    }

    private right(rect: Rect): number {
        return rect.x + rect.width;
    }

    private bottom(rect: Rect): number {
        return rect.y + rect.height;
    }









    public playCharlestonRound(
        items: readonly PassAnimationItem[],
        layout: TableLayout,
        onFinished: () => void,
    ): void {
        this.play(items, layout, onFinished);
    }

    public animateRackTileSelection(
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

    public animateRackTileReturn(
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

    public layoutRackTile(
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

    public animateDiscardDrop(
        image: Phaser.GameObjects.Image,
        x: number,
        y: number,
        duration: number = 160,
        ease: string = "Sine.easeOut"
    ): void {
        this.scene.tweens.killTweensOf(image);
        this.scene.tweens.add({
            targets: image,
            x,
            y,
            angle: 0,
            duration,
            ease,
        });
    }

    public layoutDiscardTile(
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
                duration: 1000,
                ease: "Cubic.Out",
            });
            return;
        }

        image.setPosition(x, y);
        image.setAngle(0);
    }

    public animateWallPickOLD(
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
                } else {
                    clone.setScale(
                        Phaser.Math.Linear(
                            startScale,
                            finalScale,
                            Phaser.Math.Easing.Sine.Out(progress.value),
                        ),
                    );
                }
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
    public animateWallPick(
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
        const baseScaleX = clone.scaleX;
        const baseScaleY = clone.scaleY;

        clone.setScale(baseScaleX * startScale, baseScaleY * startScale);
        clone.setAlpha(1);
        clone.setDepth(190);

        const startX = clone.x;
        const startY = clone.y;
        const screenWidth = this.scene.cameras.main.width;

        // The user requested all bottom-seat picks to use the left curve,
        // avoiding the right curve entirely.
        const direction = -1;

        // For the bottom seat, curve out to the side by about 30% of screen width (max 200px).
        // By swinging to the left or right depending on the target, we guarantee the tile 
        // never flies straight down the middle, beautifully dodging the HTML username.
        const arcOffset = isBottomSeat ? Math.min(200, screenWidth * 0.3) * direction : 0;

        const controlX = startX + (target.x - startX) * 0.5 + arcOffset;
        const controlY = startY + (target.y - startY) * 0.5;

        const progress = { value: 0 };

        this.scene.tweens.add({
            targets: progress,
            value: 1,
            duration,
            ease: "Cubic.easeInOut",
            onUpdate: () => {
                const p = progress.value;

                if (isBottomSeat) {
                    const growProgress = Phaser.Math.Clamp(
                        (p - growStart) / (1 - growStart),
                        0,
                        1,
                    );

                    const easedGrow = Phaser.Math.Easing.Sine.Out(growProgress);
                    const currentScale = Phaser.Math.Linear(startScale, finalScale, easedGrow);
                    clone.setScale(baseScaleX * currentScale, baseScaleY * currentScale);

                    // Quadratic Bezier curve for X and Y
                    const x = Math.pow(1 - p, 2) * startX + 2 * (1 - p) * p * controlX + Math.pow(p, 2) * target.x;
                    const y = Math.pow(1 - p, 2) * startY + 2 * (1 - p) * p * controlY + Math.pow(p, 2) * target.y;
                    clone.setPosition(x, y);
                } else {
                    const currentScale = Phaser.Math.Linear(startScale, finalScale, Phaser.Math.Easing.Sine.Out(p));
                    clone.setScale(baseScaleX * currentScale, baseScaleY * currentScale);

                    // Linear straight path for non-bottom seats
                    clone.setPosition(
                        Phaser.Math.Linear(startX, target.x, p),
                        Phaser.Math.Linear(startY, target.y, p),
                    );
                }
            },
            onComplete: () => {
                clone.destroy();
                onFinished();
            },
        });

        if (!isBottomSeat) {
            this.scene.tweens.add({
                targets: clone,
                angle,
                duration,
                ease: "Cubic.easeInOut",
            });
        }
    }

    public layoutPassWaitingTiles(items: readonly PassWaitingTileAnimation[], targets: readonly AnimationPoint[], size: AnimationSize, angle: number, animate: boolean, onPositionCloseButton: (tileId: string) => void): void {
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

    public animatePassWaitingTilesIntoSeatRack(items: readonly PassWaitingTileAnimation[], targets: readonly AnimationPoint[], size: AnimationSize, endAngle: number, onCloneCreated: (clone: Phaser.GameObjects.Container) => void, onFinished: () => void): void {
        if (!items.length) { onFinished(); return; }
        let completed = 0;
        const completeOne = (): void => { completed++; if (completed === items.length) onFinished(); };
        items.forEach((item, index) => {
            const target = targets[index];
            if (!target || !item.image) { completeOne(); return; }
            const tileBack = this.createTileBackClone(item.image.x, item.image.y, size.width, size.height, item.image.angle);
            onCloneCreated(tileBack);
            item.image.setDepth(181);
            this.scene.tweens.add({
                targets: item.image, scaleX: 0, duration: 110, ease: "Sine.easeIn", onComplete: () => {
                    item.image?.setVisible(false);
                    this.scene.tweens.add({
                        targets: tileBack, scaleX: 1, duration: 110, ease: "Sine.easeOut", onComplete: () => {
                            this.scene.tweens.add({ targets: tileBack, x: target.x, y: target.y, angle: endAngle, alpha: 0, scaleX: 0.82, scaleY: 0.82, duration: 520, ease: "Cubic.easeInOut", onComplete: () => { tileBack.destroy(); completeOne(); } });
                        }
                    });
                }
            });
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