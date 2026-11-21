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

- **Runs:** the spire fires automatically. A new wave starts every 30 s of game time: enemies spawn for the first 15 s, then there's a break. Waves start at 10 enemies and add 3 every 10 waves; higher waves bring more Tanks and elites (spawn chances grow per wave, `freq`/`fg`/`fmax` in `ET`). A boss arrives every 10 waves. Enemies never overlap by more than 10% of their combined size: a crowd forms a wall and newcomers stop or slide into gaps, and enemies are drawn as outlines with a light fill so they stay readable when packed.
- **Enemy stats:** the top bar shows this wave's Basic enemy (♥ health, ⚔ attack, » speed, ⚖ weight). Tap it for a table of every type (spawn chance, stats, wave summary) and a Your spire tab with your current stats. Weight decides who shoves whom in a crowd, and is meant for future knockback.
- **Enemies** come in three ranks, each type with its own shape and colour:
  - *Normal:* Basic (grey square), Fast (yellow triangle), Ranged (purple diamond, stops outside base range and shoots), Tank (orange pentagon).
  - *Elite* (from wave 15): Shielded (blue octagon, shield blocks the first 3 hits), Healer (green cross, heals nearby enemies), Splitter (magenta star, splits into 3 Fast).
  - *Boss:* red hexagon, every 10th wave.
- **Spire stats:** Attack has damage, attack speed, crits and super crits, range, damage per distance, multishot (chance + extra targets) and bounce shots (chance + bounces + range, capped at 40% of range). Defense has health, regen, barrier (a shield sized as a share of max health, shown in its own blue bar next to health; once broken it comes back at full after a recharge timer that starts at 5:00 and upgrades shorten), defense, thorns, lifesteal, death defy, and knockback (chance + force, divided by the enemy's weight). Utility has cash and coin bonuses, cash interest, starting cash, and free attack / defense / utility upgrade chances.
- **Cash:** earned from kills and cash interest (paid at the start of every wave), spent in the Upgrades tab (Attack / Defense / Utility sections, as in the Workshop). It resets every run.
- **Coins:** earned from kills, permanent, spent in the Workshop (tower stats).
- **Shards:** paid when a run on tier 2+ ends, based on kills (kills × `shardPerKill` × the tier's shard multiplier, 1.5× more per tier), permanent, spent in the Lab (meta upgrades).
- **Chips** drop from bosses and buy **Equipment**: items that add a mechanic rather than plain stats (Second Wind, Wave Rush), equipped into slots and levelled to 5 stars. Plain stat boosts come from upgrades instead.
- **Alloy** drops from elites and buys **Modules**: one per slot (Cannon, Armor, Core, Generator), 2 choices each, levelled to 40. Every 10 levels a module ranks up (Common → Rare → Epic → Legendary), boosting its special effect.
- Both are bought directly (no random draws) and can be swapped mid-run.
- **Respec:** Workshop sections, ultimates, equipment and modules can each be refunded in full (`respec()` in `js/loadout.js`), so players can try builds freely.
- **Tiers:** reaching wave 5,000 (`CFG.tierUnlockWave`) unlocks the next tier, which has tougher enemies and more coins.
- **Final wave and milestones:** reaching wave 10,000 (`CFG.finalWave`) stops spawning; destroying every enemy left clears the tier. 30 milestones per tier (`MILESTONES`, rewards from `msReward`) pay coins, alloy, chips and shards the first time each wave is reached; Records → Milestones lists them.
- **Enemy growth** is polynomial (`CFG.hpMul` / `dmgMul`, and weight via `wtMul`), and the field holds at most 5,000 enemies (`CFG.enemyCap`, plus a `cap` per type in `ET`).
- **Records:** the clock button (top right) has a Lifetime stats sheet (earnings, combat, upgrades, per-tier bests) and a Battle history that lists your last 30 runs: tier, wave, coins, coins per hour, shards, kills and run time, with best waves and runs you ended early marked.
- **Ultimate weapons** (Ultimates tab, paid in chips): Chain Lightning, Frost Field, Shockwave, Gravity Well and Laser. Each has 4 upgrade tracks of 40–100 small levels; a level's price follows how far along its track it is (`ULT.cost`, ~11.6k chips to max a track). Silver (the 2 starred tracks maxed), Gold (any 3) and Platinum (all 4) each add a bonus. Frost Field is an always-on field that adds unlimited frost stacks on a tick (slow per stack up to 95%, brittle damage per stack, a 5 s freeze at Silver). Chain Lightning triggers off your shots; the others auto-fire on their cooldown or can be set to Manual (fire button under the arena). The tab shows one collapsible row per ultimate with ×1 / ×10 / Max buying.
- **Targeting:** the 🎯 Target button under the arena opens target priority: drag enemy types above Closest to shoot them first, in order.
- **Auto-restart:** a run that ends restarts after a short countdown, which you can change or turn off in Settings.
- **Offline earnings:** your best coins-per-game-hour (from runs of at least 2 game-minutes) is paid out while you're away, as if the game ran at your fastest unlocked speed (8×, up to 24× with Overdrive). The Lab's Offline speed multiplies it and Offline duration sets the cap. Shards are paid offline the same way, from your best shards per game-hour.

### Lab

Paid in shards.

| Research | Effect |
|---|---|
| Offline speed | ×1 → ×2.5 offline earnings |
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
- `CFG`: crowd spacing (`sepGap`, `sepPush`), wave length, enemy scaling, spawn counts, tier multipliers, rewards (including `shardPerKill`), offline rules
- `ST`: tower stats, per-level gains, cash and coin costs
- `ET`: enemy types: rank, shape, colour, stats, abilities, and the name and description shown in Help (shapes are in `SHAPES`)
- `LAB`: Lab research, effects and costs
- `CARDS` / `CARD` (equipment), `MODS` / `MOD` / `MOD_SLOTS` / `RARITY`, `DROPS`: cards, modules, their prices, and chip/alloy drop rates

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
| `js/loadout.js` | Equipment and Modules: combined effects, the two tabs, buying and equipping |
| `js/ults.js` | Ultimate weapons: behaviour, effects, the Ultimates tab and manual fire buttons |
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

- More equipment (each adding a new mechanic)
- More Lab research
