import { Service } from "@angular/core";
import Phaser from "phaser";
import { Rect, TableLayout, PassAnimationItem, PlayerSeat } from "./type";

@Service({ autoProvided: false })
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
}