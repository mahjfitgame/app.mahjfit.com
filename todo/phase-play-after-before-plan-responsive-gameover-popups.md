# Plan: Remove Scroll & Make Responsive for Mahjong, Wall Game, and Dead Hand Popups

## 1. Objective
Remove all vertical and horizontal scrollbars from the game popups (Mahjong Win, Wall Game, and Dead Hand) across all screen sizes (mobile portrait/landscape, tablet, and desktop). Ensure all text, titles, tile images, badges, notes, and action buttons scale responsively to fit within the popup container without overflowing.

---

## 2. Target Files
- `src/app/module/business/game/phaser/style.scss`: Update CSS styling for `.discard-area-result-card`, `.wall-game-theme`, `.result-card-*` typography, `.atlas-tile-img`, `.wall-game-popup`, and `.dead-hand-popup`.

---

## 3. Before & After Code Snippets

### File: `src/app/module/business/game/phaser/style.scss`

#### Snippet 1: `.discard-area-result-card` Container (Remove scroll, make padding responsive)

##### Before:
```scss
.discard-area-result-card {
  position: absolute;
  z-index: 1000;
  background: linear-gradient(145deg, rgba(15, 34, 69, 0.82) 0%, rgba(7, 18, 41, 0.88) 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: none;
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
    border: none;
    justify-content: space-between;

    .result-card-header {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 100%;

      .wall-game-popup__dead-note {
        text-align: center;
        justify-content: center;
        margin: 8px auto 0;
      }
    }

    .result-card-actions {
      margin-top: 0;
      margin-bottom: 6px;
    }
  }
}
```

##### After:
```scss
/* OLDCODE
.discard-area-result-card {
  position: absolute;
  z-index: 1000;
  background: linear-gradient(145deg, rgba(15, 34, 69, 0.82) 0%, rgba(7, 18, 41, 0.88) 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: none;
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
    border: none;
    justify-content: space-between;

    .result-card-header {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 100%;

      .wall-game-popup__dead-note {
        text-align: center;
        justify-content: center;
        margin: 8px auto 0;
      }
    }

    .result-card-actions {
      margin-top: 0;
      margin-bottom: 6px;
    }
  }
}
OLDCODE */
/* NEWCODE */
// Discard area popup card: removed scroll and added responsive padding
.discard-area-result-card {
  position: absolute;
  z-index: 1000;
  background: linear-gradient(145deg, rgba(15, 34, 69, 0.88) 0%, rgba(7, 18, 41, 0.94) 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: none;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: clamp(6px, 1.4vh, 12px) clamp(8px, 1.5vw, 14px);
  overflow: hidden; // Remove vertical and horizontal scroll
  text-align: center;
  font-family: 'Outfit', sans-serif;
  box-sizing: border-box;

  &.wall-game-theme {
    border: none;
    justify-content: space-between;

    .result-card-header {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 100%;

      .wall-game-popup__dead-note {
        text-align: center;
        justify-content: center;
        margin: clamp(4px, 1vh, 8px) auto 0;
        padding: clamp(4px, 0.8vh, 8px) 10px;
        font-size: clamp(10px, 1.8vw, 13px);
      }
    }

    .result-card-actions {
      margin-top: clamp(4px, 1vh, 8px);
      margin-bottom: 2px;
    }
  }
}
/* NEWCODE */
```

---

#### Snippet 2: Typography & Hand Section (Responsive title, labels, tiles, and buttons)

##### Before:
```scss
.result-card-title {
  font-family: 'Poppins', 'Outfit', sans-serif;
  font-size: clamp(48px, 7.6vw, 84px);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: 1px;
  color: #f6c542;
  background: linear-gradient(180deg, #fff7d6 0%, #f6c542 50%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
  margin: 0 0 2px 0;

  @media (max-width: 480px) {
    font-size: clamp(32px, 9vw, 48px);
  }
}

.result-card-rule-label {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(12px, 1.8vw, 15px);
  font-weight: 700;
  color: #f6c542;
  letter-spacing: 0.5px;
  margin-top: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.result-card-score {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(11px, 1.6vw, 14px);
  font-weight: 500;
  color: #DAB6D6;
  margin-top: 2px;
}

.result-card-announcement {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(12px, 1.8vw, 15px);
  font-weight: 600;
  color: #ffffff;
  margin-top: 2px;
}

.result-card-hand-section {
  width: 100%;
  margin: 4px 0;
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

.atlas-tile-img {
  width: clamp(38px, 4.8vw, 54px);
  aspect-ratio: 0.72;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.45);
  display: block;
  object-fit: contain;
}

.result-card-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  width: 100%;
  justify-content: center;
}

.result-btn-primary {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(12px, 1.8vw, 15px);
  font-weight: 600;
  background: #B92A90;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 7px 18px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: background 0.15s ease;
}

.result-btn-secondary {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(12px, 1.8vw, 15px);
  font-weight: 600;
  background: transparent;
  color: #ffffff;
  border: 1.5px solid #264089;
  border-radius: 8px;
  padding: 7px 18px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.15s ease;
}
```

##### After:
```scss
/* OLDCODE
.result-card-title {
  font-family: 'Poppins', 'Outfit', sans-serif;
  font-size: clamp(48px, 7.6vw, 84px);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: 1px;
  color: #f6c542;
  background: linear-gradient(180deg, #fff7d6 0%, #f6c542 50%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
  margin: 0 0 2px 0;

  @media (max-width: 480px) {
    font-size: clamp(32px, 9vw, 48px);
  }
}
OLDCODE */
/* NEWCODE */
// Responsive popup title: scales neatly so it never pushes other content out of view
.result-card-title {
  font-family: 'Poppins', 'Outfit', sans-serif;
  font-size: clamp(20px, 3.2vw, 36px);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.5px;
  color: #f6c542;
  background: linear-gradient(180deg, #fff7d6 0%, #f6c542 50%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
  margin: 0 0 2px 0;

  @media (max-width: 480px) {
    font-size: clamp(18px, 5.5vw, 24px);
  }
}
/* NEWCODE */

/* OLDCODE
.result-card-rule-label {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(12px, 1.8vw, 15px);
  font-weight: 700;
  color: #f6c542;
  letter-spacing: 0.5px;
  margin-top: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.result-card-score {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(11px, 1.6vw, 14px);
  font-weight: 500;
  color: #DAB6D6;
  margin-top: 2px;
}

.result-card-announcement {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(12px, 1.8vw, 15px);
  font-weight: 600;
  color: #ffffff;
  margin-top: 2px;
}
OLDCODE */
/* NEWCODE */
// Responsive subtitle, score, and announcement text
.result-card-rule-label {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(10px, 1.5vw, 13px);
  font-weight: 700;
  color: #f6c542;
  letter-spacing: 0.5px;
  margin-top: 1px;
  line-height: 1.2;
}

.result-card-score {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(9px, 1.3vw, 12px);
  font-weight: 500;
  color: #DAB6D6;
  margin-top: 1px;
  line-height: 1.2;
}

.result-card-announcement {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(10px, 1.5vw, 13px);
  font-weight: 600;
  color: #ffffff;
  margin-top: 1px;
  line-height: 1.2;
}
/* NEWCODE */

/* OLDCODE
.result-card-hand-section {
  width: 100%;
  margin: 4px 0;
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

.atlas-tile-img {
  width: clamp(38px, 4.8vw, 54px);
  aspect-ratio: 0.72;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.45);
  display: block;
  object-fit: contain;
}
OLDCODE */
/* NEWCODE */
// Responsive tile melds container and tile image dimensions
.result-card-hand-section {
  width: 100%;
  margin: 2px 0;
  flex: 1;
  min-height: 0; // Allows flex child to shrink properly without overflow
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-card-melds-container {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(4px, 1vw, 8px);
  justify-content: center;
  align-items: flex-end;
}

.atlas-tile-img {
  width: clamp(20px, 3vw, 36px);
  aspect-ratio: 0.72;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  display: block;
  object-fit: contain;

  @media (max-width: 480px) {
    width: clamp(16px, 4.2vw, 24px);
  }
}
/* NEWCODE */

/* OLDCODE
.result-card-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  width: 100%;
  justify-content: center;
}

.result-btn-primary {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(12px, 1.8vw, 15px);
  font-weight: 600;
  background: #B92A90;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 7px 18px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: background 0.15s ease;
}

.result-btn-secondary {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(12px, 1.8vw, 15px);
  font-weight: 600;
  background: transparent;
  color: #ffffff;
  border: 1.5px solid #264089;
  border-radius: 8px;
  padding: 7px 18px;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: all 0.15s ease;
}
OLDCODE */
/* NEWCODE */
// Responsive action buttons: padding and font adapt to small and large displays
.result-card-actions {
  display: flex;
  gap: clamp(6px, 1.5vw, 12px);
  margin-top: clamp(2px, 0.8vh, 6px);
  width: 100%;
  justify-content: center;
}

.result-btn-primary {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(10px, 1.5vw, 13px);
  font-weight: 600;
  background: #B92A90;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: clamp(4px, 0.8vh, 7px) clamp(10px, 1.8vw, 16px);
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
  font-size: clamp(10px, 1.5vw, 13px);
  font-weight: 600;
  background: transparent;
  color: #ffffff;
  border: 1.5px solid #264089;
  border-radius: 6px;
  padding: clamp(4px, 0.8vh, 7px) clamp(10px, 1.8vw, 16px);
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

#### Snippet 3: Declare Dead Hand Popup (`.dead-hand-popup`)

##### Before:
```scss
.dead-hand-popup section {
    width: min(460px, calc(100% - 32px));
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.join-table-popup h2, .dead-hand-popup h2 {
    margin: 0 0 12px;
    font-size: 22px;
}

.join-table-popup p, .dead-hand-popup p {
    margin: 0 0 8px;
}

.join-table-popup small, .dead-hand-popup small {
    display: block;
    margin-bottom: 16px;
    color: #f6c542;
}

.join-table-popup button, .dead-hand-popup button {
    display: block;
    width: auto;
    min-width: 150px;
    margin: 8px auto 0;
    padding: 9px 16px;
    border: 0;
    border-radius: 8px;
    background: #B92A90;
    color: #fff;
    font: 600 15px Outfit, Arial, sans-serif;
    cursor: pointer;
}

.dead-hand-popup button {
    min-width: 190px;
}
```

##### After:
```scss
/* OLDCODE
.dead-hand-popup section {
    width: min(460px, calc(100% - 32px));
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}
OLDCODE */
/* NEWCODE */
// Dead hand dialog card: responsive bounds and padding to prevent overflow
.dead-hand-popup section {
    width: min(420px, calc(100% - 24px));
    max-height: 92dvh;
    overflow: hidden;
    padding: clamp(12px, 2vh, 20px) clamp(14px, 2.5vw, 24px);
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
}
/* NEWCODE */

/* OLDCODE
.join-table-popup h2, .dead-hand-popup h2 {
    margin: 0 0 12px;
    font-size: 22px;
}

.join-table-popup small, .dead-hand-popup small {
    display: block;
    margin-bottom: 16px;
    color: #f6c542;
}

.join-table-popup button, .dead-hand-popup button {
    display: block;
    width: auto;
    min-width: 150px;
    margin: 8px auto 0;
    padding: 9px 16px;
    border: 0;
    border-radius: 8px;
    background: #B92A90;
    color: #fff;
    font: 600 15px Outfit, Arial, sans-serif;
    cursor: pointer;
}

.dead-hand-popup button {
    min-width: 190px;
}
OLDCODE */
/* NEWCODE */
// Responsive typography and buttons for Dead Hand dialog
.join-table-popup h2, .dead-hand-popup h2 {
    margin: 0 0 clamp(4px, 1vh, 8px);
    font-size: clamp(15px, 2.8vw, 20px);
}

.join-table-popup small, .dead-hand-popup small {
    display: block;
    margin-bottom: clamp(6px, 1.2vh, 12px);
    font-size: clamp(10px, 1.8vw, 12px);
    color: #f6c542;
}

.join-table-popup button, .dead-hand-popup button {
    display: block;
    width: auto;
    min-width: min(170px, 85%);
    margin: clamp(4px, 0.8vh, 6px) auto 0;
    padding: clamp(5px, 1vh, 8px) clamp(10px, 2vw, 16px);
    border: 0;
    border-radius: 7px;
    background: #B92A90;
    color: #fff;
    font: 600 clamp(11px, 2vw, 13px) Outfit, Arial, sans-serif;
    cursor: pointer;
}

.dead-hand-popup button {
    min-width: min(180px, 85%);
}
/* NEWCODE */
```

