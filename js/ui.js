// Spire — DOM UI: HUD, overlays, upgrade panel, settings, controls.
// ---- auto-restart after a run ends ----
let autoLeft=0,autoTimer=null;
function stopAuto(){clearInterval(autoTimer);autoTimer=null;autoLeft=0}
function startAuto(){stopAuto();if(!save.set.auto)return;autoLeft=save.set.autoDelay;
  autoTimer=setInterval(()=>{autoLeft--;const el=document.getElementById('autoTxt');if(el)el.textContent=autoLeft;if(autoLeft<=0){stopAuto();newRun(ovTier)}},1000)}
const hpBar=$('hpBar'),waveBar=$('waveBar'),barBar=$('barBar');let lastHp=-1,lastWv=-1,lastBar=-1;
function bars(){
  const hp=run?Math.max(0,Math.min(1,run.hp/run.s.health)):0;
  const wv=run&&!run.over?Math.min(1,(run.waveT+(paused?0:A*CFG.step))/run.waveLen):0;
  if(Math.abs(hp-lastHp)>1e-4){lastHp=hp;hpBar.style.transform=`scaleX(${hp})`}
  $('hpBar').parentNode.classList.toggle('defy',!!run&&performance.now()-(run.defyAt||-1e9)<CFG.defyFx);
  // barrier bar: its health, or while broken, the recharge filling back up
  const on=!!run&&!run.over&&run.barMax>0,down=on&&run.barT>0,br=!on?0:down?1-run.barT/Math.max(1e-9,run.s.barrierRegen):Math.max(0,Math.min(1,run.bar/run.barMax));
  $('barW').hidden=!on;$('barTrack').classList.toggle('down',down);if(Math.abs(br-lastBar)>1e-4){lastBar=br;barBar.style.transform=`scaleX(${Math.max(0,Math.min(1,br))})`}
  if(Math.abs(wv-lastWv)>1e-4){lastWv=wv;waveBar.style.transform=`scaleX(${wv})`}
  waveBar.parentNode.classList.toggle('brk',!!run&&!run.over&&run.waveT>=run.spawnLen); // break between waves
}
// ================= UI =================
$('verTag').textContent='v'+APP_VERSION;$('verTag').href=CHANGELOG_URL;
const TX=(id,t)=>{const e=$(id);t=String(t);if(e.textContent!==t)e.textContent=t};
function hud(){
  TX('hTier',run?run.tier:'–');TX('hWave',run?(run.wave>=CFG.finalWave&&!run.over?`${run.wave} · ${fmt(aliveN)} left`:run.wave):'–');
  TX('hCash',run?fmt(run.cash):'0');TX('hCoins',fmt(save.coins));TX('hShards',fmt(save.shards));$('shardChip').hidden=!shardsOn();
  TX('hChips',fmt(save.chips));$('chipChip').hidden=!(save.chips>0||save.stats.chips>0);TX('hAlloy',fmt(save.alloy));$('alloyChip').hidden=!(save.alloy>0||save.stats.alloy>0);
  {const w=run?run.wave:1,t=run?run.tier:ovTier,e=enemyStats('basic',w,t);
   TX('eHp',fmt(e.hp));TX('eAtk',fmt(e.atk));TX('eSpd',fmt(e.spd));TX('eWt',fmt(e.weight));
   if(modalKind==='enemies'){
     if(w!==eTabW||t!==eTabT)mBody.innerHTML=enemyHtml();
     else if(eTab==='wave'&&run&&!run.over&&$('wiTime')){TX('wiTime',run.wave>=CFG.finalWave?'final wave':Math.ceil(run.waveLen-run.waveT)+' s');TX('wiSpawned',run.spawned);TX('wiAlive',enemies.filter(e=>!e.dead).length)}
     else if(eTab==='spire'){const {live,v}=spireStats();if(JSON.stringify(v)+(live?Math.round(run.hp):'')!==eSig)mBody.innerHTML=enemyHtml()}}}
  if(run){TX('hpTxt',`${fmt(Math.max(0,run.hp))} / ${fmt(run.s.health)}`+(run.invT>0?` · ✦ ${Math.ceil(run.invT)}s`:''))}
  else{TX('hpTxt','–')}
  if(run&&run.barMax>0)TX('barTxt',run.barT>0?`◈ ${mmss(run.barT)}`:`◈ ${fmt(run.bar)}`);
  const pf=$('perf');pf.hidden=!save.set.perf;$('perfBtn').classList.toggle('on',save.set.perf);
  if(save.set.perf)pf.textContent=`${fps} fps  ·  sim ${simMs.toFixed(2)} ms/frame${simCapped?'  ·  busy: running below set speed':''}\n${enemies.length} enemies  ·  ${bullets.length} shots  ·  ${ebs.length} enemy shots`;
  refreshPanel();refreshUltBar();refreshHackBar();if(typeof updRunNote==='function')updRunNote();
}
let ovTier=save.tierMax;
const shardsOn=()=>save.tierMax>=2||save.shards>0;
function tierPicker(){let h='<div class="tiers">';for(let t=1;t<=save.tierMax;t++)h+=`<button data-tier="${t}" class="${t===ovTier?'on':''}">Tier ${t}<small>best ${save.best[t]||0} · coins ×${fmt(CFG.tier(t).coin)}</small></button>`;return h+'</div>'}
function tierInfo(t){const tm=CFG.tier(t),T=save.stats.tiers[t]||{runs:0,cph:0},nxt=t<save.tierMax?'':`<p class="note" style="margin:0">Reach wave ${CFG.tierUnlockWave.toLocaleString()} here to unlock tier ${t+1} (enemies ×${fmt(CFG.tier(t+1).hp)} health, coins ×${fmt(CFG.tier(t+1).coin)}).</p>`;
  return`<div class="tinfo"><div><span>Enemy health</span><b>×${fmt(tm.hp)}</b></div><div><span>Enemy attack</span><b>×${fmt(tm.dmg)}</b></div><div><span>Enemy weight · speed</span><b>×${fmt(tm.wt)} · ×${fmt(tm.spd)}</b></div><div><span>Coins</span><b class="coin">×${fmt(tm.coin)}</b></div><div><span>Shards</span><b class="shard">${tm.shard?'×'+fmt(tm.shard):'none'}</b></div>
  <div><span>Best wave</span><b>${save.best[t]||0}</b></div><div><span>Best coins/hour</span><b class="coin">${fmt(T.cph)}</b></div><div><span>Runs</span><b>${fmt(T.runs)}</b></div><div><span>Offline rate</span><b class="coin">${fmt(offlineRate())}/h</b>${save.bestSph?` <b class="shard">${fmt(offlineShardRate())}/h</b>`:''}${save.bestChph?` <b class="chip">${fmt(offlineChipRate())}/h</b>`:''}</div></div>${nxt}`}
function showOv(kind){
  const ov=$('ov'),c=$('ovCard');if(!kind){ov.hidden=true;return}ov.hidden=false;
  ovTier=Math.min(ovTier,save.tierMax);
  c.className='card'+(kind==='start'?' big':'');
  if(kind==='start')c.innerHTML=`<h2>Hold the center</h2><p>Your spire fires automatically. Spend cash on upgrades during a run; coins carry over to the Workshop. Each tier multiplies enemy health, attack and coins; the exact numbers for the selected tier are below.</p>${tierPicker()}${tierInfo(ovTier)}
    <div class="obtns"><button id="toWs">Workshop · <span class="coin">${fmt(save.coins)}</span></button><button id="toHist">Records</button><button id="toHelp">How to play</button></div><button class="go" id="goBtn">Start tier ${ovTier}</button>`;
  else if(kind==='paused'){const R=run,m=Math.floor(R.time/60),s=Math.floor(R.time%60);
    c.innerHTML=`<h2>Paused</h2><p>Tier ${R.tier} · wave ${R.wave} · ${m}m ${s}s</p><div class="grid2"><div><span>Coins this run</span><b class="coin">${fmt(R.coins)}</b></div><div><span>Kills</span>${fmt(R.kills)}</div>${R.tm.shard?`<div><span>Shards at the end</span><b class="shard">${fmt(runShards(R))}</b></div>`:''}<div><span>Cash</span><b class="cash">${fmt(R.cash)}</b></div><div><span>Health</span>${fmt(Math.max(0,R.hp))} / ${fmt(R.s.health)}</div></div>
    <button class="go" id="resumeBtn">Resume</button><button id="endBtn" class="danger" style="width:100%;margin-top:8px">End run</button>`}
  else{const R=run,m=Math.floor(R.time/60),s=Math.floor(R.time%60);
    // after a run: the same screen as the start, with a compact summary of the run on top
    c.className='card big';
    c.innerHTML=`<div class="lastrun"><div class="lrh"><b>${R.won?`Tier ${R.tier} cleared!`:`${R.quit?'Ended':'Fell'} on wave ${R.wave}`}</b><span>Tier ${R.tier} · best ${save.best[R.tier]||0} · ${m}m ${s}s</span></div><div class="grid2 lrg"><div><span>Coins earned</span>${fmt(R.coins)}</div><div><span>Coins per hour</span>${fmt(R.cph)}${R.newBest?' · new best':R.time<CFG.offlineMinRun?' · too short to count':''}</div>${R.tier>=2?`<div><span>Shards earned</span><b class="shard">${fmt(R.shards)}</b> <small>${fmt(R.sph)}/h${R.newBestS?' · new best':''}</small></div>`:''}${R.chips?`<div><span>Chips earned</span><b class="chip">${fmt(R.chips)}</b></div>`:''}${R.alloy?`<div><span>Alloy earned</span><b class="alloy">${fmt(R.alloy)}</b></div>`:''}<div><span>Kills</span>${fmt(R.kills)}</div>${R.defies?`<div><span>Deaths defied</span>${fmt(R.defies)}</div>`:''}<div><span>Cash earned</span>${fmt(R.cashEarned)}</div></div></div>
    <h2>Next run</h2>${tierPicker()}${tierInfo(ovTier)}
    <div class="obtns"><button id="toWs">Workshop · <span class="coin">${fmt(save.coins)}</span></button><button id="toHist">Records</button><button id="toHelp">How to play</button></div>
    <button class="go" id="goBtn">${autoTimer?`Start tier ${ovTier} · auto in <span id="autoTxt">${autoLeft}</span>s`:`Start tier ${ovTier}`}</button>${autoTimer?'<button id="stopAuto" style="width:100%;margin-top:8px">Stay on this screen</button>':''}`}
}
$('ovCard').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.tier){ovTier=+t.dataset.tier;showOv(run&&run.over?'over':'start')}
  else if(t.id==='goBtn'){stopAuto();newRun(ovTier)}
  else if(t.id==='stopAuto'){stopAuto();showOv('over')}
  else if(t.id==='resumeBtn')setPause(false);
  else if(t.id==='endBtn'){if(t.dataset.arm){setPause(false);gameOver(true)}else{t.dataset.arm=1;t.textContent='Tap again to end the run'}}
  else if(t.id==='toHelp')openModal('help');
  else if(t.id==='toWs'){ui.tab=save.set.tab='Workshop';buildPanel()}
  else if(t.id==='toHist'){hTab='runs';openModal('history')}
});
const TABS=['Upgrades','Workshop','Lab','Equipment','Ultimates','Modules'];
const ui={tab:TABS.includes(save.set.tab)?save.set.tab:'Upgrades',mult:[1,10,'Max'].includes(save.set.mult)?save.set.mult:1};let rows=[];
const GROUPS=['Attack','Defense','Utility'];
function buildTabs(){$('tabs').innerHTML=TABS.map(t=>`<button data-tab="${t}" class="${t===ui.tab?'on':''}">${t}</button>`).join('')}
$('tabs').addEventListener('click',e=>{const t=e.target.closest('button');if(t){ui.tab=save.set.tab=t.dataset.tab;persist();buildPanel()}});
function plan(s,ws){
  const r=run?run.lv[s.k]||0:0,w=save.ws[s.k]||0,[c0r,g]=ws?s.w:s.c,lv=ws?w:r,c0=ws?c0r*(1-labVal('disc')):c0r;
  const bank=ws?save.coins:(run&&!run.over?run.cash:0),lim=ui.mult==='Max'?1000:ui.mult;
  let n=0,tot=0;
  while(n<lim){if(ws?capped(s,0,w+n):capped(s,r+n,w))break;const c=c0*g**(lv+n);if(ui.mult==='Max'&&tot+c>bank)break;tot+=c;n++}
  const isCap=ws?capped(s,0,w):capped(s,r,w);
  let show=n,cost=tot;if(n===0&&!isCap){show=1;cost=c0*g**lv}
  const cur=ws?valAt(s,0,w):valAt(s,r,w),nxt=ws?valAt(s,0,w+show):valAt(s,r+show,w);
  return{n,cost,show,cur,nxt,isCap,ok:n>0&&tot<=bank};
}
function buildPanel(){
  buildTabs();const P=$('panel');
  labRows=[];
  if(ui.tab==='Equipment'||ui.tab==='Ultimates'||ui.tab==='Modules'){rows=[];loSig='';P.innerHTML='';return refreshLoadout()}
  if(ui.tab==='Lab'){rows=[];
    P.innerHTML=`<p class="note">Research is paid in <b class="shard">shards</b>, earned at the end of every run on tier 2 and up: the more enemies you kill, the more you get, and higher tiers multiply it. It applies instantly and lasts forever. No timers.</p>`+(shardsOn()?'':`<p class="note"><b>Locked:</b> reach wave ${CFG.tierUnlockWave} on tier 1 to unlock tier 2 and start finding shards.</p>`)+LAB.map(l=>`<div class="row"><div><b>${l.n}</b><span class="v"></span><span class="note" style="display:block;margin:2px 0 0">${l.d}</span></div><button class="buy shard" data-lab="${l.k}"></button></div>`).join('');
    labRows=[...P.querySelectorAll('[data-lab]')].map(b=>({l:LK[b.dataset.lab],b,v:b.parentNode.querySelector('.v')}));
    return refreshPanel()}
  const ws=ui.tab==='Workshop';
  const sec=GROUPS.includes((save.set.sub||{})[ui.tab])?save.set.sub[ui.tab]:'Attack';
  let h=`<div class="mults">${[1,10,'Max'].map(m=>`<button data-mult="${m}" class="${ui.mult===m?'on':''}">${m==='Max'?'Max':'×'+m}</button>`).join('')}</div>`
    +`<div class="subs">${GROUPS.map(g=>`<button data-sub="${g}" class="${g===sec?'on':''}">${g}</button>`).join('')}</div>`;
  if(ws){h+='<p class="note">Permanent upgrades, paid in coins. They apply to every run, including the one in progress. Values shown are your starting values.</p>'+`<p class="note">Offline rate: <b class="coin">${fmt(offlineRate())} coins/hour</b>${save.bestSph?` · <b class="shard">${fmt(offlineShardRate())} shards/hour</b>`:''}${save.bestChph?` · <b class="chip">${fmt(offlineChipRate())} chips/hour</b>`:''}</p>`;
    h+=ST.filter(s=>s.g===sec).map(rowHtml).join('')+respecBtn('ws:'+sec,`Refund all ${sec.toLowerCase()} upgrades`)}
  else{h+=!run||run.over?'<p class="note">Start a run to buy in-run upgrades.</p>':'<p class="note">Paid in cash, which resets every run.</p>';
    if(labLv('auto'))h+=`<label class="ab abs"><input type="checkbox" data-ab="${sec}" ${save.set.ab[sec]?'checked':''}> Auto-buy ${sec.toLowerCase()} upgrades</label>`;
    h+=ST.filter(s=>s.g===sec&&!s.ws).map(rowHtml).join('')}
  P.innerHTML=h;
  rows=[...P.querySelectorAll('.row')].map(r=>({s:SK[r.dataset.k],v:r.querySelector('.v'),b:r.querySelector('.buy')}));
  refreshPanel();
}
let labRows=[];
const labCost=l=>l.c[0]*l.c[1]**labLv(l.k);
const rowHtml=s=>`<div class="row" data-k="${s.k}"><div><b>${s.n}</b><span class="v"></span></div><button class="buy" data-k="${s.k}"></button></div>`;
function refreshPanel(){
  refreshLoadout();
  for(const r of labRows){const l=r.l,lv=labLv(l.k),mx=lv>=l.max,c=labCost(l);
    const vt=mx?l.f(l.val(lv))+' (max)':`${l.f(l.val(lv))} → ${l.f(l.val(lv+1))}`;if(r.v.textContent!==vt)r.v.textContent=vt;
    const ok=!mx&&save.shards>=c;if(r.b.disabled===ok)r.b.disabled=!ok;const t=mx?'Max':fmt(c);if(r.b.textContent!==t)r.b.textContent=t}
  const ws=ui.tab==='Workshop';
  if(ws){const P=$('panel'),rb=P.querySelector('[data-respec^="ws:"]'),key='ws:'+(GROUPS.includes((save.set.sub||{}).Workshop)?save.set.sub.Workshop:'Attack');
    if(!rb||!rb.dataset.arm){const html=respecBtn(key,`Refund all ${key.slice(3).toLowerCase()} upgrades`);
      if(rb){if(rb.outerHTML!==html){if(html)rb.outerHTML=html;else rb.remove()}}else if(html)P.insertAdjacentHTML('beforeend',html)}}
  for(const r of rows){const p=plan(r.s,ws);
    const vt=p.isCap?fv(r.s,p.cur)+' (max)':`${fv(r.s,p.cur)} → ${fv(r.s,p.nxt)}`;if(r.v.textContent!==vt)r.v.textContent=vt;
    if(r.b.disabled===p.ok)r.b.disabled=!p.ok;
    const html=p.isCap?'Max':`<span class="q">+${p.show}</span>${fmt(p.cost)}`;
    if(r.b.innerHTML!==html)r.b.innerHTML=html;
    r.b.classList.toggle('coin',ws);r.b.classList.toggle('cash',!ws)}
}
$('panel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.respec){if(b.dataset.arm)return respec(b.dataset.respec);b.dataset.arm=1;b.classList.add('arm');b.firstChild.textContent='Tap again to refund ';return}
  if(b.dataset.sub){save.set.sub=Object.assign({},save.set.sub,{[ui.tab]:b.dataset.sub});persist();return buildPanel()}
  if(b.dataset.mult){ui.mult=save.set.mult=b.dataset.mult==='Max'?'Max':+b.dataset.mult;persist();return buildPanel()}
  if(b.dataset.lab){const l=LK[b.dataset.lab],c=labCost(l);if(labLv(l.k)>=l.max||save.shards<c)return;save.shards-=c;save.lab[l.k]=labLv(l.k)+1;save.stats.lab++;save.stats.labShards+=c;persist();
    if(l.k==='speed')buildSpeeds();if(l.k==='auto')toast('Auto-buy toggles added to the Upgrades tab');refreshPanel();return}
  if(b.dataset.k){const s=SK[b.dataset.k],ws=ui.tab==='Workshop',p=plan(s,ws);if(!p.ok)return;
    if(ws){save.coins-=p.cost;save.ws[s.k]=(save.ws[s.k]||0)+p.n;save.stats.wsUps+=p.n;save.stats.wsCoins+=p.cost;persist()}else{const free=buyRun(s,p.n);if(free)toast(free>1?`${free} levels were free!`:'Free upgrade!')}
    recalc();refreshPanel();return}
});
function settingsHtml(){return`<div class="set">
  <label><input type="checkbox" id="optDn" ${save.set.dmgNums?'checked':''}> Damage numbers</label>
  <label><input type="checkbox" id="optPf" ${save.set.perf?'checked':''}> Performance overlay</label>
  <label><input type="checkbox" id="optAuto" ${save.set.auto?'checked':''}> Auto-restart after a run ends, after
    <select id="optDelay" style="font:inherit;min-height:36px;border-radius:8px;background:var(--arena);color:var(--ink);border:1px solid var(--line)">${[3,5,10,15].map(n=>`<option ${save.set.autoDelay===n?'selected':''}>${n}</option>`).join('')}</select> s</label>
  <div class="gh">Targeting</div><div class="btns"><button data-act="tgtOpen">🎯 Target priority…</button></div>
  <div class="gh">Save</div><p class="note">Progress saves in this browser automatically. Copy a backup code to be safe, or paste one to restore.</p>
  <textarea id="saveTxt" placeholder="Backup code appears here, or paste one to import"></textarea>
  <div class="btns"><button data-act="export">Copy backup code</button><button data-act="import">Import code</button></div>
  <div class="gh">Run</div><div class="btns"><button data-act="abandon" ${run&&!run.over?'':'disabled'}>End current run</button></div>
  <div class="gh">Danger zone</div><div class="btns"><button data-act="reset" class="danger">Reset all progress</button></div>
  <p class="note">Keys: Space pause · 1–${speeds().length} speed · Esc close</p><p class="note"><a href="${CHANGELOG_URL}" target="_blank" rel="noopener" style="color:inherit">Version ${APP_VERSION} · what's new</a></p></div>`}
let resetArm=0;
function settingsClick(b){
  const a=b.dataset.act,tx=$('saveTxt');
  if(a==='tgtOpen'){openModal('target');return}
  if(a==='export'){const code=btoa(unescape(encodeURIComponent(JSON.stringify(save))));tx.value=code;tx.select();
    navigator.clipboard?.writeText(code).then(()=>toast('Backup code copied'),()=>toast('Select the code and copy it'))||toast('Select the code and copy it')}
  else if(a==='import'){try{const s=JSON.parse(decodeURIComponent(escape(atob(tx.value.trim()))));if(s.v!==1)throw 0;save=fromSaved(s);persist();recalc();toast('Save imported');buildPanel();if(!run)showOv('start');openModal('settings')}catch(e){toast('That code did not work')}}
  else if(a==='abandon'){if(run&&!run.over){closeModal();gameOver(true)}}
  else if(a==='reset'){if(Date.now()-resetArm<3000){stopAuto();save=fresh();persist();run=null;enemies.length=bullets.length=ebs.length=0;ovTier=1;showOv('start');buildPanel();buildSpeeds();closeModal();toast('Progress reset')}else{resetArm=Date.now();b.textContent='Click again to confirm'}}
}
function optChange(e){if(e.target.id==='optDn')save.set.dmgNums=e.target.checked;if(e.target.id==='optPf')save.set.perf=e.target.checked;
  if(e.target.id==='optAuto'){save.set.auto=e.target.checked;if(!save.set.auto&&autoTimer){stopAuto();if(run&&run.over)showOv('over')}}
  if(e.target.id==='optDelay')save.set.autoDelay=+e.target.value;
  if(e.target.dataset.ab)save.set.ab[e.target.dataset.ab]=e.target.checked;persist()}
$('panel').addEventListener('change',optChange);
// ---- modals: settings (gear) and help (?) ----
const modal=$('modal'),mBody=$('mBody');let modalKind=null;
function openModal(kind){modalKind=kind;$('mTitle').textContent={help:'How to play',settings:'Settings',enemies:'Enemies this wave',history:'Records',target:'Target priority'}[kind];
  modal.querySelector('.card').classList.toggle('fixh',kind==='enemies');mBody.innerHTML=kind==='help'?helpHtml():kind==='enemies'?enemyHtml():kind==='history'?historyHtml():kind==='target'?targetHtml():settingsHtml();modal.hidden=false;mBody.scrollTop=0;$('mClose').focus()}
function closeModal(){modal.hidden=true;modalKind=null}
function refreshHistory(){if(modalKind==='history')mBody.innerHTML=historyHtml()}
function statsHtml(){const S=save.stats,H=save.hist.slice(0,10),recent=H.length?H.reduce((a,h)=>a+h.cph,0)/H.length:0,day=new Date(S.since);
  const L=(n,v,c='')=>`<div class="srow"><span>${n}</span><b class="${c}">${v}</b></div>`;
  const tiers=Object.keys(save.best).map(Number).concat(Object.keys(S.tiers).map(Number)).filter((t,i,a)=>a.indexOf(t)===i).sort((a,b)=>a-b);
  return`<p class="note">Counted since ${day.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}. Times are game time.</p>
  <div class="gh">Progress</div>
  ${L('Runs played',fmt(save.runs))}${L('Waves cleared',fmt(S.waves))}${L('Time played',dur(S.time))}${L('Highest tier unlocked',save.tierMax)}
  <div class="gh">Earnings</div>
  ${L('Coins earned (runs)',fmt(S.coins),'coin')}${L('Coins earned offline',fmt(S.offCoins),'coin')}${L(`Recent coins per hour (last ${H.length===1?'run':(H.length||10)+' runs'})`,fmt(recent),'coin')}${L('Best coins per hour (offline rate)',fmt(save.bestCph),'coin')}${L('Cash earned',fmt(S.cash),'cash')}${L('Shards earned',fmt(S.shards),'shard')}${L('Shards earned offline',fmt(S.offShards),'shard')}${L('Best shards per hour',fmt(save.bestSph),'shard')}${L('Chips earned',fmt(S.chips),'chip')}${L('Chips earned offline',fmt(S.offChips||0),'chip')}${L('Best boss chips per hour (offline rate)',fmt(save.bestChph||0),'chip')}${L('Alloy earned',fmt(S.alloy),'alloy')}
  <div class="gh">Combat</div>
  ${L('Damage dealt',fmt(S.dmg))}${L('Thorns damage',fmt(S.thorn))}${L('Damage taken',fmt(S.taken))}${L('Enemies destroyed',fmt(save.kills))}${L('Elites destroyed',fmt(S.elite))}${L('Bosses destroyed',fmt(S.boss))}${L('Shots fired',fmt(S.shots))}${L('Multishot volleys',fmt(S.multi))}${L('Shot bounces',fmt(S.bounces))}${L('Damage absorbed by barrier',fmt(S.absorbed))}${L('Super crits',fmt(S.supers))}${L('Knockbacks',fmt(S.kbs))}${L('Deaths defied',fmt(S.defies))}${L('Second Winds',fmt(S.winds||0))}${L('Ultimates fired',fmt(S.ultUses))}${L('Health from lifesteal',fmt(S.stolen))}${L('Critical hits',fmt(S.crits)+(S.shots?` (${pct(S.crits/S.shots)})`:''))}${L('Hits blocked by shields',fmt(S.blocked))}
  <div class="gh">Upgrades</div>
  ${L('In-run upgrades bought',fmt(S.ups))}${L('Free upgrades',fmt(S.freeUps))}${L('Workshop upgrades',fmt(S.wsUps))}${L('Workshop coins spent',fmt(S.wsCoins),'coin')}${L('Research completed',fmt(S.lab))}${L('Lab shards spent',fmt(S.labShards),'shard')}${L('Equipment owned',CARDS.filter(c=>cardLv(c.k)).length+' / '+CARDS.length)}${L('Chips spent',fmt(S.chipsSpent||0),'chip')}${L('Modules owned',MODS.filter(m=>modLv(m.k)).length+' / '+MODS.length)}${L('Alloy spent',fmt(S.alloySpent||0),'alloy')}
  <div class="gh">By tier</div>
  <table class="etab"><thead><tr><th>Tier</th><th>Best wave</th><th>Runs</th><th>Coins</th><th>Best/h</th></tr></thead><tbody>${tiers.map(t=>{const T=S.tiers[t]||{runs:0,coins:0,cph:0};
    return`<tr><td>Tier ${t}</td><td>${save.best[t]||0}</td><td>${fmt(T.runs)}</td><td>${fmt(T.coins)}</td><td>${fmt(T.cph)}</td></tr>`}).join('')||'<tr><td colspan="5">No runs yet</td></tr>'}</tbody></table>
  <p class="note">Runs, kills and best waves include runs from before this sheet existed; the other numbers start counting from the date above. Best/h only counts runs of ${CFG.offlineMinRun/60}+ game-minutes.</p>`}
$('setBtn').addEventListener('click',()=>modalKind==='settings'?closeModal():openModal('settings'));
$('helpBtn').addEventListener('click',()=>modalKind==='help'?closeModal():openModal('help'));
$('mClose').addEventListener('click',closeModal);
// ---- target priority window: drag rows (or focus + ↑/↓) to reorder; types above Closest are shot first ----
function targetHtml(){const P=save.set.prio,ci=P.indexOf('closest');
  return`<p class="note">Enemy types above <b>Closest</b> are shot first, top to bottom. Everything below it is shot closest-first. Drag the rows, or focus one and use ↑ / ↓.</p><div class="tlist" id="tlist">${P.map((k,i)=>{const cl=k==='closest';
    return`<div class="trow${cl?' tclose':''}" data-k="${k}" tabindex="0"><span class="grip" aria-hidden="true">⠿</span>${cl?'<span class="tico"></span>':mobIcon(ET[k])}<span class="tname">${cl?'Closest (default)':ET[k].n}</span><b class="trank">${i<ci?i+1:cl?'':'–'}</b></div>`}).join('')}</div>`}
function tlistSave(){const L=$('tlist');if(!L)return;save.set.prio=[...L.children].map(r=>r.dataset.k);const ci=save.set.prio.indexOf('closest');
  [...L.children].forEach((r,i)=>{r.querySelector('.trank').textContent=r.dataset.k==='closest'?'':i<ci?i+1:'–'});persist()}
let tdrag=null;
mBody.addEventListener('pointerdown',e=>{const r=e.target.closest('.trow');if(!r||modalKind!=='target')return;e.preventDefault();r.setPointerCapture(e.pointerId);r.classList.add('drag');tdrag=r;r.focus()});
mBody.addEventListener('pointermove',e=>{if(!tdrag)return;const L=$('tlist');for(const o of L.children){if(o===tdrag)continue;const b=o.getBoundingClientRect();
  if(e.clientY<b.top+b.height/2){if(o.previousElementSibling!==tdrag)L.insertBefore(tdrag,o);return}}L.appendChild(tdrag)});
const tdrop=()=>{if(!tdrag)return;tdrag.classList.remove('drag');tdrag=null;tlistSave()};
mBody.addEventListener('pointerup',tdrop);mBody.addEventListener('pointercancel',tdrop);
mBody.addEventListener('keydown',e=>{const r=e.target.closest&&e.target.closest('.trow');if(!r||(e.key!=='ArrowUp'&&e.key!=='ArrowDown'))return;e.preventDefault();
  const L=r.parentNode;if(e.key==='ArrowUp'&&r.previousElementSibling)L.insertBefore(r,r.previousElementSibling);else if(e.key==='ArrowDown'&&r.nextElementSibling)L.insertBefore(r.nextElementSibling,r);r.focus();tlistSave()});
$('tgtBtn').addEventListener('click',()=>modalKind==='target'?closeModal():openModal('target'));
$('histBtn').addEventListener('click',()=>modalKind==='history'?closeModal():openModal('history'));
const dur=s=>{s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}h ${m}m`:`${m}m ${x}s`};
let hTab='runs',msTier=null;
// Milestones tab: every milestone of one tier, claimed ones ticked, with its rewards
function msHtml(){const t=msTier&&msTier<=save.tierMax?msTier:save.tierMax,n=save.ms[t]||0;
  let h=`<div class="tiers">${Array.from({length:save.tierMax},(_,i)=>`<button data-mstier="${i+1}" class="${i+1===t?'on':''}">Tier ${i+1}<small>${save.ms[i+1]||0}/${MILESTONES.length}${save.cleared[i+1]?' · cleared':''}</small></button>`).join('')}</div>`;
  h+=`<p class="note">Reach each wave once on a tier to collect its reward. On wave ${CFG.finalWave.toLocaleString()} nothing more spawns: destroy every enemy left to clear the tier and collect the last one.</p><div class="mslist">`;
  MILESTONES.forEach((w,i)=>{const r=msReward(w,t,i),got=i<n;
    h+=`<div class="msrow${got?' got':''}${i===n?' next':''}"><b>${got?'✓ ':''}Wave ${w.toLocaleString()}</b><span><b class="coin">${fmt(r.coins)}</b>${r.alloy?` <b class="alloy">${fmt(r.alloy)}</b>`:''}${r.chips?` <b class="chip">${fmt(r.chips)}</b>`:''}${r.shards?` <b class="shard">${fmt(r.shards)}</b>`:''}</span></div>`});
  return h+'</div>'}
function historyHtml(){const H=save.hist,tabs=`<div class="mults"><button data-htab="runs" class="${hTab==='runs'?'on':''}">Battle history</button><button data-htab="stats" class="${hTab==='stats'?'on':''}">Lifetime stats</button><button data-htab="ms" class="${hTab==='ms'?'on':''}">Milestones</button></div>`;
  if(hTab==='stats')return tabs+statsHtml();
  if(hTab==='ms')return tabs+msHtml();
  if(!H.length)return tabs+`<p class="note">No runs yet. Your last ${CFG.histMax} runs will show up here when they end.</p>`;
  const top=Math.max(...H.map(h=>h.cph));
  return tabs+`<p class="note">Your last ${CFG.histMax} runs, newest first. Run time and coins per hour are in game time.</p><div class="hist">${H.map(h=>{const d=new Date(h.at);
    return`<div class="hrow"><div class="htop"><b>Tier ${h.t}</b><b>Wave ${h.w}</b>${h.best?'<span class="tag">best wave</span>':''}${h.quit?'<span class="tag mute">ended early</span>':''}${h.won?'<span class="tag">cleared</span>':''}<span class="hdate">${d.toLocaleDateString()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div>
    <div class="hst"><span>Coins <b class="coin">${fmt(h.c)}</b></span><span>Coins/hour <b class="coin">${fmt(h.cph)}</b>${h.cph===top&&H.length>1?' ★':''}</span>${h.t>=2?`<span>Shards <b class="shard">${fmt(h.s)}</b></span>`:''}${h.ch?`<span>Chips <b class="chip">${fmt(h.ch)}</b></span>`:''}${h.al?`<span>Alloy <b class="alloy">${fmt(h.al)}</b></span>`:''}<span>Kills <b>${fmt(h.k)}</b></span>${h.df?`<span>Defied <b>${fmt(h.df)}</b></span>`:''}<span>Time <b>${dur(h.time)}</b></span></div></div>`}).join('')}</div>`}
$('eBtn').addEventListener('click',()=>modalKind==='enemies'?closeModal():openModal('enemies'));
let eTabW=0,eTabT=0,eTab='wave',eSig='';
const pct=v=>(v*100).toFixed(v<.1&&v>0?1:0)+'%';
function enemyHtml(){const live=run&&!run.over,w=eTabW=live?run.wave:1,t=eTabT=live?run.tier:ovTier;eSig='';
  $('mTitle').textContent=`Tier ${t} · Wave ${w}`;
  const tabs=`<div class="mults"><button data-etab="wave" class="${eTab==='wave'?'on':''}">Wave info</button><button data-etab="spire" class="${eTab==='spire'?'on':''}">Your spire</button></div>`;
  if(eTab==='spire')return tabs+spireHtml();
  const cb=live?run.s.coinBonus:valAt(SK.coinBonus,0,save.ws.coinBonus||0),pc=poolChances(w,t),boss=w%CFG.bossEvery===0,nextBoss=Math.ceil(w/CFG.bossEvery)*CFG.bossEvery,tm=CFG.tier(t);
  // one row per rank pool with its spawn chance, then its types (chances are per pool, split evenly between the types that have arrived)
  const row=k=>{const d=ET[k],e=enemyStats(k,w,t),on=isBoss(d)?boss:typeOn(d,w,t);
    const when=isBoss(d)?(boss?'this wave':`wave ${nextBoss}`):on?'':t<rankTier(d)?`from tier ${rankTier(d)}`:`from wave ${typeFrom(d,t)}`;
    return`<tr class="${on?'':'off'}"><td>${mobIcon(d)}<span>${d.n}${when?`<span class="when">${when}</span>`:''}</span></td><td></td><td>${fmt(e.hp)}</td><td>${fmt(e.atk)}</td><td>${fmt(e.spd)}</td><td></td><td>${fmt(e.weight)}</td></tr>`};
  // each rank row collapses its types (tap to toggle; which ranks are open is remembered in save.set.eOpen)
  const open=save.set.eOpen||[];
  const rows=RANK_ORDER.filter(rk=>TYPES.some(k=>ET[k].r===rk)).map(rk=>{const p=rk===RK.BOSS?(boss?'1 boss':'–'):pc[rk]?pct(pc[rk]):'–';
    const ks=TYPES.filter(k=>ET[k].r===rk),k0=ks[0],op=open.includes(rk);
    return`<tr class="pool${rk===RK.BOSS?(boss?'':' off'):pc[rk]?'':' off'}" data-rk="${rk}" tabindex="0" aria-expanded="${op}"><td><span class="chev">${op?'▾':'▸'}</span>${RANKS[rk]} <span class="cnt">${ks.length}</span></td><td>${p}</td><td colspan="3"></td><td class="coin">${fmt(enemyStats(k0,w,t).coins*cb)}</td><td></td></tr>`+(op?ks.map(row).join(''):'')}).join('');
  const cnt=CFG.spawnCount(w)+(boss?1:0);
  return tabs+`<table class="etab"><thead><tr><th>Enemy</th><th title="Chance per spawn, per rank">%</th><th title="Health">♥ HP</th><th title="Attack">⚔ ATK</th><th title="Speed, m/s">» m/s</th><th title="Coins each enemy of this rank drops, with your coin bonus">Coins</th><th title="Weight">⚖ WGT</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="grid2 winfo">
    <div><span>Wave time left</span><b id="wiTime">${live&&run.wave>=CFG.finalWave?'final wave':live?Math.ceil(run.waveLen-run.waveT)+' s':CFG.waveLen+' s'}</b> <small>of ${live?+run.waveLen.toFixed(1):CFG.waveLen} s (spawning for the first ${live?+run.spawnLen.toFixed(1):CFG.spawnLen} s)</small></div>
    <div><span>Spawned this wave</span><b id="wiSpawned">${live?run.spawned:0}</b> <small>of ${cnt}</small></div>
    <div><span>Enemies on the field</span><b id="wiAlive">${live?enemies.filter(e=>!e.dead).length:0}</b> <small>of ${fmt(CFG.enemyCap)} max</small></div>
    <div><span>Next boss</span><b>${boss?'this wave':'wave '+nextBoss}</b></div>
    <div><span>Growth next wave</span><b>♥ +${(100*(CFG.hpMul(w+1)/CFG.hpMul(w)-1)).toFixed(1)}% · ⚔ +${(100*(CFG.dmgMul(w+1)/CFG.dmgMul(w)-1)).toFixed(1)}%</b></div>
    <div><span>Tier ${t} multiplier</span><b>♥ ×${fmt(tm.hp)} · ⚔ ×${fmt(tm.dmg)} · ⚖ ×${fmt(tm.wt)} · » ×${fmt(tm.spd)} · <span class="coin">coins ×${fmt(tm.coin)}</span></b></div>
  </div>`}
function spireStats(){const live=run&&!run.over;const v={};for(const s of ST)v[s.k]=live?run.s[s.k]:valAt(s,0,save.ws[s.k]||0);return{live,v}}
function spireHtml(){const {live,v}=spireStats();eSig=JSON.stringify(v)+(live?Math.round(run.hp):'');
  const dps=v.damage*v.aspd*(1+v.crit*(v.critMult-1));
  return`<p class="note">${live?'Current values in this run, Workshop and in-run upgrades included.':'Your starting values (Workshop). Start a run to see in-run upgrades added.'}</p>
  <div class="grid2 winfo"><div><span>Damage per second</span><b>${fmt(dps)}</b> <small>average, crits included</small></div><div><span>Health</span><b>${live?fmt(Math.max(0,run.hp))+' / ':''}${fmt(v.health)}</b></div></div>
  ${GROUPS.map(g=>`<div class="gh">${g}</div><div class="grid2 winfo">${ST.filter(s=>s.g===g&&!(s.ws&&live)).map(s=>`<div><span>${s.n}</span><b>${fv(s,v[s.k])}</b></div>`).join('')}</div>`).join('')}`}
function togglePool(r){const rk=+r.dataset.rk,o=save.set.eOpen||(save.set.eOpen=[]),i=o.indexOf(rk);if(i<0)o.push(rk);else o.splice(i,1);persist();
  const st=mBody.scrollTop;mBody.innerHTML=enemyHtml();mBody.scrollTop=st;const n=mBody.querySelector(`tr[data-rk="${rk}"]`);if(n)n.focus()}
mBody.addEventListener('keydown',e=>{const r=e.target.closest&&e.target.closest('tr[data-rk]');if(r&&(e.key==='Enter'||e.key===' ')){e.preventDefault();togglePool(r)}});
modal.addEventListener('click',e=>{if(e.target===modal)return closeModal();{const r=e.target.closest('tr[data-rk]');if(r&&modalKind==='enemies'){togglePool(r);return}}const b=e.target.closest('button');if(!b)return;if(b.dataset.etab){eTab=b.dataset.etab;mBody.innerHTML=enemyHtml();return}if(b.dataset.mstier){msTier=+b.dataset.mstier;mBody.innerHTML=historyHtml();return}if(b.dataset.htab){hTab=b.dataset.htab;mBody.innerHTML=historyHtml();return}if(b.dataset.act)settingsClick(b)});
modal.addEventListener('change',optChange);
const mobIcon=d=>{const z=d.sz/22*.75+.4,pts=SHAPES[d.sh].map(p=>p.map(v=>(v*z).toFixed(3)).join(',')).join(' ');
  return`<svg viewBox="-1.5 -1.5 3 3" width="34" height="34" aria-hidden="true">${d.shield?`<circle r="${(z*1.4).toFixed(2)}" fill="none" stroke="var(--e6)" stroke-width=".1"/>`:''}<polygon points="${pts}" fill="var(--${d.c})" fill-opacity=".3" stroke="var(--${d.c})" stroke-width=".12" stroke-linejoin="round"/></svg>`};
function helpHtml(){const rel=v=>'×'+(+v.toFixed(v<10?2:0)),t2=CFG.tier(2),pct=v=>Math.round((v-1)*100)+'%',rng=SK.range.base;
  return`<div class="help">
  <p>Your spire sits in the middle and fires at the closest enemy in range on its own. Enemies come in from every side. The run ends when the spire's health hits 0.</p>
  <h3>Runs and waves</h3><ul>
  <li>A new wave starts every ${CFG.waveLen} s of game time: enemies spawn for the first ${CFG.spawnLen} s, then there's a break to clear the field. Every ${CFG.bossEvery}th wave brings a boss. Each block of ${CFG.bossEvery} waves spawns more enemies per wave, growing more slowly as you go: ${[1,11,21,101,1001].map(w=>`${CFG.spawnCount(w)} from wave ${w.toLocaleString()}`).join(', ')}, then it stays at ${CFG.spawnCount(CFG.lateWave)} from wave ${CFG.lateWave.toLocaleString()} on. As waves climb, Veterans and Elites make up a larger share of each wave (the Enemy panel's % column shows the share on the current wave); elites drop alloy.</li>
  <li>Every enemy hits harder each time it attacks: each hit or shot does ${Math.round((CFG.hitRamp-1)*100)}% more than its last, so don't let them linger at the spire.</li>
  <li>Enemies get tougher every wave, quickly at first and more gently later: ×${fmt(CFG.hpMul(100))} health by wave 100, ×${fmt(CFG.hpMul(1000))} by wave 1000. They also get heavier (×${fmt(CFG.wtMul(1000))} weight by wave 1000), so knockback, Shockwave and Gravity Well move them less. Wave ${CFG.finalWave.toLocaleString()} is the last: nothing more spawns, and destroying every enemy left clears the tier.</li>
  <li><b>Milestones</b> pay coins, alloy, chips (and shards from tier 2) the first time you reach certain waves on each tier, ${MILESTONES.length} per tier from wave ${MILESTONES[0]} to ${CFG.finalWave.toLocaleString()}. See Records → Milestones.</li>
  <li>Reach wave ${CFG.tierUnlockWave.toLocaleString()} to unlock the next tier. Each tier up multiplies enemy health by ${t2.hp}, damage by ${t2.dmg}, weight by ${t2.wt}, speed by ${t2.spd} and coins by ${t2.coin}.</li></ul>
  <h3>Respec</h3><p>Every Workshop section, ultimate, piece of equipment and module has a refund button that gives back everything you spent on it, so you can try a different build at no cost. Tap it once to see the amount and again to confirm.</p>
  <h3>Currencies</h3><ul>
  <li><b class="cash">Cash</b> comes from kills and from cash interest, paid at the start of every wave. Spend it on Attack, Defense and Utility upgrades. It resets every run.</li>
  <li><b class="coin">Coins</b> come from kills and are kept forever. Spend them in the Workshop on permanent tower upgrades.</li>
  <li><b class="shard">Shards</b> are paid when a run ends on tier 2 or higher, based on how many enemies you killed (${CFG.shardPerKill} per kill × the tier's shard multiplier, which grows with the tier). Spend them in the Lab.</li>
  <li><b class="chip">Chips</b> drop from bosses. Spend them on Equipment.</li>
  <li><b class="alloy">Alloy</b> drops from elites. It buys Modules, which are under maintenance for now, so it's saved for when they return.</li></ul>
  <h3>Equipment and Modules</h3><ul>
  <li><b>Equipment</b> adds new abilities: ${CARDS.map(c=>`${c.n} (${c.f(c.v[0])} at 1 star)`).join('; ')}. Buy it, equip it in a slot and level it up to 5 stars.</li>
  <li><b>Modules</b> (under maintenance for now: they give no bonuses until they return) are gear for the spire's ${MOD_SLOTS.length} slots (${MOD_SLOTS.map(s=>s.n).join(', ')}). Each adds a stat per level and has a special effect that steps up to its next value every ${MOD.per} levels as it ranks up: ${RARITY.join(', ')}.</li>
  <li>Both are bought directly, with no random draws, and you can swap them any time, even mid-run.</li></ul>
  <h3>Upgrades</h3><ul>
  <li>The <b>Upgrades</b> and <b>Workshop</b> tabs each have three sections; switch between them with the Attack / Defense / Utility buttons. <b>Attack</b>: damage, attack speed, crits and super crits (a chance for a crit to be multiplied again), range, damage per distance (more damage for every metre between the spire and its target), multishot (a chance to also fire at more enemies in range) and bounce shots (a chance for a shot to hop on to more enemies within bounce range after it hits; bounce range can't exceed 40% of your range). <b>Defense</b>: health, regen, a barrier (a shield that soaks up damage before your health, shown in the blue bar next to it; once it breaks it comes back at full after a recharge timer, 5:00 to start and shorter with upgrades), damage reduction, thorns (hits back for part of the attacker's max health; every enemy attack triggers it, Ranged shots and Charger rams included, except Boss spikes), lifesteal (heals the spire by a share of the damage its shots deal), death defy (a chance to shrug off a hit that would kill you; the spire flashes gold and shows DEFIED) and knockback (a chance for hits to shove enemies away; heavier enemies move less). <b>Utility</b>: more cash and coins, and a chance for each in-run Attack, Defense or Utility level you buy to be free.</li>
  <li><b>Workshop</b> levels are your starting values in every run. In-run levels stack on top.</li>
  <li><b>Lab</b> research extends how long offline earnings count (+4 h per level from 24 h), unlocks the 12×, 16× and 24× game speeds, takes 2% per level off Workshop prices and adds auto-buy toggles.</li>
  <li>Use ×1, ×10 or Max at the top of a tab to buy several levels at once.</li></ul>
  <h3>Offline earnings</h3>
  <p>A run keeps going while the game is open, even in a background tab or a minimised window, so you can leave it to push waves. Offline earnings only cover the time the game is closed: an open game earns nothing offline, even on the menu or between runs.</p>
  <p>Your best coins per game-hour, from a run of at least ${CFG.offlineMinRun/60} game-minutes, keeps paying while you're away, as if the game were running at your fastest unlocked speed (${Math.max(...speeds())}× now; Overdrive in the Lab raises it) at ${Math.round(CFG.offlineEff*100)}% efficiency. Offline duration sets how many hours count (${labVal('offCap')} h now). Shorter runs don't set the rate. Shards and chips work the same way: your best shards per game-hour (from tier 2+ runs) and your best boss chips per game-hour (milestone chips don't count) are paid while you're away too. The Workshop tab shows your current rates per real hour.</p>
  <h3>Enemies</h3><p>An enemy's fill shows its health: solid at full, emptying to just an outline as it's worn down. Enemies come in ranks: Normal (the Basic), Veteran (Fast, Ranged and Tank), Elite (Shielded, Healer, Splitter, Charger and Protector), Super Elite (the Lancer), Special Elite (the Hacker: rare, very strong, and only a few on the field at once), and Boss. The % column in the Enemy panel shows the exact mix. From wave ${CFG.lateWave.toLocaleString()} the number per wave stops growing and the mix shifts towards Elites instead, step by step until wave ${CFG.finalWave.toLocaleString()}: Normal and Veteran spawn chances fall to ${PC1(CFG.lateNormal)} of what they were and Elite, Super Elite and Special Elite chances rise to ${PC1(CFG.lateElite)}. Elites only appear from tier ${POOLS[RK.ELITE].tier}, and Super and Special Elites from tier ${POOLS[RK.SUPER].tier}; both drop alloy and pay ${+(Math.min(...TYPES.filter(t=>isElite(ET[t])).map(t=>ET[t].coin))/ET.basic.coin).toFixed(2)}× a Basic's coins or more. Each type arrives later in a run than the last, and sooner on higher tiers (the arrival wave is divided by tier^${CFG.fromPow}). A boss arrives every ${CFG.bossEvery} waves. Crowds push each other apart (heavier enemies win), so every enemy stays visible. Tap the Enemy stats in the top bar to see every type's numbers for the current wave; tap a rank to show or hide its types.</p><p>In that panel, % is the chance each regular spawn comes from that rank, shared equally by the rank's types that have arrived. Attack is damage per hit before your Defense: once a second up close, or one shot every 2 s for Ranged. Speed is metres per second (a new spire's range is ${SK.range.base} m). Weight is how hard an enemy is to push: heavier ones shove lighter ones aside, and knockback moves them less. Coins is what each enemy of a rank drops on the current wave (smaller Splitters pay less), with the tier multiplier and your coin bonus included. Greyed-out types can't spawn yet.</p>
  ${RANK_ORDER.filter(rk=>TYPES.some(t=>ET[t].r===rk)).map(rk=>`<div class="gh">${RANKS[rk]}</div><div class="mobs">${TYPES.filter(t=>ET[t].r===rk).map(t=>{const d=ET[t];
    const when=rk===RK.BOSS?`every ${CFG.bossEvery} waves`:rankTier(d)>1?`from tier ${rankTier(d)} (wave ${typeFrom(d,Math.max(rankTier(d),save.tierMax))} on tier ${Math.max(rankTier(d),save.tierMax)})`:d.from?`from wave ${d.from} on tier 1 (${typeFrom(d,save.tierMax)} on tier ${save.tierMax})`:'from wave 1';
    return`<div class="mob">${mobIcon(d)}<div><b>${d.n}</b> <span class="v">${when} · ${rel(d.hp/ET.basic.hp)} health · ${rel(d.dmg/ET.basic.dmg)} damage</span><p>${d.d}</p></div></div>`}).join('')}</div>`).join('')}
  <p class="note">Health and damage are relative to a basic enemy on the same wave. A new spire's range is ${rng} m; Ranged enemies stop at ${Math.round(ET.ranged.stopPct*100)}% of your range. Enemies always spawn ${Math.round((CFG.spawnRatio-1)*100)}% beyond your range (at least ${CFG.spawnR} m out), so they have to walk in; the arena zooms with your range. Knockback pushes an enemy (force ÷ its weight) metres away.</p>
  <h3>Ultimate weapons</h3><p>Bought and upgraded with chips in the Ultimates tab. Every one you own is active: ${ULTS.map(u=>`<b>${u.n}</b> (${(d=>d.charAt(0).toLowerCase()+d.slice(1,-1))(ultDesc(u))})`).join('; ')}. Chain Lightning and Frost Field are always working; the others fire on their own cooldown when there's an enemy in range, or set one to Manual and fire it with its button under the arena. Strength upgrades (damage, Force, Pull) have ${ULT.levels} levels in bands of ${ULT.band} (one per tier): a band costs about what farming its tier earns in chips, and keeps pace with that tier's enemies. Capped stats (chance, slow, cooldowns, durations) have ${Math.min(...ULTS.flatMap(u=>u.t).filter(t=>t.lv<ULT.levels).map(t=>t.lv))} to ${Math.max(...ULTS.flatMap(u=>u.t).filter(t=>t.lv<ULT.levels).map(t=>t.lv))} levels each, and every level costs more than the one before. Each ultimate's unlock and level prices are on its buttons, so choose what's worth saving for. Tap an ultimate in the tab to open it, and use ×1 / ×10 / Max to buy several levels at once. Medals come from how complete an ultimate is (the average of its 4 upgrades): <b>Silver</b> at ${Math.round(ULT.medals[0]*100)}%, <b>Gold</b> at ${Math.round(ULT.medals[1]*100)}% and <b>Platinum</b> at ${Math.round(ULT.medals[2]*100)}%; each adds a bonus.</p>
  <h3>Targeting</h3><p>Tap 🎯 <b>Target</b> under the arena to set target priority. Drag enemy types above <b>Closest</b> to have the spire shoot them first, top to bottom (closest first within a type); everything below Closest is shot closest-first. With Closest at the top, it simply shoots the closest enemy.</p>

  <h3>Controls</h3><p>Space pauses. Number keys pick a game speed. Esc closes this window.</p></div>`}
function buildSpeeds(){$('speeds').innerHTML=speeds().map(s=>`<button data-sp="${s}" class="${save.set.speed===s?'on':''}">${s}×</button>`).join('')}
$('speeds').addEventListener('click',e=>{const b=e.target.closest('button');if(b){save.set.speed=+b.dataset.sp;persist();buildSpeeds()}});
const setPause=v=>{paused=v;$('pause').textContent=v?'Resume':'Pause';$('pause').classList.toggle('on',v);if(run&&!run.over)showOv(v?'paused':null)};
$('pause').addEventListener('click',()=>setPause(!paused));
$('perfBtn').addEventListener('click',()=>{save.set.perf=!save.set.perf;persist()});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)return closeModal();if(e.target.matches('input,textarea'))return;
  if(e.code==='Space'){e.preventDefault();if(run&&!run.over)setPause(!paused)}
  const n=+e.key,sp=speeds();if(n>=1&&n<=sp.length){save.set.speed=sp[n-1];persist();buildSpeeds()}});
