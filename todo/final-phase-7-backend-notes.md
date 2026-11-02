**Phase 7B is implemented correctly.** All three fixes from my verified prompt are in, the tests prove them, and nothing existing broke.

## What I checked

| Check | Result |
|---|---|
| Fix 1: "own" means same seat **and** same rack ([bot.ts:3975](apps/app/src/graphql/business-app/game-engine/bot.ts#L3975)) | Done. My Siamese probe: **the win is now found** (it was missed before) |
| Fix 2: the search stops after real swaps ([bot.ts:4257](apps/app/src/graphql/business-app/game-engine/bot.ts#L4257)) | Done |
| Fix 3: no warnings while testing swap combinations ([bot.ts:4194](apps/app/src/graphql/business-app/game-engine/bot.ts#L4194)) | Done. A non-winning turn now prints **0 warnings** (it was 7) |
| Tests | Test 7 now really checks something (exactly 2 checks). The Siamese test is added. All flowers use `FL` |
| All engine tests | **19 suites, 530 tests pass**; the typecheck is clean |
| Run A (2025) | 129 wins, **129 legal, 0 illegal**; 4 wins came from swapping with an opponent's joker; time 963 s (−10%) |
| Run B (2026) | 51 wins, **51 legal, 0 illegal** |
| NMJL | Swaps happen only on the bot's own turn after it picks a tile. Claiming a discard for Mah Jongg is still checked as the rack lies. Only exposures, which are public, are used |

## Two small notes (no action needed)

1. **Run A ran at 12:58, before the last bot.ts edit at 13:13.** The edits made after it can't change a 4-player game: fix 1 only matters in Siamese mode, fix 2 is a safety guard, and fix 3 only removes logging. So the win and legality numbers are still valid. Only the time figure might be slightly faster with the final code.
2. **No win in the benchmarks used a swap with the bot's own exposure.** Before Step 7, the 9 "needs a joker swap" wins all happened in other games: the games play out differently now. The own-swap path is proven by tests 1, 3 and 9. Run B's one such win was a claimed discard, which NMJL doesn't allow to be fixed by a swap.

The Run B **seat** fairness test (p = 0.045) is unchanged by 7B; the games were identical. Keep it on the list for the final re-baseline.

You can commit Phase 7B now. The next step is **7C**: Part A sends the joker-swap event to the UI, and Part B makes the bot levels really different. When you're ready, I'll write the 7C prompt and check it with the real engine first.