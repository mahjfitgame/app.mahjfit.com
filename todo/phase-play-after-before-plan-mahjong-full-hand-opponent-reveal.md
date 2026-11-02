# Before & After Plan: Full Winning Hand & Opponent Hand Reveal to Exposures (Simplified Syntax)

## 1. Problem Description & Root Cause Analysis

### Problem 1: Top Exposure Rack Tiles Showing in Reverse (Upside Down)
- **Root Cause**: In `scene.ts` lines 6121–6127 (Mahjong) and 6185–6191 (Wall Game), opponent rack tiles revealed into the exposure area were explicitly rotated using `if (seat === "top") image.setAngle(180);`. This flipped all top exposure tiles upside down, whereas the exposure tray tiles normally render at `angle = 0` (upright).

### Problem 2: Opponent Hands NOT Revealed When Bottom Seat (Player) Won Mahjong
- **Root Cause**: In `component.ts` line 690, winner detection evaluated:
  ```typescript
  let winnerId = (reason === 'MAHJONG' && winnerSeatIds && winnerSeatIds.length > 0) ? winnerSeatIds[0] : null;
  if (!winnerId) {
    // only searched play_seats()
  }
  ```
  In GraphQL WebSocket payloads, `winner_seat_ids` is not provided, and the personal seat's rack is stored separately in `_personal` (`this.gameState.personal_seat_rack_first_is_mahjong()`), NOT in `play_seats()`.
  Because `personal_seat_rack_first_is_mahjong()` was never checked, `winnerId` remained `null` when the bottom player won. Consequently, `setMahjongWinPopup()` with `opponentHands` was never executed, Phaser never received `mahjong:win`, and `revealOpponentHands()` was bypassed.

### Problem 3: Mahjong Popup Missing Exposed Kongs (Only Showing 6 Tiles with Wrong Labels)
- **Root Cause 3.1**: In `component.ts` line 1873:
  ```typescript
  const tileIds: number[] = exp.tile_ids || exp.tiles || [];
  ```
  `exp.tiles` is an array of tile objects `[{ tile_id: 140 }, ...]`, not an array of numbers. Passing objects to `allTilesMap[tid]` caused `undefined` lookups, dropping both exposed Kongs (`444 DOT + JOKER` and `444 BAM + JOKER`) completely.
- **Root Cause 3.2**: In `mapRawTileToWinningTile()`, tile types were compared only against uppercase strings (`type === 'CHAR'`), whereas the API SDK supplies numeric enum codes (`TileTypeEnumAddon.CHAR = 2`, `DRAGON_WHITE = 10`, `DRAGON_GREEN = 9`), causing suit and dragon names to fall back to raw numbers (e.g. `8 25`, `1 3 105`).
- **Root Cause 3.3**: `groupConcealedTiles()` required `prev.rank === t.rank`, splitting distinct suited tiles (`2 Crack`, `4 Crack`, `8 Crack`, `Green Dragon`, `White Dragon`) into isolated 1-tile groups rather than coherent winning hand groups like `(2488 CRACK)`.

---

## 2. Expected Behavior

1. **Upright Top Exposure Tiles**: Top exposure tiles must render upright (`angle: 0`), uniform with the top exposure tray.
2. **Opponent Hands Revealed on Player Win**: When the bottom player declares Mahjong, all opponent rack tiles (`top`, `left`, `right`) must move and display in their table exposure panels.
3. **Full 14-Tile Winning Hand in Popup**:
   - Both exposed melds (`444 DOT + JOKER` and `444 BAM + JOKER`) and concealed hand tiles (`2488 CRACK`, `DRAGON GREEN`, `DRAGON WHITE`) must display with authentic texture atlas images.
   - Proper labels (`Kong 4 Dot`, `Kong 4 Bam`, `2488 Crack`, `Green Dragon`, `White Dragon`) without raw numeric tags.
4. **Simple, Clean Syntax**: Use straightforward `for...of` loops, clear `if/else` checks, and no complex chained `.map().filter()` calls so that any junior developer can easily read, debug, and maintain the code.

---

## 3. Files to Modify

1. `src/app/module/business/game/phaser/scenes/scene.ts`
2. `src/app/module/business/game/phaser/component.ts`

---

## 4. Detailed Before & After Code Snippets

---

### File 1: `src/app/module/business/game/phaser/scenes/scene.ts`

#### Change 1.1: Set Angle 0 for Top Seat in `revealOpponentHands`
**Location**: around lines 6120–6128

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
```

#### AFTER:
```typescript
          const image = this.add.image(xPos, yPos, texture.atlasKey, texture.frameKey).setDepth(42);

          /* OLDCODE
          if (seat === "top") {
            image.setAngle(180);
          } else if (seat === "left") {
            image.setAngle(90);
          } else if (seat === "right") {
            image.setAngle(-90);
          }
          OLDCODE */
          /* NEWCODE */
          // Keep top exposure tiles upright (angle 0) so they match the top exposure tray
          if (seat === "top") {
            image.setAngle(0);
          } else if (seat === "left") {
            image.setAngle(90);
          } else if (seat === "right") {
            image.setAngle(-90);
          }
          /* NEWCODE */
```

#### Change 1.2: Set Angle 0 for Top Seat in `revealAllSeatsHandsForWallGame`
**Location**: around lines 6183–6192

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
```

#### AFTER:
```typescript
          const image = this.add.image(xPos, yPos, texture.atlasKey, texture.frameKey).setDepth(42);

          /* OLDCODE
          if (seat === "top") {
            image.setAngle(180);
          } else if (seat === "left") {
            image.setAngle(90);
          } else if (seat === "right") {
            image.setAngle(-90);
          }
          OLDCODE */
          /* NEWCODE */
          if (seat === "top") {
            image.setAngle(0);
          } else if (seat === "left") {
            image.setAngle(90);
          } else if (seat === "right") {
            image.setAngle(-90);
          }
          /* NEWCODE */
```

---

### File 2: `src/app/module/business/game/phaser/component.ts`

#### Change 2.1: Detect Bottom Player Win & Gather Opponent Hands (Simple `for...of` Syntax)
**Location**: lines 685–795

#### BEFORE:
```typescript
      let winnerId = (reason === 'MAHJONG' && winnerSeatIds && winnerSeatIds.length > 0) ? winnerSeatIds[0] : null;

      if (!winnerId) {
        const seats = this.gameState.play_seats();
        if (seats) {
          for (const [seatId, seatData] of Object.entries(seats)) {
            if (seatData?.racks) {
              for (const rack of Object.values(seatData.racks)) {
                if ((rack as any).is_mahjong) {
                  winnerId = Number(seatId);
                  break;
                }
              }
            }
            if (winnerId) break;
          }
        }
      }
```

#### AFTER:
```typescript
      /* OLDCODE
      let winnerId = (reason === 'MAHJONG' && winnerSeatIds && winnerSeatIds.length > 0) ? winnerSeatIds[0] : null;

      if (!winnerId) {
        const seats = this.gameState.play_seats();
        if (seats) {
          for (const [seatId, seatData] of Object.entries(seats)) {
            if (seatData?.racks) {
              for (const rack of Object.values(seatData.racks)) {
                if ((rack as any).is_mahjong) {
                  winnerId = Number(seatId);
                  break;
                }
              }
            }
            if (winnerId) break;
          }
        }
      }
      OLDCODE */
      /* NEWCODE */
      let winnerId = (reason === 'MAHJONG' && winnerSeatIds && winnerSeatIds.length > 0) ? winnerSeatIds[0] : null;

      // 1. Check if the local player (bottom seat) won Mahjong
      if (!winnerId && reason === 'MAHJONG') {
        const isPersonalMahjong = this.gameState.personal_seat_rack_first_is_mahjong();
        const isMyTurn = this.gameState.play_current_turn_seat_id() === this.gameState.personal_seat_id();
        if (isPersonalMahjong || isMyTurn) {
          winnerId = this.gameState.personal_seat_id() ?? null;
        }
      }

      // 2. Check if an opponent bot won Mahjong in play_seats()
      if (!winnerId) {
        const seats = this.gameState.play_seats();
        if (seats) {
          for (const seatId of Object.keys(seats)) {
            const seatData = seats[seatId];
            if (seatData && seatData.racks) {
              for (const rackKey of Object.keys(seatData.racks)) {
                const rack = seatData.racks[rackKey];
                if (rack && rack.is_mahjong) {
                  winnerId = Number(seatId);
                  break;
                }
              }
            }
            if (winnerId) break;
          }
        }
      }
      /* NEWCODE */
```

And in the opponent hands extraction:

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
            OLDCODE */
            /* NEWCODE */
            const opponentHands: Record<string, number[]> = {};

            // 1. Primary source: read each opponent's hand from all_seat_rack_hands()
            const allHands = this.gameState.all_seat_rack_hands();
            const opponentSeatList: Array<'top' | 'left' | 'right'> = ['top', 'left', 'right'];

            for (const seat of opponentSeatList) {
              const seatHand = allHands[seat];
              const tileIdList: number[] = [];

              if (seatHand && Array.isArray(seatHand)) {
                for (const tileItem of seatHand) {
                  const id = tileItem?.tile_id ?? tileItem?.id;
                  if (typeof id === 'number') {
                    tileIdList.push(id);
                  }
                }
              }

              if (tileIdList.length > 0) {
                opponentHands[seat] = tileIdList;
              }
            }

            // 2. Fallback: if any opponent seat is still empty, check play_seats()
            const seats = this.gameState.play_seats();
            if (seats) {
              for (const seatId of Object.keys(seats)) {
                const seatData = seats[seatId];
                const seatPos = this.gameState.seat_position_by_gseat_id()(Number(seatId));

                if (seatPos && seatPos !== 'bottom') {
                  const alreadyHasTiles = opponentHands[seatPos] && opponentHands[seatPos].length > 0;
                  if (!alreadyHasTiles && seatData && seatData.racks) {
                    const fallbackTileIds: number[] = [];

                    for (const rackKey of Object.keys(seatData.racks)) {
                      const rack = seatData.racks[rackKey];
                      if (rack && rack.hand && typeof rack.hand === 'object') {
                        for (const handKey of Object.keys(rack.hand)) {
                          const tileObj = rack.hand[handKey];
                          const id = tileObj?.tile_id ?? tileObj?.id;
                          if (typeof id === 'number') {
                            fallbackTileIds.push(id);
                          }
                        }
                      }
                    }

                    if (fallbackTileIds.length > 0) {
                      opponentHands[seatPos] = fallbackTileIds;
                    }
                  }
                }
              }
            }
            /* NEWCODE */
```

---

#### Change 2.2: Extract All Melds & Hand Tiles in `buildWinningOverlayData` (Simple Loops)
**Location**: lines 1868–1918

#### BEFORE:
```typescript
    // Process Exposed Melds
    const exposures = rack?.exposures_meld || [];
    const processedTileIds = new Set<number>();

    for (const exp of exposures) {
      const tileIds: number[] = exp.tile_ids || exp.tiles || [];
      const tilesData: WinningTileData[] = [];
      for (const tid of tileIds) {
        processedTileIds.add(tid);
        const rawTile = allTilesMap?.[tid];
        if (rawTile) {
          tilesData.push(this.mapRawTileToWinningTile(rawTile, tid));
        }
      }
      if (tilesData.length > 0) {
        const combName = exp.combination || `${tilesData.length} Tiles`;
        winningHandGroups.push({
          combinationName: combName,
          tiles: tilesData
        });
      }
    }
```

#### AFTER:
```typescript
    /* OLDCODE
    for (const exp of exposures) {
      const tileIds: number[] = exp.tile_ids || exp.tiles || [];
      const tilesData: WinningTileData[] = [];
      for (const tid of tileIds) {
        processedTileIds.add(tid);
        const rawTile = allTilesMap?.[tid];
        if (rawTile) {
          tilesData.push(this.mapRawTileToWinningTile(rawTile, tid));
        }
      }
      if (tilesData.length > 0) {
        const combName = exp.combination || `${tilesData.length} Tiles`;
        winningHandGroups.push({
          combinationName: combName,
          tiles: tilesData
        });
      }
    }
    OLDCODE */
    /* NEWCODE */
    // Helper function to extract tile IDs from exposure meld using clean loops
    const extractTileIdsFromExp = (exp: any): number[] => {
      const resultIds: number[] = [];
      if (!exp) return resultIds;

      // Case 1: exp.tile_ids is an array of numbers
      if (Array.isArray(exp.tile_ids)) {
        for (const item of exp.tile_ids) {
          if (typeof item === 'number') {
            resultIds.push(item);
          }
        }
        return resultIds;
      }

      // Case 2: exp.tiles is an array of tile objects
      if (Array.isArray(exp.tiles)) {
        for (const item of exp.tiles) {
          if (typeof item === 'number') {
            resultIds.push(item);
          } else if (item && typeof item === 'object') {
            const id = item.tile_id ?? item.id;
            if (typeof id === 'number') {
              resultIds.push(id);
            }
          }
        }
        return resultIds;
      }

      // Case 3: exp.tiles is an object dictionary
      if (exp.tiles && typeof exp.tiles === 'object') {
        for (const key of Object.keys(exp.tiles)) {
          const item = exp.tiles[key];
          if (typeof item === 'number') {
            resultIds.push(item);
          } else if (item && typeof item === 'object') {
            const id = item.tile_id ?? item.id;
            if (typeof id === 'number') {
              resultIds.push(id);
            }
          }
        }
        return resultIds;
      }

      return resultIds;
    };

    for (const exp of exposures) {
      const tileIds = extractTileIdsFromExp(exp);
      const tilesData: WinningTileData[] = [];

      for (const tid of tileIds) {
        processedTileIds.add(tid);
        const rawTile = allTilesMap?.[tid];
        if (rawTile) {
          tilesData.push(this.mapRawTileToWinningTile(rawTile, tid));
        }
      }

      if (tilesData.length > 0) {
        const combName = exp.combination || this.describeMeldGroup(tilesData);
        winningHandGroups.push({
          combinationName: combName,
          tiles: tilesData
        });
      }
    }

    // Process Concealed Hand Tiles
    const handTileIds: number[] = [];
    if (rack?.hand_order && Array.isArray(rack.hand_order)) {
      for (const id of rack.hand_order) {
        if (!processedTileIds.has(id)) {
          handTileIds.push(id);
        }
      }
    } else if (rack?.tiles && Array.isArray(rack.tiles)) {
      for (const id of rack.tiles) {
        if (!processedTileIds.has(id)) {
          handTileIds.push(id);
        }
      }
    } else if (rack?.hand && typeof rack.hand === 'object') {
      for (const idStr of Object.keys(rack.hand)) {
        const handObj = rack.hand[idStr];
        const id = typeof handObj === 'number' ? handObj : handObj?.tile_id ?? handObj?.id ?? Number(idStr);
        if (typeof id === 'number' && !processedTileIds.has(id)) {
          handTileIds.push(id);
        }
      }
    }

    // Fallback: If handTileIds is still empty, check all_seat_rack_hands()
    if (handTileIds.length === 0) {
      const seatHand = this.gameState.all_seat_rack_hands()?.[winnerPos] || [];
      for (const t of seatHand) {
        const tid = t?.tile_id ?? t?.id;
        if (typeof tid === 'number' && !processedTileIds.has(tid)) {
          handTileIds.push(tid);
        }
      }
    }
    /* NEWCODE */
```

---

#### Change 2.3: Map Numeric Enum Types in `mapRawTileToWinningTile`
**Location**: lines 1971–1992

#### BEFORE:
```typescript
    let label = '';
    if ((category as any) === TileCategoryEnumAddon.JOKER || category === 'JOKER' || type.includes('JOKER')) {
      label = 'Joker';
    } else if ((category as any) === TileCategoryEnumAddon.FLOWER || category === 'FLOWER' || type.includes('FLOWER')) {
      label = `Flower ${rank || ''}`.trim();
    } else if ((category as any) === TileCategoryEnumAddon.WIND || category === 'WIND' || type.includes('WIND')) {
      const windMap: Record<string, string> = { WIND_EAST: 'East', WIND_SOUTH: 'South', WIND_WEST: 'West', WIND_NORTH: 'North' };
      label = windMap[type] || 'Wind';
    } else if ((category as any) === TileCategoryEnumAddon.DRAGON || category === 'DRAGON' || type.includes('DRAGON')) {
      const dragonMap: Record<string, string> = { DRAGON_RED: 'Red Dragon', DRAGON_GREEN: 'Green Dragon', DRAGON_WHITE: 'White Dragon' };
      label = dragonMap[type] || 'Dragon';
    } else {
      const suitName = type === 'BAM' ? 'Bam' : type === 'CHAR' ? 'Crack' : type === 'DOT' ? 'Dot' : type;
      label = `${rank || ''} ${suitName}`.trim();
    }
```

#### AFTER:
```typescript
    /* OLDCODE
    let label = '';
    if ((category as any) === TileCategoryEnumAddon.JOKER || category === 'JOKER' || type.includes('JOKER')) {
      label = 'Joker';
    } else if ((category as any) === TileCategoryEnumAddon.FLOWER || category === 'FLOWER' || type.includes('FLOWER')) {
      label = `Flower ${rank || ''}`.trim();
    } else if ((category as any) === TileCategoryEnumAddon.WIND || category === 'WIND' || type.includes('WIND')) {
      const windMap: Record<string, string> = { WIND_EAST: 'East', WIND_SOUTH: 'South', WIND_WEST: 'West', WIND_NORTH: 'North' };
      label = windMap[type] || 'Wind';
    } else if ((category as any) === TileCategoryEnumAddon.DRAGON || category === 'DRAGON' || type.includes('DRAGON')) {
      const dragonMap: Record<string, string> = { DRAGON_RED: 'Red Dragon', DRAGON_GREEN: 'Green Dragon', DRAGON_WHITE: 'White Dragon' };
      label = dragonMap[type] || 'Dragon';
    } else {
      const suitName = type === 'BAM' ? 'Bam' : type === 'CHAR' ? 'Crack' : type === 'DOT' ? 'Dot' : type;
      label = `${rank || ''} ${suitName}`.trim();
    }
    OLDCODE */
    /* NEWCODE */
    const isJoker = (category as any) === TileCategoryEnumAddon.JOKER || category === 'JOKER' || type.includes('JOKER') || (type as any) === TileTypeEnumAddon.JOKER || (type as any) === 15 || (type as any) === '15';
    const isFlower = (category as any) === TileCategoryEnumAddon.FLOWER || category === 'FLOWER' || type.includes('FLOWER') || ((type as any) >= 11 && (type as any) <= 14);
    const isWind = (category as any) === TileCategoryEnumAddon.WIND || category === 'WIND' || type.includes('WIND') || ((type as any) >= 4 && (type as any) <= 7);
    const isDragon = (category as any) === TileCategoryEnumAddon.DRAGON || category === 'DRAGON' || type.includes('DRAGON') || ((type as any) >= 8 && (type as any) <= 10);

    let label = '';
    if (isJoker) {
      label = 'Joker';
    } else if (isFlower) {
      const flowerRank = rank ? ` ${rank}` : '';
      label = `Flower${flowerRank}`;
    } else if (isWind) {
      if (type === 'WIND_EAST' || (type as any) === 4 || (type as any) === '4') label = 'East';
      else if (type === 'WIND_SOUTH' || (type as any) === 5 || (type as any) === '5') label = 'South';
      else if (type === 'WIND_WEST' || (type as any) === 6 || (type as any) === '6') label = 'West';
      else if (type === 'WIND_NORTH' || (type as any) === 7 || (type as any) === '7') label = 'North';
      else label = 'Wind';
    } else if (isDragon) {
      if (type === 'DRAGON_RED' || (type as any) === 8 || (type as any) === '8') label = 'Red Dragon';
      else if (type === 'DRAGON_GREEN' || (type as any) === 9 || (type as any) === '9') label = 'Green Dragon';
      else if (type === 'DRAGON_WHITE' || (type as any) === 10 || (type as any) === '10') label = 'White Dragon';
      else label = 'Dragon';
    } else {
      let suitName = 'Crack';
      if (type === 'BAM' || (type as any) === 1 || (type as any) === '1') {
        suitName = 'Bam';
      } else if (type === 'CHAR' || (type as any) === 2 || (type as any) === '2') {
        suitName = 'Crack';
      } else if (type === 'DOT' || (type as any) === 3 || (type as any) === '3') {
        suitName = 'Dot';
      }
      const rankText = rank ? `${rank} ` : '';
      label = `${rankText}${suitName}`;
    }
    /* NEWCODE */
```

---

#### Change 2.4: Intelligent Grouping of Concealed Tiles in `groupConcealedTiles` (Simple Loops, No Chaining)
**Location**: lines 2041–2068

#### BEFORE:
```typescript
  private groupConcealedTiles(tiles: WinningTileData[]): WinningMeldGroup[] {
    const melds: WinningMeldGroup[] = [];
    let currentGroup: WinningTileData[] = [];

    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (currentGroup.length === 0) {
        currentGroup.push(t);
      } else {
        const prev = currentGroup[currentGroup.length - 1];
        const matches = (prev.category === t.category && prev.type === t.type && prev.rank === t.rank);
        if (matches && currentGroup.length < 4) {
          currentGroup.push(t);
        } else {
          const tag = this.describeMeldGroup(currentGroup);
          melds.push({ combinationName: tag, tiles: currentGroup });
          currentGroup = [t];
        }
      }
    }

    if (currentGroup.length > 0) {
      const tag = this.describeMeldGroup(currentGroup);
      melds.push({ combinationName: tag, tiles: currentGroup });
    }

    return melds;
  }
```

#### AFTER:
```typescript
  /* OLDCODE
  private groupConcealedTiles(tiles: WinningTileData[]): WinningMeldGroup[] {
    const melds: WinningMeldGroup[] = [];
    let currentGroup: WinningTileData[] = [];

    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      if (currentGroup.length === 0) {
        currentGroup.push(t);
      } else {
        const prev = currentGroup[currentGroup.length - 1];
        const matches = (prev.category === t.category && prev.type === t.type && prev.rank === t.rank);
        if (matches && currentGroup.length < 4) {
          currentGroup.push(t);
        } else {
          const tag = this.describeMeldGroup(currentGroup);
          melds.push({ combinationName: tag, tiles: currentGroup });
          currentGroup = [t];
        }
      }
    }

    if (currentGroup.length > 0) {
      const tag = this.describeMeldGroup(currentGroup);
      melds.push({ combinationName: tag, tiles: currentGroup });
    }

    return melds;
  }
  OLDCODE */
  /* NEWCODE */
  private groupConcealedTiles(tiles: WinningTileData[]): WinningMeldGroup[] {
    const melds: WinningMeldGroup[] = [];
    if (!tiles || tiles.length === 0) return melds;

    const crackTiles: WinningTileData[] = [];
    const bamTiles: WinningTileData[] = [];
    const dotTiles: WinningTileData[] = [];
    const honorTiles: WinningTileData[] = [];

    // Separate tiles into suits and honors
    for (const tile of tiles) {
      const label = tile.label || '';
      if (label.includes('Crack')) {
        crackTiles.push(tile);
      } else if (label.includes('Bam')) {
        bamTiles.push(tile);
      } else if (label.includes('Dot')) {
        dotTiles.push(tile);
      } else {
        honorTiles.push(tile);
      }
    }

    // Helper to build a suited meld group (e.g. 2488 Crack)
    const addSuitedGroup = (list: WinningTileData[], suitName: string) => {
      if (list.length === 0) return;
      list.sort((a, b) => (a.rank || 0) - (b.rank || 0));

      let ranksText = '';
      for (const t of list) {
        if (t.rank != null) {
          ranksText += String(t.rank);
        }
      }
      melds.push({
        combinationName: ranksText ? `${ranksText} ${suitName}` : suitName,
        tiles: list
      });
    };

    addSuitedGroup(crackTiles, 'Crack');
    addSuitedGroup(bamTiles, 'Bam');
    addSuitedGroup(dotTiles, 'Dot');

    // Add honor tiles (Green Dragon, White Dragon, etc.) as individual groups
    for (const honor of honorTiles) {
      melds.push({
        combinationName: honor.label,
        tiles: [honor]
      });
    }

    return melds;
  }
  /* NEWCODE */
```

---

## 5. Verification Plan
1. **Compilation Check**: Run `npx tsc -p tsconfig.app.json --noEmit` — 0 errors.
2. **Behavior Verification**:
   - When bottom player wins Mahjong, all 3 opponent racks (`top`, `left`, `right`) reveal their hands in their exposure panels.
   - Top exposure tiles are upright (`angle = 0`), matching the top exposure tray.
   - Mahjong popup displays all 14 tiles of the winning hand in 5 clear groups with genuine atlas images:
     - `(2488 CRACK)`
     - `(444 BAM + JOKER)`
     - `(DRAGON GREEN)`
     - `(444 DOT + JOKER)`
     - `(DRAGON WHITE)`
   - Strict `OLDCODE` / `NEWCODE` pattern with 0 code deletions.
   - All loops and logic are direct, readable, and easy to maintain.
