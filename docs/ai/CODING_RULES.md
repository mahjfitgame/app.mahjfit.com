# Coding Rules & Implementation Standards: Mahjfit Client

## 1. Absolute Project Invariants (Zero Exceptions)

### Rule 1: Code Preservation Pattern (`OLDCODE` / `NEWCODE`)
> **RULE**: Do not remove existing code. When modifying any logic, comment out the previous code and add the comment `OLDCODE`. Label the replacement code with `NEWCODE`.

**Format for TypeScript / JavaScript:**
```typescript
/* OLDCODE
private readonly game = this._game.asReadonly();
OLDCODE */
/* NEWCODE */
public readonly game = this._game.asReadonly();
/* NEWCODE */
```

**Format for HTML Templates:**
```html
<!-- OLDCODE
<div class="instruction-panel" [style.background]="'transparent'"></div>
OLDCODE -->
<!-- NEWCODE -->
<div class="instruction-panel" [style.background]="state.borderWidth === 0 ? 'transparent' : '#f4f2ec'"></div>
<!-- NEWCODE -->
```

### Rule 2: Confidentiality of `todo/Frontend Development.txt`
> **RULE**: Do NOT read, inspect, parse, or follow the file `todo/Frontend Development.txt`. It is strictly for the user's personal reference.

---

## 2. Design System and Visual Standards

All UI work must comply with `.agents/style-typography.md` and the Mahjfit Brand Guide.

### Mandatory Color Palette
| Token | Hex | Int (Phaser) | Allowed Usages |
| :--- | :--- | :--- | :--- |
| **Fuchsia** | `#B92A90` | `0xB92A90` | Primary buttons, active links, claim accent highlights |
| **Blue** | `#264089` | `0x264089` | Page titles, primary headings, rack bodies, high-contrast text |
| **Lavender** | `#DAB6D6` | `0xDAB6D6` | Soft page backgrounds, modal backdrops, subtle dividers |
| **Avocado / Lime**| `#C7C22E` | `0xC7C22E` | Labels, feedback notices, instruction panel borders |
| **Red** | `#F04846` | `0xF04846` | Error states, invalid moves, dead-hand notices |
| **Green** | `#11B364` | `0x11B364` | Success messages, valid drop targets, winning celebrations |
| **Gray** | `#9EB5C1` | `0x9EB5C1` | Disabled buttons (60% opacity), muted table borders |
| **Pink** | `#EFACBF` | `0xEFACBF` | Decorative badges, secondary highlights |

### Typography
- **Font Family**: `Poppins, Arial, sans-serif` (imported via `@fontsource/poppins`).
- **Heading 1**: 28px - 34px, Bold (`700`), Blue `#264089`.
- **Button Text**: 14px - 16px, Semi-Bold (`600`), Uppercase or Title Case, White text on Fuchsia background.
- **Instruction Title**: 14px - 18px, Bold (`700`), Blue `#264089`.
- **Instruction Body**: 12px - 14px, Regular (`400`), Blue `#264089` or Avocado `#C7C22E`.

### Tailwind CSS v4 Rules
- Tailwind v4 is configured with the `tw:` prefix in `src/tailwind.css`:
  ```css
  @import "tailwindcss" prefix(tw);
  ```
- **MANDATORY**: Every Tailwind utility class in templates and SCSS must include the `tw:` prefix.
  - Correct: `<div class="tw:flex tw:items-center tw:justify-between tw:gap-4">`
  - Incorrect: `<div class="flex items-center justify-between gap-4">`

---

## 3. Angular Implementation Standards

### Component Architecture
- **Standalone Components Only**: All components, directives, and pipes must set `standalone: true`. No `NgModule` wrappers.
- **Dependency Injection**: Use `inject(...)` instead of constructor parameter injection:
  ```typescript
  // Preferred
  protected readonly service = inject(GameService);
  private readonly router = inject(Router);
  ```
- **Control Flow Syntax**: Use modern Angular template control flow (`@if`, `@else`, `@for`, `@switch`). Never use `*ngIf` or `*ngFor`.
- **Signals for Component State**:
  - Use `signal<T>(initialValue)` for mutable local UI state.
  - Use `computed(() => ...)` for derived calculations.
  - Never call `.set()` or `.update()` inside a `computed()` selector (must remain pure).
  - Use `effect(() => ...)` strictly for external imperative operations (e.g., emitting events to Phaser or writing to local storage).

---

## 4. Phaser & Game Subsystem Rules

### 1. Phaser is a Renderer, Not an Authoritative Engine
- Phaser scenes and managers (`PhaserScene`, `PhaserLayoutUi`, `PhaserAnimation`) must NEVER directly modify game rules, decide turn progressions, or confirm tile ownership.
- All user interactions (tapping a tile to discard, clicking pass, claiming a tile) must emit callbacks or events to Angular / `GameState`.
- Only server confirmation via WebSocket payloads updates the confirmed state.

### 2. Tween & Animation Management
- Always kill running tweens before starting a new tween on the same target:
  ```typescript
  this.scene.tweens.killTweensOf(image);
  this.scene.tweens.add({ targets: image, ... });
  ```
- All flight animations must complete with deterministic callbacks that reset scale, alpha, and depth.

### 3. Audio Sprite & Sound Throttling
- Audio must be played through `PhaserSound` (`src/app/module/business/game/phaser/sound.ts`) using preloaded audio sprites (`tiles`, `effects`).
- Discard voices and rapid SFX must be throttled by at least 35ms - 80ms to avoid audio distortion and browser audio buffer overruns.

### 4. Layout Scaling & Responsive Geometry
- Never hardcode absolute pixel positions for table elements.
- Always retrieve bounds from `PhaserLayoutGame` or `PhaserLayoutUi` which dynamically factor in `viewport.width`, `viewport.height`, and safe-area insets (`safeAreaProbe`).

---

## 5. Existing Conventions vs. Recommended Improvements

| Pattern | Current Implementation (Preserve) | Recommended Future Standard |
| :--- | :--- | :--- |
| **Game State Storage** | Scoped `GameState` inheriting `SignalStateService` | Migrate all public/private server fields into one atomic `GameFrame` signal |
| **Phaser Communication** | `this.game.events.emit(...)` event bus | Strongly-typed Port/Adapter interface between Angular and Phaser |
| **Large Files** | Monolithic files (`scene.ts` > 7,000 lines) | Incrementally factor out managers (`PhaserExposureManager`, `PhaserDiscardGrid`) without breaking existing working behavior |
| **Code Replacement** | Commenting out code with `OLDCODE`/`NEWCODE` | Strictly adhere to user's `OLDCODE`/`NEWCODE` preservation rule on every edit |
| **Tests** | Vitest spec files covering specific queue behaviors | Expand automated regression test coverage for sorting, state transitions, and atlas resolution |
