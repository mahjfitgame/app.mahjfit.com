# Plan: Increase Popup Title Sizes for Desktop Devices (Mahjong, Wall Game, Dead Hand)

## 1. Objective
Increase the title font size of the **Mahjong Win**, **Wall Game**, and **Dead Hand** popups on desktop devices (`@media (min-width: 1024px)`), while maintaining responsive scaling so content continues to fit without scrollbars on mobile and tablet devices.

---

## 2. Target Files
- `src/app/module/business/game/phaser/style.scss`: Update `.result-card-title`, `.wall-game-theme .result-card-title`, and `.dead-hand-popup h2`.

---

## 3. Before & After Code Snippets

### File: `src/app/module/business/game/phaser/style.scss`

#### Snippet 1: `.result-card-title` (Larger font size on desktop, responsive on smaller screens)

##### Before:
```scss
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
```

##### After:
```scss
/* OLDCODE
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
OLDCODE */
/* NEWCODE */
// Popup title: larger on desktop devices, scaling down responsively on tablet and mobile
.result-card-title {
  font-family: 'Poppins', 'Outfit', sans-serif;
  font-size: clamp(24px, 3.5vw, 42px);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.5px;
  color: #f6c542;
  background: linear-gradient(180deg, #fff7d6 0%, #f6c542 50%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
  margin: 0 0 2px 0;

  // Desktop devices: display a noticeably larger title
  @media (min-width: 1024px) {
    font-size: clamp(40px, 4.5vw, 62px);
  }

  // Mobile phones: compact size to prevent vertical scrollbars
  @media (max-width: 480px) {
    font-size: clamp(18px, 5.5vw, 24px);
  }
}
/* NEWCODE */
```

---

#### Snippet 2: `.wall-game-theme .result-card-title` (Extra prominence for Wall Game & Dead Hand Game Over on desktop)

##### Before:
```scss
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
```

##### After:
```scss
/* OLDCODE
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
OLDCODE */
/* NEWCODE */
  // Wall Game & Dead Hand Game Over: larger title on desktop since there are no meld tiles below
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

      .result-card-title {
        @media (min-width: 1024px) {
          font-size: clamp(46px, 5.2vw, 68px);
          margin-bottom: 6px;
        }
      }

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
/* NEWCODE */
```

---

#### Snippet 3: `.dead-hand-popup h2` (Bigger title for Declare Dead Hand Dialog on desktop)

##### Before:
```scss
// Responsive typography and buttons for Dead Hand dialog
.join-table-popup h2, .dead-hand-popup h2 {
    margin: 0 0 clamp(4px, 1vh, 8px);
    font-size: clamp(15px, 2.8vw, 20px);
}
```

##### After:
```scss
/* OLDCODE
// Responsive typography and buttons for Dead Hand dialog
.join-table-popup h2, .dead-hand-popup h2 {
    margin: 0 0 clamp(4px, 1vh, 8px);
    font-size: clamp(15px, 2.8vw, 20px);
}
OLDCODE */
/* NEWCODE */
// Responsive typography and buttons for Dead Hand dialog (larger title on desktop)
.join-table-popup h2, .dead-hand-popup h2 {
    margin: 0 0 clamp(4px, 1vh, 8px);
    font-size: clamp(15px, 2.8vw, 20px);

    @media (min-width: 1024px) {
        font-size: clamp(22px, 2.2vw, 28px);
        margin-bottom: 10px;
    }
}
/* NEWCODE */
```

