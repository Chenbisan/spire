// Spire — save/load (localStorage) and offline earnings.
// ================= save =================
const KEY='spire-save-v1';
// lifetime counters for the Stats sheet; old saves get zeros and 'since' = the day they first load this version
const freshStats=()=>({since:Date.now(),time:0,coins:0,offCoins:0,cash:0,shards:0,dmg:0,thorn:0,taken:0,shots:0,crits:0,blocked:0,
  elite:0,boss:0,chips:0,alloy:0,multi:0,bounces:0,absorbed:0,supers:0,kbs:0,defies:0,stolen:0,freeUps:0,waves:0,ups:0,wsUps:0,wsCoins:0,lab:0,labShards:0,tiers:{}});
const fresh=()=>({v:1,bestCph:0,lastSeen:0,coins:0,shards:0,chips:0,alloy:0,cards:{},cardEq:[],cardSlots:2,mods:{},modEq:{},hist:[],stats:freshStats(),ws:{},lab:{},tierMax:1,best:{},runs:0,kills:0,set:{dmgNums:true,perf:false,speed:1,auto:true,autoDelay:5,ab:{}}});
let save=fresh();
// items removed from the game are refunded in chips (save.refund is shown once by the Equipment code)
function migrate(sv){let back=0;for(const k of Object.keys(sv.cards)){if(CK[k])continue;const l=sv.cards[k];back+=CARD.buy;for(let i=0;i<l-1;i++)back+=CARD.up[i];delete sv.cards[k]}
  sv.cardEq=sv.cardEq.filter(k=>CK[k]);if(sv.set.tab==='Cards')sv.set.tab='Equipment';if(back){sv.chips+=back;sv.refund=(sv.refund||0)+back}return sv}
const fromSaved=s=>migrate(Object.assign(fresh(),s,{set:Object.assign(fresh().set,s.set),stats:Object.assign(freshStats(),s.stats)}));
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v===1)save=fromSaved(s)}catch(e){}
function persist(){save.lastSeen=Date.now();try{localStorage.setItem(KEY,JSON.stringify(save))}catch(e){}}

// ---- offline earnings ----
function awayText(s){const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h}h ${m}m`:`${m}m`}
// offline coins/real hour: best coins per game-hour, as if the game ran at your fastest unlocked speed, × Lab Offline speed
const offlineRate=()=>save.bestCph*Math.max(...speeds())*labVal('offSpd');
function offline(){
  const now=Date.now(),last=save.lastSeen;persist();
  if(!last||!save.bestCph)return;
  const away=(now-last)/1000;if(away<CFG.offlineMinAway)return;
  const cap=labVal('offCap'),counted=Math.min(away,cap*3600),earned=offlineRate()*counted/3600;
  save.coins+=earned;save.stats.offCoins+=earned;persist();
  $('wbTxt').textContent=`You were away for ${awayText(away)}`+(away>counted?` (capped at ${cap}h)`:'')+'.';
  $('wbCoins').textContent=fmt(earned);$('wbRate').textContent=fmt(offlineRate())+'/h';
  $('wb').hidden=false;if(run&&!run.over)setPause(true);
}
$('wbOk').addEventListener('click',()=>{$('wb').hidden=true;if(run&&!run.over)setPause(false)});
