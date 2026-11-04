# Phase Play: Joker Exchange Complete Flow, Wall Flight Fix & Rack Overlap Elimination

## 1. Overview & Root Cause Explanation

### The Problem
1. **Wrong Animation (Wall to Seat instead of Exposure to Rack):** When exchanging a Joker with an opponent exposure (e.g., Left or Right exposure), the Joker tile was seen flying from the **center wall** down to the bottom rack.
2. **Joker Overlapping the Last Tile in Rack:** When the Joker landed, it overlapped the adjacent/last tile in the rack (sitting half a tile over it).

### Why It Happened (Root Cause)
1. **Wall Pick Hijack in `reconcileRackTiles`:**
   During the play phase, when it is the player's turn to discard, the player has 14 tiles. When exchanging a Joker, the server sends the updated hand (14 tiles). The client code had a loose check:
   `const isPickAction = this.isWaitingForPickResponse || (this.tablePhase === GamePhaseEnum.PLAYING && this.rackTiles.length === 14);`
   Because `rackTiles.length === 14` was true, it mistakenly treated the incoming Joker as a **wall pick** and started `animateWallTileToSeat("bottom", ...)`.
2. **Source Position Checked Rack Instead of Exposure:**
   In `handleJokerExchange()`, it checked `this.tileMap.get(joker_tile_id)` first. Because the incoming Joker was already placed into the rack by `setRack`, `oldJokerPos` took the rack/wall coordinates instead of finding the Joker in the opponent's exposure tray (`calledOpponentExposureTiles[to_seat]`).
3. **Double / Orphaned Sprites:**
   `animateWallTileToSeat` flew a wall clone and scheduled the tile image visible at the wall landing spot, while `animateJokerExchange` concurrently flew another clone to the rack. Two sprites ended up rendering over the same hand positions.
4. **Coordinate Shift from Hand Size:**
   `destJokerPos` was calculated before updating `rackOrder`. Hand centering shifts by ~35px (half a tile) when hand size changes between 13 and 14 tiles, placing the landing Joker at an offset overlapping position.

---

## 2. Before / After Code Changes

### File 1: `src/app/module/business/game/phaser/scenes/scene.ts`

---

#### Change 1: Guard Wall Pick Detection in `reconcileRackTiles` (Prevent Wall Flight on Joker Exchange)
**Location:** Around line 2115 in `scene.ts`

##### Before:
```typescript
      // Check if this new tile was picked from wall (either flag is true, or rack reached 14 tiles in play phase)
      const isPickAction = this.isWaitingForPickResponse ||
        (this.tablePhase === GamePhaseEnum.PLAYING && this.rackTiles.length === 14);

      if (isPickAction) {
        this.isWaitingForPickResponse = false;
        // Keep tile invisible on the rack until the wall-to-rack flight finishes
        runtime.image.setAlpha(0);
        this.pendingLocalPickRuntime = runtime;
        this.animatingPickTileId = tile.tile_id!;
      }
```

##### After:
```typescript
      /* OLDCODE
      // Check if this new tile was picked from wall (either flag is true, or rack reached 14 tiles in play phase)
      const isPickAction = this.isWaitingForPickResponse ||
        (this.tablePhase === GamePhaseEnum.PLAYING && this.rackTiles.length === 14);

      if (isPickAction) {
        this.isWaitingForPickResponse = false;
        // Keep tile invisible on the rack until the wall-to-rack flight finishes
        runtime.image.setAlpha(0);
        this.pendingLocalPickRuntime = runtime;
        this.animatingPickTileId = tile.tile_id!;
      }
      OLDCODE */
      /* NEWCODE */
      // Check if this tile is arriving via a Joker exchange (must NOT trigger wall pick animation)
      const isJokerSwapTile = (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === tile.tile_id) ||
        (this.isJoker(tile.tile_id!) && this.pendingLocalJokerSwap !== undefined);

      // A wall pick ONLY triggers if the local player explicitly initiated a wall pick
      // (this.isWaitingForPickResponse) and this tile is NOT an incoming Joker swap.
      const isPickAction = this.isWaitingForPickResponse && !isJokerSwapTile;

      if (isPickAction) {
        this.isWaitingForPickResponse = false;
        // Keep tile invisible on the rack until the wall-to-rack flight finishes
        runtime.image.setAlpha(0);
        this.pendingLocalPickRuntime = runtime;
        this.animatingPickTileId = tile.tile_id!;
      } else if (isJokerSwapTile) {
        // Keep Joker invisible on rack until animateJokerExchange flight completes
        runtime.image.setAlpha(0);
      }
      /* NEWCODE */
```

---

#### Change 2: Resolve Joker Starting Position Directly from Exposure Tray
**Location:** In `handleJokerExchange()` around line 7765 in `scene.ts`

##### Before:
```typescript
    let jokerTile = this.tileMap.get(joker_tile_id);
    let oldJokerPos = { x: this.layout.tableOuter.x, y: this.layout.tableOuter.y, scale: 1 };
    let jokerKey = "tiles";
    let jokerFrame = "1-bam";

    if (jokerTile && jokerTile.image && jokerTile.image.active) {
      // BUG: Grabbed rack/wall coordinates if tile was already in tileMap!
      oldJokerPos = { x: jokerTile.image.x, y: jokerTile.image.y, scale: jokerTile.image.scaleX };
      jokerKey = (jokerTile.image.texture as any)?.key || jokerKey;
      jokerFrame = jokerTile.image.frame?.name || jokerFrame;
    } else {
      let found = false;
      if (to_seat && to_seat !== "bottom") {
        const opponentImages = this.calledOpponentExposureTiles[to_seat as Exclude<TableSeat, "bottom">];
        if (opponentImages) {
          const jokerImg = opponentImages.find((img: Phaser.GameObjects.Image) => img.getData("joker-tile-id") === joker_tile_id);
          if (jokerImg && jokerImg.active) {
            oldJokerPos = { x: jokerImg.x, y: jokerImg.y, scale: jokerImg.scaleX };
            jokerKey = (jokerImg.texture as any)?.key || jokerKey;
            jokerFrame = jokerImg.frame?.name || jokerFrame;
            jokerImg.setAlpha(0);
            found = true;
          }
        }
      ...
```

##### After:
```typescript
    /* OLDCODE
    let jokerTile = this.tileMap.get(joker_tile_id);
    let oldJokerPos = { x: this.layout.tableOuter.x, y: this.layout.tableOuter.y, scale: 1 };
    let jokerKey = "tiles";
    let jokerFrame = "1-bam";

    if (jokerTile && jokerTile.image && jokerTile.image.active) {
      oldJokerPos = { x: jokerTile.image.x, y: jokerTile.image.y, scale: jokerTile.image.scaleX };
      jokerKey = (jokerTile.image.texture as any)?.key || jokerKey;
      jokerFrame = jokerTile.image.frame?.name || jokerFrame;
    } else {
      let found = false;
      if (to_seat && to_seat !== "bottom") {
        const opponentImages = this.calledOpponentExposureTiles[to_seat as Exclude<TableSeat, "bottom">];
        if (opponentImages) {
          const jokerImg = opponentImages.find((img: Phaser.GameObjects.Image) => img.getData("joker-tile-id") === joker_tile_id);
          if (jokerImg && jokerImg.active) {
            oldJokerPos = { x: jokerImg.x, y: jokerImg.y, scale: jokerImg.scaleX };
            jokerKey = (jokerImg.texture as any)?.key || jokerKey;
            jokerFrame = jokerImg.frame?.name || jokerFrame;
            jokerImg.setAlpha(0);
            found = true;
          }
        }
        if (!found) {
          const rect = (this.layout as any)[`${to_seat}Exposure`];
          if (rect) {
            oldJokerPos = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, scale: 0.5 };
          }
        }
      }
      const fullTile = this.allTiles[joker_tile_id];
      if (fullTile) {
        const texture = this.gameService.resolve(fullTile as any, 50);
        if (texture) { jokerKey = texture.atlasKey; jokerFrame = texture.frameKey; }
      }
    }
    OLDCODE */
    /* NEWCODE */
    // Determine the source starting position of the exposed Joker.
    // The Joker tile is in to_seat's exposure panel (left, right, top, or bottom).
    let oldJokerPos = { x: this.layout.tableOuter.x, y: this.layout.tableOuter.y, scale: 1 };
    let jokerKey = "tiles";
    let jokerFrame = "1-bam";
    let foundJokerInExposure = false;

    if (to_seat && to_seat !== "bottom") {
      const opponentImages = this.calledOpponentExposureTiles[to_seat as Exclude<TableSeat, "bottom">];
      if (opponentImages && opponentImages.length > 0) {
        let jokerImg = opponentImages.find(
          (img: Phaser.GameObjects.Image) => img.active && img.getData("joker-tile-id") === joker_tile_id
        );
        if (!jokerImg) {
          jokerImg = opponentImages.find(
            (img: Phaser.GameObjects.Image) => img.active && img.getData("joker-swap-enabled")
          );
        }
        if (jokerImg && jokerImg.active) {
          oldJokerPos = { x: jokerImg.x, y: jokerImg.y, scale: jokerImg.scaleX };
          jokerKey = (jokerImg.texture as any)?.key || jokerKey;
          jokerFrame = jokerImg.frame?.name || jokerFrame;
          jokerImg.setAlpha(0);
          foundJokerInExposure = true;
        }
      }
      if (!foundJokerInExposure) {
        const rect = (this.layout as any)[`${to_seat}Exposure`];
        if (rect) {
          oldJokerPos = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, scale: 0.5 };
        }
      }
    } else if (to_seat === "bottom") {
      const bottomJokerImg = this.calledBottomExposureTiles.find(
        (img: Phaser.GameObjects.Image) => img.active && img.getData("joker-tile-id") === joker_tile_id
      );
      if (bottomJokerImg && bottomJokerImg.active) {
        oldJokerPos = { x: bottomJokerImg.x, y: bottomJokerImg.y, scale: bottomJokerImg.scaleX };
        jokerKey = (bottomJokerImg.texture as any)?.key || jokerKey;
        jokerFrame = bottomJokerImg.frame?.name || jokerFrame;
        bottomJokerImg.setAlpha(0);
        foundJokerInExposure = true;
      }
    }

    const fullJokerTile = this.allTiles[joker_tile_id];
    if (fullJokerTile) {
      const texture = this.gameService.resolve(fullJokerTile as any, 50);
      if (texture) {
        jokerKey = texture.atlasKey;
        jokerFrame = texture.frameKey;
      }
    }

    let jokerTile = this.tileMap.get(joker_tile_id);
    /* NEWCODE */
```

---

#### Change 3: Update `rackOrder` First and Calculate Exact Destination Slot
**Location:** In `handleJokerExchange()` around lines 7920–7960 in `scene.ts`

##### Before:
```typescript
    // Destination was calculated BEFORE rackOrder was updated, using old array length
    let destJokerPos = { ...oldNaturalPos, scale: 1 };
    if (from_seat === "bottom") {
      let rackIndex = this.rackOrder.indexOf(from_tile_id);
      if (rackIndex === -1 && this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === joker_tile_id) {
        rackIndex = this.pendingLocalJokerSwap.rackIndex;
      }
      if (rackIndex === -1) {
        rackIndex = this.rackOrder.indexOf(joker_tile_id);
      }
      if (rackIndex !== -1) {
        const slot = this.slotForIndex(rackIndex);
        destJokerPos = { x: slot.x, y: slot.y, scale: 1 };
      } else {
        destJokerPos = { ...oldNaturalPos, scale: 1 };
      }
    }
```

##### After:
```typescript
    /* OLDCODE
    const swapMode = (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === joker_tile_id)
      ? (this.pendingLocalJokerSwap.mode ?? "double-tap")
      : "double-tap";

    let destJokerPos = { ...oldNaturalPos, scale: 1 };
    if (from_seat === "bottom") {
      let rackIndex = this.rackOrder.indexOf(from_tile_id);
      if (rackIndex === -1 && this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === joker_tile_id) {
        rackIndex = this.pendingLocalJokerSwap.rackIndex;
      }
      if (rackIndex === -1) {
        rackIndex = this.rackOrder.indexOf(joker_tile_id);
      }
      if (rackIndex !== -1) {
        const slot = this.slotForIndex(rackIndex);
        destJokerPos = { x: slot.x, y: slot.y, scale: 1 };
      } else {
        destJokerPos = { ...oldNaturalPos, scale: 1 };
      }
    } else {
      const targetPoint = this.pickTargetPointForSeat(from_seat as TableSeat);
      destJokerPos = { x: targetPoint.x, y: targetPoint.y, scale: 0.5 };
    }
    OLDCODE */
    /* NEWCODE */
    const swapMode = (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === joker_tile_id)
      ? (this.pendingLocalJokerSwap.mode ?? "double-tap")
      : "double-tap";

    // 1. Update rackOrder FIRST so that slotForIndex calculates against the authoritative final hand layout
    if (from_seat === "bottom") {
      const fromRackIndex = this.rackOrder.indexOf(from_tile_id);
      if (fromRackIndex !== -1) {
        this.rackOrder.splice(fromRackIndex, 1, joker_tile_id);
      } else if (!this.rackOrder.includes(joker_tile_id)) {
        if (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === joker_tile_id) {
          const safeIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, this.rackOrder.length);
          this.rackOrder.splice(safeIdx, 0, joker_tile_id);
        } else {
          this.rackOrder.push(joker_tile_id);
        }
      }
      this.removeFromRackOrder(from_tile_id);
      this.reindexRackRuntimeSlots();
      this.lastServerOrder = this.rackOrder.join(',');
    }

    // 2. Calculate the exact destination position for Joker on the player's rack
    let destJokerPos = { ...oldNaturalPos, scale: 1 };
    if (from_seat === "bottom") {
      const finalRackIndex = this.rackOrder.indexOf(joker_tile_id);
      if (finalRackIndex !== -1) {
        const slot = this.slotForIndex(finalRackIndex);
        destJokerPos = { x: slot.x, y: slot.y, scale: 1 };
      } else {
        destJokerPos = { ...oldNaturalPos, scale: 1 };
      }
    } else {
      const targetPoint = this.pickTargetPointForSeat(from_seat as TableSeat);
      destJokerPos = { x: targetPoint.x, y: targetPoint.y, scale: 0.5 };
    }
    /* NEWCODE */
```

---

#### Change 4: Keep Static Joker Sprite Hidden During Flight and Setup Interactions
**Location:** In `handleJokerExchange()` around lines 8030–8080 in `scene.ts`

##### Before:
```typescript
      // Replaced rackOrder a second time and did not force alpha: 0 while flight is running
      if (rackIndex !== -1) {
        this.rackOrder.splice(rackIndex, 1, joker_tile_id);
      }
      ...
      image = this.add.image(destJokerPos.x, destJokerPos.y, ...);
```

##### After:
```typescript
    /* OLDCODE
    if (from_seat === "bottom") {
      // Joker is entering bottom player's rack
      const rackIndex = this.rackOrder.indexOf(from_tile_id);
      if (rackIndex !== -1) {
        this.rackOrder.splice(rackIndex, 1, joker_tile_id);
      } else if (!this.rackOrder.includes(joker_tile_id)) {
        if (this.pendingLocalJokerSwap && this.pendingLocalJokerSwap.jokerTileId === joker_tile_id) {
          const safeIdx = Phaser.Math.Clamp(this.pendingLocalJokerSwap.rackIndex, 0, this.rackOrder.length);
          this.rackOrder.splice(safeIdx, 0, joker_tile_id);
        } else {
          this.rackOrder.push(joker_tile_id);
        }
      }
      this.removeFromRackOrder(from_tile_id);
      this.reindexRackRuntimeSlots();
      this.lastServerOrder = this.rackOrder.join(',');
      ...
    OLDCODE */
    /* NEWCODE */
    if (from_seat === "bottom") {
      const tileWidth = Math.round(this.layout.bottomTileLayout.width);
      const tileHeight = Math.round(this.layout.bottomTileLayout.height);

      if (!jokerTile) {
        const fullTile = this.allTiles[joker_tile_id];
        if (fullTile) {
          const texture = this.gameService.resolve(fullTile as any, tileWidth);
          const image = this.add.image(destJokerPos.x, destJokerPos.y, texture.atlasKey, texture.frameKey);
          image.setOrigin(0.5);
          image.setDisplaySize(tileWidth, tileHeight);
          image.setAlpha(0); // keep hidden until exchange animation completes
          jokerTile = {
            vm: { ...fullTile, id: (fullTile as any).id ?? joker_tile_id, tile_id: joker_tile_id } as any,
            image,
            zone: "rack",
            selected: false,
            isDragging: false,
            slotIndex: this.rackOrder.indexOf(joker_tile_id),
          };
          this.tileMap.set(joker_tile_id, jokerTile);
        }
      }

      if (jokerTile) {
        if (!jokerTile.vm.tile_id) {
          (jokerTile.vm as any).tile_id = joker_tile_id;
        }
        jokerTile.zone = "rack";
        jokerTile.selected = false;
        jokerTile.isDragging = false;
        jokerTile.image.setPosition(destJokerPos.x, destJokerPos.y);
        jokerTile.image.setAlpha(0); // keep hidden during flight animation
        jokerTile.image.clearTint();
        jokerTile.image.setData("joker-swap-enabled", false);
        jokerTile.image.setData("exposure-asset", undefined);
        jokerTile.image.setData("joker-tile-id", undefined);
        jokerTile.image.setData("joker-seat", undefined);
        jokerTile.image.off("pointerup");
        jokerTile.image.setDepth(30);
        jokerTile.image.setDisplaySize(tileWidth, tileHeight);
        this.applyTileTextureFilter(jokerTile.image, true);
        jokerTile.image.removeAllListeners();
        this.registerTileInput(jokerTile);
      }
    }
    /* NEWCODE */
```

---

#### Change 5: Complete Animation, Reveal Static Tiles, and Refresh Layout
**Location:** In `handleJokerExchange()` onFinished callback around lines 8245–8270 in `scene.ts`

##### Before:
```typescript
          if (to_seat && to_seat !== "bottom") {
            const opponentImages = this.calledOpponentExposureTiles[to_seat as Exclude<TableSeat, "bottom">];
            if (opponentImages) {
              const jokerImg = opponentImages.find((img: Phaser.GameObjects.Image) => img.getData("joker-tile-id") === joker_tile_id);
              if (jokerImg && jokerImg.active) {
                jokerImg.setTexture(naturalKey, naturalFrame);
                jokerImg.setData("joker-tile-id", undefined);
                jokerImg.setData("joker-swap-enabled", false);
                jokerImg.disableInteractive();
                jokerImg.setAlpha(1);
              }
            }
          }
```

##### After:
```typescript
          /* OLDCODE
          if (to_seat && to_seat !== "bottom") {
            const opponentImages = this.calledOpponentExposureTiles[to_seat as Exclude<TableSeat, "bottom">];
            if (opponentImages) {
              const jokerImg = opponentImages.find((img: Phaser.GameObjects.Image) => img.getData("joker-tile-id") === joker_tile_id);
              if (jokerImg && jokerImg.active) {
                // Update exposure slot to display the new natural tile
                jokerImg.setTexture(naturalKey, naturalFrame);
                jokerImg.setData("joker-tile-id", undefined);
                jokerImg.setData("joker-swap-enabled", false);
                jokerImg.disableInteractive();
                jokerImg.setAlpha(1);
              }
            }
          }
          OLDCODE */
          /* NEWCODE */
          if (to_seat && to_seat !== "bottom") {
            const opponentImages = this.calledOpponentExposureTiles[to_seat as Exclude<TableSeat, "bottom">];
            if (opponentImages) {
              let jokerImg = opponentImages.find((img: Phaser.GameObjects.Image) => img.getData("joker-tile-id") === joker_tile_id);
              if (!jokerImg) {
                jokerImg = opponentImages.find((img: Phaser.GameObjects.Image) => img.active && img.getData("joker-swap-enabled"));
              }
              if (jokerImg && jokerImg.active) {
                // Update exposure slot to display the new natural tile
                jokerImg.setTexture(naturalKey, naturalFrame);
                jokerImg.setData("joker-tile-id", undefined);
                jokerImg.setData("joker-swap-enabled", false);
                jokerImg.disableInteractive();
                jokerImg.setAlpha(1);
              }
            }
          }
          /* NEWCODE */
          if (from_seat === "bottom") {
            this.layoutRackTiles(true);
            this.pendingLocalJokerSwap = undefined;
          }
          if (to_seat === "bottom") {
            this.layoutCalledBottomExposureTiles();
          }
```

---

### File 2: `src/app/module/business/game/phaser/animation.ts`

#### Mode A and Mode B Animation Implementation in `animateJokerExchange`
**Location:** Lines 528–599 in `animation.ts`

```typescript
  /* NEWCODE */
  animateJokerExchange(
    jokerClone: Phaser.GameObjects.Container | Phaser.GameObjects.Image,
    naturalClone: Phaser.GameObjects.Container | Phaser.GameObjects.Image | null,
    destJokerPos: { x: number, y: number, scale: number },
    destNaturalPos: { x: number, y: number, scale: number },
    duration: number,
    onFinished: () => void,
    mode: "double-tap" | "drag-and-drop" = "double-tap"
  ): void {
    // Mode B (Drag-and-Drop): Natural tile already dropped at target zone.
    // Instantly hide natural clone and animate only jokerClone flying downward into player's rack.
    if (mode === "drag-and-drop" || !naturalClone) {
      if (naturalClone && naturalClone.active) {
        naturalClone.destroy();
      }
      this.scene.tweens.add({
        targets: jokerClone,
        x: Math.round(destJokerPos.x),
        y: Math.round(destJokerPos.y),
        scaleX: destJokerPos.scale,
        scaleY: destJokerPos.scale,
        duration: 200,
        ease: "Cubic.easeOut",
        onComplete: () => {
          if (jokerClone && jokerClone.active) {
            jokerClone.destroy();
          }
          onFinished();
        }
      });
      return;
    }

    // Mode A (Double-Tap): Automated simultaneous flight of both clones (250-300ms ease-out).
    // No flips or scaleX modifiers during flight.
    let completedCount = 0;
    const checkDone = () => {
      completedCount++;
      if (completedCount === 2) {
        if (jokerClone && jokerClone.active) jokerClone.destroy();
        if (naturalClone && naturalClone.active) naturalClone.destroy();
        onFinished();
      }
    };

    const flightDuration = Math.min(Math.max(duration || 260, 250), 300);

    // Translate Joker clone down to player rack space
    this.scene.tweens.add({
      targets: jokerClone,
      x: Math.round(destJokerPos.x),
      y: Math.round(destJokerPos.y),
      scaleX: destJokerPos.scale,
      scaleY: destJokerPos.scale,
      duration: flightDuration,
      ease: "Cubic.easeOut",
      onComplete: checkDone
    });

    // Translate Natural clone up to exposure slot
    this.scene.tweens.add({
      targets: naturalClone,
      x: Math.round(destNaturalPos.x),
      y: Math.round(destNaturalPos.y),
      scaleX: destNaturalPos.scale,
      scaleY: destNaturalPos.scale,
      duration: flightDuration,
      ease: "Cubic.easeOut",
      onComplete: checkDone
    });
  }
  /* NEWCODE */
```

---

## 3. End-to-End Workflow Diagram

```
[User Action: Drag-and-Drop OR Double-Tap]
               │
               ▼
   [executeJokerSwap]
   - Records pendingLocalJokerSwap { fromTileId, jokerTileId, rackIndex, mode }
   - Sends WS call to backend (publishActionSwapJoker)
               │
               ▼
[Backend confirms & broadcasts]
   ├── 1. WebSocket "rack:set" event arrives:
   │      - reconcileRackTiles() runs
   │      - Checks isJokerSwapTile -> isPickAction is FALSE (NO wall flight!)
   │      - Natural tile removed from rack; incoming Joker given slotIndex
   │      - Joker sprite created on rack with alpha: 0 (invisible)
   │
   └── 2. WebSocket "joker:exchange" event arrives:
          - handleJokerExchange() runs
          - oldJokerPos resolved directly from opponent exposure tray (left/right/top)
          - rackOrder updated first; destJokerPos calculated from updated rackOrder
          - Clones spawned:
            * Mode A: naturalClone flies rack -> exposure, jokerClone flies exposure -> rack
            * Mode B: naturalClone destroyed at drop; jokerClone flies exposure -> rack (200ms)
          - Flight completes:
            * jokerClone destroyed
            * Static Joker tile set to alpha: 1
            * Opponent exposure tray displays natural tile
            * layoutRackTiles(true) slides all hand tiles cleanly into position (0 overlap!)
```

---

## 4. Manual Verification Checklist

1. **Joker Exchange with Left Exposure:**
   - [ ] Pick a tile so it is your turn (`NEED_DISCARD`).
   - [ ] Drag a matching natural tile from your rack to a meld containing a Joker in the **Left exposure** (or double-tap).
   - [ ] **Observe starting position:** The Joker MUST fly directly from the Left exposure tray down to your rack. It must **NEVER** come from the center wall.
   - [ ] **Observe landing position:** The Joker lands in your rack without overlapping any tile. All 14 tiles sit side-by-side with standard spacing.
2. **Joker Exchange with Right Exposure:**
   - [ ] Drag a matching natural tile to a meld with a Joker in the **Right exposure**.
   - [ ] The Joker flies from the Right exposure tray to your rack.
   - [ ] All rack tiles slide and snap cleanly into place with 0 overlap.
3. **Normal Wall Pick (Verify No Regression):**
   - [ ] On your turn with 13 tiles, click "PICK".
   - [ ] Tile animates normally from the center wall down to the rack.
4. **Tile Discard (Verify No Regression):**
   - [ ] Discard a tile by dragging to center discard area or double clicking.
   - [ ] Hand returns to 13 tiles with normal alignment.

