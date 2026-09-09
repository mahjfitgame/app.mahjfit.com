### As per the current claim logic why we need to schedule for claom resolver when phase is claim


The claim resolver timer is needed only when the claim phase still has unresolved human seats.

Current logic:

1. `openClaimWindow()` sets:

```ts
state.play.phase = CLAIM;
state.play.claim.deadline_at = Date.now() + 10000;
```

2. Bots/disconnected seats receive automatic claim intents.

3. If every eligible seat already has an intent:

```ts
areAllClaimSeatsResolved(state) === true
```

the claim is resolved immediately and no timer is needed.

4. If a connected human has not answered, `phase` remains `CLAIM`. Then `updateStateAfterEveryAction()` schedules:

```ts
scheduleClaimResolve(keyid, ms, ...)
```

The timer guarantees that the game cannot remain stuck forever if the human does not click PASS, PUNG, KONG, or another claim.

When it fires, it:

- Reloads the latest state from Redis.
- Confirms the claim is still active.
- Calls `resolveClaimWindow()`.
- Commits and publishes the next state.

So the timer is not for bot claims. It is a fallback deadline for unanswered human claims.

The timer can be skipped when all eligible seats have already submitted intents, but it should not be removed while human claim responses are allowed.



---






### But for human why we need to schedule, the game is on waiting for human action and other seat we disaply the waiting whenever human not submitted the claim option and we don't need deadline for human claims.

Then still we need to scheduleClaimResolve with time




No. If your rule is:

> Human players can take as long as needed, and the game waits during `CLAIM`

then you do not need `scheduleClaimResolve()` for human claims.

The claim flow should be:

```text
DISCARD
→ phase = CLAIM
→ publish claim state
→ wait indefinitely

Human submits PASS/CLAIM
→ save intent

All eligible seats submitted
→ resolveClaimWindow()
→ phase = PLAYING
→ publish next seat
```

Required changes:

```ts
state.play.claim = {
  tile,
  from_seat: fromSeatId,
  deadline_at: null,
  intents,
};
```

Make the DTO nullable:

```ts
@Field(() => GraphQLTimestamp, { nullable: true })
declare deadline_at: number | null;
```

Then in `updateStateAfterEveryAction()`:

```ts
if (state.play.phase === GamePhaseEnum.CLAIM && state.play.claim) {
  this.geState.clearBotTurn(keyid);
  this.geState.clearTurnAuto(keyid);

  if (state.play.claim.deadline_at == null) {
    this.geState.clearClaimResolve(keyid);
    return state;
  }

  // Schedule only when a deadline exists.
  // scheduleClaimResolve(...)
}
```

`resolveClaimWindow()` must be called when the final eligible human submits PASS or a claim. The timer should remain available only if you later enable timed claims.

Important: if no deadline is used and a human never responds, the game will remain in `CLAIM` forever by design. That is acceptable only if the client clearly displays:

```text
Waiting for other players to respond
```

Also ensure the final claim/PASS action calls `commitStateAndScheduleNext()` after resolving, so the next seat state is saved and published through websocket.


---
### Explain me how scheduleClaimResolve behave, it will wait the delay time? OR not is differrent situation below.

If 1 seat is human and other seats are bot,
Suppose bot turn and and discard tile
1]
No claim window then it will wait for the delay time?

2]
Claim window only for bot seat then it will wait for the delay time?

3]
Claim window only for human seat then it will wait for the delay time?

4]
Claim window for human seat and both seat then it will wait for the delay time?




`scheduleClaimResolve()` uses `setTimeout()`. It waits until the configured deadline, then reloads the latest state and resolves the claim.

Current claim deadline in the code is:

```ts
deadline_at: Date.now() + 3000
```

So the claim timeout is currently approximately 3 seconds. If changed to `10000`, it becomes approximately 10 seconds.

| Situation | Does it wait? | Result |
|---|---:|---|
| 1. No eligible claim seat | No | Claim window resolves immediately and next turn starts. |
| 2. Eligible seats are bots only | No | Bots submit intents automatically. If all intents exist, claim resolves immediately. |
| 3. At least one human seat has not responded | Yes | Timer waits until `deadline_at`, then resolves automatically. |
| 4. Human + bot seats | Yes, only while the human is pending | Bots submit immediately; timer waits for the human. If the human responds before the deadline, resolution happens immediately and the timer is cleared. |

Example:

```text
Bot discards
→ claim window opens
→ bot intents are added immediately
→ human has not responded
→ timer waits 3 seconds
→ resolveClaimWindow()
→ publish next turn
```

If the human responds before the timeout:

```text
Human submits PASS
→ all intents are now present
→ resolveClaimWindow() immediately
→ clearClaimResolve()
→ publish next turn
```

The timer does not block the current request. It schedules a callback for later. The websocket first publishes the `CLAIM` state, then the resolver publishes the next state when either all responses arrive or the deadline expires.