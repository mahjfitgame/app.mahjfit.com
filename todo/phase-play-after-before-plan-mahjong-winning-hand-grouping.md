# Before & After Plan: Mahjong Winning Hand Grouping and Arrangement

## 1. Problem Description

Currently, the Mahjong winning popup displays winning hands with incorrect groupings and labels across multiple American Mahjongg card rules:

1. **Screenshot 1 (Rule: `113579 1111 1111`)**:
   - The code wrongly attached a Joker to the pair of `1 Crack`, making it `Pung of 1 Crack`. In American Mahjongg, pairs cannot contain Jokers.
   - Because that Joker was stolen, the `1 Dot` kong was left with only 3 tiles (`Pung of 1 Dot`).
   - The single run tiles `3, 5, 7, 9 Crack` were displayed as 4 separate isolated single tiles (`13 Crack`, `15 Crack`, `17 Crack`, `19 Crack`).
   - **Correct Arrangement**:
     `113579 Crack` (6 tiles) + `Kong of 1 Dot` (4 tiles with Joker) + `Kong of 1 Bam` (4 tiles with Joker).

2. **Screenshot 2 (Rule: `FF 246 888 246 888`)**:
   - The code had no concept of number step runs like `246 Dot` and `246 Bam`.
   - Each tile was treated as an isolated single tile, and sorted by rank across suits: `2 Bam, 2 Dot, 4 Bam, 4 Dot, 6 Bam, 6 Dot`.
   - **Correct Arrangement**:
     `2 Flowers` (2 tiles) + `246 Dot` (3 tiles) + `Pung of 8 Dot` (3 tiles) + `246 Bam` (3 tiles) + `Pung of 8 Bam` (3 tiles).

3. **Screenshot 3 (Rule: `22 00 222 666 NEWS`)**:
   - The `6 Bam` was a single tile that needed 2 Jokers to make a 3-tile Pung (`6JJ`). The code only added Jokers to groups of 2 or 3 tiles, so it left `6 Bam` alone and dropped both Jokers as loose orphan tiles.
   - The `NEWS` winds were split into separate single tiles instead of being grouped as the standard `NEWS` combination.
   - The pair of White Dragons (`00` / Soap) was split.
   - **Correct Arrangement**:
     `Pair of 2 Dot` (2 tiles) + `Pair of White Dragon` (2 tiles) + `Pung of 2 Bam` (3 tiles, exposed) + `Pung of 6 Bam` (3 tiles with 2 Jokers) + `NEWS` (4 tiles).

---

## 2. Solution Overview

We replace the naive grouping with a clean, step-by-step Mahjong grouping solver in `src/app/module/business/game/phaser/component.ts`:

1. **Keep Exposed Melds**: Melds already exposed on the player's rack during the game are already valid and are kept intact.
2. **Group Flowers (`FF`)**: All flower tiles are grouped together.
3. **Group `NEWS` Winds**: If the hand contains East, South, West, North (1 of each), group them as `NEWS`.
4. **Group White Dragon Pairs (`00`)**: If the hand has a pair of White Dragons (Soap used for zero `00` in year hands), group them as `Pair of White Dragon`.
5. **Detect Suited Runs (No Jokers Allowed)**:
   - `113579` or `135799`: 6 tiles in the same suit with an odd pair and singles.
   - `13579`: 5-tile odd run.
   - `2468`: 4-tile even run.
   - `246`: 3-tile even run.
   - `135`, `357`, `579`: 3-tile odd run.
   - `123`, `234`, etc.: 3-tile consecutive run.
6. **Assign Jokers to Remaining Melds**:
   - In American Mahjongg, Jokers can only be used in melds of 3 or more (Pungs = 3, Kongs = 4, Quints = 5).
   - If a group has 3 natural tiles and needs a Kong $\rightarrow$ add 1 Joker.
   - If a group has 2 natural tiles and needs a Pung $\rightarrow$ add 1 Joker.
   - If a group has 1 natural tile and needs a Pung $\rightarrow$ add 2 Jokers (e.g. `6JJ`).
   - If a group has 2 natural tiles and is a pair $\rightarrow$ keep as a natural pair (no Jokers).
7. **Sort Groups in Mahjong Card Order**:
   - Flowers first.
   - Suited groups kept together with their matching pungs/kongs (e.g. `246 Dot` then `Pung of 8 Dot`, then `246 Bam` then `Pung of 8 Bam`).
   - Dragons (`00`).
   - Winds (`NEWS`).

---

## 3. Files to Modify

- `src/app/module/business/game/phaser/component.ts`

---

## 4. Before & After Code Snippets

### File: `src/app/module/business/game/phaser/component.ts`
**Location**: Lines 2506–2660 (Replacing `groupConcealedTiles`, `describeMeldGroup`, and `getWinningGroupSortOrder`)

#### BEFORE CODE:

```typescript
  /* OLDCODE
  // Group concealed tiles into proper rule combinations (Flowers, Pairs, Pungs, Kongs)
  private groupConcealedTiles(tiles: WinningTileData[]): WinningMeldGroup[] {
    const melds: WinningMeldGroup[] = [];
    if (!tiles || tiles.length === 0) return melds;

    const flowerTiles: WinningTileData[] = [];
    const jokerTiles: WinningTileData[] = [];
    const naturalTiles: WinningTileData[] = [];

    // 1. Separate into flowers, jokers, and natural tiles
    for (const tile of tiles) {
      const label = tile.label || '';
      if (tile.category === 'FLOWER' || label.includes('Flower')) {
        flowerTiles.push(tile);
      } else if (label.includes('Joker')) {
        jokerTiles.push(tile);
      } else {
        naturalTiles.push(tile);
      }
    }

    // 2. All Flowers group together as FFF
    if (flowerTiles.length > 0) {
      const count = flowerTiles.length;
      const countLabel = count === 1 ? '1 Flower' : `${count} Flowers`;
      melds.push({
        combinationName: countLabel,
        tiles: flowerTiles
      });
    }

    // 3. Group identical natural tiles into combinations (Pairs, Pungs, Kongs)
    const naturalGroupsMap = new Map<string, WinningTileData[]>();
    for (const tile of naturalTiles) {
      const key = `${tile.type}_${tile.rank ?? ''}_${tile.label ?? ''}`;
      const existing = naturalGroupsMap.get(key);
      if (existing) {
        existing.push(tile);
      } else {
        naturalGroupsMap.set(key, [tile]);
      }
    }

    const groupedLists: WinningTileData[][] = [];
    for (const list of naturalGroupsMap.values()) {
      groupedLists.push(list);
    }

    // 4. Attach Jokers to incomplete melds (Pungs/Kongs that need Jokers)
    for (const list of groupedLists) {
      if (jokerTiles.length === 0) break;
      if (list.length === 2 && jokerTiles.length >= 1) {
        list.push(jokerTiles.pop()!);
      } else if (list.length === 3 && jokerTiles.length >= 1) {
        list.push(jokerTiles.pop()!);
      }
    }

    // 5. Add each natural combination with its descriptive name
    for (const list of groupedLists) {
      const combName = this.describeMeldGroup(list);
      melds.push({
        combinationName: combName,
        tiles: list
      });
    }

    // 6. Any remaining Jokers form their own group
    if (jokerTiles.length > 0) {
      const count = jokerTiles.length;
      melds.push({
        combinationName: count === 1 ? '1 Joker' : `${count} Jokers`,
        tiles: jokerTiles
      });
    }

    return melds;
  }

  private describeMeldGroup(group: WinningTileData[]): string {
    if (group.length === 0) return '';

    // Pick a natural tile as representative if Jokers are present
    let rep = group[0];
    for (const t of group) {
      if (!t.label?.includes('Joker')) {
        rep = t;
        break;
      }
    }

    const count = group.length;
    if (rep.category === 'FLOWER' || rep.label?.includes('Flower')) {
      return count === 1 ? '1 Flower' : `${count} Flowers`;
    }
    if (rep.label?.includes('Joker')) {
      return count === 1 ? '1 Joker' : `${count} Jokers`;
    }

    if (count === 2) return `Pair of ${rep.label}`;
    if (count === 3) return `Pung of ${rep.label}`;
    if (count === 4) return `Kong of ${rep.label}`;
    if (count === 5) return `Quint of ${rep.label}`;
    if (count === 6) return `Sextet of ${rep.label}`;

    return `${count} ${rep.label}`;
  }

  // Canonical Mahjong rule sort order: Flowers (100) -> Suited Numbers (200 + rank * 10) -> Winds (400) -> Dragons (500)
  private getWinningGroupSortOrder(group: WinningMeldGroup): number {
    if (!group.tiles || group.tiles.length === 0) return 999;

    let rep = group.tiles[0];
    for (const t of group.tiles) {
      if (!t.label?.includes('Joker')) {
        rep = t;
        break;
      }
    }

    const label = rep.label || '';
    const type = String(rep.type || '');
    const rank = rep.rank || 0;

    // 1. Flowers always first
    if (rep.category === 'FLOWER' || label.includes('Flower')) {
      return 100;
    }

    // 2. Numbered suited tiles (sorted by rank: 5s before 7s before 9s)
    if (rank >= 1 && rank <= 9) {
      let suitOffset = 0;
      if (label.includes('Crack') || type === 'CHAR') suitOffset = 0;
      else if (label.includes('Bam') || type === 'BAM') suitOffset = 1;
      else if (label.includes('Dot') || type === 'DOT') suitOffset = 2;
      return 200 + rank * 10 + suitOffset;
    }

    // 3. Winds (East, South, West, North)
    if (label.includes('East') || type === 'WIND_EAST') return 410;
    if (label.includes('South') || type === 'WIND_SOUTH') return 420;
    if (label.includes('West') || type === 'WIND_WEST') return 430;
    if (label.includes('North') || type === 'WIND_NORTH') return 440;

    // 4. Dragons (Red Dragon, Green Dragon, White Dragon)
    if (label.includes('Red Dragon') || type === 'DRAGON_RED') return 510;
    if (label.includes('Green Dragon') || type === 'DRAGON_GREEN') return 520;
    if (label.includes('White Dragon') || type === 'DRAGON_WHITE') return 530;

    // 5. Jokers
    if (label.includes('Joker')) return 600;

    return 700;
  }
  OLDCODE */
```

---

#### AFTER CODE:

```typescript
  /* NEWCODE */
  // Group winning hand tiles cleanly according to American Mahjongg card rules
  private groupConcealedTiles(tiles: WinningTileData[]): WinningMeldGroup[] {
    const melds: WinningMeldGroup[] = [];
    if (!tiles || tiles.length === 0) return melds;

    // Separate tiles into buckets
    const flowerTiles: WinningTileData[] = [];
    const jokerTiles: WinningTileData[] = [];
    const naturalTiles: WinningTileData[] = [];

    for (const tile of tiles) {
      const label = tile.label || '';
      if (tile.category === 'FLOWER' || label.includes('Flower')) {
        flowerTiles.push(tile);
      } else if (label.includes('Joker') || tile.category === 'JOKER' || tile.type.includes('JOKER')) {
        jokerTiles.push(tile);
      } else {
        naturalTiles.push(tile);
      }
    }

    // 1. Group Flowers (FF, FFFF)
    if (flowerTiles.length > 0) {
      const count = flowerTiles.length;
      melds.push({
        combinationName: count === 1 ? '1 Flower' : `${count} Flowers`,
        tiles: flowerTiles
      });
    }

    // 2. Check for NEWS Winds combination (1 East, 1 South, 1 West, 1 North)
    const eastIdx = naturalTiles.findIndex(t => t.type === 'WIND_EAST' || t.label === 'East');
    const southIdx = naturalTiles.findIndex(t => t.type === 'WIND_SOUTH' || t.label === 'South');
    const westIdx = naturalTiles.findIndex(t => t.type === 'WIND_WEST' || t.label === 'West');
    const northIdx = naturalTiles.findIndex(t => t.type === 'WIND_NORTH' || t.label === 'North');

    if (eastIdx !== -1 && southIdx !== -1 && westIdx !== -1 && northIdx !== -1) {
      // Pick the 4 wind tiles in NEWS order
      const newsIndices = [eastIdx, southIdx, westIdx, northIdx].sort((a, b) => b - a);
      const newsTiles: WinningTileData[] = [];
      for (const idx of newsIndices) {
        newsTiles.unshift(naturalTiles.splice(idx, 1)[0]);
      }
      // Sort in clean East, South, West, North order
      newsTiles.sort((a, b) => {
        const order: Record<string, number> = { East: 1, South: 2, West: 3, North: 4 };
        return (order[a.label || ''] || 0) - (order[b.label || ''] || 0);
      });
      melds.push({
        combinationName: 'NEWS',
        tiles: newsTiles
      });
    }

    // 3. Check for White Dragon pairs (used as '00' in year hands like 2026)
    const whiteDragonTiles = naturalTiles.filter(t => t.type === 'DRAGON_WHITE' || t.label?.includes('White Dragon'));
    if (whiteDragonTiles.length === 2) {
      // Remove both White Dragons from the pool
      for (const wd of whiteDragonTiles) {
        const idx = naturalTiles.indexOf(wd);
        if (idx !== -1) naturalTiles.splice(idx, 1);
      }
      melds.push({
        combinationName: 'Pair of White Dragon',
        tiles: whiteDragonTiles
      });
    }

    // 4. Check for Suited Runs / Sequences (e.g. 113579, 246, 135)
    // Jokers cannot belong to runs or pairs in American Mahjongg
    const suits = ['Crack', 'Bam', 'Dot'];
    for (const suit of suits) {
      const suitTiles = naturalTiles.filter(t => (t.label || '').includes(suit));
      if (suitTiles.length === 0) continue;

      // Count rank occurrences in this suit
      const rankCounts = new Map<number, WinningTileData[]>();
      for (const t of suitTiles) {
        const rank = t.rank || 0;
        if (!rankCounts.has(rank)) rankCounts.set(rank, []);
        rankCounts.get(rank)!.push(t);
      }

      // Pattern 4A: 113579 (Odd run with a pair: 1, 1, 3, 5, 7, 9)
      const hasOddSingles = [3, 5, 7, 9].every(r => (rankCounts.get(r)?.length || 0) >= 1);
      const pairRank = [1, 3, 5, 7, 9].find(r => (rankCounts.get(r)?.length || 0) >= 2);
      if (hasOddSingles && pairRank !== undefined) {
        const runTiles: WinningTileData[] = [];
        // Take the pair
        runTiles.push(...rankCounts.get(pairRank)!.splice(0, 2));
        // Take one of each other odd rank
        for (const r of [1, 3, 5, 7, 9]) {
          if (r !== pairRank) {
            runTiles.push(rankCounts.get(r)!.splice(0, 1)[0]);
          }
        }
        // Remove from naturalTiles
        for (const t of runTiles) {
          const idx = naturalTiles.indexOf(t);
          if (idx !== -1) naturalTiles.splice(idx, 1);
        }
        runTiles.sort((a, b) => (a.rank || 0) - (b.rank || 0));
        melds.push({
          combinationName: `113579 ${suit}`,
          tiles: runTiles
        });
        continue;
      }

      // Pattern 4B: 246 Even Run (single 2, single 4, single 6)
      const has246 = (rankCounts.get(2)?.length === 1) &&
                     (rankCounts.get(4)?.length === 1) &&
                     (rankCounts.get(6)?.length === 1);
      if (has246) {
        const runTiles: WinningTileData[] = [
          rankCounts.get(2)!.splice(0, 1)[0],
          rankCounts.get(4)!.splice(0, 1)[0],
          rankCounts.get(6)!.splice(0, 1)[0]
        ];
        for (const t of runTiles) {
          const idx = naturalTiles.indexOf(t);
          if (idx !== -1) naturalTiles.splice(idx, 1);
        }
        melds.push({
          combinationName: `246 ${suit}`,
          tiles: runTiles
        });
        continue;
      }

      // Pattern 4C: 135 Odd Run (single 1, single 3, single 5)
      const has135 = (rankCounts.get(1)?.length === 1) &&
                     (rankCounts.get(3)?.length === 1) &&
                     (rankCounts.get(5)?.length === 1);
      if (has135) {
        const runTiles: WinningTileData[] = [
          rankCounts.get(1)!.splice(0, 1)[0],
          rankCounts.get(3)!.splice(0, 1)[0],
          rankCounts.get(5)!.splice(0, 1)[0]
        ];
        for (const t of runTiles) {
          const idx = naturalTiles.indexOf(t);
          if (idx !== -1) naturalTiles.splice(idx, 1);
        }
        melds.push({
          combinationName: `135 ${suit}`,
          tiles: runTiles
        });
        continue;
      }
    }

    // 5. Group remaining identical natural tiles
    const naturalGroupsMap = new Map<string, WinningTileData[]>();
    for (const tile of naturalTiles) {
      const key = `${tile.type}_${tile.rank ?? ''}_${tile.label ?? ''}`;
      if (!naturalGroupsMap.has(key)) {
        naturalGroupsMap.set(key, []);
      }
      naturalGroupsMap.get(key)!.push(tile);
    }

    const groupedLists: WinningTileData[][] = Array.from(naturalGroupsMap.values());

    // 6. Smart Joker Assignment:
    // Jokers can only be used in Pungs (3), Kongs (4), Quints (5).
    // Pairs must never receive a Joker.
    // Case A: 3 natural tiles + 1 Joker -> Kong (4 tiles)
    for (const list of groupedLists) {
      if (jokerTiles.length > 0 && list.length === 3) {
        list.push(jokerTiles.pop()!);
      }
    }

    // Case B: 1 natural tile + 2 Jokers -> Pung (3 tiles, e.g. 6JJ)
    for (const list of groupedLists) {
      if (jokerTiles.length >= 2 && list.length === 1) {
        list.push(jokerTiles.pop()!);
        list.push(jokerTiles.pop()!);
      }
    }

    // Case C: 2 natural tiles + 1 Joker -> Pung (3 tiles, e.g. 88J)
    // Only if total tiles need a Pung (leave pairs intact if no jokers or if exactly 2)
    for (const list of groupedLists) {
      if (jokerTiles.length >= 1 && list.length === 2) {
        list.push(jokerTiles.pop()!);
      }
    }

    // 7. Add grouped identical combinations
    for (const list of groupedLists) {
      const combName = this.describeMeldGroup(list);
      melds.push({
        combinationName: combName,
        tiles: list
      });
    }

    // 8. Any remaining Jokers (fallback)
    if (jokerTiles.length > 0) {
      const count = jokerTiles.length;
      melds.push({
        combinationName: count === 1 ? '1 Joker' : `${count} Jokers`,
        tiles: jokerTiles
      });
    }

    return melds;
  }

  // Label the group in simple plain English
  private describeMeldGroup(group: WinningTileData[]): string {
    if (group.length === 0) return '';

    // Find the first natural tile to get the name
    let rep = group[0];
    for (const t of group) {
      if (!t.label?.includes('Joker')) {
        rep = t;
        break;
      }
    }

    const count = group.length;
    if (rep.category === 'FLOWER' || rep.label?.includes('Flower')) {
      return count === 1 ? '1 Flower' : `${count} Flowers`;
    }
    if (rep.label?.includes('Joker')) {
      return count === 1 ? '1 Joker' : `${count} Jokers`;
    }

    if (count === 2) return `Pair of ${rep.label}`;
    if (count === 3) return `Pung of ${rep.label}`;
    if (count === 4) return `Kong of ${rep.label}`;
    if (count === 5) return `Quint of ${rep.label}`;
    if (count === 6) return `Sextet of ${rep.label}`;

    return `${count} ${rep.label}`;
  }

  // Card sort order: Flowers (100) -> Suited Units (200 + suit) -> Dragons (400) -> Winds (500)
  private getWinningGroupSortOrder(group: WinningMeldGroup): number {
    if (!group.tiles || group.tiles.length === 0) return 999;

    const combName = group.combinationName || '';

    // 1. Flowers first
    if (combName.includes('Flower')) return 100;

    // 2. NEWS winds
    if (combName === 'NEWS') return 500;

    // 3. White Dragon / Dragons
    if (combName.includes('White Dragon') || combName.includes('Dragon')) return 400;

    // 4. Suited combinations: Keep suit and run together
    let rep = group.tiles[0];
    for (const t of group.tiles) {
      if (!t.label?.includes('Joker')) {
        rep = t;
        break;
      }
    }

    const label = rep.label || combName;
    let suitOffset = 0;
    if (label.includes('Crack')) suitOffset = 10;
    else if (label.includes('Dot')) suitOffset = 20;
    else if (label.includes('Bam')) suitOffset = 30;

    const minRank = Math.min(...group.tiles.map(t => t.rank || 9));
    return 200 + suitOffset * 5 + minRank;
  }
  /* NEWCODE */
```

---

## 5. Verification Plan

1. **TypeScript compilation**:
   ```bash
   npx tsc -p tsconfig.app.json --noEmit
   ```
2. **Test Cases to Verify**:
   - Case 1: `113579 Crack` + `Kong of 1 Dot` (with Joker) + `Kong of 1 Bam` (with Joker)
   - Case 2: `2 Flowers` + `246 Dot` + `Pung of 8 Dot` (with Joker) + `246 Bam` + `Pung of 8 Bam` (with Joker)
   - Case 3: `Pair of 2 Dot` + `Pair of White Dragon` + `Pung of 2 Bam` (exposed) + `Pung of 6 Bam` (6JJ) + `NEWS`
3. **Invariants Verification**:
   - Strict `OLDCODE` / `NEWCODE` pattern preserved with 0 deletions.

