// Spire — save/load (localStorage) and offline earnings.
// ================= save =================
const KEY='spire-save-v1';
const fresh=()=>({v:1,bestCph:0,lastSeen:0,coins:0,shards:0,ws:{},lab:{},tierMax:1,best:{},runs:0,kills:0,set:{dmgNums:true,perf:false,speed:1,auto:true,autoDelay:5,ab:{}}});
let save=fresh();
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v===1)save=Object.assign(fresh(),s,{set:Object.assign(fresh().set,s.set)})}catch(e){}
function persist(){save.lastSeen=Date.now();try{localStorage.setItem(KEY,JSON.stringify(save))}catch(e){}}

// ---- offline earnings ----
function awayText(s){const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h}h ${m}m`:`${m}m`}
function offline(){
  const now=Date.now(),last=save.lastSeen;persist();
  if(!last||!save.bestCph)return;
  const away=(now-last)/1000;if(away<CFG.offlineMinAway)return;
  const cap=labVal('offCap'),counted=Math.min(away,cap*3600),earned=save.bestCph*labVal('offSpd')*counted/3600;
  save.coins+=earned;persist();
  $('wbTxt').textContent=`You were away for ${awayText(away)}`+(away>counted?` (capped at ${cap}h)`:'')+'.';
  $('wbCoins').textContent=fmt(earned);$('wbRate').textContent=fmt(save.bestCph*labVal('offSpd'))+'/h';
  $('wb').hidden=false;if(run&&!run.over)setPause(true);
}
$('wbOk').addEventListener('click',()=>{$('wb').hidden=true;if(run&&!run.over)setPause(false)});
