# Before & After Plan: Redirect to `/home` on "No game found" Error

## 1. Overview & Root Cause
When a game has already ended and the user reloads `/game/:keyid`, the server's GraphQL mutation `GameStatePublicStart` returns:
```json
{
  "data": null,
  "errors": [
    {
      "message": "Game start failed. No game found.",
      "path": ["GameStatePublicStart"],
      "extensions": { "code": "BAD_REQUEST" }
    }
  ],
  "status": 200,
  "ok": true
}
```

### Why it was not redirecting to `/home`:
1. In GraphQL, errors often return with HTTP `status: 200` (`ok: true`), so the call does **not** throw an exception into the `catch (error)` block.
2. In `GameState.startGame()` (`state.ts`), `if (startResp?.data)` evaluated to `false` because `startResp.data` was `null`. It simply skipped the block and returned `false`, without checking `startResp.errors`.
3. In the `catch` block, it previously checked `this.router.navigate(['/'])` instead of `this.router.navigate(['/home'])`.
4. In `GameComponent.ngOnInit()` (`component.ts`), `startGame()` was awaited without checking if it returned `false`.

---

## 2. Expected Behavior
- When `startGame()` encounters `"Game start failed. No game found."` (or any failure to start the game on reload):
  1. Clear the stale cookie-persisted game key (`this.clearCreatedGame()`).
  2. Redirect the player to `/home` (`this.router.navigate(['/home'])`).

---

## 3. Files to Modify
1. `src/app/module/business/game/state/state.ts`
2. `src/app/module/business/game/component.ts`

---

## 4. Detailed Before & After Code Snippets

### File 1: `src/app/module/business/game/state/state.ts`
**Location**: `startGame()` (around lines 1418–1446)

#### BEFORE:
```typescript
            if (startResp?.data) {
                const data = startResp.data as GameStateOutputDto & { private?: GameStatePersonalOutputDto; development?: unknown };
                this.setGame(data.game as GameStateGameOutputDto);
                this.setPlay(data.play as GameStatePlayOutputDto);
                this.setPersonal((data.personal ?? data.private) as GameStatePersonalOutputDto);
                this.captureDevelopmentPayload(data);
                await this.afterGameStart();
                return startResp;
            }
        } catch (error: any | BfwApiSdkError) {
            this.log.error('ERROR START GAME', error);
            // console.log('ERROR START GAME', error.message);
            // console.log('ERROR RESPONSE', error.response);
            // console.log('ERROR RS DATA', error.response.data.errors[0].message);
            // console.log('ERROR STATUS', error.status);
            if (error.status == 400) {
                if (error.response.data.errors instanceof Array) {
                    const arrError = error.response.data.errors;
                    for (const key in arrError) {
                        if (arrError[key].message.includes('No game found.')) {
                            this.router.navigate(['/']);
                        }
                    }
                }
            }

            return false;
        }
        return false;
```

#### AFTER:
```typescript
            if (startResp?.data) {
                const data = startResp.data as GameStateOutputDto & { private?: GameStatePersonalOutputDto; development?: unknown };
                this.setGame(data.game as GameStateGameOutputDto);
                this.setPlay(data.play as GameStatePlayOutputDto);
                this.setPersonal((data.personal ?? data.private) as GameStatePersonalOutputDto);
                this.captureDevelopmentPayload(data);
                await this.afterGameStart();
                return startResp;
            }

            /* NEWCODE */
            // Handle GraphQL 200 response containing errors (e.g. "Game start failed. No game found.")
            const responseErrors = (startResp as any)?.errors || (startResp?.data as any)?.errors;
            if (Array.isArray(responseErrors) && responseErrors.length > 0) {
                const isNoGameFound = responseErrors.some((err: any) =>
                    err?.message?.includes('No game found.') ||
                    err?.message?.includes('Game start failed')
                );
                if (isNoGameFound) {
                    this.clearCreatedGame();
                    this.router.navigate(['/home']);
                    return false;
                }
            }
            /* NEWCODE */
        /* OLDCODE
        } catch (error: any | BfwApiSdkError) {
            this.log.error('ERROR START GAME', error);
            // console.log('ERROR START GAME', error.message);
            // console.log('ERROR RESPONSE', error.response);
            // console.log('ERROR RS DATA', error.response.data.errors[0].message);
            // console.log('ERROR STATUS', error.status);
            if (error.status == 400) {
                if (error.response.data.errors instanceof Array) {
                    const arrError = error.response.data.errors;
                    for (const key in arrError) {
                        if (arrError[key].message.includes('No game found.')) {
                            this.router.navigate(['/']);
                        }
                    }
                }
            }

            return false;
        }
        OLDCODE */
        /* NEWCODE */
        } catch (error: any | BfwApiSdkError) {
            this.log.error('ERROR START GAME', error);
            const errorList = error?.response?.data?.errors || error?.errors;
            let isNoGameFound = false;

            if (Array.isArray(errorList)) {
                isNoGameFound = errorList.some((err: any) =>
                    err?.message?.includes('No game found.') ||
                    err?.message?.includes('Game start failed')
                );
            } else if (typeof error?.message === 'string') {
                isNoGameFound = error.message.includes('No game found.') || error.message.includes('Game start failed');
            }

            if (isNoGameFound || error?.status === 400) {
                this.clearCreatedGame();
                this.router.navigate(['/home']);
            }

            return false;
        }
        /* NEWCODE */
        return false;
```

---

### File 2: `src/app/module/business/game/component.ts`
**Location**: `ngOnInit()` (around line 85)

#### BEFORE:
```typescript
    if (this.gkeyid()) {
      const gameStartedResp = await this.service.state.startGame();

    } else {
```

#### AFTER:
```typescript
    /* OLDCODE
    if (this.gkeyid()) {
      const gameStartedResp = await this.service.state.startGame();

    } else {
    OLDCODE */
    /* NEWCODE */
    if (this.gkeyid()) {
      const gameStartedResp = await this.service.state.startGame();
      // If game could not be started (e.g. already ended or invalid key), redirect to home
      if (!gameStartedResp) {
        this.router.navigate(['/home']);
        return;
      }
    } else {
    /* NEWCODE */
```

---

## 5. Verification & Testing Strategy
1. **Compilation Check**: Run `npx tsc -p tsconfig.app.json --noEmit` to verify 0 errors.
2. **Behavioral Check**:
   - Reload a finished game URL: verifies that `GameStatePublicStart` returns `errors`, clears stale cookie, and redirects user to `/home`.
   - Normal new game creation and continuation unaffected.

