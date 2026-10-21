# Smash Tiles

A modern Breakout-style brick breaker for the web and Android. Break every tile with the ball, catch falling power-ups, and keep your combo alive as the ball speeds up with every hit.

> **Status: in development.** The game is playable in the browser, and progress is saved on the device. Accounts, the online leaderboard and the Android app are still being built (see [Roadmap](#roadmap)).

## Features

- Canvas game in a fixed portrait playfield that scales to any screen, sharp on high-DPI displays
- Plays the same on 60Hz and 120Hz screens (fixed-step physics)
- Touch, mouse and keyboard controls
- Pauses automatically when you switch tabs or apps
- Six power-ups: Multi-Ball, Wide Paddle, Slow Motion, Sticky Paddle, Extra Life, Coin Rush
- 40 hand-made levels, then endless remixes with tougher bricks
- Special bricks: tough (2–3 hits), steel (unbreakable), explosive (chain reactions), plus moving rows and teleport portals
- Combo scoring, coins, a 3-star rating per level, and a speed boost of 1.5% per brick hit
- Progress saved on the device: coins, unlocked levels, best score and stars per level
- Shop: spend coins on power-ups, then use them during a level from the in-game inventory
- Responsive layout: compact top bar on phones, stats panel on desktop
- Lazy-loaded pages that cope with flaky connections, plus an error screen instead of a blank page
- Self-hosted font (Fredoka) and icons ([Lucide](https://lucide.dev)), with no third-party requests at runtime

## Controls

| Action | Touch | Mouse / keyboard |
|---|---|---|
| Move paddle | Drag anywhere | Move the mouse, or ← → / A D |
| Launch ball | Tap | Click, or Space |
| Start | Tap the start screen | Space or Enter |
| Pause / resume | Pause button | P or Esc |

## Scoring

| Event | Points |
|---|---|
| Break a brick | 100 × brick toughness (1–3 hits) × combo multiplier |
| Hit a tough brick without breaking it | 10 |
| Clear a level | 1,000 per life left |

- **Combo:** every brick you break before the ball touches the paddle again raises the multiplier (x1, x2, x3 … up to **x10**). A paddle hit or a lost ball resets it, so long rallies off the walls and bricks pay the most.
- **Stars:** 3 stars for clearing a level with 3 or more lives left, 2 with two, 1 with one.
- **Coins:** 10 per brick broken, plus Coin Rush power-ups. Spend them in the shop.
- **Total score** on the Home screen is the sum of your best score on each level, so replaying a level only counts if you beat your best.

## Tech stack

- [React 19](https://react.dev) + [Vite 8](https://vite.dev), plain JavaScript (JSX)
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- [React Router 8](https://reactrouter.com) (`HashRouter`)
- HTML5 Canvas game engine with no game framework
- [Zustand](https://zustand.docs.pmnd.rs) for saved player progress
- [Lucide](https://lucide.dev) icons, [Fontsource](https://fontsource.org) Fredoka font
- ESLint 10 + Prettier

## Getting started

**Requirements:** Node.js 24. React Router 8 needs Node 22.22 or newer, and the version is pinned in `.nvmrc`.

```bash
git clone https://github.com/HassanAarish/smash-tiles.git
cd smash-tiles
nvm use            # switches to the Node version in .nvmrc
npm install
npm run dev
```

Open the URL Vite prints, usually http://localhost:5173.

**Testing on a phone:** run `npm run dev -- --host` and open the "Network" URL on a phone connected to the same Wi-Fi.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` / `lint:fix` | Run ESLint (and auto-fix) |
| `npm run format` / `format:check` | Format with Prettier (or just check) |

## Project structure

```
src/
├── game/                 # Game engine: plain JS, no React
│   ├── engine.js         # GameEngine: state, game loop, physics, collisions
│   ├── render.js         # Canvas drawing
│   ├── input.js          # Mouse, touch, keyboard, auto-pause
│   ├── levelData.js      # The 40 levels as text grids (edit here to add levels)
│   ├── levels.js         # Builds levels from the data, remixes, validation
│   ├── powerUps.js       # Power-up definitions (shared with the shop)
│   └── constants.js      # Playfield size, speeds, tuning values
├── pages/
│   ├── Home/             # Menu: level select, power-ups, shop, leaderboard
│   └── Game/             # Game screen: canvas, HUD, overlays
├── store/                # Player progress (Zustand, saved on the device)
├── config/routes/        # Route registry + router (lazy-loaded pages)
├── components/common/    # ErrorBoundary, RouteFallback, PowerUpIcon
├── hooks/                # useOnlineStatus
└── utils/                # lazyRoute (lazy + retry), network helpers
```

## How it works

- **The engine and React are kept separate.** `GameEngine` runs the simulation and draws to the canvas every frame. React only renders the HUD and the menus, and it re-renders only when a displayed value (score, lives, coins and so on) actually changes.
- **Fixed-step physics.** The simulation advances in 1/120 s steps with speeds in units per second, so frame rate never changes game speed.
- **World coordinates.** Gameplay happens in a fixed 600×840 world, and the canvas is scaled to fit the screen.
- **Lazy routes.** Pages are listed once in `src/config/routes/registry.jsx` and loaded with `lazyRoute`. If a page's code fails to download, it waits for the connection to come back and retries.

## Conventions

- Import across folders with the `@/` alias (maps to `src/`, configured in both `vite.config.js` and `jsconfig.json`).
- Add pages through the route registry only, and never import a page directly, so code-splitting keeps working.
- Don't load fonts or other assets from CDNs. Everything is bundled so the Android app works offline.
- Use Lucide for icons, not emoji.
- `src/game/powerUps.js` is the single source of truth for power-ups.

## Roadmap

1. **Finish the game:** ~~saved player progress~~ and ~~levels and special bricks~~ (done), sound and haptics, settings, and a tutorial
2. **Backend (Firebase):** accounts, cloud saves synced across web and Android, a real leaderboard, server-side validation of scores and coins
3. **Android app (Capacitor):** native packaging, ads and in-app purchases
4. **Release:** web hosting and Google Play Store

## License

ISC © Aarish Jafri
