// Spire — balance and content tables. Tweak numbers here.
// Game version — bump it (and add a CHANGELOG.md entry) with every published update
const APP_VERSION='1.0.1';
const CHANGELOG_URL='https://github.com/chenbisan/spire/blob/main/CHANGELOG.md';
// ================= CONFIG: tweak everything here =================
const CFG={
  step:1/60, waveLen:20, arenaR:320, spawnR:335, towerR:14, bulletSpd:420, ebSpd:120,
  tierUnlockWave:25,                       // reach this wave to unlock the next tier
  tier:t=>({hp:4**(t-1),dmg:3**(t-1),coin:2.2**(t-1)}),
  hpGrow:1.068, dmgGrow:1.05,              // per-wave enemy scaling
  spawnCount:w=>Math.floor(8+w*1.3),
  waveCash:w=>4+w*2,
  killCash:w=>1+w*.05, killCoin:w=>1+w*.02,
  offlineMinRun:120,         // a run must last this many game seconds to set the offline rate
  offlineMinAway:60,          // offline cap and speed come from the Lab
  bossEvery:10, maxDmgNums:50, maxParts:240
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
// Lab: meta upgrades, paid in coins, applied instantly
const LAB=[
 {k:'offSpd',n:'Offline speed',d:'Each hour away counts as more game-hours.',max:10,c:[200,1.6],val:l=>1+.15*l,f:v=>'×'+v.toFixed(2)},
 {k:'offCap',n:'Offline duration',d:'How long offline earnings keep counting.',max:12,c:[150,1.5],val:l=>24+4*l,f:v=>v+'h'},
 {k:'speed',n:'Overdrive',d:'Unlocks faster game speeds.',max:3,c:[2000,5],val:l=>[8,12,16,24][l],f:v=>'up to '+v+'×'},
 {k:'disc',n:'Workshop discount',d:'Cheaper workshop upgrades.',max:15,c:[300,1.5],val:l=>.02*l,f:v=>'−'+Math.round(v*100)+'%'},
 {k:'auto',n:'Auto-buyer',d:'Adds an auto-buy toggle to the Attack, Defense and Utility tabs. Buys the cheapest upgrade first.',max:1,c:[1500,1],val:l=>l,f:v=>v?'unlocked':'locked'},
];
const LK=Object.fromEntries(LAB.map(l=>[l.k,l]));
const ET={ // sh: 0 square, 1 triangle, 2 diamond, 3 hexagon
 basic:{hp:4,dmg:1,spd:24,sz:7,cash:1,coin:1,sh:0},
 fast:{hp:2.5,dmg:.8,spd:46,sz:6,cash:1,coin:1,sh:1,from:3,wt:.25},
 tank:{hp:18,dmg:2.5,spd:13,sz:12,cash:4,coin:3,sh:0,from:8,wt:.12,bar:1},
 ranged:{hp:3.5,dmg:1.2,spd:20,sz:7,cash:2,coin:2,sh:2,from:12,wt:.12,stop:125},
 boss:{hp:250,dmg:12,spd:9,sz:22,cash:60,coin:40,sh:3,bar:1}
};
const TYPES=Object.keys(ET);
