# Before & After Plan: Mahjong UI Upgrade (Atlas Tile Rendering & All Seats Hand Reveal)

## 1. Overview & Root Cause Analysis

### Issues Addressed from Screenshot
1. **Numbers (`91`, `91`, etc.) Shown Instead of Tile Images**:
   - In `component.ts`, `this.phaser?.scene?.getScene("PhaserScene")` was queried to fetch tile atlas data URLs.
   - The scene's actual registered key in `scene.ts` is **`"table-scene"`**.
   - Because the key didn't match, `scene` was `undefined`, and `tile.imageUrl` remained `undefined`, falling back to printing the tile's text label (`{{ tile.label }}`).
2. **Tile Size in Popup Too Small**:
   - `.atlas-tile-img` had a hardcoded `clamp(20px, 2.8vw, 36px)`.
   - The user requested that the winning hand tile images match the bottom rack tile size and visual styling.
3. **Opponent Tiles Not Displayed in Exposure Panels on Mahjong**:
   - In `component.ts`, `opponentHands` extraction checked `if ((rack as any).tiles)`, but the server GraphQL response sends `rack.hand` (a dictionary of tile objects) and `rack.hand_order`.
   - Because `rack.tiles` was `undefined`, `opponentHands` was empty (`[]`), so no tiles were placed into the exposure panels.
   - User explicitly requested: **"Use rack.hand"** to extract all seats' tiles.

---

## 2. Files to Modify
1. `src/app/module/business/game/phaser/component.ts`
   - Use `rack.hand` to extract all opponent seat hand tiles.
   - Fix scene key lookup from `"PhaserScene"` to `"table-scene"` in `mapRawTileToWinningTile()`.
2. `src/app/module/business/game/phaser/scenes/scene.ts`
   - Track revealed opponent tile images in `this.calledOpponentExposureTiles[seat]`.
3. `src/app/module/business/game/phaser/style.scss`
   - Update `.atlas-tile-img` and container sizing to match bottom rack tile dimensions (`width: clamp(40px, 4.6vw, 54px)`, `aspect-ratio: 0.72`, `border-radius: 8px`).

---

## 3. Detailed Before & After Code Snippets

---

### Change 1: Extract Opponent Hands using `rack.hand` on Mahjong
**File**: `src/app/module/business/game/phaser/component.ts` (around line 750)

#### BEFORE:
```typescript
            const opponentHands: Record<string, number[]> = {};
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const [seatId, seatData] of Object.entries(seats)) {
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));
                if (seatPos && seatPos !== 'bottom' && seatData?.racks) {
                  const tiles: number[] = [];
                  for (const rack of Object.values(seatData.racks)) {
                    if ((rack as any).tiles) tiles.push(...(rack as any).tiles);
                  }
                  opponentHands[seatPos] = tiles;
                }
              }
            }
```

#### AFTER:
```typescript
            /* OLDCODE
            const opponentHands: Record<string, number[]> = {};
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const [seatId, seatData] of Object.entries(seats)) {
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));
                if (seatPos && seatPos !== 'bottom' && seatData?.racks) {
                  const tiles: number[] = [];
                  for (const rack of Object.values(seatData.racks)) {
                    if ((rack as any).tiles) tiles.push(...(rack as any).tiles);
                  }
                  opponentHands[seatPos] = tiles;
                }
              }
            }
            OLDCODE */
            /* NEWCODE */
            const opponentHands: Record<string, number[]> = {};
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const [seatId, seatData] of Object.entries(seats)) {
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));
                if (seatPos && seatPos !== 'bottom' && seatData?.racks) {
                  const tiles: number[] = [];
                  for (const rack of Object.values(seatData.racks)) {
                    // Extract tiles using rack.hand as sent by GraphQL WebSocket
                    if ((rack as any)?.hand && typeof (rack as any).hand === 'object') {
                      const handTiles = Object.values((rack as any).hand)
                        .map((t: any) => t?.tile_id ?? (t as any)?.id)
                        .filter((id): id is number => id != null);
                      tiles.push(...handTiles);
                    }
                  }
                  opponentHands[seatPos] = tiles;
                }
              }
            }
            /* NEWCODE */
```

---

### Change 2: Fix Scene Key to `"table-scene"` for Tile Atlas Image URLs
**File**: `src/app/module/business/game/phaser/component.ts` (around line 1980)

#### BEFORE:
```typescript
    /* NEWCODE */
    let imageUrl: string | undefined;
    const scene = this.phaser?.scene?.getScene("PhaserScene") as any;
    if (scene && typeof scene.getTileDataUrl === 'function') {
      imageUrl = scene.getTileDataUrl(rawTile);
    }

    return {
      id: tileId,
      assetName,
      category,
      type,
      rank,
      label,
      imageUrl
    };
    /* NEWCODE */
```

#### AFTER:
```typescript
    /* OLDCODE
    let imageUrl: string | undefined;
    const scene = this.phaser?.scene?.getScene("PhaserScene") as any;
    if (scene && typeof scene.getTileDataUrl === 'function') {
      imageUrl = scene.getTileDataUrl(rawTile);
    }

    return {
      id: tileId,
      assetName,
      category,
      type,
      rank,
      label,
      imageUrl
    };
    OLDCODE */
    /* NEWCODE */
    let imageUrl: string | undefined;
    // The Phaser scene is registered under the key "table-scene"
    const scene = (this.phaser?.scene?.getScene("table-scene") || this.phaser?.scene?.scenes?.[0]) as any;
    if (scene && typeof scene.getTileDataUrl === 'function') {
      const tileIdentifier = tileId ?? rawTile?.tile_id ?? rawTile?.id ?? rawTile;
      imageUrl = scene.getTileDataUrl(tileIdentifier);
    }

    return {
      id: tileId,
      assetName,
      category,
      type,
      rank,
      label,
      imageUrl
    };
    /* NEWCODE */
```

---

### Change 3: Track Revealed Opponent Tiles in `scene.ts`
**File**: `src/app/module/business/game/phaser/scenes/scene.ts` (around line 6100)

#### BEFORE:
```typescript
          const image = this.add.image(xPos, yPos, texture.atlasKey, texture.frameKey).setDepth(42);

          if (seat === "top") {
            image.setAngle(180);
          } else if (seat === "left") {
            image.setAngle(90);
          } else if (seat === "right") {
            image.setAngle(-90);
          }

          image.setDisplaySize(tileSize.width, tileSize.height);
          activeIndex++;
```

#### AFTER:
```typescript
          /* OLDCODE
          const image = this.add.image(xPos, yPos, texture.atlasKey, texture.frameKey).setDepth(42);

          if (seat === "top") {
            image.setAngle(180);
          } else if (seat === "left") {
            image.setAngle(90);
          } else if (seat === "right") {
            image.setAngle(-90);
          }

          image.setDisplaySize(tileSize.width, tileSize.height);
          activeIndex++;
          OLDCODE */
          /* NEWCODE */
          const image = this.add.image(xPos, yPos, texture.atlasKey, texture.frameKey).setDepth(42);

          if (seat === "top") {
            image.setAngle(180);
          } else if (seat === "left") {
            image.setAngle(90);
          } else if (seat === "right") {
            image.setAngle(-90);
          }

          image.setDisplaySize(tileSize.width, tileSize.height);
          this.calledOpponentExposureTiles[seat].push(image);
          activeIndex++;
          /* NEWCODE */
```

---

### Change 4: Match Tile Image Size to Bottom Rack Tile Dimensions
**File**: `src/app/module/business/game/phaser/style.scss` (around line 1180)

#### BEFORE:
```scss
.atlas-tile-img {
  width: clamp(20px, 2.8vw, 36px);
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  display: block;
}
```

#### AFTER:
```scss
/* OLDCODE
.atlas-tile-img {
  width: clamp(20px, 2.8vw, 36px);
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  display: block;
}
OLDCODE */
/* NEWCODE */
.atlas-tile-img {
  width: clamp(38px, 4.8vw, 54px);
  aspect-ratio: 0.72;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.45);
  display: block;
  object-fit: contain;
}
/* NEWCODE */
```

---

## 4. Verification & Testing Strategy
1. **Compilation Check**: Run `npx tsc -p tsconfig.app.json --noEmit` to verify 0 errors.
2. **Visual & Behavioral Verification**:
   - Verify that winning hand tiles display authentic texture atlas images instead of text numbers.
   - Verify that the tile size matches bottom rack tile proportions.
   - Verify that when Mahjong occurs, opponent hands from `rack.hand` are populated into their exposure panels on the table.
   - Strict `OLDCODE` / `NEWCODE` compliance.

