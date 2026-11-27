// Spire — save/load (localStorage) and offline earnings.
// ================= save =================
const KEY='spire-save-v1';
// lifetime counters for the Stats sheet; old saves get zeros and 'since' = the day they first load this version
const freshStats=()=>({since:Date.now(),time:0,coins:0,offCoins:0,cash:0,shards:0,dmg:0,thorn:0,taken:0,shots:0,crits:0,blocked:0,
  elite:0,boss:0,chips:0,alloy:0,multi:0,bounces:0,absorbed:0,offShards:0,offChips:0,ultUses:0,supers:0,kbs:0,defies:0,stolen:0,freeUps:0,waves:0,ups:0,wsUps:0,wsCoins:0,lab:0,labShards:0,tiers:{}});
const fresh=()=>({v:1,ultV:8,bestCph:0,bestSph:0,bestChph:0,lastSeen:0,coins:0,shards:0,chips:0,alloy:0,cards:{},cardEq:[],mods:{},modEq:{},ults:{},ms:{},cleared:{},hist:[],stats:freshStats(),ws:{},lab:{},tierMax:1,best:{},runs:0,kills:0,set:{ultMan:{},dmgNums:true,prio:['closest','healer','protector','boss','charger','splitter','shielded','ranged','tank','fast','basic'],perf:false,speed:1,auto:true,autoDelay:5,ab:{}}});
let save=fresh();
// items removed from the game are refunded in chips (save.refund is shown once by the Equipment code)
function migrate(sv){let back=0;
  // 1.72: Equipment slots moved from chips to the Lab; slots already bought are kept as research levels
  if(sv.cardSlots>CARD.slots0){sv.lab.slots=Math.max(sv.lab.slots||0,sv.cardSlots-CARD.slots0)}delete sv.cardSlots;
  // removed research: refund its shards (shown once as a toast)
  for(const k of Object.keys(sv.lab||{}))if(LAB_GONE[k]){const [c0,g]=LAB_GONE[k];let sh=0;for(let i=0;i<sv.lab[k];i++)sh+=c0*g**i;delete sv.lab[k];if(sh){sv.shards+=sh;sv.shardRefund=(sv.shardRefund||0)+sh}}
for(const k of Object.keys(sv.cards)){if(CK[k])continue;const l=sv.cards[k];back+=CARD.buy;for(let i=0;i<l-1;i++)back+=CARD.up[i];delete sv.cards[k]}
  sv.cardEq=sv.cardEq.filter(k=>CK[k]);if(sv.set.tab==='Cards')sv.set.tab='Equipment';
  // target priority: one list with a 'closest' divider (types above it are shot first, in order)
  {const P=sv.set.prio;if(!P.includes('closest')){if(sv.set.target==='priority')P.push('closest');else P.unshift('closest')}for(const t of TYPES)if(!P.includes(t))P.push(t);delete sv.set.target}if(back){sv.chips+=back;sv.refund=(sv.refund||0)+back}return sv}
const fromSaved=s=>migrate(Object.assign(fresh(),s,{ultV:s.ultV||1,set:Object.assign(fresh().set,s.set),stats:Object.assign(freshStats(),s.stats)}));
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v===1)save=fromSaved(s)}catch(e){}
function persist(){save.lastSeen=Date.now();try{localStorage.setItem(KEY,JSON.stringify(save))}catch(e){}}

// ---- offline earnings ----
function awayText(s){const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h}h ${m}m`:`${m}m`}
// offline coins/real hour: best coins per game-hour, as if the game ran at your fastest unlocked speed, × CFG.offlineEff
const offMult=()=>Math.max(...speeds())*CFG.offlineEff;
// shards and chips: best shards / boss chips per game-hour, same rules
const offlineRate=()=>save.bestCph*offMult(), offlineShardRate=()=>save.bestSph*offMult(), offlineChipRate=()=>(save.bestChph||0)*offMult();
function offline(){
  const now=Date.now(),last=save.lastSeen;persist();
  if(!last||!(save.bestCph||save.bestSph||save.bestChph))return;
  const away=(now-last)/1000;if(away<CFG.offlineMinAway)return;
  const counted=away,earned=offlineRate()*counted/3600;
  const sh=offlineShardRate()*counted/3600,ch=offlineChipRate()*counted/3600;
  save.coins+=earned;save.stats.offCoins+=earned;save.shards+=sh;save.stats.offShards+=sh;save.stats.shards+=sh;save.chips+=ch;save.stats.offChips=(save.stats.offChips||0)+ch;save.stats.chips+=ch;persist();
  $('wbTxt').textContent=`You were away for ${awayText(away)}.`;
  $('wbCoins').textContent=fmt(earned);$('wbRate').textContent=fmt(offlineRate())+'/h';
  $('wbShardRow').hidden=!sh;$('wbShards').textContent=fmt(sh);$('wbSRate').textContent=fmt(offlineShardRate())+'/h';
  $('wbChipRow').hidden=!ch;$('wbChips').textContent=fmt(ch);$('wbCRate').textContent=fmt(offlineChipRate())+'/h';
  $('wb').hidden=false;if(run&&!run.over)setPause(true);
}
$('wbOk').addEventListener('click',()=>{$('wb').hidden=true;if(run&&!run.over)setPause(false)});
