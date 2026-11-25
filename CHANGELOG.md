# What's new in Spire

## 1.25.1 — 2026-11-25
- The Chips and ×1 / ×10 / Max bar at the top of the Ultimates tab now stays in view while you scroll through the ultimates.

## 1.25.0 — 2026-11-21
- **Runs end on the main screen:** when a run ends (you end it or the spire falls) you're back on the same screen as when the game starts, with the tier picker, tier details and shortcuts, plus a compact summary of the run you just played at the top. Auto-restart still counts down on the Start button after the spire falls.

## 1.24.1 — 2026-11-21
- **Faster drawing:** enemies are now pre-drawn once per zoom level (per type and health step) and stamped onto the arena each frame, instead of being traced shape by shape. They look the same; big crowds paint much faster.

## 1.24.0 — 2026-11-21
- **🎯 Target priority has its own window:** tap **Target** under the arena (next to the speed buttons). Drag enemy types above **Closest** to have the spire shoot them first, in order (ranks 1, 2, 3…); everything below Closest is shot closest-first. You can also focus a row and use ↑ / ↓. Your old Priority order carries over. Settings has a shortcut to the same window.
- **No more enemy health bars:** an enemy's health now shows in its fill. It's solid at full health and empties to just an outline as it's worn down (in four steps). Cheaper to draw, and easier to read in a crowd.

## 1.23.0 — 2026-11-20
- **Ultimates take real progress to finish:** every upgrade track now has 40 to 100 small levels instead of 4 to 20 big ones, with the same start and end values. Prices climb steadily towards the end of each track (about 11.6k chips to max one), so Silver, Gold and Platinum are proper milestones. Your current levels convert so every ultimate stays exactly as strong as it was.
- **❄ Frost Field rebuilt:** it's now **always on**. On every tick, each enemy touching the field gains a **frost stack**; stacks never wear off and have no limit.
  - Each stack slows by 5%, up to your **Max slow** (30% → 95%, shown with the stacks it takes).
  - **Tick rate** (0.5 → 4 ticks/s), **Radius** (60% → 200% of range) and **Brittle** (enemies take +0.2% → +2% damage per stack they carry).
  - Silver (Max slow + Tick rate): enemies **freeze solid for 5 s** the first time they reach max slow · Gold: enemy shots that enter the field are destroyed · Platinum: frozen enemies take double brittle damage.
  - Duration and Cooldown are gone; chips you spent on them are refunded.
- **Tidier Ultimates tab:** one compact row per ultimate with a progress bar; tap a row to open it (one at a time). Buy ×1, ×10 or Max levels at once.
- Chain Lightning's Bounce targets now grow in tenths: the fraction is the chance of one extra branch.

## 1.22.0 — 2026-11-20
- **🛡 Barrier rework:** the barrier no longer trickles back. Once it breaks, it **recharges to full after a timer**, which starts at **5:00** of game time. The *Barrier regen* upgrade is now **Barrier recharge time**: each level takes 4 s off in a run (3 s in the Workshop), down to 0:30. Your existing levels carry over.
- **Barrier bar:** the barrier now has its own deep blue bar next to your health, showing how much is left, or while it's broken, the recharge filling back up with a countdown. The spire's ring shows a dashed recharge arc while it's down.
- Chain Lightning keeps its lighter blue, so the two don't get mixed up.

## 1.21.2 — 2026-11-20
- **Faster with big crowds and maxed ultimates:** about twice as fast with every ultimate maxed, and about 1.6× faster with 3,000 enemies, so high game speeds hold up far longer.
  - Laser and Gravity Well damage now lands 10 times a second instead of every frame (same total damage).
  - Chain Lightning, multishot, healers and shots that lose their target only look at nearby enemies.
- **Tidier crowds:** enemies blocked by the crowd in front of them wait their turn instead of piling on top of each other, so big crowds overlap about a third as much.
- **Crowd detail mode removed:** big crowds are now drawn at full detail (outlines, health bars, healer pulses, dashed stun rings), since the cheaper drawing barely saved any time.

## 1.21.1 — 2026-11-20
- **Much faster with huge crowds:** with 2,000+ enemies on screen the simulation runs several times faster (crowd spacing uses a finer grid, and Chain Lightning and bounce shots only look at nearby enemies).
- **No more frame-rate collapse:** the simulation gets a fixed time budget per frame. If a crowd is too big to keep up, the game runs a little slower than your chosen speed instead of freezing; the FPS overlay says when that happens.
- **Crowd detail mode:** above 500 enemies the arena draws more cheaply (solid shapes, batched hit flashes, no healer pulses, fewer lightning bolts, health bars only on elites and bosses) so the frame rate holds up.

## 1.21.0 — 2026-11-20
- **🔴 New ultimate, Laser:** charges up, then fires a beam toward your target that burns every enemy along it. Upgrade damage, width, duration and charge time.
- **Every ultimate now has 4 upgrades** and three statuses, each with a bonus: **Silver** for maxing the 2 starred upgrades (for Frost Field, Gravity Well and Laser that's duration and cooldown, which makes them always on), **Gold** for any 3, **Platinum** for all 4.
  - **Chain Lightning now triggers off your shots:** each hit has a chance to spark a bolt, and every enemy it strikes has the same chance to split it into several weaker bolts that jump to nearby enemies, branching like real lightning. Upgrades: proc chance, bounce targets (branches per split), bounce multiplier (damage kept per bounce) and damage. Silver, bolts can crit · Gold, strikes twice · Platinum, bolts slow what they hit.
  - Frost Field (+ Radius): Silver, always on and +20% damage taken inside · Gold, +20% slow · Platinum, enemy shots entering the field are destroyed.
  - Shockwave (+ Radius): Silver, stunned enemies take +25% damage · Gold, the blast deals 20× spire damage · Platinum, an aftershock repeats it 1 s later.
  - Gravity Well (+ Pull): Silver, always on and +20% damage taken inside · Gold, 2× spire damage per second inside · Platinum, enemies inside can't move or attack.
  - Laser: Silver, always firing and ignores shields · Gold, +50% damage · Platinum, a second beam fires the opposite way.
- Fixed: Frost Field and Gravity Well were drawn in the wrong colours.

## 1.20.0 — 2026-11-20
- **Ultimates grow into permanent weapons:** upgrades now go further but get exponentially pricier (×1.6 chips per level), so maxing them means pushing higher tiers for chips. Frost Field and Gravity Well start at 10 s active every 300 s and can be upgraded to 60 s every 60 s.
- **Silver and Gold status:** Silver makes Frost Field and Gravity Well **always on** (the well hops to the biggest cluster every 5 s), and comes from the fastest cooldown for Chain Lightning and Shockwave. Gold means every upgrade is maxed. Each status adds a bonus:
  - Chain Lightning: Silver, bolts can crit and super crit · Gold, strikes twice.
  - Frost Field: Silver, enemies in the field take +20% damage · Gold, slow +20% (up to 80%).
  - Shockwave: Silver, stunned enemies take +25% damage · Gold, the blast deals 20× spire damage.
  - Gravity Well: Silver, enemies in the well take +20% damage · Gold, the well deals 2× spire damage per second inside.

## 1.19.0 — 2026-11-20
- **⚡ Ultimate weapons,** in a new Ultimates tab, unlocked and upgraded with chips (shared with Equipment):
  - **Chain Lightning:** a bolt strikes an enemy in range and arcs on to nearby enemies. Upgrade damage, jumps and cooldown.
  - **Frost Field:** for a few seconds, every enemy inside your range is slowed. Upgrade slow, duration and cooldown.
  - **Shockwave:** shoves every enemy in range outward (heavier ones move less) and stuns them. Upgrade force, stun and cooldown.
  - **Gravity Well:** opens on the biggest cluster of enemies in range and pulls everything nearby into it. Upgrade radius, duration and cooldown.
- Every ultimate you own is active. Each fires automatically on its cooldown, or switch one to **Manual** and fire it with its button under the arena.

## 1.18.0 — 2026-11-20
- **Second Wind reworked:** once per run, a killing blow is cancelled and the spire becomes **invincible** for 60 s of game time (75 / 90 / 105 / 120 s at 2–5 stars). Nothing can damage it meanwhile; regen and thorns keep working. A pulsing shield and countdown show on the spire and next to your health. Death defy is still tried first, so it doesn't waste your Second Wind.

## 1.17.2 — 2026-11-20
- **Death defied is hard to miss:** a gold shockwave bursts from the spire, the spire flashes gold, a big DEFIED rises above it and the health bar flashes gold. It shows at any game speed, even with damage numbers off.

## 1.17.1 — 2026-11-20
- A hit cancelled by death defy no longer counts toward "Damage taken" in Lifetime stats.
- Deaths defied in a run now show on the end-of-run screen and in the battle history (they were already counted in Lifetime stats).

## 1.17.0 — 2026-11-20
- **🎯 Target priority:** under Settings → Targeting, keep **Closest** (the default) or switch to **Priority** and rank the enemy types with ▲ / ▼. The spire shoots the highest-ranked type in range first, then the closest of that type; multishot follows the same order. The starting order is Healer, Boss, Splitter, Shielded, Ranged, Tank, Fast, Basic.
- **Shorter targeting lines:** in clean mode the line is now a short stub off each enemy being shot at, pointing back at the spire, instead of a line all the way from the spire.
- **Hits are easier to see:** an enemy that's hit lights up solid in its own colour with a bright outline, then fades back.

## 1.16.2 — 2026-11-20
- **Ending a run yourself no longer auto-restarts it.** You stay on the end screen until you pick a tier and start again. Auto-restart still kicks in when the spire falls.

## 1.16.1 — 2026-11-20
- A run you end yourself now says "Ended on wave X" instead of "Fell on wave X".

## 1.16.0 — 2026-11-20
- **Clean shot effects at high speed:** from 8× up, the flicker of hundreds of shots is replaced by a faint, steady line from the spire to each enemy it's shooting at, plus a quick flash on each enemy it hits. Only crit and super crit damage numbers pop up, and kill particles are thinned out. Choose Auto, Full or Clean under Settings → Shot effects.
- **Hit flashes at every speed:** enemies briefly light up when they take a hit.

## 1.15.9 — 2026-11-20
- Distance rings space out (100, 200 or 500 m) when the view is small or far out, so their labels never overlap, e.g. on phones.

## 1.15.8 — 2026-11-20
- **More room to see enemies coming:** the arena zooms out further as your range grows. The space around your range ring goes from 15% at the start to 50% by 510 m of range, so you can watch enemies walk in from the top and bottom too.

## 1.15.7 — 2026-11-20
- **Enemies spawn off-screen:** each enemy starts just past the edge of your screen in its direction (or 35% beyond your range, whichever is farther), so on wide screens the ones coming from the sides start a little farther out instead of appearing in view. They still fade in.

## 1.15.6 — 2026-11-20
- **Enemies spawn much farther out:** 35% beyond your range (was 15%), so they have real travel time before they reach it.
- **They walk in from off-screen:** the view now fits your range ring rather than the spawn ring, so enemies enter from beyond the edge, and any that spawn in view fade in instead of popping up.

## 1.15.5 — 2026-11-20
- The version number moved to a small, faint label in the arena's bottom-right corner (tap it to see what's new).

## 1.15.4 — 2026-11-20
- Version number shown next to the Spire name.

## 1.15.3 — 2026-11-20
- **Distance rings every 100 m,** labelled along the crosshair, so you can read range at a glance.
- **Smooth zoom:** as your range grows mid-run, the arena eases out to show more of the map (the spawn ring always stays 15% beyond your range; enemies already on the field keep their positions).

## 1.15.2 — 2026-11-20
- **The spawn ring scales with your range:** enemies spawn 15% beyond your range (never closer than 335 m), so even a very long range keeps a sensible approach.
- **Range upgrades now go up to 600 m** (was 340 m).

## 1.15.1 — 2026-11-20
- **Bounce range is capped at 40% of your range,** so shots no longer bounce across the whole map. The upgrade shows "max" at the cap, and the cap grows as your range does.
- **Enemies always spawn beyond your range:** the spawn ring stays outside your range, and the arena zooms out to fit, so you can't out-range the spawn.

## 1.15.0 — 2026-11-20
- **Shards are earned offline too,** at your best shards per game-hour (from tier 2+ runs of at least 2 game-minutes), with the same speed and Lab bonuses as offline coins. The welcome-back screen, Workshop, start screen and Lifetime stats show the shard rate.

## 1.14.0 — 2026-11-20
- **New coin drops:** Basic 2, Fast / Ranged / Tank 3, elites 5, bosses 10 (before the wave, tier and coin-bonus multipliers).
- **The tier coin multiplier is front and centre:** it grows ×2.2 per tier (×4.84 on tier 3, ×10.6 on tier 4…) and now shows on the tier buttons, the start screen and the enemy panel, so it's clear higher tiers are worth farming.
- **Enemy coins:** the enemy table has a Coins column with what each enemy drops on the current wave, your coin bonus included.
- **Better start screen:** pick a tier and see its enemy health and attack, coin and shard multipliers, your best wave, best coins per hour, runs and offline rate, with shortcuts to the Workshop, Records and How to play.
- **Shards now come from kills:** instead of dropping from enemies, shards are paid when a run ends on tier 2 or higher, based on how many enemies you killed. Higher tiers multiply it (×1.5 per tier). The Paused card shows what you'll get so far.
- **Pause, then end:** pausing now shows a Paused card with your run so far, Resume, and End run (tap twice to confirm).

## 1.13.0 — 2026-11-20
- **Cards are now Equipment,** with a new look: your equipped items sit in glowing slots at the top, and the armory below shows each item as a tile with its own icon.
- **Equipment only adds new abilities now.** Second Wind and Wave Rush stay. The cards that only raised a stat (Sharpshooter, Rapid Fire, Eagle Eye, Lucky Shot, Fortify, Mending, Bounty, Prospector) and Frost Field (saved for a future ultimate weapon) are gone, and **every chip you spent on them is refunded**.
- **Higher upgrade caps instead:** attack speed now goes up to 25/s (was 10), crit chance to 100% (was 80%) and range to 340 (was 300), so upgrades can take those stats further. Damage, health, regen, cash and coins were already uncapped.
- **Distances are in metres:** range, bounce shot range, knockback force and enemy speed (m/s) now show an "m", and damage per distance is per metre.
- **The top bar no longer jumps around:** it has a fixed two-row layout (currencies and buttons on top, enemy stats and health below), and numbers keep a steady width as they change.

## 1.12.0 — 2026-11-20
- **New Attack upgrades:**
  - **Multishot chance / targets:** a chance for each shot to also fire at more enemies in range (1 extra to start, up to 8).
  - **Bounce shot chance / targets / range:** a chance for a shot to hop on to a nearby enemy after it hits (1 bounce to start, up to 8), and how far it can hop.
  - **Super crit chance / damage:** a chance for a crit to be multiplied again (×2 to start). Super crits show in red.
  - **Damage per distance:** extra damage for every unit between the spire and its target, so far-off enemies take more.
- **New Defense upgrades:**
  - **Barrier health:** a shield, sized as a share of your max health, that soaks up damage before your health does. It shows as a blue ring around the spire and a strip under the health bar.
  - **Barrier regen:** how fast the barrier refills, as a share of its size per second.
  - **Lifesteal:** heals the spire by a share of the damage its shots deal.
  - **Death defy chance:** a chance to shrug off a hit that would destroy the spire ("defied" pops up).
  - **Knockback chance / force:** a chance for your hits to shove enemies away from the spire. Heavier enemies (higher ⚖ weight) get pushed less, and bosses barely move.
- **New Utility upgrades:** free Attack, Defense and Utility upgrade chances. Each in-run level you buy in that section (by hand or with auto-buy) has that chance to cost nothing.
- The Scatter Cannon module now adds to your multishot chance.
- Lifetime stats count multishot volleys, shot bounces, super crits, knockbacks, deaths defied, free upgrades, lifesteal healing and damage absorbed by the barrier.

## 1.11.0 — 2026-11-20
- **Upgrades and Workshop are split into Attack, Defense and Utility sections** with a switcher under the ×1 / ×10 / Max buttons, so each list is short. Each tab remembers its section after a refresh. Auto-buy toggles show for the section you're looking at.

## 1.10.1 — 2026-11-20
- The **Wave bonus** upgrade is now called **Cash interest**: the cash you get at the start of every wave. Your upgrade levels carry over.

## 1.10.0 — 2026-11-20
- **Much bigger offline earnings:** time away now counts as if the game were running at your fastest unlocked speed (8× to start, up to 24× with Overdrive), instead of 1×. Lab Offline speed multiplies that further. The Workshop shows your rate per real hour.

## 1.9.0 — 2026-11-20
- **🃏 Cards:** 11 perks bought with **chips**, which bosses drop: Sharpshooter, Rapid Fire, Eagle Eye, Lucky Shot, Fortify, Mending, Frost Field (slows enemies in range), Second Wind (survive one killing blow per run), Wave Rush (shorter waves), Bounty and Prospector. Equip 3 at a time (buy up to 6 slots) and level each to 5 stars.
- **⚙️ Modules:** gear for 4 slots (Cannon, Armor, Core, Generator), 2 to choose from in each, bought and levelled with **alloy**, which elites drop. Each level adds a stat; every 10 levels the module ranks up from Common to Rare, Epic and Legendary, strengthening its special effect (bonus damage to elites and bosses, extra shots, defense, thorns, crit damage, slowing hits, more drops, or interest on your cash).
- Both are bought directly, with no random draws, and can be swapped any time, even mid-run. New Cards and Modules tabs sit next to the Lab.
- **The side panel remembers** which tab you were on and your ×1 / ×10 / Max choice after a refresh.
- The Workshop's offline-rate note is now just the rate; the details moved to the ? help.

## 1.8.0 — 2026-11-20
- **📊 Lifetime stats:** the 🕘 button now has a Lifetime stats tab next to Battle history: time played, waves cleared, coins (from runs and offline), recent and best coins per hour, cash, shards, damage dealt and taken, thorns damage, enemies, elites and bosses destroyed, shots and crits, shield blocks, upgrades and research bought, coins and shards spent, plus a best-wave / runs / coins table for each tier. Runs, kills and best waves include your past play; everything else counts from today.

## 1.7.0 — 2026-11-20
- **🕘 Battle history:** a new clock button at the top right (and a button on the end-of-run screen) lists your last 30 runs: tier, wave, date, coins, coins per hour, shards, kills and run time. Runs that set a new best wave are tagged, the best coins-per-hour run gets a ★, and runs you ended yourself say so. Runs played before this update aren't in the list.

## 1.6.0 — 2026-11-20
- **Better enemy info** (tap the Enemy stats in the top bar):
  - **Wave info** now shows each enemy's chance to spawn, plus a wave summary: time left, how many enemies have spawned, how many are on the field, the next boss, and how much enemies grow per wave and per tier.
  - **Your spire** is a new tab with your current stats side by side: damage per second, health and every upgrade value.

## 1.5.0 — 2026-11-20
- **Enemy stats in the top bar:** see this wave's enemy ♥ health, ⚔ attack, » speed and ⚖ weight at a glance. Tap it for a table of every enemy type, which updates as the waves go by and shows when locked types arrive.
- **New stat, weight:** heavier enemies shove lighter ones aside in a crowd (a Tank won't be pushed around by Fast enemies, and nothing moves a Boss). Future knockback will use it too.

## 1.4.0 — 2026-11-20
- **Update banner:** when a new version of Spire is published, a banner at the top says so. Tap it to refresh into the new version (your progress is saved first). It warns you if a run is in progress, since refreshing ends it. Tap ✕ to hide it until the next update.
- The health ring around the spire is gone. Health is shown in the bar at the top.

## 1.3.0 — 2026-11-20
- **Smoother shots at high speed:** shots now leave a short streak behind them instead of jumping, and a shot that lands within a single frame (common at 12× and up) shows a quick fading tracer, so you can always see your spire firing.
- **One Upgrades tab:** Attack, Defense and Utility are now sections of a single Upgrades tab, laid out like the Workshop. The side panel has three tabs: Upgrades, Workshop and Lab.
- Auto-buy toggles sit next to each section's heading.

## 1.2.0 — 2026-11-20
- **Enemy ranks:** enemies are now Normal, Elite or Boss, and the ? help groups them that way.
- **3 new Elite enemies,** a few per wave from wave 15:
  - 🛡️ **Shielded** (blue octagon): a ring shield blocks its first 3 hits completely.
  - ➕ **Healer** (green cross): every second, heals enemies around it by 10% of their max health.
  - ⭐ **Splitter** (magenta star): breaks into 3 Fast enemies when it dies.
- **Every enemy has its own shape and colour.** Tanks are now orange pentagons (they were squares like Basic), and the boss is red.
- **No more stacking:** enemies push each other apart instead of piling onto one spot, and they're drawn as outlines with a light fill so you can tell them apart in a crowd.
- Hits absorbed by a shield show "block".

## 1.1.0 — 2026-11-20
- **⚙️ Settings moved** to a gear button at the top right, so the upgrade tabs fit without side-scrolling.
- **? How to play:** a new button next to the gear explains runs, waves, tiers, currencies and upgrades, and shows every enemy type with when it appears and what it does.
- **💎 Shards, a new currency for the Lab:** Lab research now costs shards instead of coins. Shards only drop from enemies on tier 2 and up, with 1.5× more on each tier after that. Coins are now only for the Workshop. Research you already bought is kept.
- The Settings key hint now shows the right speed keys once Overdrive unlocks more of them.

## 1.0.1 — 2026-11-20
- **Version number in Settings:** the bottom of the Settings tab shows the game version and links to this page.
- Behind the scenes: the game is now split into several files, so future updates are easier to make. Nothing changes in how it plays, and your save carries over.

## 1.0.0 — 2026-11-20
- **First release:** a lone spire against waves of geometric enemies, with in-run upgrades, the Workshop, the Lab, tiers, auto-restart, offline earnings and save backup codes.
