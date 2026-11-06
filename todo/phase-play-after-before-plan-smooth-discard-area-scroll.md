# Phase Play: Before & After Plan - Smooth Discard Area Scroll (Momentum & Elastic Bounce)

## 1. Overview & Goal

Currently, scrolling in the discard area has two issues:
1. **Mouse Wheel**: Jumps instantly in rigid steps without any smooth glide.
2. **Drag & Swipe**: Stops immediately the moment the finger/mouse is lifted (no momentum or flick glide).

We will add a **lightweight smooth scrolling physics system** inside Phaser (Approach A) matching modern mobile/web scrollers (like RexRainbow's Scroller):
* **Smooth Wheel Gliding**: Mouse wheel smoothly glides to the target instead of snapping instantly.
* **Fling & Momentum**: Swiping/dragging with speed lets the tiles glide and naturally slow down with friction.
* **Elastic Bounce-Back**: Dragging past the top or bottom edges smoothly springs back into place.

---

## 2. Files to Modify

* **File**: `src/app/module/business/game/phaser/scenes/scene.ts`
  - Add simple scroll physics variables (`discardVelocityY`, `discardTargetScrollY`, `discardLastPointerY`, `discardLastPointerTime`).
  - Update `wheel`, `pointerdown`, `pointermove`, and `pointerup` handlers for discard area.
  - Add `updateDiscardScrollPhysics()` and call it in `override update()`.

---

## 3. Before and After Code Snippets

### File: `src/app/module/business/game/phaser/scenes/scene.ts`

---

#### Snippet 1: Discard Scroll State Variables (lines ~148–153)

##### BEFORE:
```typescript
  private discardScrollStartY: number = 0;
  private discardScrollStartOffsetY: number = 0;
  private discardScrollY: number = 0;
  private isScrollingDiscard: boolean = false;
```

##### AFTER:
```typescript
  /* OLDCODE
  private discardScrollStartY: number = 0;
  private discardScrollStartOffsetY: number = 0;
  private discardScrollY: number = 0;
  private isScrollingDiscard: boolean = false;
  OLDCODE */
  /* NEWCODE */
  // Discard area scroll position and smooth movement variables
  private discardScrollStartY: number = 0;
  private discardScrollStartOffsetY: number = 0;
  private discardScrollY: number = 0;
  private discardTargetScrollY: number = 0;
  private discardVelocityY: number = 0;
  private discardLastPointerY: number = 0;
  private discardLastPointerTime: number = 0;
  private isScrollingDiscard: boolean = false;
  /* NEWCODE */
```

---

#### Snippet 2: Mouse Wheel Handler (lines ~451–457)

##### BEFORE:
```typescript
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number, deltaZ: number) => {
      if (this.tablePhase === GamePhaseEnum.LOBBY || this.tableOverlayBlockLevel !== "none") return;
      if (isPointerInDiscardArea(pointer)) {
        this.discardScrollY = Phaser.Math.Clamp(this.discardScrollY + deltaY, 0, Math.max(0, this.discardMaxScroll));
        this.updateDiscardTilePositions();
      }
```

##### AFTER:
```typescript
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number, deltaZ: number) => {
      if (this.tablePhase === GamePhaseEnum.LOBBY || this.tableOverlayBlockLevel !== "none") return;
      /* OLDCODE
      if (isPointerInDiscardArea(pointer)) {
        this.discardScrollY = Phaser.Math.Clamp(this.discardScrollY + deltaY, 0, Math.max(0, this.discardMaxScroll));
        this.updateDiscardTilePositions();
      }
      OLDCODE */
      /* NEWCODE */
      // Smooth mouse wheel: update target position and let update loop smoothly glide to it
      if (isPointerInDiscardArea(pointer)) {
        const maxScroll = Math.max(0, this.discardMaxScroll);
        this.discardTargetScrollY = Phaser.Math.Clamp(this.discardTargetScrollY + deltaY * 0.8, 0, maxScroll);
        this.discardVelocityY = 0;
      }
      /* NEWCODE */
```

---

#### Snippet 3: Pointer Drag & Fling Handlers (lines ~478–550)

##### BEFORE:
```typescript
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.tablePhase === GamePhaseEnum.LOBBY || this.tableOverlayBlockLevel !== "none") return;
      if (isPointerInDiscardArea(pointer)) {
        this.isScrollingDiscard = true;
        this.discardScrollStartY = pointer.y;
        this.discardScrollStartOffsetY = this.discardScrollY;
      }
      ...
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isScrollingDiscard && pointer.isDown) {
        const deltaY = this.discardScrollStartY - pointer.y;
        this.discardScrollY = Phaser.Math.Clamp(this.discardScrollStartOffsetY + deltaY, 0, Math.max(0, this.discardMaxScroll));
        this.updateDiscardTilePositions();
      }
      ...
    });

    this.input.on('pointerup', () => {
      this.isScrollingDiscard = false;
      ...
    });
```

##### AFTER:
```typescript
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.tablePhase === GamePhaseEnum.LOBBY || this.tableOverlayBlockLevel !== "none") return;
      /* OLDCODE
      if (isPointerInDiscardArea(pointer)) {
        this.isScrollingDiscard = true;
        this.discardScrollStartY = pointer.y;
        this.discardScrollStartOffsetY = this.discardScrollY;
      }
      OLDCODE */
      /* NEWCODE */
      // Start drag: stop existing velocity and record starting points
      if (isPointerInDiscardArea(pointer)) {
        this.isScrollingDiscard = true;
        this.discardVelocityY = 0;
        this.discardScrollStartY = pointer.y;
        this.discardScrollStartOffsetY = this.discardScrollY;
        this.discardLastPointerY = pointer.y;
        this.discardLastPointerTime = this.time.now;
      }
      /* NEWCODE */
      ...
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      /* OLDCODE
      if (this.isScrollingDiscard && pointer.isDown) {
        const deltaY = this.discardScrollStartY - pointer.y;
        this.discardScrollY = Phaser.Math.Clamp(this.discardScrollStartOffsetY + deltaY, 0, Math.max(0, this.discardMaxScroll));
        this.updateDiscardTilePositions();
      }
      OLDCODE */
      /* NEWCODE */
      // While dragging: track movement speed (velocity) for momentum release
      if (this.isScrollingDiscard && pointer.isDown) {
        const deltaY = this.discardScrollStartY - pointer.y;
        const maxScroll = Math.max(0, this.discardMaxScroll);

        // Apply slight resistance when pulling past edges (rubber-band feel)
        let newScrollY = this.discardScrollStartOffsetY + deltaY;
        if (newScrollY < 0) {
          newScrollY = newScrollY * 0.35;
        } else if (newScrollY > maxScroll) {
          newScrollY = maxScroll + (newScrollY - maxScroll) * 0.35;
        }
        this.discardScrollY = newScrollY;
        this.discardTargetScrollY = Phaser.Math.Clamp(newScrollY, 0, maxScroll);

        // Calculate drag speed for fling effect
        const timeDiff = Math.max(1, this.time.now - this.discardLastPointerTime);
        const distanceDiff = this.discardLastPointerY - pointer.y;
        this.discardVelocityY = (distanceDiff / timeDiff) * 16; // speed per frame

        this.discardLastPointerY = pointer.y;
        this.discardLastPointerTime = this.time.now;
        this.updateDiscardTilePositions();
      }
      /* NEWCODE */
      ...
    });

    this.input.on('pointerup', () => {
      /* OLDCODE
      this.isScrollingDiscard = false;
      OLDCODE */
      /* NEWCODE */
      // When released: cap max fling velocity so it doesn't spin too fast
      if (this.isScrollingDiscard) {
        this.isScrollingDiscard = false;
        this.discardVelocityY = Phaser.Math.Clamp(this.discardVelocityY, -25, 25);
      }
      /* NEWCODE */
      this.isScrollingExposure = "none";
      this.hideDragProxy();
    });
```

---

#### Snippet 4: Smooth Physics Update Loop (lines ~11400–11415)

##### BEFORE:
```typescript
  override update(time: number, delta: number): void {
  }
```

##### AFTER:
```typescript
  /* OLDCODE
  override update(time: number, delta: number): void {
  }
  OLDCODE */
  /* NEWCODE */
  // Update loop: runs every frame to smoothly glide and bounce discard tiles
  override update(time: number, delta: number): void {
    this.updateDiscardSmoothScroll();
  }

  // Smooth scroll helper: handles gliding, momentum friction, and edge bounce-back
  private updateDiscardSmoothScroll(): void {
    const maxScroll = Math.max(0, this.discardMaxScroll);

    // 1. If user is dragging with pointer, let pointermove control the position
    if (this.isScrollingDiscard) {
      return;
    }

    let needsTileUpdate = false;

    // 2. Momentum / Fling gliding (after user swipes and releases)
    if (Math.abs(this.discardVelocityY) > 0.1) {
      this.discardScrollY += this.discardVelocityY;
      this.discardVelocityY *= 0.92; // friction slows down the glide
      this.discardTargetScrollY = Phaser.Math.Clamp(this.discardScrollY, 0, maxScroll);
      needsTileUpdate = true;
    } else {
      this.discardVelocityY = 0;
    }

    // 3. Elastic Bounce-Back (if pulled past top 0 or bottom maxScroll)
    if (this.discardScrollY < 0) {
      this.discardScrollY = Phaser.Math.Linear(this.discardScrollY, 0, 0.15);
      if (Math.abs(this.discardScrollY) < 0.5) {
        this.discardScrollY = 0;
      }
      needsTileUpdate = true;
    } else if (this.discardScrollY > maxScroll) {
      this.discardScrollY = Phaser.Math.Linear(this.discardScrollY, maxScroll, 0.15);
      if (Math.abs(this.discardScrollY - maxScroll) < 0.5) {
        this.discardScrollY = maxScroll;
      }
      needsTileUpdate = true;
    }
    // 4. Smooth Mouse Wheel Gliding (moves smoothly towards target position)
    else if (Math.abs(this.discardScrollY - this.discardTargetScrollY) > 0.5) {
      this.discardScrollY = Phaser.Math.Linear(this.discardScrollY, this.discardTargetScrollY, 0.18);
      needsTileUpdate = true;
    }

    // Refresh tile positions whenever scroll position changes
    if (needsTileUpdate) {
      this.updateDiscardTilePositions();
    }
  }
  /* NEWCODE */
```

---

## 4. Why This Approach is Best

1. **Lightweight & Clean**: Uses only standard Phaser math methods (`Phaser.Math.Linear` and `Phaser.Math.Clamp`).
2. **Zero External Dependencies**: No third-party packages to install or maintain.
3. **Natural Mobile & Desktop Feel**: Swiping feels fluid like iOS/Android, and wheel scrolling glides smoothly without jumping.
4. **Beginner Friendly**: 100% plain TypeScript with simple variables and clear logic.

