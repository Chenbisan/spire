// Spire — balance and content tables. Tweak numbers here.
// Game version — bump it (and add a CHANGELOG.md entry) with every published update
const APP_VERSION='1.54.0';
const CHANGELOG_URL='https://github.com/chenbisan/spire/blob/main/CHANGELOG.md';
// ================= CONFIG: tweak everything here =================
const CFG={
  step:1/60, waveLen:30, spawnLen:15,  // a wave lasts waveLen game s: enemies spawn during the first spawnLen s, then a break until the next wave
  arenaR:100, spawnR:110, spawnRatio:1.35, viewRatio:[1.15,1.5,510], fadeIn:.5,  // viewRatio: the view fits range × this, growing from [0] at the base range to [1] at [2] m so there's room to see enemies walk in
  offscreen:25,  // offscreen: how far past the screen edge enemies spawn (m)
   // spawn ring 35% beyond your range; the view fits range ×1.12 so enemies walk in from off-screen; new enemies fade in (game s)
  towerR:14, bulletSpd:420, ebSpd:120,
  tierUnlockWave:2500,                     // reach this wave to unlock the next tier (a quarter of the way to the final wave)
  // tier multipliers are powers of the tier, not exponential, so tiers 20 to 100 stay sane. coin: tier³ (×8 at tier 2, ×1,000 at
  // tier 10); enemy health tier^3.5 grows a little faster, so each tier asks for more power than it pays for; drops (chips, alloy) tier^1.5
  tier:t=>({hp:t**3.5,dmg:t**3,coin:t**3,shard:t<2?0:(t-1)**1.5,wt:t**1.2,spd:1+.03*(t-1),drop:t**1.5}),
  // enemy growth is polynomial, not exponential: a spire's power grows like a power of what it earns (exponential prices
  // cancel exponential effects), so enemies grow the same way. hpMul/dmgMul: multiplier on wave w (1 on wave 1)
  hpMul:w=>(1+(w-1)/10)**4, dmgMul:w=>(1+(w-1)/10)**3,
  wtMul:w=>(1+(w-1)/50)**.75,  // weight grows too (×2.4 by wave 100, ×10 by 1000, ×53 by 10000), so knockback, Shockwave and Gravity Well move high-wave enemies less
  hitRamp:1.03,  // each attack an enemy makes does this much more than its previous one (×1.34 by the 10th hit, ×18 by the 100th), so enemies can't linger forever
  protectR:40, protectShare:.5,  // Protectors: radius they guard (m) and the share of redirected damage they take
  fromPow:1.2,  // enemy types arrive at ET from ÷ tier^fromPow, and their pool's chance builds up to POOLS full ÷ tier^fromPow
  guardEvery:3,  // Protectors' guard links are refreshed every this many steps
  chargeAt:.9,  // a Charger stops to charge once it's this far inside your range (share of range)
  splitSz:.75,  // each smaller Splitter is this much the size of its parent
  healCd:5,  // an enemy can be healed at most once every this many game seconds
  finalWave:10000,  // reaching this wave stops all spawning; destroying every enemy left clears the tier (the run ends as a win)
  enemyCap:5000,  // most enemies on the field at once (each type also has its own cap, ET cap); spawns past it are skipped
  // enemies per wave: steps up every 10 waves, by less and less (28 at wave 101, 70 at 1001), and stops growing at lateWave (156 from wave 6000)
  spawnCount:w=>10+Math.floor(6*Math.sqrt(Math.floor((Math.min(w,CFG.lateWave)-1)/10))),
  // from lateWave to finalWave the mix shifts towards elites: Normal and Veteran spawn chances fall to lateNormal × and Elite and Super Elite ones rise to lateElite ×
  // (about 25% Normal + Veteran / 75% Elite + Super Elite by the final wave, from about 50 / 50)
  lateWave:6000, lateNormal:.5, lateElite:1.5,
  waveCash:w=>6+w*3,
  killCash:w=>2*(1+w*.05), killCoin:w=>3.5*(1+w*.03),  // per-kill rewards (× the enemy's own cash/coin); fewer, tougher enemies per wave than before, so each pays more and higher waves pay much more
  shardPerKill:.2,           // shards paid when a run ends = kills × this × tier shard multiplier (tier 2+ only)
  offlineMinRun:120,         // a run must last this many game seconds to set the offline rate
  offlineMinAway:60,          // offline cap and speed come from the Lab
  histMax:30,                // battle history keeps this many runs
  bossEvery:10, maxDmgNums:50, maxParts:240,
  defyFx:900,  // death defied effect length (real ms)
  hpFill:[.6,.4,.22,.06],  // enemy fill opacity by health band: >75%, >50%, >25%, below
  // hit flash length (real ms)
  hitFlash:180,
  tracerLife:.12, maxTracers:300, streakMax:90,   // shot streaks: real seconds a landed shot's trail lingers; longest drawn trail
  sepGap:.9, sepPush:.8, restSteps:3, walkMin:.3, sepChecks:400, sepEveryOther:800, simBudget:20, nearR:60, dotHz:10, boltsDrawn:20, // nearR: a retargeting shot looks this far through the grid first; dotHz: damage-over-time ultimates (Laser, Gravity Well) apply damage this many times per game second // restSteps: a fully blocked enemy waits this many steps before checking for room again; walkMin: slow movers step once they've built up this many metres // sepChecks: safety cap on neighbours checked per enemy per step; simBudget: max ms of simulation per frame
          // enemies keep (sum of sizes × sepGap) apart; sepPush = how hard they shove per step
};
// stat: base, ra = per in-run level, wa/wm = per workshop level, c/w = [cost, growth]
// min: the stat can't go below this (for stats that shrink as you upgrade) · t: shown as m:ss
const ST=[
 {k:'damage',g:'Attack',n:'Damage',base:3,mul:1,ra:.35,wm:1.08,c:[4,1.14],w:[12,1.2]},
 {k:'aspd',g:'Attack',n:'Attack speed',base:1,ra:.06,wa:.03,max:25,c:[6,1.16],w:[15,1.22],u:'/s'},
 {k:'crit',g:'Attack',n:'Crit chance',base:.02,ra:.01,wa:.005,max:1,c:[8,1.15],w:[20,1.25],p:1},
 {k:'critMult',g:'Attack',n:'Crit damage',base:1.5,ra:.1,wa:.05,c:[10,1.15],w:[20,1.22],x:1},
 {k:'superCrit',g:'Attack',n:'Super crit chance (of crits)',base:0,ra:.01,wa:.005,max:.8,c:[20,1.18],w:[40,1.25],p:1},
 {k:'superMult',g:'Attack',n:'Super crit damage',base:2,ra:.1,wa:.05,c:[20,1.17],w:[40,1.22],x:1},
 {k:'range',g:'Attack',n:'Range',base:30,ra:3,wa:2,max:600,c:[8,1.16],w:[25,1.25],u:' m'},
 {k:'dmgDist',g:'Attack',n:'Damage per distance',base:0,ra:.0005,wa:.0003,max:.02,c:[15,1.17],w:[30,1.25],p:1,u:' per m'},
 {k:'multiChance',g:'Attack',n:'Multishot chance',base:0,ra:.01,wa:.005,max:.8,c:[15,1.17],w:[30,1.25],p:1},
 {k:'multiTargets',g:'Attack',n:'Multishot targets',base:1,ra:1,wa:1,max:8,c:[60,2.5],w:[200,3]},
 {k:'bounceChance',g:'Attack',n:'Bounce shot chance',base:0,ra:.01,wa:.005,max:.8,c:[15,1.17],w:[30,1.25],p:1},
 {k:'bounceTargets',g:'Attack',n:'Bounce shot targets',base:1,ra:1,wa:1,max:8,c:[60,2.5],w:[200,3]},
 {k:'bounceRange',g:'Attack',n:'Bounce shot range',base:60,ra:3,wa:2,maxOfRange:.4,c:[12,1.16],w:[25,1.22],u:' m'},
 {k:'health',g:'Defense',n:'Health',base:30,mul:1,ra:.4,wm:1.08,c:[4,1.14],w:[12,1.2]},
 {k:'regen',g:'Defense',n:'Regen',base:.4,mul:1,ra:.4,wm:1.08,c:[6,1.15],w:[15,1.2],u:'/s'},
 {k:'barrier',g:'Defense',n:'Barrier health (of max health)',base:0,ra:.02,wa:.01,max:1,c:[12,1.16],w:[30,1.25],p:1},
 // barrier recharge: once broken, the barrier comes back at full after this many game seconds (key kept from the old regen stat so saves keep their levels)
 {k:'barrierRegen',g:'Defense',n:'Barrier recharge time',base:300,ra:-4,wa:-3,min:30,c:[10,1.16],w:[25,1.25],t:1},
 {k:'defense',g:'Defense',n:'Defense',base:0,ra:.01,wa:.005,max:.75,c:[10,1.16],w:[25,1.25],p:1},
 {k:'thorns',g:'Defense',n:'Thorns (of attacker max HP)',base:0,ra:.02,wa:.01,max:.5,c:[12,1.17],w:[30,1.25],p:1},
 {k:'deathDefy',g:'Defense',n:'Death defy chance',base:0,ra:.005,wa:.003,max:.5,c:[20,1.2],w:[40,1.28],p:1},
 {k:'lifesteal',g:'Defense',n:'Lifesteal (of damage dealt)',base:0,ra:.002,wa:.001,max:.2,c:[20,1.2],w:[40,1.28],p:1},
 {k:'kbChance',g:'Defense',n:'Knockback chance',base:0,ra:.01,wa:.005,max:.8,c:[12,1.16],w:[25,1.25],p:1},
 {k:'kbForce',g:'Defense',n:'Knockback force (÷ enemy weight)',base:10,mul:1,ra:.05,wm:1.04,c:[15,1.2],w:[40,1.28],u:' m'}, // grows by % with no cap, so it can keep up with ever heavier high-wave and high-tier enemies; its price climbs faster than other stats (×1.28 per Workshop level) so high levels take high-tier earnings
 {k:'cashBonus',g:'Utility',n:'Cash per kill',base:1,ra:.05,wa:.04,c:[10,1.15],w:[20,1.2],x:1},
 {k:'waveCash',g:'Utility',n:'Cash interest',base:1,ra:.1,wa:.08,c:[10,1.15],w:[20,1.2],x:1},
 {k:'coinBonus',g:'Utility',n:'Coins per kill',base:1,ra:.03,wa:.05,c:[15,1.17],w:[25,1.2],x:1},
 {k:'freeAttack',g:'Utility',n:'Free attack upgrade chance',base:0,ra:.01,wa:.005,max:.5,c:[15,1.18],w:[30,1.25],p:1},
 {k:'freeDefense',g:'Utility',n:'Free defense upgrade chance',base:0,ra:.01,wa:.005,max:.5,c:[15,1.18],w:[30,1.25],p:1},
 {k:'freeUtility',g:'Utility',n:'Free utility upgrade chance',base:0,ra:.01,wa:.005,max:.5,c:[15,1.18],w:[30,1.25],p:1},
 {k:'startCash',g:'Utility',n:'Starting cash',base:0,wa:25,ws:1,w:[20,1.2]},
];
const SK=Object.fromEntries(ST.map(s=>[s.k,s]));
// Lab: meta upgrades, paid in shards, applied instantly
const LAB=[
 {k:'offSpd',n:'Offline speed',d:'Multiplies your offline earnings: +15% per level.',max:10,c:[20,1.6],val:l=>1+.15*l,f:v=>'×'+v.toFixed(2)},
 {k:'offCap',n:'Offline duration',d:'Offline earnings count for up to 24 h, plus 4 h per level.',max:12,c:[15,1.5],val:l=>24+4*l,f:v=>v+'h'},
 {k:'speed',n:'Overdrive',d:'Each level unlocks the next game speed: 12×, then 16×, then 24×.',max:3,c:[200,5],val:l=>[8,12,16,24][l],f:v=>'up to '+v+'×'},
 {k:'disc',n:'Workshop discount',d:'Every Workshop upgrade costs 2% fewer coins per level (up to 30% at level 15).',max:15,c:[30,1.5],val:l=>.02*l,f:v=>'−'+Math.round(v*100)+'%'},
 {k:'auto',n:'Auto-buyer',d:'Adds an auto-buy toggle to each section (Attack, Defense, Utility) of the Upgrades tab. Buys the cheapest upgrade first.',max:1,c:[150,1],val:l=>l,f:v=>v?'unlocked':'locked'},
];
const LK=Object.fromEntries(LAB.map(l=>[l.k,l]));
// Enemy shapes as unit polygons (scaled by sz). Used by the canvas and the Help icons.
const regPoly=(n,r,rot=0)=>Array.from({length:n},(_,i)=>{const a=rot+i*2*Math.PI/n;return[Math.cos(a)*r,Math.sin(a)*r]});
const SHAPES={
 square:[[-1,-1],[1,-1],[1,1],[-1,1]],
 triangle:[[1.3,0],[Math.cos(2.4),Math.sin(2.4)],[Math.cos(2.4),-Math.sin(2.4)]], // points along +x
 diamond:[[0,-1.2],[1,0],[0,1.2],[-1,0]],
 pentagon:regPoly(5,1.1,-Math.PI/2),
 octagon:regPoly(8,1.08,Math.PI/8),
 cross:[[-.36,-1.1],[.36,-1.1],[.36,-.36],[1.1,-.36],[1.1,.36],[.36,.36],[.36,1.1],[-.36,1.1],[-.36,.36],[-1.1,.36],[-1.1,-.36],[-.36,-.36]],
 chevron:[[1.3,0],[-.6,1],[-.15,0],[-.6,-1]], // points along +x (an arrowhead)
 crest:[[0,-1.15],[1,-.75],[.85,.45],[0,1.2],[-.85,.45],[-1,-.75]], // a heater shield
 star:Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?.55:1.3;return[Math.cos(a)*r,Math.sin(a)*r]}),
 hexagon:regPoly(6,1),
};
// enemy ranks (ET r): 1 Normal (Basic), 2 Veteran (Fast, Ranged, Tank), 3 Elite (Shielded, Healer, Splitter), 4 Super Elite (Charger, Protector), and Boss on its own
const RK={NORMAL:1,VETERAN:2,ELITE:3,SUPER:4,BOSS:5};
const RANKS=['','Normal','Veteran','Elite','Super Elite','Boss'];
const isElite=d=>d.r===RK.ELITE||d.r===RK.SUPER, isBoss=d=>d.r===RK.BOSS;
// spawn chance per rank pool: once the pool's first type arrives it has a freq chance per spawn, building up to fmax by wave full
// (full is ÷ tier^CFG.fromPow like arrivals). The pool's chance is split evenly between its types that have arrived; Normal (Basic) takes what's left
// coins each enemy drops, per rank (before the wave, tier and coin bonus multipliers)
const RANK_COIN={[RK.NORMAL]:2,[RK.VETERAN]:3,[RK.ELITE]:5,[RK.SUPER]:8,[RK.BOSS]:10};
const POOLS={
 [RK.VETERAN]:{freq:.15, fmax:.45, full:300},
 [RK.ELITE]:{freq:.04, fmax:.32, full:2400},
 [RK.SUPER]:{freq:.04, fmax:.18, full:5400},
};
// ghost: ignores collision (walks through others, and others through it) · r: rank · sh: shape · c: colour token (--eN) · rot: 'face' points at the spire, 'spin' rotates
// cap: most of this type on the field at once · from: first wave on tier 1 (sooner on higher tiers: from ÷ tier^CFG.fromPow) · spawn chances
// are per rank, see POOLS · weight: resists being pushed (crowds now, knockback later) · n/d: shown in Help
const ET={
 basic:{n:'Basic',r:1,d:'Walks straight in and hits the spire once a second.',hp:4,dmg:1,spd:24,weight:1,sz:7,cash:1,sh:'square',c:'e1',cap:1700},
 fast:{n:'Fast',r:2,d:'',hp:2.5,dmg:.8,spd:46,weight:0.6,sz:6,cash:1,sh:'triangle',rot:'face',c:'e2',from:10,cap:1000},
 ranged:{n:'Ranged',r:2,d:'Stops at 90% of your range, just inside your reach, and fires a shot at the spire every 2 s. Each shot that lands triggers your Thorns on it.',hp:3.5,dmg:2.04,spd:20,weight:0.9,sz:7,cash:2,sh:'diamond',c:'e4',from:100,stopPct:.9,shoot:1,cap:500},
 tank:{n:'Tank',r:2,d:'',hp:18,dmg:2.5,spd:13,weight:3,sz:12,cash:4,sh:'pentagon',c:'e3',from:40,cap:800},
 shielded:{n:'Shielded',r:3,d:'Its shield (the ring) blocks the first 3 hits completely, crits included. Every hit removes one charge however strong it is, so more shots per second break it faster.',hp:10,dmg:1.3,spd:18,weight:2,sz:10,cash:6,sh:'octagon',c:'e6',from:250,shield:3,cap:400},
 healer:{n:'Healer',r:3,d:'Never attacks: it stops 50 m from the spire (or at 90% of your range if that\'s closer) and sits there. Every 15 s, heals enemies within 25 m for half its own max health, but never more than a quarter of the target\'s max health. Each enemy can be healed once every 5 s, and Healers can\'t heal each other.',hp:8,dmg:0,stop:50,stopPct:.9,spd:20,weight:1.2,sz:9,cash:6,sh:'cross',c:'e7',from:500,heal:.5,healR:25,healEvery:15,healMax:.25,cap:200},
 splitter:{n:'Splitter',r:3,d:'Splits into 2 smaller Splitters with half its health when it dies, and each of those splits once more (7 in all). Each smaller one pays half the coins and cash of the one it split from, and only the first drops alloy.',hp:12,dmg:1.5,spd:22,weight:1.6,sz:10,cash:6,sh:'star',c:'e8',from:800,split:2,splits:2,cap:400},
 charger:{n:'Charger',r:4,d:'Immovable: nothing can push or pull it. It walks into your range, charges up for 3 s, then rams the spire for 10× its attack, and keeps hitting from there. It ignores the crowd: it walks and rams straight through other enemies.',hp:16,dmg:2,spd:16,weight:3,sz:11,cash:6,sh:'chevron',rot:'face',c:'e9',from:1200,immov:1,ghost:1,charge:3,ram:10,ramSpd:160,cap:300},
 protector:{n:'Protector',r:4,d:'Guards its friends: damage aimed at any enemy within 40 m of it hits the Protector instead, which takes only half. Protectors don\'t guard each other. Kill it first to get at the rest.',hp:20,dmg:1.5,spd:18,weight:2.5,sz:11,cash:6,sh:'crest',c:'e10',from:1800,protect:1,cap:200},
 boss:{n:'Boss',r:5,d:'',hp:150,dmg:6,spd:9,weight:20,stop:30,edge:1,barrage:10,barrageEvery:10,spike:.25,spikeFlight:1.6,spikeFan:75,spikeOut:50,sz:22,cash:60,sh:'hexagon',rot:'spin',c:'e5',cap:25}
};
const TYPES=Object.keys(ET);
for(const k of TYPES)ET[k].coin=RANK_COIN[ET[k].r]; // coins are per rank
// descriptions with exact ratios to a Basic (the same on every wave and tier, since both scale alike)
{const B=ET.basic,x=v=>+v.toFixed(2)+'×',pc=v=>Math.round(v*100)+'%';
  ET.fast.d=`Moves ${x(ET.fast.spd/B.spd)} as fast as a Basic, with ${pc(ET.fast.hp/B.hp)} of its health and ${pc(ET.fast.dmg/B.dmg)} of its attack.`;
  ET.tank.d=`Moves at ${pc(ET.tank.spd/B.spd)} of a Basic's speed, with ${x(ET.tank.hp/B.hp)} its health, ${x(ET.tank.dmg/B.dmg)} its attack and ${x(ET.tank.weight/B.weight)} its weight.`;
  {const b=ET.boss;b.d=`Arrives every ${CFG.bossEvery}th wave, with ${x(b.hp/B.hp)} a Basic's health, ${x(b.dmg/B.dmg)} its attack and ${x(b.weight/B.weight)} its weight, moving at ${pc(b.spd/B.spd)} of its speed. It stops when its near edge is ${b.stop} m from the spire's centre (so a new spire can reach it) and as soon as it arrives, and every ${b.barrageEvery} s after, launches ${b.barrage} spikes from its back that fan out and curve in on the spire. Each spike deals ${pc(b.spike)} of its attack (${x(b.spike*b.barrage)} its attack per barrage), and spikes don't trigger Thorns.`}}
// ================= Cards and Modules =================
const PC=v=>{const p=+(v*100).toFixed(1);return(p<10?p:Math.round(p))+'%'};
// drops: chips from bosses (Cards), alloy from elites (Modules); both grow with wave and tier
const DROPS={chips:(w,t)=>2*(1+w/20)*CFG.tier(t).drop, alloy:(w,t)=>(1+w/50)*CFG.tier(t).drop};
// Equipment: items that add a mechanic (not plain stats; those come from upgrades). Bought with chips (boss drops),
// equipped into slots, levelled to 5 stars. v = value per star. (Internally still save.cards / CARDS so old saves load.)
const CARD={buy:10, up:[10,20,40,80], slots0:2, slotCost:[40,120,300]}; // up[i]: star i+1 → i+2; slotCost: 3rd, 4th, 5th slot
const CARDS=[
 {k:'wind',n:'Second Wind',col:'acc',icon:'<path d="M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.6 12 20 12 20z"/><path d="M8 12.5h2.2l1.2-2.5 1.6 4.5 1.2-2h1.8"/>',
  v:[60,75,90,105,120],f:v=>`once per run, a killing blow is cancelled and the spire is invincible for ${v} s`,fx:(F,v)=>F.revive=Math.max(F.revive,v)}, // v: invincible game seconds
 {k:'rush',n:'Wave Rush',col:'gold',icon:'<path d="M3 6l7 6-7 6z"/><path d="M12 6l7 6-7 6z"/><path d="M21 5v14"/>',
  v:[.05,.1,.15,.2,.25],f:v=>`waves are ${PC(v)} shorter`,fx:(F,v)=>F.rush=Math.max(F.rush,v)},
];
// Modules: one per slot, bought and levelled with alloy. Every 10 levels the rarity goes up (an ascension, costing CFG×ascend),
// which raises the module's special effect. main: stat bonus per level (mul = +per×lvl %, add = flat).
const RARITY=['Common','Rare','Epic','Legendary'];
const MOD={buy:30, cost:l=>Math.ceil(8*1.15**l), ascend:4, per:10, max:40};
const MOD_SLOTS=[{k:'cannon',n:'Cannon'},{k:'armor',n:'Armor'},{k:'core',n:'Core'},{k:'gen',n:'Generator'}];
const MODS=[
 {k:'rail',s:'cannon',n:'Rail Cannon',st:'damage',per:.03,mul:1,sp:[.1,.25,.5,1],sf:v=>`+${PC(v)} damage to elites and bosses`,fx:(F,v)=>F.eliteDmg+=v},
 {k:'scatter',s:'cannon',n:'Scatter Cannon',st:'aspd',per:.015,mul:1,sp:[.05,.1,.2,.3],sf:v=>`+${PC(v)} multishot chance`,fx:(F,v)=>F.multi+=v},
 {k:'bulwark',s:'armor',n:'Bulwark',st:'health',per:.04,mul:1,sp:[.02,.04,.07,.1],sf:v=>`+${PC(v)} defense`,fx:(F,v)=>F.add.defense+=v},
 {k:'spiked',s:'armor',n:'Spiked Plate',st:'regen',per:.04,mul:1,sp:[.03,.06,.1,.15],sf:v=>`+${PC(v)} thorns`,fx:(F,v)=>F.add.thorns+=v},
 {k:'luckc',s:'core',n:'Lucky Core',st:'crit',per:.003,sp:[.1,.25,.5,1],sf:v=>`+×${v} crit damage`,fx:(F,v)=>F.add.critMult+=v},
 {k:'stasis',s:'core',n:'Stasis Core',st:'range',per:1,sp:[.1,.2,.3,.4],sf:v=>`hits slow the target by ${PC(v)} for 1 s`,fx:(F,v)=>F.slowHit=Math.max(F.slowHit,v)},
 {k:'mint',s:'gen',n:'Mint',st:'coinBonus',per:.02,mul:1,sp:[.1,.2,.35,.5],sf:v=>`+${PC(v)} shards, chips and alloy`,fx:(F,v)=>F.drop+=v},
 {k:'vault',s:'gen',n:'Vault',st:'cashBonus',per:.03,mul:1,sp:[.01,.02,.03,.05],sf:v=>`each wave, also earn ${PC(v)} of the cash you're holding (up to 5× your cash interest payout)`,fx:(F,v)=>F.interest+=v},
];
const CK=Object.fromEntries(CARDS.map(c=>[c.k,c])),MK=Object.fromEntries(MODS.map(m=>[m.k,m]));
// ================= Ultimate weapons =================
// Bought and upgraded with chips (shared with Equipment). Every owned ultimate is active; each fires on its cooldown,
// automatically or (per ultimate) when you tap its button.
// Each has 4 upgrade tracks of ULT.levels levels, laid out in bands of ULT.band levels, one band per tier (20 tiers for now;
// raise ULT.levels to add bands for later tiers). Level l sits in band x = 1 + l/band:
//   - a level costs ULT.cost(l) = c0 × x^1.5 chips, the same curve as chip income across tiers (drops grow tier^1.5),
//     so the band for a tier costs about what farming that tier earns (~16 game-hours for all five ultimates' bands at wave ~1000);
//   - strength tracks (pow: damage, Force, Pull) have all ULT.levels levels and grow base × x^pow, keeping up with that tier's
//     enemy health and weight;
//   - capped stats (chance, slow, cooldowns, durations) have their own short track (lv) in natural steps from base to end
//     (e.g. Max slow 30% → 95% in 5% steps). Level i is priced like the 100-level track at the same point in the tier bands,
//     × √(100 / lv), so each level is a big step and the price climbs fast (ultCost in ults.js).
// cost: each ultimate's price multiplier (unlock and every level). The more impactful ones cost more, so choosing what to save for matters.
// Medals come from how complete an ultimate is (average progress across its 4 tracks, ULT.medals: 10% / 30% / 60%).
const ULT={levels:100, band:5, c0:200, medals:[.1,.3,.6], chainJump:70, chainDepth:8, chainMax:40, unlock:50, laserTurn:Math.PI/60, laserTurnFast:Math.PI/30, noHeal:5, missileSpd:45, missileTurn:3.5, missileTrail:18, shellFlight:1.2, heat:.25, spreadFire:.5, bomblets:2, bombletR:120, execute:.15, salvo:3, mStack:1.25, maxWells:3, collapse:1.5, siphon:.5, heavy:1.5, aftershock:1, gravSample:64, frostPer:.05, freeze:5, melt:.02, bossWt:.1, shaken:5, ringTime:.5, crush:1, spreadR:25};  // Firebomb: shellFlight, seconds a firebomb is in the air; heat, extra damage per second an enemy stays on the carpet (Gold doubles it); spreadFire, size and duration of Silver's new fires as a share of the carpet's. Missiles: missileSpd (m/s); missileTurn, how fast a missile can turn (rad/s, sharpening by 100% per second chasing a target); missileTrail, positions kept for its smoke trail; bomblets and bombletR, Silver's bomblets and how far they look; execute, Gold's health share; salvo, Platinum's missiles per launch; mStack, Platinum's damage multiplier per earlier missile hit on the same enemy. Laser: laserTurn / laserTurnFast, how fast the beam tracks at Silver / Platinum (radians per s); noHeal, Gold's no-healing time. Gravity Well: maxWells open at once; collapse, Silver's yank = this many seconds of pull; siphon, Gold's seconds added per kill inside; heavy, Platinum's weight multiplier inside. Shockwave: bossWt, bosses count this share of their weight; shaken, seconds the shake lasts; ringTime, game seconds the ring takes to reach its radius; crush, Silver's extra multiplier for an enemy that couldn't move at all; spreadR, how far Gold's Aftershock spreads the shake (m); frostPer: slow per frost stack; freeze: Frost Field Silver freeze (game s); melt: Frost Field Platinum, chance per 10 m an enemy shot travels inside the field to melt
ULT.cost=l=>Math.ceil(ULT.c0*(1+l/ULT.band)**1.5);
const PC1=v=>(v*100).toFixed(1).replace(/\.0$/,'')+'%'; // ultimate percentages keep a decimal so every level shows its gain
// track levels before the 1.23 rework (old saves are converted proportionally, keeping each track's value)
// Frost Field's old Duration and Cooldown were removed in 1.23 (chips spent on them are refunded; old cost was 10×1.6^level)
const ULT_OLD_LV={chain:{chance:10,jumps:4,mult:10,dmg:20},frost:{slow:10,radius:10,dur:10,cd:12},shock:{force:10,stun:12,radius:10,cd:10},grav:{radius:10,pull:10,dur:10,cd:12},laser:{dmg:20,width:10,dur:12,cd:12}};
const S1=v=>(+v.toFixed(1))+' s';
const ULTS=[
 {k:'chain',cost:1.5,n:'Chain Lightning',col:'bolt',d:()=>`Your shots have a ${PC1(uv('chain','chance'))} chance to spark a bolt that splits from enemy to enemy like lightning. Each bounce deals ${PC1(1-uv('chain','mult'))} less damage than the one before.`,passive:1, // d can be a function: descriptions show your current numbers
  icon:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  t:[{k:'chance',lv:10,n:'Proc chance (to start and to split)',base:.1,end:.6,f:v=>PC1(v)},{k:'jumps',lv:8,n:'Bounce targets',base:2,end:6,f:v=>`splits into ${+v.toFixed(1)}`},
     {k:'mult',lv:10,n:'Bounce multiplier',base:.4,end:.9,f:v=>PC1(1-v)+' less damage per bounce'},{k:'dmg',n:'Damage',base:2,pow:1.2,f:v=>`×${fmt(v)} spire damage`}],
  sb:'bolts can crit and super crit, using your spire\'s crit chance, crit damage, super crit chance and super crit damage', gb:'every bolt hits each enemy twice (double bolt damage)', pb:'bolts slow what they hit by 50% for 2 s'},
 {k:'frost',cost:1.25,n:'Frost Field',col:'alloy',d:()=>`Always on. ${+uv('frost','rate').toFixed(2)} times a second, every enemy inside the field (${PC1(uv('frost','radius'))} of your range around the spire) gains a frost stack. Each stack slows it by ${PC1(ULT.frostPer)}, up to ${PC1(uv('frost','slow'))} in total, and makes it take +${(v=>+(v*100).toFixed(3)+'%')(uv('frost','brittle'))} damage from everything. Stacks never wear off.`,passive:1,aura:1,
  icon:'<path d="M12 2v20M4.9 7l14.2 10M4.9 17 19.1 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>',
  t:[{k:'slow',lv:13,n:'Max slow',base:.3,end:.95,f:v=>PC1(v)+` (${Math.ceil(v/ULT.frostPer-1e-9)} stacks)`},{k:'rate',lv:14,n:'Tick rate',base:.5,end:4,f:v=>(+v.toFixed(2))+' ticks/s'},
     {k:'radius',lv:14,n:'Radius',base:.6,end:2,f:v=>PC1(v)+' of range'},{k:'brittle',lv:18,n:'Brittle',base:.002,end:.02,f:v=>`+${(v*100).toFixed(3).replace(/0+$/,'')}% damage taken per stack`}],
  sb:'enemies freeze solid for 5 s the first time they reach max slow', gb:'frozen enemies take double brittle damage', pb:'enemy shots inside the field have a 2% chance to melt for every 10 m they travel'},
 {k:'shock',cost:0.75,n:'Shockwave',col:'gold',d:()=>`Every ${S1(uv('shock','cd'))}, a ring bursts out from the spire to ${PC1(uv('shock','radius'))} of your range. Each enemy it reaches is shoved ${fmt(uv('shock','force'))} m outward, divided by the enemy's weight (the crowd can stop it), and shaken for ${ULT.shaken} s: a shaken enemy takes damage × (${+uv('shock','dmg').toFixed(2)} × its weight) from everything, never less than ×1. Bosses count only ${PC1(ULT.bossWt)} of their weight.`,
  icon:'<circle cx="12" cy="12" r="2.5"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17M20.5 3.5a12 12 0 0 1 0 17"/>',
  t:[{k:'force',n:'Force',base:40,pow:2,f:v=>fmt(v)+' m (÷ weight)'},{k:'dmg',lv:18,n:'Shake multiplier',base:.5,end:5,f:v=>`×${+v.toFixed(2)} × enemy weight damage taken`},
     {k:'radius',lv:8,n:'Radius',base:.6,end:1,f:v=>PC1(v)+' of range'},{k:'cd',lv:15,n:'Cooldown',base:90,end:15,f:S1}],  // 5 s steps, fastest 15 s
  sb:'Crush: an enemy the crowd stops from being pushed all the way is shaken harder, up to double the multiplier if it couldn\'t move at all', gb:'Aftershock: when a shaken enemy dies, the shake spreads to enemies within 25 m for the time it had left', pb:'Echo: a second ring follows 1 s later'},
 {k:'grav',cost:1,n:'Gravity Well',col:'shard',d:()=>`Every ${S1(uv('grav','cd'))} (counted from when the last well opened), opens a well on the spot in your range with the most enemies within ${fmt(uv('grav','radius'))} m that aren't already in a well. For ${S1(uv('grav','dur'))} it pulls every enemy within ${fmt(uv('grav','radius'))} m towards its centre at ${fmt(uv('grav','pull'))} m/s, divided by the enemy's weight. Up to ${ULT.maxWells} wells can be open at once; once Duration reaches Cooldown there's always one up.`,
  icon:'<circle cx="12" cy="12" r="2"/><path d="M12 4a8 8 0 1 1-8 8"/><path d="M12 8a4 4 0 1 1-4 4"/>',
  t:[{k:'radius',lv:10,n:'Radius',base:50,end:150,f:v=>(+v.toFixed(1))+' m'},{k:'pull',n:'Pull',base:70,pow:2,f:v=>fmt(v)+' m/s (÷ weight)'},
     {k:'dur',lv:10,n:'Duration',base:10,end:60,f:S1},{k:'cd',lv:12,n:'Cooldown',base:300,end:60,f:S1}],
  sb:`Collapse: when a well ends, it yanks every enemy within twice its radius towards its centre, as far as ${ULT.collapse} s of its pull would move them`, gb:'Siphon: every enemy that dies inside a well adds 0.5 s to it (up to double its duration), so wells can overlap', pb:'Heavy core: enemies inside a well count as 50% heavier, so Shockwave shakes them harder and knockback can\'t push them back out'},
 {k:'laser',cost:1.5,n:'Laser',col:'hot',d:()=>`Every ${S1(uv('laser','cd'))}, fires a ${fmt(uv('laser','width'))} m wide beam for ${S1(uv('laser','dur'))} at the enemy with the most health (the biggest number, not the biggest share), chosen once when it fires. Every enemy the beam touches takes ×${fmt(uv('laser','dmg'))} spire damage per second.`,
  icon:'<circle cx="5" cy="12" r="2.5"/><path d="M8 12h14"/><path d="M8 9.5l3 1M8 14.5l3-1"/>',
  t:[{k:'dmg',n:'Damage',base:3,pow:1.2,f:v=>`×${fmt(v)} spire damage /s`},{k:'width',lv:12,n:'Width',base:10,end:40,f:v=>(+v.toFixed(1))+' m'},
     {k:'dur',lv:12,n:'Duration',base:3,end:15,f:S1},{k:'cd',lv:12,n:'Charge time',base:60,end:12,f:S1}],
  sb:`Tracking: while firing, the beam slowly turns, up to ${Math.round(ULT.laserTurn*180/Math.PI)}° per second, to follow the enemy it locked on to; only when that enemy dies does it lock on to the enemy with the most health at that moment`, gb:'Cauterize: enemies the beam hits can\'t be healed for 5 s', pb:`Lock-on: the beam turns up to ${Math.round(ULT.laserTurnFast*180/Math.PI)}° per second (${+(ULT.laserTurnFast/ULT.laserTurn).toFixed(2)}× faster), and enemies inside it are slowed by 50%`},
 {k:'missile',cost:1.25,n:'Missiles',col:'chip',d:()=>`Every ${S1(uv('missile','cd'))}, fires a slow missile (${ULT.missileSpd} m/s) that homes in on the enemy with the least health. It deals ×${fmt(uv('missile','dmg'))} spire damage to every enemy within ${fmt(uv('missile','radius'))} m of where it hits, plus a bonus for the health its target is missing: +${PC1(uv('missile','low'))} at 0% health, +${PC1(uv('missile','low')/2)} at 50%, scaling evenly in between.`,
  icon:'<path d="M14.5 4.5c2.5-1 4.6-1 5 .1.4 1-.6 3.2-3 5.5l-6 6-3-3z"/><path d="M8.5 10.5 5 11l-2 3 3.5.5M13.5 15.5 13 19l-3 2-.5-3.5"/><path d="m6.5 17.5-2 2"/>',
  t:[{k:'dmg',n:'Missile damage',base:5,pow:1.2,f:v=>`×${fmt(v)} spire damage`},{k:'cd',lv:12,n:'Cooldown',base:15,end:3,f:S1},
     {k:'radius',lv:10,n:'Blast radius',base:20,end:70,f:v=>(+v.toFixed(1))+' m'},{k:'low',lv:10,n:'Low-health bonus',base:1,end:5,f:v=>`up to +${Math.round(v*100)}% at 0% health`}],
  sb:`Cluster: each blast throws ${ULT.bomblets} bomblets at the ${ULT.bomblets} weakest other enemies within ${ULT.bombletR} m, each for 50% of the missile damage`, gb:'Execute: a missile kills any non-boss target below 15% health outright', pb:'Salvo: fires 3 missiles at once, at the 3 weakest enemies, and every missile hit on an enemy makes the next one against it 25% stronger (compounding)'},
 {k:'firebomb',cost:1,n:'Firebomb',col:'fire',d:()=>`Every ${S1(uv('firebomb','cd'))}, lobs a firebomb at the enemy that has stood still the longest. It leaves a flaming carpet with a ${fmt(uv('firebomb','radius'))} m radius for ${S1(uv('firebomb','dur'))}. Anything on it takes ×${fmt(uv('firebomb','dmg'))} spire damage per second, +${PC1(ULT.heat)} for every second it has ever spent on a carpet. The bonus never resets, even if it steps off or reaches another carpet later.`,
  icon:'<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-3.2 2.2-5 3.5-7.5.6 1.6 1.6 2.6 2.6 3 .2-2.8 1.4-5.6 3.9-7.5-.3 2.8.8 4.6 2 6.3 1 1.5 1.5 3 1.5 4.7 0 4-2.9 7-7 7z"/><path d="M12 21c-1.7 0-3-1.2-3-3 0-1.6 1.3-2.6 2-4 .9 1.6 4 2.4 4 4.2 0 1.6-1.3 2.8-3 2.8z"/>',
  t:[{k:'dmg',n:'Fire damage',base:1,pow:1.2,f:v=>`×${fmt(v)} spire damage /s`},{k:'radius',lv:7,n:'Carpet radius',base:15,end:50,f:v=>(+v.toFixed(1))+' m'},
     {k:'cd',lv:10,n:'Cooldown',base:12,end:2,f:S1},{k:'dur',lv:8,n:'Carpet duration',base:4,end:12,f:S1}],
  sb:`Spreading flames: an enemy that dies on the carpet sets the ground where it fell alight (a carpet with ${PC1(ULT.spreadFire)} of the radius, for ${PC1(ULT.spreadFire)} of the time)`, gb:'Searing: burning builds up twice as fast (+50% for every second on the carpet)', pb:'Carpet bombing: 2 firebombs per launch, at the 2 stillest enemies'}
];
const MEDALS=['','Silver','Gold','Platinum'];
for(const u of ULTS)for(const t of u.t){if(!t.lv)t.lv=ULT.levels;t.cm=u.cost} // lv: strength tracks get the full banded length; cm: the ultimate's price multiplier
// ================= Milestones =================
// Paid once per tier, the first time you reach each wave. Most sit in the first 1000 waves; the last one is the final wave.
// Rewards are worth `mult` waves of that wave's income (coins, plus alloy, chips, and shards from tier 2), so later ones pay more.
const MILESTONES=[10,13,16,20,25,30,40,50,60,75,100,125,150,200,250,300,400,500,600,750,1000,1250,1500,2000,2500,3000,4000,5000,7500,10000];
const MS={mult:25, final:5}; // final: the last milestone (clearing the tier) pays this many times more
function msReward(w,t,i){const tm=CFG.tier(t),n=CFG.spawnCount(w),k=MS.mult*(i===MILESTONES.length-1?MS.final:1);
  return{coins:Math.round(k*n*4*CFG.killCoin(w)*tm.coin),alloy:Math.round(k*n*.15*DROPS.alloy(w,t)),chips:Math.round(k*.3*DROPS.chips(w,t)),shards:tm.shard?Math.round(k*n*CFG.shardPerKill*tm.shard):0}}
const UK=Object.fromEntries(ULTS.map(u=>[u.k,u]));
