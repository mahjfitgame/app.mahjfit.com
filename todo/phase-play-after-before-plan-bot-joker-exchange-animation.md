# Phase Play: Bot Joker Exchange Tile-Flip Animation & Sound

## 1. Problem & Context
When a bot performs a Joker exchange:
1. The natural tile destination position was incorrectly set to `pickTargetPointForSeat(to_seat)` (the opponent's rack/avatar) instead of the actual Joker tile position in the exposure area (`oldJokerPos`).
2. In the opponent exposure list, the Joker image was made visible again after the animation instead of being replaced by the natural tile.
3. The frontend was relying on the legacy `play.last_joker_exchange` instead of the authoritative sequence contract (`play.joker_exchanges` and `play.joker_exchange_seq`).
4. Toast notification `"<Seat Name> swapped a Joker"` and the tile-flip animation effect in the exposure area were missing.

---

## 2. Before & After Code Snippets

### File 1: `src/app/module/business/game/state/state.ts`

#### Change A: Add computed signals for `play_joker_exchanges` and `play_joker_exchange_seq`

**Before:**
```typescript
    // ████ play_last_joker_exchange SIGNAL ██████████████████████████████████████
    public readonly play_last_joker_exchange = computed<any | undefined>(() => {
        return (this.play() as any)?.last_joker_exchange;
    });
```

**After:**
```typescript
    // ████ play_last_joker_exchange SIGNAL ██████████████████████████████████████
    public readonly play_last_joker_exchange = computed<any | undefined>(() => {
        return (this.play() as any)?.last_joker_exchange;
    });

    /* NEWCODE */
    // ████ play_joker_exchanges SIGNAL ███████████████████████████████████████████
    public readonly play_joker_exchanges = computed<any[] | undefined>(() => {
        return (this.play() as any)?.joker_exchanges;
    });

    // ████ play_joker_exchange_seq SIGNAL ████████████████████████████████████████
    public readonly play_joker_exchange_seq = computed<number | undefined>(() => {
        return (this.play() as any)?.joker_exchange_seq;
    });
    /* NEWCODE */
```

---

#### Change B: Add GraphQL Selection Fields in `commonSelectionFields.play`

**Before:**
```typescript
                winner_seat_ids: true,
                /* NEWCODE */
                winning_hands: {
                    seat_id: true,
                    rack_id: true,
                    rule_id: true,
                    label: true,
                    value_kind: true,
                    value_mult: true,
                    groups: {
                        index: true,
                        kind: true,
                        set_type: true,
                        title: true,
                        exposed: true,
                        tile_ids: true
                    }
                },
                /* NEWCODE */
                wall_count: true,
```

**After:**
```typescript
                winner_seat_ids: true,
                /* NEWCODE */
                winning_hands: {
                    seat_id: true,
                    rack_id: true,
                    rule_id: true,
                    label: true,
                    value_kind: true,
                    value_mult: true,
                    groups: {
                        index: true,
                        kind: true,
                        set_type: true,
                        title: true,
                        exposed: true,
                        tile_ids: true
                    }
                },
                joker_exchange_seq: true,
                joker_exchanges: {
                    seq: true,
                    from_gseat_id: true,
                    from_rack_id: true,
                    to_gseat_id: true,
                    to_rack_id: true,
                    exposure_index: true,
                    from_tile_id: true,
                    tile_code: true,
                    joker_tile_id: true
                },
                /* NEWCODE */
                wall_count: true,
```

---

### File 2: `src/app/module/business/game/phaser/component.ts`

#### Change A: Add `lastSeenJokerSeq` property

**Before:**
```typescript
  private lastProcessedExchange: any = null;
```

**After:**
```typescript
  /* OLDCODE
  private lastProcessedExchange: any = null;
  OLDCODE */
  /* NEWCODE */
  private lastProcessedExchange: any = null;
  private lastSeenJokerSeq: number = -1;
  /* NEWCODE */
```

---

#### Change B: Replace `play_last_joker_exchange` effect with authoritative `joker_exchanges` processing

**Before:**
```typescript
    effect(() => {
      const exchange = this.gameState.play_last_joker_exchange();
      if (!this.phaser || !this.sceneReady() || !exchange) return;

      if (JSON.stringify(this.lastProcessedExchange) !== JSON.stringify(exchange)) {
        this.lastProcessedExchange = exchange;
        const payload = {
          ...exchange,
          from_seat: this.gameState.seat_position_by_gseat_id()(exchange.from_gseat_id),
          to_seat: this.gameState.seat_position_by_gseat_id()(exchange.to_gseat_id)
        };
        this.phaser.events.emit("joker:exchange", payload);
      }
    });
```

**After:**
```typescript
    /* OLDCODE
    effect(() => {
      const exchange = this.gameState.play_last_joker_exchange();
      if (!this.phaser || !this.sceneReady() || !exchange) return;

      if (JSON.stringify(this.lastProcessedExchange) !== JSON.stringify(exchange)) {
        this.lastProcessedExchange = exchange;
        const payload = {
          ...exchange,
          from_seat: this.gameState.seat_position_by_gseat_id()(exchange.from_gseat_id),
          to_seat: this.gameState.seat_position_by_gseat_id()(exchange.to_gseat_id)
        };
        this.phaser.events.emit("joker:exchange", payload);
      }
    });
    OLDCODE */
    /* NEWCODE */
    // Process authoritative joker exchanges via play.joker_exchanges and seq pointer
    effect(() => {
      if (!this.phaser || !this.sceneReady()) return;

      const playData = this.gameState.play();
      if (!playData) return;

      const currentSeq = playData.joker_exchange_seq ?? 0;

      // Initial load or reconnect: sync pointer without playing animations
      if (this.lastSeenJokerSeq === -1) {
        this.lastSeenJokerSeq = currentSeq;
        return;
      }

      const exchanges: any[] = playData.joker_exchanges || [];
      if (!Array.isArray(exchanges) || exchanges.length === 0) return;

      // Process only new entries where entry.seq > lastSeenJokerSeq in ascending seq order
      const newEntries = exchanges
        .filter((e) => e && typeof e.seq === 'number' && e.seq > this.lastSeenJokerSeq)
        .sort((a, b) => a.seq - b.seq);

      for (const entry of newEntries) {
        const fromSeat = this.gameState.seat_position_by_gseat_id()(entry.from_gseat_id);
        const toSeat = this.gameState.seat_position_by_gseat_id()(entry.to_gseat_id);

        const payload = {
          ...entry,
          from_seat: fromSeat,
          to_seat: toSeat
        };

        // Emit exchange event to Phaser scene
        this.phaser.events.emit("joker:exchange", payload);

        // Display toast notification: "<seat name> swapped a Joker"
        const seatName = fromSeat === 'bottom' ? 'You' : this.getPlayerName(fromSeat);
        this.notify.info(`${seatName} swapped a Joker`);

        // Advance sequence pointer
        this.lastSeenJokerSeq = entry.seq;
      }
    });
    /* NEWCODE */
```

---

### File 3: `src/app/module/business/game/phaser/scenes/scene.ts`

#### Change A: Fix `destNaturalPos` in `handleJokerExchange`

**Before:**
```typescript
    // Determine destination position for Natural tile (entering to_seat exposure)
    let destNaturalPos = { ...oldJokerPos };
    if (to_seat === "bottom") {
      destNaturalPos = { ...oldJokerPos, scale: oldJokerPos.scale };
    } else {
      const targetPoint = this.pickTargetPointForSeat(to_seat as TableSeat);
      destNaturalPos = { x: targetPoint.x, y: targetPoint.y, scale: 0.5 };
    }
```

**After:**
```typescript
    /* OLDCODE
    // Determine destination position for Natural tile (entering to_seat exposure)
    let destNaturalPos = { ...oldJokerPos };
    if (to_seat === "bottom") {
      destNaturalPos = { ...oldJokerPos, scale: oldJokerPos.scale };
    } else {
      const targetPoint = this.pickTargetPointForSeat(to_seat as TableSeat);
      destNaturalPos = { x: targetPoint.x, y: targetPoint.y, scale: 0.5 };
    }
    OLDCODE */
    /* NEWCODE */
    // Natural tile must land exactly where the Joker was in the exposure area
    const destNaturalPos = { ...oldJokerPos, scale: oldJokerPos.scale };
    /* NEWCODE */
```

---

#### Change B: Update opponent exposure tile texture when swap animation finishes

**Before:**
```typescript
          if (to_seat && to_seat !== "bottom") {
            const opponentImages = this.calledOpponentExposureTiles[to_seat as Exclude<TableSeat, "bottom">];
            if (opponentImages) {
              const jokerImg = opponentImages.find((img: Phaser.GameObjects.Image) => img.getData("joker-tile-id") === joker_tile_id);
              if (jokerImg && jokerImg.active) jokerImg.setAlpha(1);
            }
          }
```

**After:**
```typescript
          /* OLDCODE
          if (to_seat && to_seat !== "bottom") {
            const opponentImages = this.calledOpponentExposureTiles[to_seat as Exclude<TableSeat, "bottom">];
            if (opponentImages) {
              const jokerImg = opponentImages.find((img: Phaser.GameObjects.Image) => img.getData("joker-tile-id") === joker_tile_id);
              if (jokerImg && jokerImg.active) jokerImg.setAlpha(1);
            }
          }
          OLDCODE */
          /* NEWCODE */
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
          /* NEWCODE */
```

---

### File 4: `src/app/module/business/game/phaser/animation.ts`

#### Change: Add tile-flip visual effect in `animateJokerExchange`

**Before:**
```typescript
    // Tween Natural Clone to destNaturalPos
    this.scene.tweens.add({
      targets: naturalClone,
      x: Math.round(destNaturalPos.x),
      y: Math.round(destNaturalPos.y),
      scaleX: destNaturalPos.scale,
      scaleY: destNaturalPos.scale,
      duration: duration,
      ease: "Cubic.easeInOut",
      onComplete: checkDone
    });
```

**After:**
```typescript
    /* OLDCODE
    // Tween Natural Clone to destNaturalPos
    this.scene.tweens.add({
      targets: naturalClone,
      x: Math.round(destNaturalPos.x),
      y: Math.round(destNaturalPos.y),
      scaleX: destNaturalPos.scale,
      scaleY: destNaturalPos.scale,
      duration: duration,
      ease: "Cubic.easeInOut",
      onComplete: checkDone
    });
    OLDCODE */
    /* NEWCODE */
    // Move Natural tile to exposure and flip into slot
    this.scene.tweens.add({
      targets: naturalClone,
      x: Math.round(destNaturalPos.x),
      y: Math.round(destNaturalPos.y),
      duration: duration,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        // Tile-flip effect in exposure area: flip along horizontal axis (scaleX)
        this.scene.tweens.add({
          targets: naturalClone,
          scaleX: 0,
          duration: 90,
          ease: "Sine.easeIn",
          yoyo: true,
          onYoyo: () => {
            // Halfway through flip: snap to target scale
            naturalClone.setScale(destNaturalPos.scale);
          },
          onComplete: checkDone
        });
      }
    });
    /* NEWCODE */
```

---

## 3. Verification & Safety
1. **TypeScript compilation**: Verify `npx tsc -p tsconfig.app.json --noEmit` produces 0 errors.
2. **Invariant enforcement**: All replaced code wrapped in `/* OLDCODE ... OLDCODE */`, all new code tagged with `/* NEWCODE */`.
3. **Sound**: Sound effect `joker_exchange.mp3` plays seamlessly via existing `this.soundManager.playJokerExchange()`.
4. **Toast**: Displays `<Seat Name> swapped a Joker` notification via `this.notify.info(...)`.

