# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Smash Tiles is a Breakout-style game that will ship both as a web app and as an Android app on the Play Store (planned: Capacitor wrapper, Firebase backend). It is built with React 19 and Vite 8 in plain JavaScript (JSX, no TypeScript). It uses Tailwind CSS v4 through `@tailwindcss/vite`, so there is no `tailwind.config.js` and Tailwind comes from `@import "tailwindcss"` in `src/App.css`. Routing uses `react-router` v8.

- **Imports:** `@/` maps to `src/`. It's defined in `vite.config.js` (for builds) and in `jsconfig.json` `paths` (for the editor), so keep the two in sync. Use `@/...` across folders and relative paths inside `src/game/`.
- **Fonts are self-hosted:** never add Google Fonts `<link>` tags or CDN font URLs, because the Android app has to work offline. Fonts come from `@fontsource-variable/*` packages imported in `src/App.css`. Tailwind's `--font-sans` is set to Fredoka in the `@theme` block there, and canvas text uses `GAME_FONT` in `src/game/render.js`.

**Node 24 is required** (`.nvmrc`; react-router 8 needs Node ≥ 22.22). With nvm, run `nvm use` first.

## Commands

```bash
npm run dev           # Vite dev server with HMR
npm run build         # production build to dist/
npm run preview       # serve the built dist/
npm run lint          # ESLint (flat config, includes React Compiler-era react-hooks rules)
npm run lint:fix
npm run format        # Prettier (printWidth 100, trailing commas)
npm run format:check
```

There is no test framework yet.

## Architecture

There are two layers: a framework-free game engine in `src/game/` and React pages in `src/pages/`.

### Engine (`src/game/`)

- `engine.js`: the `GameEngine` class owns all simulation state and the `requestAnimationFrame` loop. React is not involved. Physics runs in **fixed steps** (`PHYSICS_STEP`, 1/120 s) with velocities in units per second, so gameplay is the same on 60Hz and 120Hz screens. Never move objects by a fixed amount per frame.
- The UI subscribes with the `onChange(snapshot)` callback passed to the constructor. `emit()` sends a new snapshot only when the HUD-relevant values change, so React doesn't re-render every frame. To show a new value in the UI, add it to `snapshot()`.
- Phases: `menu` → `playing` ⇄ `paused` → `levelComplete` | `gameOver`. UI commands are `newGame(level)`, `play()`, `pause()`, `togglePause()`, `launch()`, `nextLevel()`, `setPointerX()` and `setKey()`.
- All coordinates are in a fixed **600×840 portrait world** (`constants.js`). The canvas is scaled to fit by `resize()`, which accounts for devicePixelRatio. Gameplay code never deals with screen pixels.
- `render.js` is a set of pure drawing functions that read engine state. `input.js` connects mouse (absolute follow), touch (relative drag, tap to launch) and keyboard, and auto-pauses on blur or when the page is hidden.
- **Levels are data.** `levelData.js` holds the 40 hand-made levels as text grids with one row per line (`.` empty, `1`–`3` hits, `#` steel, `X` explosive), plus optional per-row `moving` and `portals`. The file is `prettier-ignore`d so the grids stay readable. `levels.js` builds them: `buildLevel(n)`, `getLevelDefinition(n)` (after level 40 it remixes levels 11–40 with tougher bricks, forever), `motionX` for moving rows, which are clamped to stay on screen. `validateLevels()` checks width, characters and that no breakable brick is sealed in by steel. It runs automatically in dev and logs problems to the console.
- Brick types: `steel` (`unbreakable`) only deflects and doesn't count toward clearing. `explosive` calls `breakBrick` on everything within `EXPLOSION_REACH_X/Y` (its 8 neighbours), which chains, and each brick counts toward the combo. Bricks are marked `destroyed` during a chain and filtered out afterwards.
- `powerUps.js` is the **single source of truth** for power-up IDs, names, icons, prices and durations. Both the engine and the Home page shop import it.
- Brick collisions resolve at most one brick per ball per step, and `enforceMinAngle` stops the ball from looping straight vertically or horizontally. When removing entities, use `filter` or `splice` after the search, never in the middle of a `forEach`.

### Pages (`src/pages/`)

- `App.jsx` sets up `HashRouter` → `ErrorBoundary` → `Root` (`src/config/routes/index.jsx`). Keep `HashRouter`, since it works inside the Capacitor webview without server rewrites. Navigate with `useNavigate`, not `window.location`.
- **Routes are lazy-loaded.** `src/config/routes/registry.jsx` is the only list of pages: `/` is Home and `/game?level=N` is Game. Each page loads through `lazyRoute` (`src/utils/lazyWithRetry.js`), which waits for the connection while offline and retries failed chunk downloads, rendered inside `<Suspense fallback={<RouteFallback />}>`. To add a page, add one registry entry. **Never import a page statically or re-export pages from a barrel**, because that puts it back in the main bundle. Unknown paths redirect to `/`.
- `ErrorBoundary` (`src/components/common/`) catches render errors and failed chunk loads. A failed chunk reloads the page (automatically once back online), and a render bug resets the boundary in place.
- `Game/index.jsx` creates the engine in an effect, measures the available space with a `ResizeObserver`, and renders `MobileHud` (below `lg`), `StatsPanel` (`lg` and up) and `GameOverlay` from the latest snapshot. Read `engineRef.current` only inside callbacks or effects, never during render (the react-hooks lint rules enforce this).
- `Home/index.jsx` is a tabbed menu: level grid, power-up info, shop and leaderboard. The leaderboard is still mock data.

### Player store (`src/store/`)

- `playerStore.js` is a Zustand store with `persist`, saved under the `smash-tiles-player` key. It holds coins, `highestCompleted` (level N+1 is unlocked), per-level `{ stars, bestScore }`, the power-up `inventory` (consumables bought in the shop) and `bestCombo`. Change it only through its actions: `recordResult`, `buyPowerUp`, `consumePowerUp` and `resetProgress`. These are the points that will be validated server-side in Phase 2. Use the primitive selectors `selectUnlockedLevel` and `selectTotalScore`. Total score is the sum of each level's best score.
- `storage.js` is the storage adapter (localStorage, every call wrapped in try/catch). It will be swapped for async Capacitor Preferences on Android, and at that point screens must wait for hydration.
- `progressRecorder.js` connects the engine to the store. On the transition into `levelComplete` or `gameOver` it calls `recordResult` once. Coins are a running total per run in the engine, so it only adds what hasn't been saved yet. The engine itself never imports the store.
- Game page: `?level=N` is clamped to the highest unlocked level (read once on mount). The in-game inventory calls `engine.applyPowerUp(id)` and only spends the item if that returns true, which it does only while playing.

## Known gaps / next steps (Phase 1 roadmap)

- Scoring (in `constants.js`): brick = `BRICK_SCORE × maxHealth × min(combo, MAX_COMBO_MULTIPLIER)`. The combo resets on any paddle hit or lost ball. Damaging a brick without breaking it gives `BRICK_DAMAGE_SCORE`, and a cleared level adds `LIFE_BONUS × lives`. The README's Scoring section documents this for players, so keep the two in sync.
- Level difficulty still needs real playtesting. In autopilot runs, Zigzag (15), Grand Wall (30) and Labyrinth (38) take about 6–7 minutes.
- There is no sound, haptics, settings screen or tutorial yet.
- Most of the shadcn-style CSS variables in `src/App.css` are unused template leftovers.
