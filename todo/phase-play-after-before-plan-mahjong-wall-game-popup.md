# Before & After Plan: Mahjong Win & Wall Game Discard-Area Popup Redesign

## 1. Overview & Objectives

### Goals
1. **Discard Area Sizing**: Both the Mahjong Win popup and the Wall Game popup will cover **only the discard area** (matching Phaser's `discardArea` `{ x, y, width, height }`), keeping player racks and exposures visible around the board.
2. **Winning Hand with Tile Atlas Artwork**:
   - Render winning hand tiles using the authentic **Phaser texture atlas images** (`tiles_1x` / `tiles_2x` frames extracted via data URLs).
   - Display tiles with clear grouping (melds/combinations) in their proper order.
3. **Celebration Effects & Text**:
   - Retain confetti celebration effect.
   - Retain winner announcement ("MAH JONGG!", "YOU WIN!" / "[PLAYER] WINS!", score, and bonus breakdown).
4. **Eye Icon Show / Hide Toggle**:
   - An eye icon button (👁️) in the header of the popup to toggle visibility.
   - When clicked to hide, the modal becomes invisible and a small floating eye button appears in the corner of the discard area so clicking it restores the popup.
5. **Wall Game Hand Reveal**:
   - When a Wall Game (draw) occurs, the popup covers the discard area.
   - All seats' hands (Top, Left, Right, Bottom) are displayed to their respective exposures so everyone can inspect all 4 hands.
6. **Functional Action Buttons**:
   - **Play Again**: Navigates to `/game` route.
   - **Exit**: Navigates to `/home` route.
   - Compliant with Mahjfit Design System: font `Outfit`, weight 600 SemiBold, radius 8px, primary button Fuchsia `#B92A90`.
7. **Responsive Design**:
   - Seamlessly responsive on Desktop, Tablet, and Mobile devices by tracking the dynamic `discardArea` bounds from Phaser.

---

## 2. Files to Modify
1. `src/app/module/business/game/phaser/scenes/type.ts` (add `onDiscardAreaOverlay` callback)
2. `src/app/module/business/game/phaser/scenes/scene.ts` (emit `discardArea` bounds, expose tile data URL resolver, handle wall game reveal)
3. `src/app/module/business/game/phaser/component.ts` (track `discardAreaRect`, eye toggle state, tile atlas URL generation, routes)
4. `src/app/module/business/game/phaser/template.html` (comment out old full-screen popups, add new discard-area scoped popups)
5. `src/app/module/business/game/phaser/style.scss` (styles for discard-area popup, tile images, buttons, and eye icon)

---

## 3. Detailed Before & After Code Snippets

---

### File 1: `src/app/module/business/game/phaser/scenes/type.ts`
**Location**: `PhaserSceneCallbacks` interface (around line 150)

#### BEFORE:
```typescript
  readonly onInstructionPanelOverlay: (state: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly visible: boolean;
  }) => void;
```

#### AFTER:
```typescript
  /* OLDCODE
  readonly onInstructionPanelOverlay: (state: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly visible: boolean;
  }) => void;
  OLDCODE */
  /* NEWCODE */
  readonly onInstructionPanelOverlay: (state: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly visible: boolean;
  }) => void;
  readonly onDiscardAreaOverlay?: (rect: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }) => void;
  /* NEWCODE */
```

---

### File 2: `src/app/module/business/game/phaser/scenes/scene.ts`

#### Change 2.1: Emit `discardArea` on resize and initial setup
**Location**: `drawTable()` or `resize()` (around line 3045)

#### BEFORE:
```typescript
    const discardArea = this.layout.discardArea;
    this.discardMaskGraphics.clear();
    this.discardMaskGraphics.fillStyle(0xffffff);
    this.discardMaskGraphics.fillRect(discardArea.x, discardArea.y, discardArea.width, Math.max(0, discardArea.height));
    this.drawDiscardDebugArea();
```

#### AFTER:
```typescript
    /* OLDCODE
    const discardArea = this.layout.discardArea;
    this.discardMaskGraphics.clear();
    this.discardMaskGraphics.fillStyle(0xffffff);
    this.discardMaskGraphics.fillRect(discardArea.x, discardArea.y, discardArea.width, Math.max(0, discardArea.height));
    this.drawDiscardDebugArea();
    OLDCODE */
    /* NEWCODE */
    const discardArea = this.layout.discardArea;
    this.discardMaskGraphics.clear();
    this.discardMaskGraphics.fillStyle(0xffffff);
    this.discardMaskGraphics.fillRect(discardArea.x, discardArea.y, discardArea.width, Math.max(0, discardArea.height));
    this.drawDiscardDebugArea();
    // Notify Angular of the exact discard area bounds for overlays/popups
    this.callbacks.onDiscardAreaOverlay?.({
      x: Math.round(discardArea.x),
      y: Math.round(discardArea.y),
      width: Math.round(discardArea.width),
      height: Math.round(discardArea.height),
    });
    /* NEWCODE */
```

#### Change 2.2: Expose Tile Texture Data URL Resolver
**Location**: around line 3835

#### BEFORE:
```typescript
  private getFrameDataUrl(atlasKey: string, frameKey: string): string | undefined {
```

#### AFTER:
```typescript
  /* OLDCODE
  private getFrameDataUrl(atlasKey: string, frameKey: string): string | undefined {
  OLDCODE */
  /* NEWCODE */
  public getTileDataUrl(tileIdOrDef: any): string | undefined {
    try {
      const texture = this.resolveTileTexture(tileIdOrDef);
      if (!texture) return undefined;
      const cacheKey = `${texture.atlasKey}:${texture.frameKey}`;
      let dataUrl = this.tileDataUrlCache.get(cacheKey);
      if (!dataUrl) {
        dataUrl = this.getFrameDataUrl(texture.atlasKey, texture.frameKey);
        if (dataUrl) this.tileDataUrlCache.set(cacheKey, dataUrl);
      }
      return dataUrl;
    } catch {
      return undefined;
    }
  }

  private getFrameDataUrl(atlasKey: string, frameKey: string): string | undefined {
  /* NEWCODE */
```

#### Change 2.3: Reveal All Seats' Hands on Wall Game
**Location**: `revealAllSeatsHandsForWallGame()`

#### NEW CODE ADDITION:
```typescript
  /* NEWCODE */
  public revealAllSeatsHandsForWallGame(seatsData?: Record<string, any>): void {
    if (!this.layout) return;
    this.expireTileCallWindow();
    this.closeJokerSwapWindow();

    // Reveal hands into exposure areas for top, left, right seats
    const seatPositions: Array<"top" | "left" | "right"> = ["top", "left", "right"];
    for (const seat of seatPositions) {
      let tileIds: number[] = [];
      if (seatsData && seatsData[seat]) {
        const rack = seatsData[seat]?.racks?.[1] || seatsData[seat]?.racks?.first;
        if (rack?.hand_order) tileIds = rack.hand_order;
        else if (rack?.hand) tileIds = Object.keys(rack.hand).map(Number);
      }

      if (tileIds.length === 0) continue;

      const tileSize = this.calledOpponentExposureTileSize(seat);
      const gap = Math.max(2, Math.round(tileSize.width * 0.05));
      const startPos = this.calledOpponentExposureTilePosition(seat, this.calledOpponentExposureTiles[seat].length);

      let activeIndex = 0;
      for (const tileId of tileIds) {
        const fullTile = this.allTiles[tileId] || {
          category: 'SUITED',
          type: (tileId % 3 === 0 ? 'BAM' : tileId % 3 === 1 ? 'CHAR' : 'DOT'),
          rank: (tileId % 9) + 1
        };
        const texture = this.gameService.resolve(fullTile as any, Math.round(tileSize.width));
        if (texture) {
          const xPos = startPos.x + (seat === "top" ? activeIndex * (tileSize.width + gap) : 0);
          const yPos = startPos.y + ((seat === "left" || seat === "right") ? activeIndex * (tileSize.width + gap) : 0);
          const image = this.add.image(xPos, yPos, texture.atlasKey, texture.frameKey).setDepth(42);
          image.setDisplaySize(tileSize.width, tileSize.height);
          this.calledOpponentExposureTiles[seat].push(image);
          activeIndex++;
        }
      }
    }
  }
  /* NEWCODE */
```

---

### File 3: `src/app/module/business/game/phaser/component.ts`

#### Change 3.1: Add Signals for Discard Area Rect & Eye Toggle State
**Location**: around line 210

#### BEFORE:
```typescript
  readonly mahjongGameOver = signal<boolean>(false);
  readonly mahjongWinResult = signal<MahjongWinCelebration | null>(null);
  /* NEWCODE */
  readonly winningOverlayData = signal<WinningOverlayData | null>(null);
  /* NEWCODE */
```

#### AFTER:
```typescript
  readonly mahjongGameOver = signal<boolean>(false);
  readonly mahjongWinResult = signal<MahjongWinCelebration | null>(null);
  /* NEWCODE */
  readonly winningOverlayData = signal<WinningOverlayData | null>(null);
  // Discard area bounds for anchoring the result popup
  readonly discardAreaRect = signal<{ x: number; y: number; width: number; height: number } | null>(null);
  // Toggle visibility of the result popup via the Eye icon
  readonly isResultPopupHidden = signal<boolean>(false);
  /* NEWCODE */
```

#### Change 3.2: Hook up `onDiscardAreaOverlay` callback
**Location**: `initPhaser()` around line 925

#### BEFORE:
```typescript
          onInstructionPanelOverlay: (state) => this.setInstructionPanelOverlay(state),
```

#### AFTER:
```typescript
          /* OLDCODE
          onInstructionPanelOverlay: (state) => this.setInstructionPanelOverlay(state),
          OLDCODE */
          /* NEWCODE */
          onInstructionPanelOverlay: (state) => this.setInstructionPanelOverlay(state),
          onDiscardAreaOverlay: (rect) => this.discardAreaRect.set(rect),
          /* NEWCODE */
```

#### Change 3.3: Map Winning Tile with Texture Atlas Image URL
**Location**: `mapRawTileToWinningTile()` around line 1930

#### BEFORE:
```typescript
  private mapRawTileToWinningTile(rawTile: any, tileId: number): WinningTileData {
    return {
      id: tileId,
      category: rawTile.category || 'SUITED',
      type: rawTile.type || 'BAM',
      rank: rawTile.rank ?? 1,
      label: rawTile.name || `${rawTile.rank || ''} ${rawTile.type || ''}`,
      assetName: rawTile.code || 'b1'
    };
  }
```

#### AFTER:
```typescript
  /* OLDCODE
  private mapRawTileToWinningTile(rawTile: any, tileId: number): WinningTileData {
    return {
      id: tileId,
      category: rawTile.category || 'SUITED',
      type: rawTile.type || 'BAM',
      rank: rawTile.rank ?? 1,
      label: rawTile.name || `${rawTile.rank || ''} ${rawTile.type || ''}`,
      assetName: rawTile.code || 'b1'
    };
  }
  OLDCODE */
  /* NEWCODE */
  private mapRawTileToWinningTile(rawTile: any, tileId: number): WinningTileData {
    // Resolve the authentic atlas frame data URL from Phaser
    let imageUrl: string | undefined;
    const scene = this.phaser?.scene?.getScene("PhaserScene") as any;
    if (scene?.getTileDataUrl) {
      imageUrl = scene.getTileDataUrl(rawTile);
    }

    return {
      id: tileId,
      category: rawTile.category || 'SUITED',
      type: rawTile.type || 'BAM',
      rank: rawTile.rank ?? 1,
      label: rawTile.name || `${rawTile.rank || ''} ${rawTile.type || ''}`,
      assetName: rawTile.code || 'b1',
      imageUrl
    };
  }
  /* NEWCODE */
```

#### Change 3.4: Action Buttons Redirection
**Location**: around lines 2095-2100

#### BEFORE:
```typescript
  public onExitGame(): void {
    void this.router.navigate(["/"]);
  }

  public onStartNewGame(): void {
    window.location.href = "/game";
  }
```

#### AFTER:
```typescript
  /* OLDCODE
  public onExitGame(): void {
    void this.router.navigate(["/"]);
  }

  public onStartNewGame(): void {
    window.location.href = "/game";
  }
  OLDCODE */
  /* NEWCODE */
  public onExitGame(): void {
    // Redirect to home route
    void this.router.navigate(["/home"]);
  }

  public onStartNewGame(): void {
    // Restart with game route
    void this.router.navigate(["/game"]);
  }
  /* NEWCODE */
```

---

### File 4: `src/app/module/business/game/phaser/template.html`

#### Change 4.1: Comment Out Old Full-Screen Popups and Add Discard-Area Scoped Popups
**Location**: Lines 316 to 435

#### BEFORE:
```html
@if (mahjongWinResult(); as result) {
<div class="mahjong-win-overlay" aria-hidden="false">
  ... [full-screen overlay content] ...
</div>
}

@if (wallGameOver()) {
<div class="wall-game-popup" aria-hidden="false">
  ... [full-screen wall game content] ...
</div>
}
```

#### AFTER:
```html
<!-- OLDCODE
@if (mahjongWinResult(); as result) {
<div class="mahjong-win-overlay" aria-hidden="false">
  ... [old full screen overlay] ...
</div>
}
@if (wallGameOver()) {
<div class="wall-game-popup" aria-hidden="false">
  ... [old full screen wall game] ...
</div>
}
OLDCODE -->

<!-- NEWCODE -->
<!-- MAH JONGG WIN POPUP (Discard Area Scoped) -->
@if (mahjongWinResult(); as result) {
  @if (discardAreaRect(); as discardArea) {
    <!-- Floating Eye Restore Button (when hidden) -->
    @if (isResultPopupHidden()) {
      <button
        type="button"
        class="result-popup-toggle-eye"
        [style.left.px]="discardArea.x + discardArea.width - 44"
        [style.top.px]="discardArea.y + 8"
        (click)="isResultPopupHidden.set(false)"
        title="Show Summary">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
    } @else {
      <!-- Main Discard Area Card -->
      <div
        class="discard-area-result-card"
        [style.left.px]="discardArea.x"
        [style.top.px]="discardArea.y"
        [style.width.px]="discardArea.width"
        [style.height.px]="discardArea.height">

        <!-- Confetti within discard area -->
        @for (confetti of mahjongConfetti(); track $index) {
        <div class="mahjong-win-popup__confetti" [style.left]="confetti.left" [style.top]="confetti.top"
          [style.width]="confetti.width" [style.height]="confetti.height" [style.background]="confetti.background"
          [style.--fall-duration]="confetti.fallDuration" [style.--fall-delay]="confetti.fallDelay"
          [style.--start-rotate]="confetti.startRotate" [style.--end-rotate]="confetti.endRotate"
          [style.--fall-distance]="confetti.fallDistance"></div>
        }

        <!-- Eye toggle button in header to hide -->
        <button
          type="button"
          class="result-card-eye-btn"
          (click)="isResultPopupHidden.set(true)"
          title="Hide Summary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </button>

        <header class="result-card-header">
          <h2 class="result-card-title">MAH JONGG!</h2>
          @if (winningOverlayData(); as winData) {
            <div class="result-card-score">
              Score: {{ winData.baseScore }} &nbsp;&bull;&nbsp; Bonus: +{{ winData.bonus }}
            </div>
            <div class="result-card-announcement">
              {{ winData.winnerName === 'YOU' ? 'YOU WIN!' : winData.winnerName }} earned {{ winData.totalPoints }} points
            </div>
          } @else {
            <div class="result-card-announcement">
              {{ result.winner === 'bottom' ? 'YOU WIN!' : (result.winner.toUpperCase() + ' WINS!') }}
            </div>
          }
        </header>

        <!-- Winning Hand Groups with Atlas Tile Artwork -->
        @if (winningOverlayData(); as winData) {
          <section class="result-card-hand-section">
            <div class="result-card-melds-container">
              @for (group of winData.winningHandGroups; track $index) {
                <div class="result-card-meld-group">
                  @if (group.combinationName) {
                    <span class="result-card-meld-tag">{{ group.combinationName }}</span>
                  }
                  <div class="result-card-meld-tiles">
                    @for (tile of group.tiles; track tile.id || $index) {
                      <div class="atlas-tile-wrapper">
                        @if (tile.imageUrl) {
                          <img [src]="tile.imageUrl" class="atlas-tile-img" [alt]="tile.label" draggable="false" />
                        } @else {
                          <div class="atlas-tile-fallback">{{ tile.label }}</div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </section>
        }

        <!-- Action Controls -->
        <footer class="result-card-actions">
          <button type="button" class="result-btn-primary" (pointerup)="$event.stopPropagation(); onStartNewGame()">
            PLAY AGAIN
          </button>
          <button type="button" class="result-btn-secondary" (pointerup)="$event.stopPropagation(); onExitGame()">
            EXIT
          </button>
        </footer>
      </div>
    }
  }
}

<!-- WALL GAME POPUP (Discard Area Scoped) -->
@if (wallGameOver()) {
  @if (discardAreaRect(); as discardArea) {
    @if (isResultPopupHidden()) {
      <button
        type="button"
        class="result-popup-toggle-eye"
        [style.left.px]="discardArea.x + discardArea.width - 44"
        [style.top.px]="discardArea.y + 8"
        (click)="isResultPopupHidden.set(false)"
        title="Show Summary">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
    } @else {
      <div
        class="discard-area-result-card wall-game-theme"
        [style.left.px]="discardArea.x"
        [style.top.px]="discardArea.y"
        [style.width.px]="discardArea.width"
        [style.height.px]="discardArea.height">

        <button
          type="button"
          class="result-card-eye-btn"
          (click)="isResultPopupHidden.set(true)"
          title="Hide Summary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </button>

        <header class="result-card-header">
          <h2 class="result-card-title">{{ gameOverState().title || 'WALL GAME' }}</h2>
          <div class="result-card-announcement">
            {{ gameOverState().message || 'No one won the game. Wall tiles ran out.' }}
          </div>
        </header>

        <footer class="result-card-actions">
          <button type="button" class="result-btn-primary" (pointerup)="$event.stopPropagation(); onStartNewGame()">
            PLAY AGAIN
          </button>
          <button type="button" class="result-btn-secondary" (pointerup)="$event.stopPropagation(); onExitGame()">
            EXIT
          </button>
        </footer>
      </div>
    }
  }
}
<!-- NEWCODE -->
```

---

### File 5: `src/app/module/business/game/phaser/style.scss`

#### NEW CSS ADDITIONS (matching Mahjfit Design System):
```scss
/* NEWCODE */
// Discard Area Anchored Result Card
.discard-area-result-card {
  position: absolute;
  z-index: 1000;
  background: linear-gradient(145deg, rgba(15, 34, 69, 0.96) 0%, rgba(7, 18, 41, 0.98) 100%);
  border: 2px solid #C7C22E;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 10px;
  overflow-y: auto;
  overflow-x: hidden;
  text-align: center;
  font-family: 'Outfit', sans-serif;
  box-sizing: border-box;

  &.wall-game-theme {
    border-color: #264089;
  }
}

// Eye Toggle Buttons
.result-card-eye-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #ffffff;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: rgba(185, 42, 144, 0.4);
    color: #ffffff;
  }
}

.result-popup-toggle-eye {
  position: absolute;
  z-index: 1000;
  background: #264089;
  border: 1.5px solid #C7C22E;
  border-radius: 8px;
  color: #ffffff;
  padding: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.08);
    background: #B92A90;
  }
}

// Result Typography (Outfit)
.result-card-title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(22px, 3.2vw, 36px);
  font-weight: 700;
  margin: 0;
  color: #C7C22E;
  letter-spacing: 0.5px;
}

.result-card-score {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(12px, 1.6vw, 15px);
  font-weight: 500;
  color: #DAB6D6;
  margin-top: 2px;
}

.result-card-announcement {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(13px, 1.8vw, 16px);
  font-weight: 600;
  color: #ffffff;
  margin-top: 2px;
}

// Hand & Meld Groups
.result-card-hand-section {
  width: 100%;
  margin: 6px 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-card-melds-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  align-items: flex-end;
}

.result-card-meld-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.result-card-meld-tag {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(9px, 1.2vw, 11px);
  font-weight: 600;
  color: #C7C22E;
  text-transform: uppercase;
}

.result-card-meld-tiles {
  display: flex;
  gap: 2px;
}

// Atlas Tile Artwork
.atlas-tile-wrapper {
  display: inline-flex;
}

.atlas-tile-img {
  width: clamp(22px, 3vw, 38px);
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  display: block;
}

.atlas-tile-fallback {
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  background: #ffffff;
  color: #000;
  padding: 4px;
  border-radius: 4px;
}

// Action Buttons (Outfit, 8px radius, Mahjfit Theme)
.result-card-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  width: 100%;
  justify-content: center;
}

.result-btn-primary {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(13px, 1.8vw, 16px);
  font-weight: 600;
  background: #B92A90;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: background 0.15s ease;

  &:hover {
    background: #C453A3;
  }
  &:active {
    background: #921D70;
  }
}

.result-btn-secondary {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(13px, 1.8vw, 16px);
  font-weight: 600;
  background: transparent;
  color: #ffffff;
  border: 1.5px solid #264089;
  border-radius: 8px;
  padding: 8px 18px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(38, 64, 137, 0.25);
    border-color: #DAB6D6;
  }
}
/* NEWCODE */
```

---

## 4. Verification & Testing Strategy
1. **Compilation Check**: Run `npx tsc -p tsconfig.app.json --noEmit` to verify 0 errors.
2. **Visual & Layout Check**:
   - Verify that the card covers only the discard area and does not overlay the 4 player racks and exposure panels.
   - Verify that clicking the Eye icon hides the popup and displays the restore button, and clicking it again restores the popup.
   - Verify that the winning tiles display actual tile atlas images.
   - Verify that "Play Again" redirects to `/game` and "Exit" redirects to `/home`.
   - Verify that all old code is commented out with `OLDCODE` and new code is tagged with `NEWCODE`.

