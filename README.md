# Spire

An offline idle tower-defense game for the browser. One spire in the center, waves of geometric enemies, upgrades during a run, and permanent progression between runs. It has no servers, accounts, paid currency or timers.

## Play

Open `index.html` in a browser. It has no build step and no dependencies apart from Google Fonts, and it works straight from the file system (no server needed).

To run it from a local server (useful for testing on other devices on your network):

```sh
npx serve .
# or
python -m http.server 8000
```

## How it plays

- **Runs:** the spire fires automatically. A new wave starts every 20 s of game time, and a boss arrives every 10 waves. Enemy types are basic (square), fast (triangle), tank (large square), ranged (diamond, stops outside base range) and boss (hexagon).
- **Cash:** earned from kills and wave bonuses, spent on in-run upgrades (Attack / Defense / Utility). It resets every run.
- **Coins:** earned from kills, permanent, spent in the Workshop (tower stats) and the Lab (meta upgrades).
- **Tiers:** reaching wave 25 unlocks the next tier, which has tougher enemies and more coins.
- **Auto-restart:** a run that ends restarts after a short countdown, which you can change or turn off in Settings.
- **Offline earnings:** your best coins-per-game-hour (from runs of at least 2 game-minutes) is paid out while you're away. The Lab raises the offline speed and cap.

### Lab

| Research | Effect |
|---|---|
| Offline speed | ×1 → ×2.5 game-hours per real hour away |
| Offline duration | 24 h → 72 h cap |
| Overdrive | Unlocks 12×, 16×, 24× game speed |
| Workshop discount | Up to −30% Workshop costs |
| Auto-buyer | Per-tab auto-buy toggles (cheapest upgrade first) |

### Controls

- `Space` pause / resume
- `1`–`8` game speed (unlocked speeds only)
- **FPS** button shows frame rate, simulation cost and entity counts

## Tuning

All balance numbers are in `js/config.js`:

- `CFG`: wave length, enemy scaling, spawn counts, tier multipliers, rewards, offline rules
- `ST`: tower stats, per-level gains, cash and coin costs
- `ET`: enemy types
- `LAB`: Lab research, effects and costs

## Code layout

| File | What's in it |
|---|---|
| `index.html` | Markup and script order |
| `css/style.css` | All styles and theme colours |
| `js/config.js` | Balance and content tables (`CFG`, `ST`, `LAB`, `ET`) |
| `js/util.js` | `$`, number formatting, toast |
| `js/save.js` | localStorage save/load, offline earnings |
| `js/sim.js` | Run state, stats, fixed-step `update()`, auto-buyer |
| `js/render.js` | Canvas drawing |
| `js/ui.js` | HUD, overlays, upgrade panel, settings, controls, auto-restart |
| `js/main.js` | Main loop and boot (loaded last) |

These are classic `<script>` files, not ES modules, so the game keeps working from `file://` (browsers block module imports there). They share one global scope and load in the order listed in `index.html`. Code that runs at load time may only use things from files above it; anything inside a function can use any file.

## Tech notes

- Plain HTML, CSS and JS using Canvas 2D, with no build step.
- Fixed-timestep simulation (60 Hz) with render interpolation, so motion is smooth at any refresh rate and game speed adds simulation steps instead of skipping frames.
- Object pooling for enemies and projectiles, and batched drawing per enemy type.
- Saves to `localStorage` (`spire-save-v1`). Settings → Copy backup code exports a save, and Import restores it. Saves are tied to the site the game runs on, so use a backup code when moving between hosts.

## Ideas / next up

- Ultimate abilities (chain lightning, slow field)
- Cards/modules bought directly (no gacha)
- More Lab research
