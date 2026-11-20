# Spire

**Play:** https://chenbisan.github.io/spire/

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

- **Runs:** the spire fires automatically. A new wave starts every 20 s of game time, and a boss arrives every 10 waves. Crowds push each other apart, and enemies are drawn as outlines with a light fill so they stay readable when packed.
- **Enemy stats:** the top bar shows this wave's Basic enemy (♥ health, ⚔ attack, » speed, ⚖ weight). Tap it for a table of every type (spawn chance, stats, wave summary) and a Your spire tab with your current stats. Weight decides who shoves whom in a crowd, and is meant for future knockback.
- **Enemies** come in three ranks, each type with its own shape and colour:
  - *Normal:* Basic (grey square), Fast (yellow triangle), Ranged (purple diamond, stops outside base range and shoots), Tank (orange pentagon).
  - *Elite* (from wave 15): Shielded (blue octagon, shield blocks the first 3 hits), Healer (green cross, heals nearby enemies), Splitter (magenta star, splits into 3 Fast).
  - *Boss:* red hexagon, every 10th wave.
- **Cash:** earned from kills and wave bonuses, spent in the Upgrades tab (Attack / Defense / Utility sections). It resets every run.
- **Coins:** earned from kills, permanent, spent in the Workshop (tower stats).
- **Shards:** only drop from enemies on tier 2 and up (1.5× more per tier above that), permanent, spent in the Lab (meta upgrades).
- **Tiers:** reaching wave 25 unlocks the next tier, which has tougher enemies and more coins.
- **Auto-restart:** a run that ends restarts after a short countdown, which you can change or turn off in Settings.
- **Offline earnings:** your best coins-per-game-hour (from runs of at least 2 game-minutes) is paid out while you're away. The Lab raises the offline speed and cap.

### Lab

Paid in shards.

| Research | Effect |
|---|---|
| Offline speed | ×1 → ×2.5 game-hours per real hour away |
| Offline duration | 24 h → 72 h cap |
| Overdrive | Unlocks 12×, 16×, 24× game speed |
| Workshop discount | Up to −30% Workshop costs |
| Auto-buyer | Auto-buy toggles per Upgrades section (cheapest upgrade first) |

### Controls

- **?** (top right) explains the rules and every enemy type
- **Gear** (top right) opens Settings: options, save backup, end run, reset

- `Space` pause / resume
- `1`–`8` game speed (unlocked speeds only)
- **FPS** button shows frame rate, simulation cost and entity counts

## Tuning

All balance numbers are in `js/config.js`:

- `ET` uses `freq` for spawn frequency and `weight` for push/knockback resistance.
- `CFG`: crowd spacing (`sepGap`, `sepPush`), wave length, enemy scaling, spawn counts, tier multipliers, rewards (including `shardRate`), offline rules
- `ST`: tower stats, per-level gains, cash and coin costs
- `ET`: enemy types: rank, shape, colour, stats, abilities, and the name and description shown in Help (shapes are in `SHAPES`)
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
| `js/update.js` | "New version available" banner and refresh |
| `js/ui.js` | HUD, overlays, upgrade panel, Settings and Help windows, controls, auto-restart |
| `js/main.js` | Main loop and boot (loaded last) |

These are classic `<script>` files, not ES modules, so the game keeps working from `file://` (browsers block module imports there). They share one global scope and load in the order listed in `index.html`. Code that runs at load time may only use things from files above it; anything inside a function can use any file.

## Tech notes

- Plain HTML, CSS and JS using Canvas 2D, with no build step.
- Shots are drawn as streaks from their last drawn position, and shots that land within one frame leave a short fading tracer, so they stay visible at 24× speed.
- Fixed-timestep simulation (60 Hz) with render interpolation, so motion is smooth at any refresh rate and game speed adds simulation steps instead of skipping frames.
- Object pooling for enemies and projectiles, and batched drawing per enemy type.
- Saves to `localStorage` (`spire-save-v1`). Settings → Copy backup code exports a save, and Import restores it. Saves are tied to the site the game runs on, so use a backup code when moving between hosts.

## Versioning

Spire uses [Semantic Versioning](https://semver.org). The current version is `APP_VERSION` in `js/config.js`. It's shown at the bottom of the Settings tab and links to the changelog.

- **Major:** old saves can't be loaded as-is (save format change without a migration), or the game is substantially reworked.
- **Minor:** new features or content, such as an ability, a Lab research or an enemy type.
- **Patch:** bug fixes, balance tweaks, and refactors players won't notice.

To release:

1. Bump `APP_VERSION` in `js/config.js`.
2. Add a `## X.Y.Z — date` section at the top of `CHANGELOG.md`, written for players.
3. Commit, push to `main`, then tag the commit `vX.Y.Z`.

Players with the hosted game open see a "Version X is available" banner within about 10 minutes of the push (sooner when they switch back to the tab). It compares the live `APP_VERSION` with the one they're running, so a change that doesn't bump `APP_VERSION` won't be announced.

The save format has its own number (`v` in the save, `spire-save-v1` key), which only changes when the save layout changes.

## Ideas / next up

- Ultimate weapons (chain lightning, slow field): new tab next to Lab
- Modules bought directly (no gacha): new tab
- More Lab research
