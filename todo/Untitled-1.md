
# Walkthrough: Card-Targeted Bot Engine Upgrade (RealMahjongg.com Style AI)

We have completed the upgrade of the Bot Engine in `bot.ts` and `rule.ts` to a **Card-Targeted Decision System**. The bot now evaluates all decisions against official National Mah Jongg League (NMJL) card hands, ensuring human-like strategic claims and discards.

---

## Key Changes Made

### 1. Card Hand Distance Evaluator ([`rule.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/rule.ts#L1779-L1789))
- **`computeRackDistanceToCard(rack, state)`:**
  - Added public helper in `rule.ts` that converts a rack's combined hand + exposures to physical tile keys and calculates the minimum missing tile count needed across all rule card hands using `computeMinimumDistanceToMahjong`.

### 2. Card-Driven Claim Decision ([`bot.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/bot.ts#L335-L388))
- **`botChooseClaimIntent`:**
  - Enforced max 3 exposures rule: a bot will **never** claim a 4th meld without Mahjong.
  - Measures `currentDist` vs `claimedDist`.
  - A bot **only claims** a discard (Pung/Kong/Quint) if making the claim **improves its distance to an NMJL card hand** (`claimedDist <= currentDist`). Otherwise, the bot returns `PASS`.

### 3. Card-Driven Discard Scoring ([`bot.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/bot.ts#L1194-L1223))
- **`scoreBotDiscardCandidate`:**
  - Evaluates card hand distance when candidate tiles are removed.
  - If removing a candidate tile increases distance to Mahjong -> tile is required for target card line -> **Keep Bonus** applied (score penalty if discarded).
  - If removing a candidate tile does not alter distance -> tile is unneeded for target card line -> **Discard Bonus** applied.

---

### 4. Flower Tile Code Support (`FL`) ([`rule.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/rule.ts#L843))
- Updated `tileCodeToTileKey` to map `FL` (as well as `FL1`..`FL8` and legacy `F1`..`F8`) to generic Flower key `'F'`.
- Updated `isFlower` helper in `rule.ts` to recognize `FL` as a flower tile.

### 5. Wall & Discard Seat Guards and Chronological Discard Tracking ([`rule.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/rule.ts#L4331), [`service.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/service.ts#L2797))
- **`applyOrderTilesAction` (`rule.ts`):** Added check for `WL` (Wall) and `DA` (Discard) seats to return current state cleanly without throwing an error when ordering requested on system seats.
- **Chronological Discard Sequence (`service.ts` & `rule.ts`):** Appended tile IDs sequentially to `discardRack.hand_order` when tiles are discarded and cleaned up `hand_order` on claim. This preserves exact chronological discard order on frontend reload (`epPublicStart`).

### 6. Frontend Joker Exchange Animation Signal & Hand Order Sync ([`dto.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/dto.ts#L257), [`bot.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/bot.ts#L2415), [`rule.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/rule.ts#L4193))
- **`GameJokerExchangeActionGSOutputDto` (`dto.ts`):** Added `last_joker_exchange` field to `GameStatePlayOutputDto` containing `from_gseat_id`, `to_gseat_id`, `from_tile_id`, and `joker_tile_id`. This provides exact tile IDs and seat IDs to trigger the frontend swap animation.
- **Bot Hand Order Sync (`bot.ts`):** Populated `last_joker_exchange` in `applyBotJokerExchangeOption` and synchronized `botRack.hand_order` when a natural tile is swapped for a Joker.
- **Human Exchange Signal (`rule.ts`):** Populated `last_joker_exchange` in `applyExchangeJokerAction`.

### 7. Joker Exchange Target Exposure Tile Deletion Fix ([`rule.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/rule.ts#L4176), [`rule.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/rule.ts#L4270))
- **Exposure Joker Deletion (`rule.ts`):** Fixed `applyExchangeJokerAction` to explicitly delete the old Joker tile key (`delete exposures_meld[...].tiles[jokerKey]`) from the target exposure meld before adding the natural tile. Prevents 3-tile Pungs (`[West, West, Joker]`) from turning into 4-tile Kongs (`[West, West, Joker, West]`).
- **Loop Fix (`rule.ts`):** Added `index++` in `swapJokerInExposure`'s while loop to prevent infinite loop risk when scanning multiple exposures.

### 8. Fix `exposures_meld.tiles` Sparse Array Expansion Bug ([`rule.ts`](file:///Users/admin/Documents/server/mahjfit.com/api.mahjfit.com/apps/app/src/graphql/business-app/game-engine/rule.ts#L4174))
- **In-Place Array Replacement (`rule.ts`):** Fixed `applyExchangeJokerAction` to perform in-place array index replacement (`targetMeld.tiles[jokerIdx] = reqTile`) within `exposures_meld[...].tiles`. This eliminates sparse array allocation (`Array(135)` with 132 `null` elements) caused by indexing an array with physical database tile IDs.

---

## Verification Results

### Automated Tests
- Ran `npm run typecheck` (`tsc -p tsconfig.build.json --noEmit`):
  - **Result:** Exit code 0 (0 compilation or type errors).


=============================================================================

### How Frontend Identifies Joker Exchange for Swap Animation

To allow the frontend to detect a Joker Exchange (by either a bot or a human) and trigger the swap animation, we will provide a dedicated **`last_joker_exchange`** field in the published `play` state (`GameStatePlayOutputDto`).

### Payload Signal Structure
When a bot or player exchanges a Joker, `state.play.last_joker_exchange` will contain:

```json
{
  "last_joker_exchange": {
    "from_gseat_id": 3339,     // Seat performing the exchange (e.g. Bot Seat)
    "to_gseat_id": 3335,       // Target seat whose exposed meld was swapped
    "from_tile_id": 105,       // Natural tile ID placed into exposure (e.g. B5)
    "joker_tile_id": 142       // Joker tile ID taken into hand (e.g. J)
  }
}
```

### How the Frontend Uses This Data for Animation:
1. **Subscription Listener:** On receiving WebSocket / GraphQL subscription updates (`WS_GAME_PUBLISH_PLAY`), check if `play.last_joker_exchange` is present.
2. **Tile Swap Animation:**
   - Slide `from_tile_id` (natural tile `105`) **from** `from_gseat_id`'s rack **into** `to_gseat_id`'s exposure meld.
   - Slide `joker_tile_id` (Joker `142`) **from** `to_gseat_id`'s exposure meld **into** `from_gseat_id`'s rack hand.

---

I have prepared the [Implementation Plan](file:///Users/admin/.gemini/antigravity-ide/brain/4a5e9c8b-6be4-431e-902d-744193cde092/implementation_plan.md) covering:
1. `GameJokerExchangeActionGSOutputDto` addition to `dto.ts`.
2. Populating `last_joker_exchange` in `bot.ts` and `rule.ts`.
3. Maintaining `hand_order` array synchronization.

Please review the plan and let me know if you would like me to proceed with implementing these backend changes!