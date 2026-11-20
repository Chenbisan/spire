// Spire — balance and content tables. Tweak numbers here.
// Game version — bump it (and add a CHANGELOG.md entry) with every published update
const APP_VERSION='1.8.0';
const CHANGELOG_URL='https://github.com/chenbisan/spire/blob/main/CHANGELOG.md';
// ================= CONFIG: tweak everything here =================
const CFG={
  step:1/60, waveLen:20, arenaR:320, spawnR:335, towerR:14, bulletSpd:420, ebSpd:120,
  tierUnlockWave:25,                       // reach this wave to unlock the next tier
  tier:t=>({hp:4**(t-1),dmg:3**(t-1),coin:2.2**(t-1),shard:t<2?0:1.5**(t-2)}),
  hpGrow:1.068, dmgGrow:1.05,              // per-wave enemy scaling
  spawnCount:w=>Math.floor(8+w*1.3),
  waveCash:w=>4+w*2,
  killCash:w=>1+w*.05, killCoin:w=>1+w*.02,
  shardRate:.1,              // shards per kill = enemy coin value × this × tier shard mult (tier 2+ only)
  offlineMinRun:120,         // a run must last this many game seconds to set the offline rate
  offlineMinAway:60,          // offline cap and speed come from the Lab
  histMax:30,                // battle history keeps this many runs
  bossEvery:10, maxDmgNums:50, maxParts:240,
  tracerLife:.12, maxTracers:300, streakMax:90,   // shot streaks: real seconds a landed shot's trail lingers; longest drawn trail
  sepGap:.9, sepPush:.5          // enemies keep (sum of sizes × sepGap) apart; sepPush = how hard they shove per step
};
// stat: base, ra = per in-run level, wa/wm = per workshop level, c/w = [cost, growth]
const ST=[
 {k:'damage',g:'Attack',n:'Damage',base:3,mul:1,ra:.35,wm:1.08,c:[4,1.14],w:[12,1.2]},
 {k:'aspd',g:'Attack',n:'Attack speed',base:1,ra:.06,wa:.03,max:10,c:[6,1.16],w:[15,1.22],u:'/s'},
 {k:'crit',g:'Attack',n:'Crit chance',base:.02,ra:.01,wa:.005,max:.8,c:[8,1.15],w:[20,1.25],p:1},
 {k:'critMult',g:'Attack',n:'Crit damage',base:1.5,ra:.1,wa:.05,c:[10,1.15],w:[20,1.22],x:1},
 {k:'range',g:'Attack',n:'Range',base:110,ra:3,wa:2,max:300,c:[8,1.16],w:[25,1.25]},
 {k:'health',g:'Defense',n:'Health',base:30,mul:1,ra:.4,wm:1.08,c:[4,1.14],w:[12,1.2]},
 {k:'regen',g:'Defense',n:'Regen',base:.4,mul:1,ra:.4,wm:1.08,c:[6,1.15],w:[15,1.2],u:'/s'},
 {k:'defense',g:'Defense',n:'Defense',base:0,ra:.01,wa:.005,max:.75,c:[10,1.16],w:[25,1.25],p:1},
 {k:'thorns',g:'Defense',n:'Thorns (of attacker max HP)',base:0,ra:.02,wa:.01,max:.5,c:[12,1.17],w:[30,1.25],p:1},
 {k:'cashBonus',g:'Utility',n:'Cash per kill',base:1,ra:.05,wa:.04,c:[10,1.15],w:[20,1.2],x:1},
 {k:'waveCash',g:'Utility',n:'Wave bonus',base:1,ra:.1,wa:.08,c:[10,1.15],w:[20,1.2],x:1},
 {k:'coinBonus',g:'Utility',n:'Coins per kill',base:1,ra:.03,wa:.05,c:[15,1.17],w:[25,1.2],x:1},
 {k:'startCash',g:'Utility',n:'Starting cash',base:0,wa:25,ws:1,w:[20,1.2]},
];
const SK=Object.fromEntries(ST.map(s=>[s.k,s]));
// Lab: meta upgrades, paid in shards, applied instantly
const LAB=[
 {k:'offSpd',n:'Offline speed',d:'Each hour away counts as more game-hours.',max:10,c:[20,1.6],val:l=>1+.15*l,f:v=>'×'+v.toFixed(2)},
 {k:'offCap',n:'Offline duration',d:'How long offline earnings keep counting.',max:12,c:[15,1.5],val:l=>24+4*l,f:v=>v+'h'},
 {k:'speed',n:'Overdrive',d:'Unlocks faster game speeds.',max:3,c:[200,5],val:l=>[8,12,16,24][l],f:v=>'up to '+v+'×'},
 {k:'disc',n:'Workshop discount',d:'Cheaper workshop upgrades.',max:15,c:[30,1.5],val:l=>.02*l,f:v=>'−'+Math.round(v*100)+'%'},
 {k:'auto',n:'Auto-buyer',d:'Adds auto-buy toggles to the Attack, Defense and Utility sections of the Upgrades tab. Buys the cheapest upgrade first.',max:1,c:[150,1],val:l=>l,f:v=>v?'unlocked':'locked'},
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
// from/freq: first wave and spawn frequency · weight: resists being pushed (crowds now, knockback later) · bar: health bar · n/d: shown in Help
const ET={
 basic:{n:'Basic',r:1,d:'Walks straight in and hits the spire once a second.',hp:4,dmg:1,spd:24,weight:1,sz:7,cash:1,coin:1,sh:'square',c:'e1'},
 fast:{n:'Fast',r:1,d:'Twice as quick and fragile. Comes in numbers.',hp:2.5,dmg:.8,spd:46,weight:0.6,sz:6,cash:1,coin:1,sh:'triangle',rot:'face',c:'e2',from:3,freq:.25},
 ranged:{n:'Ranged',r:1,d:'Stops outside a new spire\'s range and fires shots at it. Upgrade Range to reach it.',hp:3.5,dmg:1.2,spd:20,weight:0.9,sz:7,cash:2,coin:2,sh:'diamond',c:'e4',from:12,freq:.12,stop:125},
 tank:{n:'Tank',r:1,d:'Slow, with lots of health and a hard hit.',hp:18,dmg:2.5,spd:13,weight:3,sz:12,cash:4,coin:3,sh:'pentagon',c:'e3',from:8,freq:.12,bar:1},
 shielded:{n:'Shielded',r:2,d:'Its shield (the ring) blocks the first 3 hits completely, crits included. Fast attack speed breaks it quickest.',hp:10,dmg:2,spd:18,weight:2,sz:10,cash:6,coin:5,sh:'octagon',c:'e6',from:15,freq:.05,bar:1,shield:3},
 healer:{n:'Healer',r:2,d:'Every second, heals enemies around it by 10% of their max health. Kill it first.',hp:8,dmg:1,spd:20,weight:1.2,sz:9,cash:6,coin:5,sh:'cross',c:'e7',from:18,freq:.05,bar:1,heal:.1,healR:70},
 splitter:{n:'Splitter',r:2,d:'Breaks into 3 Fast enemies when it dies.',hp:12,dmg:1.5,spd:22,weight:1.6,sz:10,cash:6,coin:5,sh:'star',c:'e8',from:20,freq:.05,bar:1,split:3},
 boss:{n:'Boss',r:3,d:'Arrives every 10th wave. Huge health and damage.',hp:250,dmg:12,spd:9,weight:10,sz:22,cash:60,coin:40,sh:'hexagon',rot:'spin',c:'e5',bar:1}
};
const TYPES=Object.keys(ET);
