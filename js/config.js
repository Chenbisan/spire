// Spire — balance and content tables. Tweak numbers here.
// Game version — bump it (and add a CHANGELOG.md entry) with every published update
const APP_VERSION='1.28.0';
const CHANGELOG_URL='https://github.com/chenbisan/spire/blob/main/CHANGELOG.md';
// ================= CONFIG: tweak everything here =================
const CFG={
  step:1/60, waveLen:30, spawnLen:15,  // a wave lasts waveLen game s: enemies spawn during the first spawnLen s, then a break until the next wave
  arenaR:320, spawnR:335, spawnRatio:1.35, viewRatio:[1.15,1.5,510], fadeIn:.5,  // viewRatio: the view fits range × this, growing from [0] at the base range to [1] at [2] m so there's room to see enemies walk in
  offscreen:25,  // offscreen: how far past the screen edge enemies spawn (m)
   // spawn ring 35% beyond your range; the view fits range ×1.12 so enemies walk in from off-screen; new enemies fade in (game s)
  towerR:14, bulletSpd:420, ebSpd:120,
  tierUnlockWave:25,                       // reach this wave to unlock the next tier
  tier:t=>({hp:4**(t-1),dmg:3**(t-1),coin:2.2**(t-1),  // coin: the tier coin multiplier, exponential so higher tiers pay off
           shard:t<2?0:1.5**(t-2),wt:1.6**(t-1),spd:1.08**(t-1)}),  // wt/spd: enemies are heavier (×10 at tier 6) and faster (×1.47 at tier 6) on higher tiers
  // enemy growth is polynomial, not exponential: a spire's power grows like a power of what it earns (exponential prices
  // cancel exponential effects), so enemies grow the same way. hpMul/dmgMul: multiplier on wave w (1 on wave 1)
  hpMul:w=>(1+(w-1)/10)**4, dmgMul:w=>(1+(w-1)/10)**3,
  wtMul:w=>(1+(w-1)/50)**.75,  // weight grows too (×2.4 by wave 100, ×10 by 1000, ×53 by 10000), so knockback, Shockwave and Gravity Well move high-wave enemies less
  finalWave:10000,  // reaching this wave stops all spawning; destroying every enemy left clears the tier (the run ends as a win)
  enemyCap:5000,  // most enemies on the field at once (each type also has its own cap, ET cap); spawns past it are skipped
  spawnCount:w=>10+Math.floor(6*Math.sqrt(Math.floor((w-1)/10))),  // enemies per wave: steps up every 10 waves, by less and less (29 at wave 100, 70 at 1000, 200 at 10000); harder waves come from the mix, see ET freq
  waveCash:w=>6+w*3,
  killCash:w=>2*(1+w*.05), killCoin:w=>3.5*(1+w*.03),  // per-kill rewards (× the enemy's own cash/coin); fewer, tougher enemies per wave than before, so each pays more and higher waves pay much more
  shardPerKill:.2,           // shards paid when a run ends = kills × this × tier shard multiplier (tier 2+ only)
  offlineMinRun:120,         // a run must last this many game seconds to set the offline rate
  offlineMinAway:60,          // offline cap and speed come from the Lab
  histMax:30,                // battle history keeps this many runs
  bossEvery:10, maxDmgNums:50, maxParts:240,
  defyFx:900,  // death defied effect length (real ms)
  hpFill:[.6,.4,.22,.06],  // enemy fill opacity by health band: >75%, >50%, >25%, below
  cleanFxAt:8, hitFlash:180, beamHold:150, beamLen:.07,  // beamLen: stub length as a share of the view radius   // Auto shot effects switch to clean at this game speed; hit flash length (real ms)
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
 {k:'range',g:'Attack',n:'Range',base:110,ra:3,wa:2,max:600,c:[8,1.16],w:[25,1.25],u:' m'},
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
 {k:'kbForce',g:'Defense',n:'Knockback force (÷ enemy weight)',base:10,mul:1,ra:.05,wm:1.04,c:[12,1.16],w:[25,1.22],u:' m'}, // grows by % with no cap, so it can keep up with ever heavier high-wave and high-tier enemies
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
 {k:'offSpd',n:'Offline speed',d:'Multiplies your offline earnings.',max:10,c:[20,1.6],val:l=>1+.15*l,f:v=>'×'+v.toFixed(2)},
 {k:'offCap',n:'Offline duration',d:'How long offline earnings keep counting.',max:12,c:[15,1.5],val:l=>24+4*l,f:v=>v+'h'},
 {k:'speed',n:'Overdrive',d:'Unlocks faster game speeds.',max:3,c:[200,5],val:l=>[8,12,16,24][l],f:v=>'up to '+v+'×'},
 {k:'disc',n:'Workshop discount',d:'Cheaper workshop upgrades.',max:15,c:[30,1.5],val:l=>.02*l,f:v=>'−'+Math.round(v*100)+'%'},
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
 star:Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?.55:1.3;return[Math.cos(a)*r,Math.sin(a)*r]}),
 hexagon:regPoly(6,1),
};
const RANKS=['','Normal','Elite','Boss'];
// r: rank · sh: shape · c: colour token (--eN) · rot: 'face' points at the spire, 'spin' rotates
// cap: most of this type on the field at once · from: first wave · freq: spawn chance on that wave, growing by fg per wave up to fmax (higher waves bring more tanks and elites) · weight: resists being pushed (crowds now, knockback later) · bar: (unused; health shows as fill) · n/d: shown in Help
const ET={
 basic:{n:'Basic',r:1,d:'Walks straight in and hits the spire once a second.',hp:4,dmg:1,spd:24,weight:1,sz:7,cash:1,coin:2,sh:'square',c:'e1',cap:1700},
 fast:{n:'Fast',r:1,d:'Twice as quick and fragile. Comes in numbers.',hp:2.5,dmg:.8,spd:46,weight:0.6,sz:6,cash:1,coin:3,sh:'triangle',rot:'face',c:'e2',from:3,freq:.2,cap:1000},
 ranged:{n:'Ranged',r:1,d:'Stops 125 m out, beyond a new spire\'s range, and fires shots at it. Upgrade Range to reach it.',hp:3.5,dmg:1.2,spd:20,weight:0.9,sz:7,cash:2,coin:3,sh:'diamond',c:'e4',from:12,freq:.08,fg:.002,fmax:.15,stop:125,cap:500},
 tank:{n:'Tank',r:1,d:'Slow, with lots of health and a hard hit.',hp:18,dmg:2.5,spd:13,weight:3,sz:12,cash:4,coin:3,sh:'pentagon',c:'e3',from:8,freq:.08,fg:.003,fmax:.25,bar:1,cap:800},
 shielded:{n:'Shielded',r:2,d:'Its shield (the ring) blocks the first 3 hits completely, crits included. Fast attack speed breaks it quickest.',hp:10,dmg:2,spd:18,weight:2,sz:10,cash:6,coin:5,sh:'octagon',c:'e6',from:15,freq:.03,fg:.002,fmax:.15,bar:1,shield:3,cap:400},
 healer:{n:'Healer',r:2,d:'Every second, heals enemies within 70 m by 10% of their max health. Kill it first.',hp:8,dmg:1,spd:20,weight:1.2,sz:9,cash:6,coin:5,sh:'cross',c:'e7',from:18,freq:.03,fg:.0012,fmax:.1,bar:1,heal:.1,healR:70,cap:200},
 splitter:{n:'Splitter',r:2,d:'Breaks into 3 Fast enemies when it dies.',hp:12,dmg:1.5,spd:22,weight:1.6,sz:10,cash:6,coin:5,sh:'star',c:'e8',from:20,freq:.03,fg:.002,fmax:.15,bar:1,split:3,cap:400},
 boss:{n:'Boss',r:3,d:'Arrives every 10th wave. Huge health and damage.',hp:150,dmg:6,spd:9,weight:10,sz:22,cash:60,coin:10,sh:'hexagon',rot:'spin',c:'e5',bar:1,cap:25}
};
const TYPES=Object.keys(ET);
// ================= Cards and Modules =================
const PC=v=>{const p=+(v*100).toFixed(1);return(p<10?p:Math.round(p))+'%'};
// drops: chips from bosses (Cards), alloy from elites (Modules); both grow with wave and tier
const DROPS={chips:(w,t)=>2*(1+w/20)*1.4**(t-1), alloy:(w,t)=>(1+w/50)*1.4**(t-1)};
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
// automatically or (per ultimate) when you tap its button. 4 upgrade tracks each: value = base + per × level (or base × (1 + mul)^level for strength tracks that must keep up with enemy weight), up to lv levels (40-100 small steps).
// Status: Silver = both silverT tracks maxed (for timed ones that's duration + cooldown, which makes them permanent),
// Gold = any 3 tracks maxed (including the Silver pair), Platinum = all 4. Each adds the bonus in sb / gb / pb.
// Each level costs ULT.cost(level, track levels): the price follows how far along the track you are (not the raw level),
// so every track costs about the same to max: ~11.6k chips for the whole track, ~23k for Silver, ~50-60k for Platinum.
const ULT={chainJump:70, chainDepth:8, chainMax:40, unlock:50, c0:10, g:1.1, ref:50, gravMove:5, laserAim:3, aftershock:1, gravSample:64, frostPer:.05, freeze:5};  // frostPer: slow per frost stack; freeze: Frost Field Silver freeze (game s)
ULT.cost=(l,L)=>Math.ceil(ULT.c0*ULT.g**(l*ULT.ref/L));
// track levels before the 1.23 rework (old saves are converted proportionally, keeping each track's value)
// Frost Field's old Duration and Cooldown were removed in 1.23 (chips spent on them are refunded; old cost was 10×1.6^level)
const ULT_OLD_LV={chain:{chance:10,jumps:4,mult:10,dmg:20},frost:{slow:10,radius:10,dur:10,cd:12},shock:{force:10,stun:12,radius:10,cd:10},grav:{radius:10,pull:10,dur:10,cd:12},laser:{dmg:20,width:10,dur:12,cd:12}};
const S1=v=>(+v.toFixed(1))+' s';
const ULTS=[
 {k:'chain',n:'Chain Lightning',col:'bolt',d:'Your shots have a chance to spark a bolt that splits from enemy to enemy like lightning, weaker with every bounce.',passive:1,
  icon:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  t:[{k:'chance',n:'Proc chance (to start and to split)',base:.1,per:.01,lv:50,f:v=>PC(v)},{k:'jumps',n:'Bounce targets',base:2,per:.1,lv:40,f:v=>`splits into ${+v.toFixed(1)}`},
     {k:'mult',n:'Bounce multiplier',base:.4,per:.01,lv:50,f:v=>PC(v)+' damage per bounce'},{k:'dmg',n:'Damage',base:2,per:.2,lv:100,f:v=>`×${+v.toFixed(1)} spire damage`}],
  silverT:['chance','jumps'], sb:'bolts can crit and super crit', gb:'strikes twice', pb:'bolts slow what they hit by 50% for 2 s'},
 {k:'frost',n:'Frost Field',col:'alloy',d:'Always on. On every tick, each enemy touching the field around the spire gains a frost stack. Each stack slows it by 5% (up to your max slow) and makes it brittle: it takes more damage for every stack it carries. Stacks never wear off.',passive:1,aura:1,
  icon:'<path d="M12 2v20M4.9 7l14.2 10M4.9 17 19.1 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>',
  t:[{k:'slow',n:'Max slow',base:.3,per:.013,lv:50,f:v=>PC(v)+` (${Math.ceil(v/ULT.frostPer-1e-9)} stacks)`},{k:'rate',n:'Tick rate',base:.5,per:.07,lv:50,f:v=>(+v.toFixed(2))+' ticks/s'},
     {k:'radius',n:'Radius',base:.6,per:.028,lv:50,f:v=>PC(v)+' of range'},{k:'brittle',n:'Brittle',base:.002,per:.00018,lv:100,f:v=>`+${(v*100).toFixed(2).replace(/0$/,'')}% damage taken per stack`}],
  silverT:['slow','rate'], sb:'enemies freeze solid for 5 s the first time they reach max slow', gb:'enemy shots that enter the field are destroyed', pb:'frozen enemies take double brittle damage'},
 {k:'shock',n:'Shockwave',col:'gold',d:'A blast shoves enemies around the spire outward (heavier ones move less) and stuns them.',
  icon:'<circle cx="12" cy="12" r="2.5"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17M20.5 3.5a12 12 0 0 1 0 17"/>',
  t:[{k:'force',n:'Force',base:40,mul:.04,lv:100,f:v=>fmt(v)+' m (÷ weight)'},{k:'stun',n:'Stun',base:1,per:.05,lv:60,f:S1},
     {k:'radius',n:'Radius',base:.6,per:.008,lv:50,f:v=>PC(v)+' of range'},{k:'cd',n:'Cooldown',base:90,per:-1.4,lv:50,f:S1}],
  silverT:['stun','cd'], sb:'stunned enemies take +25% damage', gb:'the blast also deals 20× spire damage', pb:'an aftershock repeats the blast 1 s later'},
 {k:'grav',n:'Gravity Well',col:'shard',d:'Opens on the biggest cluster of enemies in range and pulls everything nearby into it.',timed:1,
  icon:'<circle cx="12" cy="12" r="2"/><path d="M12 4a8 8 0 1 1-8 8"/><path d="M12 8a4 4 0 1 1-4 4"/>',
  t:[{k:'radius',n:'Radius',base:50,per:1.2,lv:50,f:v=>(+v.toFixed(1))+' m'},{k:'pull',n:'Pull',base:70,mul:.04,lv:100,f:v=>fmt(v)+' m/s (÷ weight)'},
     {k:'dur',n:'Duration',base:10,per:1,lv:50,f:S1},{k:'cd',n:'Cooldown',base:300,per:-4,lv:60,f:S1}],
  silverT:['dur','cd'], sb:'always on (hops to the biggest cluster every 5 s), and enemies inside take +20% damage', gb:'deals 2× spire damage per second to everything inside', pb:'enemies inside are held: they can\'t move or attack'},
 {k:'laser',n:'Laser',col:'hot',d:'Charges up, then fires a beam toward your target that burns every enemy along it.',timed:1,
  icon:'<circle cx="5" cy="12" r="2.5"/><path d="M8 12h14"/><path d="M8 9.5l3 1M8 14.5l3-1"/>',
  t:[{k:'dmg',n:'Damage',base:3,per:.3,lv:100,f:v=>`×${+v.toFixed(1)} spire damage /s`},{k:'width',n:'Width',base:10,per:.4,lv:50,f:v=>(+v.toFixed(1))+' m'},
     {k:'dur',n:'Duration',base:3,per:.2,lv:60,f:S1},{k:'cd',n:'Charge time',base:60,per:-.8,lv:60,f:S1}],
  silverT:['dur','cd'], sb:'always firing (re-aims every 3 s), and the beam ignores shields', gb:'+50% beam damage', pb:'a second beam fires the opposite way'},
];
const MEDALS=['','Silver','Gold','Platinum'];
// ================= Milestones =================
// Paid once per tier, the first time you reach each wave. Most sit in the first 1000 waves; the last one is the final wave.
// Rewards are worth `mult` waves of that wave's income (coins, plus alloy, chips, and shards from tier 2), so later ones pay more.
const MILESTONES=[10,13,16,20,25,30,40,50,60,75,100,125,150,200,250,300,400,500,600,750,1000,1250,1500,2000,2500,3000,4000,5000,7500,10000];
const MS={mult:25, final:5}; // final: the last milestone (clearing the tier) pays this many times more
function msReward(w,t,i){const tm=CFG.tier(t),n=CFG.spawnCount(w),k=MS.mult*(i===MILESTONES.length-1?MS.final:1);
  return{coins:Math.round(k*n*4*CFG.killCoin(w)*tm.coin),alloy:Math.round(k*n*.15*DROPS.alloy(w,t)),chips:Math.round(k*.3*DROPS.chips(w,t)),shards:tm.shard?Math.round(k*n*CFG.shardPerKill*tm.shard):0}}
const UK=Object.fromEntries(ULTS.map(u=>[u.k,u]));
