# Spire

An offline idle tower-defense game for the browser. One spire in the center, waves of geometric enemies, upgrades during a run, and permanent progression between runs. It has no servers, accounts, paid currency or timers.

## Play

Open `index.html` in a browser. It has no build step and no dependencies apart from Google Fonts.

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

All balance numbers are at the top of the script in `index.html`:

- `CFG`: wave length, enemy scaling, spawn counts, tier multipliers, rewards, offline rules
- `ST`: tower stats, per-level gains, cash and coin costs
- `ET`: enemy types
- `LAB`: Lab research, effects and costs

## Tech notes

- Single self-contained HTML file using Canvas 2D.
- Fixed-timestep simulation (60 Hz) with render interpolation, so motion is smooth at any refresh rate and game speed adds simulation steps instead of skipping frames.
- Object pooling for enemies and projectiles, and batched drawing per enemy type.
- Saves to `localStorage` (`spire-save-v1`). Settings → Copy backup code exports a save, and Import restores it. Saves are tied to the site the game runs on, so use a backup code when moving between hosts.

## Ideas / next up

- Split `index.html` into modules (config, sim, render, UI, save)
- Ultimate abilities (chain lightning, slow field)
- Cards/modules bought directly (no gacha)
- More Lab research
