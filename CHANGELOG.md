# What's new in Spire

## 1.58.0 — 2026-11-25
- **Offline earnings at 60%:** coins, shards and chips earned while the game is closed now pay 60% of what the same time playing at your best rate would (still at your fastest unlocked speed, × Offline speed research), so playing stays worth more than being away hour for hour, until Offline speed research is well along.

## 1.57.0 — 2026-11-25
- **Runs keep going in the background:** a run no longer pauses when you switch tabs or minimise the window; it keeps playing at your chosen speed while the game is open. Offline earnings now cover only the time the game is closed. While the game is open (in a background tab, on the menu or between runs) it earns nothing offline, and offline earnings are paid when you open the game again. On a huge late-game crowd the background run may fall a little behind your chosen speed, as it can on screen.

## 1.56.0 — 2026-11-25
- **Chips are earned offline too:** like coins and shards, your best boss chips per game-hour (from a run of at least the usual minimum length; milestone chips don't count) keeps paying while you're away, at your fastest unlocked speed × Offline speed research, up to your Offline duration. The welcome-back screen, Workshop, start screen and Records show the chip rate. Your rate is set by your next qualifying run.

## 1.55.0 — 2026-11-25
- **Modules are under maintenance:** they're being reworked. For now the Modules tab shows a notice, modules you own give no bonuses, and they can't be bought or levelled. Elites still drop alloy, and it's all saved for when Modules return.

## 1.54.0 — 2026-11-25
- **Laser charge ring:** a thin red ring round the spire fills up over the Laser's whole charge time and empties when the beam fires. It replaces the red glow that flashed on the spire just before each beam, which strobed at high game speeds.
- **Same effects at every speed:** the clean shot-effects mode is gone, along with the Shot effects setting. Shots, hit streaks, kill particles and damage numbers now look the same at 1× and at 24×.

## 1.53.0 — 2026-11-25
- **Missiles turn like missiles:** instead of snapping to face a new target, a missile banks round in an arc (up to about 200° per second at first, tightening the longer it chases so it never circles forever). They also leave a fading smoke trail and have a longer exhaust flame.

## 1.52.0 — 2026-11-25
- **Bosses fight from a distance:** twice as heavy (20× a Basic's weight, was 10×). A Boss stops when its near edge is 30 m from the spire, so a new spire can still reach it. As soon as it arrives, and every 10 s after, it launches 10 spikes from its back that fan out and curve in on the spire. Each spike deals 25% of the Boss's attack (2.5× per barrage), and Bosses no longer hit the spire up close.
- **Thorns works on every enemy attack:** Ranged shots now trigger it on the enemy that fired them, as melee hits and Charger rams already did. Boss spikes are the only exception.
- **Coins are per rank:** every enemy in a rank pays the same: Normal 2, Veteran 3, Elite 5, Super Elite 8 (Chargers and Protectors were 5), Boss 10. The Enemy panel shows coins on each rank's row.

## 1.51.0 — 2026-11-25
- **New enemy ranks:** Normal (Basic), Veteran (Fast, Ranged, Tank), Elite (Shielded, Healer, Splitter), Super Elite (Charger, Protector) and Boss. Elites and Super Elites drop alloy; Rail Cannon's bonus hits Elites, Super Elites and Bosses.
- **Spawn chances are per rank:** each rank has one chance per spawn, shared equally by its types that have arrived. The Enemy panel now groups enemies by rank and shows one % per rank.
- **Waves stop growing at wave 6,000** (156 enemies per wave). From there to wave 10,000 the mix shifts step by step towards Elites and Super Elites: Normal and Veteran chances halve and Elite and Super Elite chances grow 1.5×, ending at about 25% Normal + Veteran and 75% Elite + Super Elite (was about 50 / 50).
- **Laser turns far slower:** Silver tracking now turns at most 3° per second (was 15°) and Platinum at most 6° per second (was 30°).

## 1.50.0 — 2026-11-25
- **Missiles look like missiles:** they're drawn with a pointed nose, tail fins and an exhaust flame, turn to face where they're flying, and are drawn bigger, and fly at half the speed (45 m/s, was 90 m/s) so you can follow them.
- **Firebomb's burn bonus never resets:** every second an enemy spends on any carpet adds +25% (+50% with Gold) to the fire damage it takes, and it keeps that bonus when it steps off, so the next carpet picks up where the last one left off.
- **Laser is slower and more deliberate:** it picks the enemy with the most health once when it fires and stays locked on to it. It only picks a new target when that enemy dies, so it no longer flicks back and forth as health values change.
  - Silver tracking turns the beam at up to 15° per second (was 29°), and Platinum Lock-on at up to 30° per second (was 86°).

## 1.49.1 — 2026-11-25
- **Help gives the real enemy count:** it used to say every 10 waves adds 3 enemies per wave; it now lists the actual counts (10 per wave on waves 1–10, 16 from wave 11, 18 from wave 21, and so on), worked out from the game's own formula.

## 1.49.0 — 2026-11-25
- **No more vague descriptions:** everything now says exactly what it does, with numbers.
  - Every ultimate's description is built from your current upgrades (e.g. Laser: "Every 60 s, fires a 10 m wide beam for 3 s … takes ×3 spire damage per second"), and their Silver / Gold / Platinum bonuses give exact figures (turn speeds, ranges, sizes).
  - Fast, Tank and Boss descriptions give their exact speed, health, attack and weight compared with a Basic; Splitter and Shielded say exactly how they pay out and break.
  - Lab research, the start screen, Modules and the help say exactly how much each thing changes, instead of "faster", "cheaper", "much more" or "a few".
  - The help no longer lists the ultimates' price multipliers.

## 1.48.4 — 2026-11-25
- **Chain Lightning says exactly what it does:** its description now shows your current proc chance and how much less damage each bounce deals (e.g. "Each bounce deals 60% less damage than the one before"), and the Bounce multiplier upgrade reads "60% less damage per bounce".

## 1.48.3 — 2026-11-25
- The Chips and ×1 / ×10 / Max bar at the top of the Ultimates tab now stays in view while you scroll through the ultimates.
- Ultimate descriptions no longer show their price multiplier (prices are unchanged).

## 1.48.2 — 2026-11-21
- **Chargers ignore the crowd:** they walk and ram straight through other enemies, and nothing bumps into them, so every ram reaches the spire. (1.48.1's shoving is gone.) Every other enemy still keeps its distance.

## 1.48.1 — 2026-11-21
- **Smoother with big crowds:** with 3,500 enemies and every ultimate the game now runs almost twice as fast (game speeds up to about 23× hold steady, was about 12×), and about a third faster with 2,000 enemies. Enemies stuck behind the crowd wait instead of re-checking for room every frame, Chargers walk in the same efficient way as everyone else, Protectors refresh who they guard a few times a second instead of every frame, and the Laser looks for its target 10 times a second.
- **Chargers shove the crowd aside:** a ramming Charger now pushes enemies in its way out to the sides instead of ploughing through them. If the crowd is too packed to give way, or another Charger is in the way, the ram stops there and the Charger walks in on foot without its ram hit. Enemies no longer end up overlapping around Chargers.

## 1.48.0 — 2026-11-21
- **🔥 New ultimate, Firebomb:** lobs a firebomb at the enemy that has **stood still the longest**. Where it lands it leaves a **flaming carpet**, and anything standing on it burns harder the longer it stays: +25% damage for every second on it, reset when it steps off. It punishes Ranged enemies, parked Healers, charging Chargers and crowds held up at the spire.
  - Upgrades: **Fire damage** (100 levels, 5 per tier), **Carpet radius** (15 → 50 m), **Cooldown** (12 → 2 s) and **Carpet duration** (4 → 12 s).
  - Medals: **Silver, Spreading flames**, an enemy that dies on the carpet sets the ground where it fell alight · **Gold, Searing**, burning builds up twice as fast · **Platinum, Carpet bombing**, 2 firebombs per launch.

## 1.47.0 — 2026-11-21
- **A fresh spire starts with 30 m of range** (was 110 m), on a smaller field: the view starts at 100 m across and enemies spawn about 110 m out (was 320 m and 335 m). The view still zooms out as your range grows. Range upgrades matter a lot more now.
- **Ranged enemies stop at 90% of your range** (27 m for a fresh spire) instead of a fixed 125 m, so they're always just inside your reach (once one has found its spot it stays there, even if your range grows). To make up for it, their shots hit **70% harder** (2.04× a Basic's attack instead of 1.2×).
- **Healers** stop at 50 m or 90% of your range, whichever is closer, so a short-range spire can still reach them.

## 1.46.0 — 2026-11-21
- **Enemy types arrive much further apart:** on tier 1, Fast from wave 10, Tank 40, Ranged 100, Shielded 250, Healer 500, Splitter 800, Charger 1,200 and Protector 1,800 (they all used to arrive by wave 25). Bosses still come every 10 waves.
- **Higher tiers bring them sooner:** arrival waves are divided by tier^1.2 (÷2.3 on tier 2, ÷7 on tier 5, ÷36 on tier 20), so Protectors show up around wave 780 on tier 2 and wave 50 on tier 20.
- Each type now ramps in gradually after it arrives, reaching its full share by triple its arrival wave. Full shares are trimmed so every type fits: at the deepest waves a wave is about 20% Tanks, 15% Fast, 12% each Ranged, Shielded and Splitters, 10% Chargers, 8% each Healers and Protectors. The enemy table and Help show the arrival wave for your tier.

## 1.45.0 — 2026-11-21
- **🛡 New elite, Protector** (from wave 25): guards its friends. Damage aimed at any enemy within 40 m of it hits the Protector instead, which takes only half of it. A faint ring shows the area it guards. Protectors don't guard each other, and Missiles' Execute still goes straight through. Kill it first to get at the rest.

## 1.44.0 — 2026-11-21
- **⚡ New elite, Charger** (from wave 22): **immovable**, so knockback, Shockwave, Gravity Well and crowds can't move it (Shockwave still shakes it). It walks into your range, **charges up for 3 s** (a ring fills around it), then **rams the spire for 10× its attack** and keeps hitting from there. Kill it while it charges.
- **Healers no longer attack:** they stop 50 m from the spire and sit there healing, so they can't die to Thorns.
- **Shielded** enemies hit a little softer (1.3 instead of 2).

## 1.43.0 — 2026-11-21
- **🚀 New ultimate, Missiles:** fires a missile that homes in on the enemy with the **least health** and hits harder the more of its health is missing. Everything within the blast radius takes the same damage. Built for finishing off the wounded.
  - Upgrades: **Missile damage** (100 levels, 5 per tier), **Cooldown** (15 → 3 s), **Blast radius** (20 → 70 m) and **Low-health bonus** (up to +100% → +500% damage on a target at 0% health).
  - Medals: **Silver, Cluster**, each blast throws 2 bomblets at the next weakest enemies nearby for 50% damage · **Gold, Execute**, a missile kills any non-boss target below 15% health outright · **Platinum, Salvo**, 3 missiles at once at the 3 weakest enemies, and every missile hit on an enemy makes the next one against it 25% stronger (compounding).
  - Prices ×1.25.

## 1.42.0 — 2026-11-21
- **🔴 Laser is the boss killer:** when fully charged it fires at the enemy with the **most health** (the biggest number, not the biggest share), and burns everything along the beam.
  - **Silver, Tracking:** while firing, the beam turns to follow whichever living enemy has the most health.
  - **Gold, Cauterize:** enemies the beam hits can't be healed for 5 s.
  - **Platinum, Lock-on:** the beam turns 3× faster, and enemies inside it are slowed by 50%.
  - Gone: always firing at Silver, ignoring shields, +50% damage and the second beam. Duration and Charge time now always matter.

## 1.41.0 — 2026-11-21
- **Splitters split into Splitters:** when one dies it breaks into **2 smaller Splitters with half its health**, and each of those splits once more into 2 with half again (7 in all), instead of 3 Fast enemies. Each split is smaller and pays half the coins and cash, and only the first one drops alloy. Chain Lightning is the answer.

## 1.40.0 — 2026-11-21
- **🌀 Gravity Well reworked:**
  - **No more always-on at Silver.** Its cooldown now starts when a well opens, so Duration and Cooldown matter: once Duration matches Cooldown (both 60 s at max) there's always a well up.
  - **Up to 3 wells at once,** each on a different cluster of enemies.
  - **Silver, Collapse:** when a well ends, it yanks every enemy within twice its radius towards its centre.
  - **Gold, Siphon:** every enemy that dies inside a well adds 0.5 s to it, up to double its duration, so wells overlap and a 2nd or 3rd can open.
  - **Platinum, Heavy core:** enemies inside a well count as 50% heavier: Shockwave shakes them harder and knockback can't push them back out.
  - The old Silver (+20% damage inside), Gold (2× spire damage per second) and Platinum (enemies held in place) are gone.

## 1.39.0 — 2026-11-21
- **Shockwave reworked into a utility ultimate:**
  - The blast is now a **ring that travels out from the spire** to its radius, catching each enemy as it passes.
  - It no longer stuns. Every enemy the ring reaches is **shaken for 5 s**: it takes damage × (the **Shake multiplier** × its weight) from everything. A ×3 multiplier on a weight-30 enemy means it takes 90× damage from your shots and ultimates. Tanks that shrug off knockback are exactly what it's for. **Bosses resist:** only 10% of a boss's weight counts.
  - Cooldown now goes down to **15 s** (was 20 s), in 15 steps of 5 s.
  - The Stun upgrade is replaced by the **Shake multiplier** (×0.5 → ×5 in 18 steps); chips you spent on Stun are refunded.
  - New medals: **Silver, Crush**: an enemy the crowd stops from being pushed all the way is shaken harder, up to double the multiplier if it couldn't move at all · **Gold, Aftershock**: when a shaken enemy dies, the shake spreads to enemies within 25 m for the time it had left, so kills snowball · **Platinum, Echo**: a second ring follows 1 s later (the old aftershock).

## 1.38.0 — 2026-11-21
- **Enemies hit harder the longer they live:** every hit or shot an enemy lands does **3% more** than its previous one (×1.34 by its 10th attack, ×18 by its 100th). Enemies parked at the spire, or kept alive by Healers or a stalled fight, get dangerous fast, so kill them quickly.

## 1.37.0 — 2026-11-21
- **Frost Field medals reworked:** destroying every enemy shot made Ranged enemies harmless, so:
  - **Gold** is now *frozen enemies take double brittle damage* (was Platinum).
  - **Platinum** is now *enemy shots inside the field have a 2% chance to melt for every 10 m they travel* (was Gold, where every shot was destroyed). A shot crossing 100 m of field melts about 18% of the time.

## 1.36.0 — 2026-11-21
- **Stronger ultimates cost more:** each ultimate now has its own price, for unlocking and for every level. **Chain Lightning** and **Laser** ×1.5, **Frost Field** ×1.25, **Gravity Well** ×1, **Shockwave** ×0.75. Save up for a big one, or spread your chips across cheaper ones to push higher sooner. Each ultimate shows its price multiplier when you open it.

## 1.35.0 — 2026-11-21
- **Ultimate upgrades come in natural steps:** capped stats no longer share the same long track. Each has a handful of big steps, and the price climbs fast:
  - Max slow 30% → 95% in 13 steps of 5% · Proc chance and Bounce multiplier in 5% steps · Bounce targets +0.5 a step · Tick rate +0.25/s · Frost radius +10% of range · Brittle +0.1% per stack.
  - Shockwave: Stun +0.25 s, Radius +5% of range, Cooldown −5 s · Gravity Well: Radius +10 m, Duration +5 s, Cooldown −20 s · Laser: Width +2.5 m, Duration +1 s, Charge time −4 s.
  - Strength upgrades (Chain Lightning and Laser damage, Shockwave Force, Gravity Well Pull) keep their 100 levels, 5 per tier.
- **Medals by how complete an ultimate is** (the average of its 4 upgrades): **Silver at 10%, Gold at 30%, Platinum at 60%**.
- Your levels convert so every ultimate stays at least as strong as before.

## 1.34.0 — 2026-11-21
- **Ultimate upgrades hit harder:** each upgrade now has **100 levels** (5 per tier) instead of 400, so every level does 4× as much: proc chance +0.5 points a level instead of +0.125, damage upgrades about +25% a level early on instead of +6%. Each level costs more to match (a tier's band costs about 65% more than before).
- Percentages on ultimate upgrades show a decimal, so every level visibly changes.
- Medals scale with the shorter tracks: **Silver at 40, Gold at 120, Platinum at 240** total levels (of 400).
- Your levels convert so every ultimate stays at least as strong as before.

## 1.33.0 — 2026-11-21
- **⚡ Ultimates rebuilt for the long game:** every upgrade now has **400 levels**, in bands of 20 (one per tier, 20 tiers for now). A band costs about what farming its tier earns in chips, so your ultimates grow with the tier you farm instead of maxing out early.
  - Strength upgrades (Chain Lightning and Laser damage, Shockwave Force, Gravity Well Pull) keep growing band after band to keep up with each tier's tougher, heavier enemies.
  - Other upgrades (chances, slow, radius, durations, cooldowns) move evenly towards their final value over all 400 levels.
  - **Medals no longer need maxed upgrades:** they come from the total levels across an ultimate's 4 upgrades: **Silver at 160, Gold at 480, Platinum at 960** (of 1,600).
  - Your current levels convert so every ultimate is exactly as strong as before.
- **Tier scaling that lasts to tier 20 and beyond:** tier multipliers now grow as powers of the tier instead of multiplying every tier. Enemy health tier^3.5 (×11 on tier 2, ×128 on tier 4, ×36k on tier 20), attack tier³, weight tier^1.2, speed +3% per tier, chip and alloy drops tier^1.5, shards (tier − 1)^1.5.

## 1.32.0 — 2026-11-21
- **Next tier at wave 2,500** (was 5,000). Farming a lower tier to get stronger, then pushing a higher one, is part of the game.
- **Higher tiers pay much more, sooner:** the tier coin multiplier is now tier³ instead of ×2.2 per tier: ×8 coins on tier 2 (was ×2.2), ×27 on tier 3 (×4.8), ×125 on tier 5 (×23), ×1,000 on tier 10. It keeps growing without running away exponentially, so it still makes sense at tier 20 and beyond.

## 1.31.0 — 2026-11-21
- **Healers reworked:** a big pack of Healers could keep a crowd alive forever. Now:
  - They pulse **every 15 s** (was every second) and reach **25 m** (was 70 m).
  - Each pulse heals a **flat amount**, half of the Healer's own max health, instead of 10% of the target's, and **never more than a quarter** of the target's max health. Tanks and bosses with huge health pools barely notice a heal.
  - Each enemy can be healed **at most once every 5 s**, however many Healers are around.
  - Healers **can't heal each other** (or themselves).

## 1.30.0 — 2026-11-21
- **♻ Respec anything, free:** try a build, and if it doesn't work out, get everything back.
  - **Workshop:** each section (Attack, Defense, Utility) has a *Refund all* button that resets its upgrades and returns all the coins.
  - **Ultimates:** each ultimate has *Refund upgrades*, which returns every chip spent on its levels (it stays unlocked).
  - **Equipment** and **Modules:** each owned item has a *Refund* button that returns everything spent on it.
  - Tap once to see the amount, tap again to confirm. Works any time, even mid-run.

## 1.29.0 — 2026-11-21
- **Tiers unlock much later:** the next tier now unlocks at **wave 5,000** (half way to a tier's final wave) instead of wave 25, so each tier is a long climb and pushing deep is how you earn: higher waves spawn more enemies, more of them are tanks and elites, and every kill pays more. Tiers you've already unlocked stay unlocked.

## 1.28.0 — 2026-11-21
- **🏁 Every tier has a finish line:** **wave 10,000** is the last. Once you reach it nothing more spawns, and you clear the tier by **destroying every enemy left** on the field (the top bar counts them down). Holding the crowd off isn't enough. The run ends as a win, and cleared tiers are marked in your records.
- **🏆 Milestones:** 30 per tier, from wave 10 to wave 10,000 (most of them in the first 1,000 waves). The first time you reach one on a tier, you get coins, alloy and chips, plus shards from tier 2. Later milestones pay more, and the final one, paid for clearing the tier, pays 5× extra. See **Records → Milestones**.
- **New difficulty curve:** enemies get tougher quickly at first and more gently later (polynomial instead of a fixed % per wave), so a stronger spire keeps pushing further instead of hitting a sudden wall. The wave info shows how much tougher the next wave is.
- **Enemies get heavier:** weight now grows with the wave too (×2.4 by wave 100, ×10 by wave 1,000, ×53 by wave 10,000), so knockback, Shockwave and Gravity Well push high-wave enemies around much less. A strong spire can no longer keep a crowd at bay forever with knockback alone.
- **Higher tiers bring heavier, faster enemies:** each tier up multiplies enemy weight by 1.6 and speed by 1.08 (×10 weight and ×1.47 speed at tier 6), on top of health and attack.
- **Push power keeps up:** Shockwave **Force** and Gravity Well **Pull** now have 100 levels that each add 4% (×50 by the last level), and **Knockback force** grows 4% per Workshop level with no cap (it used to stop at 120 m), so it stays useful however heavy enemies get on high tiers. To balance that, its price climbs faster than other stats (×1.28 per Workshop level instead of ×1.22, ×1.2 per run level instead of ×1.16), so high knockback levels take high-tier earnings. Heavier enemies need these pushed further, which is part of moving up a tier. Your current levels convert so nothing gets weaker.
- **Gentler wave sizes:** waves still grow every 10 waves, but by less and less: 29 enemies at wave 100, 70 at wave 1,000, 200 at wave 10,000.
- **Enemy limit:** at most 5,000 enemies on the field, and each type has its own limit (e.g. 1,700 Basic, 200 Healers, 25 Bosses). A spawn whose type is full becomes another type, and nothing spawns while the field is full.

## 1.27.0 — 2026-11-21
- **Waves have a break:** each wave now spawns its enemies over **15 s**, followed by a **15 s break** to clear the field before the next one (30 s per wave in all). The wave bar dims during the break.
- **Fewer enemies, tougher mix:** waves start at 10 enemies and add **3 more every 10 waves** (instead of one or two more every wave). Higher waves bring more Tanks and elites instead: by wave 100 there are no Basic enemies left, and elites make up about 40% of a wave.
- **Better rewards:** each kill pays twice the cash and about 3.5× the coins it used to, growing faster with the wave, and wave cash is up 50%. Since elites pay more and drop alloy, pushing to higher waves pays off much more.
- **Bosses hit less hard:** boss health 250 → 150 and attack 12 → 6 (before wave and tier scaling), so the first bosses are no longer a wall for a new spire.

## 1.26.0 — 2026-11-21
- **Enemies no longer pile on top of each other.** They always keep at least 90% of their combined size apart: an enemy walking into a crowd stops at the wall, or slides sideways into a gap if there is one, instead of pushing into the pack.
- Gravity Well, Shockwave and knockback move enemies only as far as the crowd lets them, so they can't shove enemies through each other either. Shockwave pushes the outermost enemies first, so each one has room to be pushed back.
- Bosses are kept apart from everything around them too (their size used to let some neighbours slip through).

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
