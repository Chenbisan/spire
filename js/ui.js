// Spire — DOM UI: HUD, overlays, upgrade panel, settings, controls.
// ---- auto-restart after a run ends ----
let autoLeft=0,autoTimer=null;
function stopAuto(){clearInterval(autoTimer);autoTimer=null;autoLeft=0}
function startAuto(){stopAuto();if(!save.set.auto)return;autoLeft=save.set.autoDelay;
  autoTimer=setInterval(()=>{autoLeft--;const el=document.getElementById('autoTxt');if(el)el.textContent=autoLeft;if(autoLeft<=0){stopAuto();newRun(ovTier)}},1000)}
const hpBar=$('hpBar'),waveBar=$('waveBar');let lastHp=-1,lastWv=-1;
function bars(){
  const hp=run?Math.max(0,Math.min(1,run.hp/run.s.health)):0;
  const wv=run&&!run.over?Math.min(1,(run.waveT+(paused?0:A*CFG.step))/CFG.waveLen):0;
  if(Math.abs(hp-lastHp)>1e-4){lastHp=hp;hpBar.style.transform=`scaleX(${hp})`}
  if(Math.abs(wv-lastWv)>1e-4){lastWv=wv;waveBar.style.transform=`scaleX(${wv})`}
}
// ================= UI =================
const TX=(id,t)=>{const e=$(id);t=String(t);if(e.textContent!==t)e.textContent=t};
function hud(){
  TX('hTier',run?run.tier:'–');TX('hWave',run?run.wave:'–');
  TX('hCash',run?fmt(run.cash):'0');TX('hCoins',fmt(save.coins));TX('hShards',fmt(save.shards));$('shardChip').hidden=!shardsOn();
  {const w=run?run.wave:1,t=run?run.tier:ovTier,e=enemyStats('basic',w,t);
   TX('eHp',fmt(e.hp));TX('eAtk',fmt(e.atk));TX('eSpd',fmt(e.spd));TX('eWt',fmt(e.weight));
   if(modalKind==='enemies'){
     if(w!==eTabW||t!==eTabT)mBody.innerHTML=enemyHtml();
     else if(eTab==='wave'&&run&&!run.over&&$('wiTime')){TX('wiTime',Math.ceil(CFG.waveLen-run.waveT)+' s');TX('wiSpawned',run.spawned);TX('wiAlive',enemies.filter(e=>!e.dead).length)}
     else if(eTab==='spire'){const {live,v}=spireStats();if(JSON.stringify(v)+(live?Math.round(run.hp):'')!==eSig)mBody.innerHTML=enemyHtml()}}}
  if(run){TX('hpTxt',`${fmt(Math.max(0,run.hp))} / ${fmt(run.s.health)}`)}
  else{TX('hpTxt','–')}
  const pf=$('perf');pf.hidden=!save.set.perf;$('perfBtn').classList.toggle('on',save.set.perf);
  if(save.set.perf)pf.textContent=`${fps} fps  ·  sim ${simMs.toFixed(2)} ms/frame\n${enemies.length} enemies  ·  ${bullets.length} shots  ·  ${ebs.length} enemy shots`;
  refreshPanel();if(typeof updRunNote==='function')updRunNote();
}
let ovTier=save.tierMax;
const shardsOn=()=>save.tierMax>=2||save.shards>0;
function tierPicker(){let h='<div class="tiers">';for(let t=1;t<=save.tierMax;t++)h+=`<button data-tier="${t}" class="${t===ovTier?'on':''}">Tier ${t}<small>best wave ${save.best[t]||0}</small></button>`;return h+'</div>'}
function showOv(kind){
  const ov=$('ov'),c=$('ovCard');if(!kind){ov.hidden=true;return}ov.hidden=false;
  ovTier=Math.min(ovTier,save.tierMax);
  if(kind==='start')c.innerHTML=`<h2>Hold the center</h2><p>Your spire fires automatically. Spend cash on upgrades during a run; coins carry over to the workshop. Reach wave ${CFG.tierUnlockWave} to unlock the next tier.</p>${tierPicker()}<button class="go" id="goBtn">Start run</button>`;
  else{const R=run,m=Math.floor(R.time/60),s=Math.floor(R.time%60);
    c.innerHTML=`<h2>Fell on wave ${R.wave}</h2><p>Tier ${R.tier} · best ${save.best[R.tier]||0}</p><div class="grid2"><div><span>Coins earned</span>${fmt(R.coins)}</div><div><span>Coins per hour</span>${fmt(R.cph)}${R.newBest?' · new best':''}</div><div><span>Offline rate</span>${fmt(save.bestCph)}/h${R.time<CFG.offlineMinRun?' (run too short to count)':''}</div>${R.tier>=2?`<div><span>Shards earned</span><b class="shard">${fmt(R.shards)}</b></div>`:''}<div><span>Kills</span>${fmt(R.kills)}</div><div><span>Cash earned</span>${fmt(R.cashEarned)}</div><div><span>Run time</span>${m}m ${s}s (game time)</div></div><button id="toHist" style="width:100%;margin-bottom:8px">Battle history</button><button id="toWs" style="width:100%;margin-bottom:8px">Open workshop (${fmt(save.coins)} coins)</button>${tierPicker()}<button class="go" id="goBtn">${autoTimer?`Run again · auto in <span id="autoTxt">${autoLeft}</span>s`:'Run again'}</button>${autoTimer?'<button id="stopAuto" style="width:100%;margin-top:8px">Stay on this screen</button>':''}`}
}
$('ovCard').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.tier){ovTier=+t.dataset.tier;showOv(run&&run.over?'over':'start')}
  else if(t.id==='goBtn'){stopAuto();newRun(ovTier)}
  else if(t.id==='stopAuto'){stopAuto();showOv('over')}
  else if(t.id==='toWs'){ui.tab='Workshop';buildPanel()}
  else if(t.id==='toHist')openModal('history');
});
const ui={tab:'Upgrades',mult:1};let rows=[];
const TABS=['Upgrades','Workshop','Lab'];   // Ultimates and Modules go here later
const GROUPS=['Attack','Defense','Utility'];
function buildTabs(){$('tabs').innerHTML=TABS.map(t=>`<button data-tab="${t}" class="${t===ui.tab?'on':''}">${t}</button>`).join('')}
$('tabs').addEventListener('click',e=>{const t=e.target.closest('button');if(t){ui.tab=t.dataset.tab;buildPanel()}});
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
  if(ui.tab==='Lab'){rows=[];
    P.innerHTML=`<p class="note">Research is paid in <b class="shard">shards</b>, which only drop from enemies on tier 2 and up. It applies instantly and lasts forever. No timers.</p>`+(shardsOn()?'':`<p class="note"><b>Locked:</b> reach wave ${CFG.tierUnlockWave} on tier 1 to unlock tier 2 and start finding shards.</p>`)+LAB.map(l=>`<div class="row"><div><b>${l.n}</b><span class="v"></span><span class="note" style="display:block;margin:2px 0 0">${l.d}</span></div><button class="buy shard" data-lab="${l.k}"></button></div>`).join('');
    labRows=[...P.querySelectorAll('[data-lab]')].map(b=>({l:LK[b.dataset.lab],b,v:b.parentNode.querySelector('.v')}));
    return refreshPanel()}
  const ws=ui.tab==='Workshop';
  let h=`<div class="mults">${[1,10,'Max'].map(m=>`<button data-mult="${m}" class="${ui.mult===m?'on':''}">${m==='Max'?'Max':'×'+m}</button>`).join('')}</div>`;
  if(ws){h+='<p class="note">Permanent upgrades, paid in coins. They apply to every run, including the one in progress. Values shown are your starting values.</p>'+`<p class="note">Offline rate: <b class="coin">${fmt(save.bestCph*labVal('offSpd'))} coins/hour</b> (best run ${fmt(save.bestCph)}/h × lab ${labVal('offSpd').toFixed(2)}, up to ${labVal('offCap')}h). Runs under ${CFG.offlineMinRun/60} minutes of game time don't count. Rate is per game-hour, so game speed doesn't change it.</p>`;
    for(const g of['Attack','Defense','Utility'])h+=`<div class="gh">${g}</div>`+ST.filter(s=>s.g===g).map(rowHtml).join('')}
  else{h+=!run||run.over?'<p class="note">Start a run to buy in-run upgrades.</p>':'<p class="note">Paid in cash, which resets every run.</p>';
    for(const g of GROUPS)h+=`<div class="gh ghx"><span>${g}</span>${labLv('auto')?`<label class="ab"><input type="checkbox" data-ab="${g}" ${save.set.ab[g]?'checked':''}> Auto-buy</label>`:''}</div>`+ST.filter(s=>s.g===g&&!s.ws).map(rowHtml).join('')}
  P.innerHTML=h;
  rows=[...P.querySelectorAll('.row')].map(r=>({s:SK[r.dataset.k],v:r.querySelector('.v'),b:r.querySelector('.buy')}));
  refreshPanel();
}
let labRows=[];
const labCost=l=>l.c[0]*l.c[1]**labLv(l.k);
const rowHtml=s=>`<div class="row" data-k="${s.k}"><div><b>${s.n}</b><span class="v"></span></div><button class="buy" data-k="${s.k}"></button></div>`;
function refreshPanel(){
  for(const r of labRows){const l=r.l,lv=labLv(l.k),mx=lv>=l.max,c=labCost(l);
    const vt=mx?l.f(l.val(lv))+' (max)':`${l.f(l.val(lv))} → ${l.f(l.val(lv+1))}`;if(r.v.textContent!==vt)r.v.textContent=vt;
    const ok=!mx&&save.shards>=c;if(r.b.disabled===ok)r.b.disabled=!ok;const t=mx?'Max':fmt(c);if(r.b.textContent!==t)r.b.textContent=t}
  const ws=ui.tab==='Workshop';
  for(const r of rows){const p=plan(r.s,ws);
    const vt=p.isCap?fv(r.s,p.cur)+' (max)':`${fv(r.s,p.cur)} → ${fv(r.s,p.nxt)}`;if(r.v.textContent!==vt)r.v.textContent=vt;
    if(r.b.disabled===p.ok)r.b.disabled=!p.ok;
    const html=p.isCap?'Max':`<span class="q">+${p.show}</span>${fmt(p.cost)}`;
    if(r.b.innerHTML!==html)r.b.innerHTML=html;
    r.b.classList.toggle('coin',ws);r.b.classList.toggle('cash',!ws)}
}
$('panel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mult){ui.mult=b.dataset.mult==='Max'?'Max':+b.dataset.mult;return buildPanel()}
  if(b.dataset.lab){const l=LK[b.dataset.lab],c=labCost(l);if(labLv(l.k)>=l.max||save.shards<c)return;save.shards-=c;save.lab[l.k]=labLv(l.k)+1;persist();
    if(l.k==='speed')buildSpeeds();if(l.k==='auto')toast('Auto-buy toggles added to the Upgrades tab');refreshPanel();return}
  if(b.dataset.k){const s=SK[b.dataset.k],ws=ui.tab==='Workshop',p=plan(s,ws);if(!p.ok)return;
    if(ws){save.coins-=p.cost;save.ws[s.k]=(save.ws[s.k]||0)+p.n;persist()}else{run.cash-=p.cost;run.lv[s.k]=(run.lv[s.k]||0)+p.n}
    recalc();refreshPanel();return}
});
function settingsHtml(){return`<div class="set">
  <label><input type="checkbox" id="optDn" ${save.set.dmgNums?'checked':''}> Damage numbers</label>
  <label><input type="checkbox" id="optPf" ${save.set.perf?'checked':''}> Performance overlay</label>
  <label><input type="checkbox" id="optAuto" ${save.set.auto?'checked':''}> Auto-restart after a run ends, after
    <select id="optDelay" style="font:inherit;min-height:36px;border-radius:8px;background:var(--arena);color:var(--ink);border:1px solid var(--line)">${[3,5,10,15].map(n=>`<option ${save.set.autoDelay===n?'selected':''}>${n}</option>`).join('')}</select> s</label>
  <div class="gh">Save</div><p class="note">Progress saves in this browser automatically. Copy a backup code to be safe, or paste one to restore.</p>
  <textarea id="saveTxt" placeholder="Backup code appears here, or paste one to import"></textarea>
  <div class="btns"><button data-act="export">Copy backup code</button><button data-act="import">Import code</button></div>
  <div class="gh">Run</div><div class="btns"><button data-act="abandon" ${run&&!run.over?'':'disabled'}>End current run</button></div>
  <div class="gh">Danger zone</div><div class="btns"><button data-act="reset" class="danger">Reset all progress</button></div>
  <p class="note">Keys: Space pause · 1–${speeds().length} speed · Esc close</p><p class="note"><a href="${CHANGELOG_URL}" target="_blank" rel="noopener" style="color:inherit">Version ${APP_VERSION} · what's new</a></p></div>`}
let resetArm=0;
function settingsClick(b){
  const a=b.dataset.act,tx=$('saveTxt');
  if(a==='export'){const code=btoa(unescape(encodeURIComponent(JSON.stringify(save))));tx.value=code;tx.select();
    navigator.clipboard?.writeText(code).then(()=>toast('Backup code copied'),()=>toast('Select the code and copy it'))||toast('Select the code and copy it')}
  else if(a==='import'){try{const s=JSON.parse(decodeURIComponent(escape(atob(tx.value.trim()))));if(s.v!==1)throw 0;save=Object.assign(fresh(),s,{set:Object.assign(fresh().set,s.set)});persist();recalc();toast('Save imported');buildPanel();if(!run)showOv('start');openModal('settings')}catch(e){toast('That code did not work')}}
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
function openModal(kind){modalKind=kind;$('mTitle').textContent={help:'How to play',settings:'Settings',enemies:'Enemies this wave',history:'Battle history'}[kind];
  mBody.innerHTML=kind==='help'?helpHtml():kind==='enemies'?enemyHtml():kind==='history'?historyHtml():settingsHtml();modal.hidden=false;mBody.scrollTop=0;$('mClose').focus()}
function closeModal(){modal.hidden=true;modalKind=null}
function refreshHistory(){if(modalKind==='history')mBody.innerHTML=historyHtml()}
$('setBtn').addEventListener('click',()=>modalKind==='settings'?closeModal():openModal('settings'));
$('helpBtn').addEventListener('click',()=>modalKind==='help'?closeModal():openModal('help'));
$('mClose').addEventListener('click',closeModal);
$('histBtn').addEventListener('click',()=>modalKind==='history'?closeModal():openModal('history'));
const dur=s=>{s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}h ${m}m`:`${m}m ${x}s`};
function historyHtml(){const H=save.hist;
  if(!H.length)return`<p class="note">No runs yet. Your last ${CFG.histMax} runs will show up here when they end.</p>`;
  const top=Math.max(...H.map(h=>h.cph));
  return`<p class="note">Your last ${CFG.histMax} runs, newest first. Run time and coins per hour are in game time.</p><div class="hist">${H.map(h=>{const d=new Date(h.at);
    return`<div class="hrow"><div class="htop"><b>Tier ${h.t}</b><b>Wave ${h.w}</b>${h.best?'<span class="tag">best wave</span>':''}${h.quit?'<span class="tag mute">ended early</span>':''}<span class="hdate">${d.toLocaleDateString()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div>
    <div class="hst"><span>Coins <b class="coin">${fmt(h.c)}</b></span><span>Coins/hour <b class="coin">${fmt(h.cph)}</b>${h.cph===top&&H.length>1?' ★':''}</span>${h.t>=2?`<span>Shards <b class="shard">${fmt(h.s)}</b></span>`:''}<span>Kills <b>${fmt(h.k)}</b></span><span>Time <b>${dur(h.time)}</b></span></div></div>`}).join('')}</div>`}
$('eBtn').addEventListener('click',()=>modalKind==='enemies'?closeModal():openModal('enemies'));
let eTabW=0,eTabT=0,eTab='wave',eSig='';
const pct=v=>(v*100).toFixed(v<.1&&v>0?1:0)+'%';
function enemyHtml(){const live=run&&!run.over,w=eTabW=live?run.wave:1,t=eTabT=live?run.tier:ovTier;eSig='';
  $('mTitle').textContent=`Tier ${t} · Wave ${w}`;
  const tabs=`<div class="mults"><button data-etab="wave" class="${eTab==='wave'?'on':''}">Wave info</button><button data-etab="spire" class="${eTab==='spire'?'on':''}">Your spire</button></div>`;
  if(eTab==='spire')return tabs+spireHtml();
  const ch=spawnChance(w),boss=w%CFG.bossEvery===0,nextBoss=Math.ceil(w/CFG.bossEvery)*CFG.bossEvery,tm=CFG.tier(t);
  const rows=TYPES.map(k=>{const d=ET[k],e=enemyStats(k,w,t),on=d.r===3?boss:w>=(d.from||1);
    const when=d.r===3?(boss?'this wave':`wave ${nextBoss}`):on?'':`from wave ${d.from}`;
    const chance=d.r===3?(boss?'1 boss':'–'):on?pct(ch[k]||0):'–';
    return`<tr class="${on?'':'off'}"><td>${mobIcon(d)}<span>${d.n}${when?`<span class="when">${when}</span>`:''}</span></td><td>${chance}</td><td>${fmt(e.hp)}</td><td>${fmt(e.atk)}</td><td>${fmt(e.spd)}</td><td>${fmt(e.weight)}</td></tr>`}).join('');
  const cnt=CFG.spawnCount(w)+(boss?1:0);
  return tabs+`<table class="etab"><thead><tr><th>Enemy</th><th title="Chance per spawn">%</th><th title="Health">♥ HP</th><th title="Attack">⚔ ATK</th><th title="Speed">» SPD</th><th title="Weight">⚖ WGT</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="grid2 winfo">
    <div><span>Wave time left</span><b id="wiTime">${live?Math.ceil(CFG.waveLen-run.waveT)+' s':CFG.waveLen+' s'}</b> <small>of ${CFG.waveLen} s</small></div>
    <div><span>Spawned this wave</span><b id="wiSpawned">${live?run.spawned:0}</b> <small>of ${cnt}</small></div>
    <div><span>Enemies on the field</span><b id="wiAlive">${live?enemies.filter(e=>!e.dead).length:0}</b></div>
    <div><span>Next boss</span><b>${boss?'this wave':'wave '+nextBoss}</b></div>
    <div><span>Growth per wave</span><b>♥ +${pct(CFG.hpGrow-1)} · ⚔ +${pct(CFG.dmgGrow-1)}</b></div>
    <div><span>Tier ${t} multiplier</span><b>♥ ×${fmt(tm.hp)} · ⚔ ×${fmt(tm.dmg)}</b></div>
  </div>
  <p class="note">% is the chance each regular spawn is that type. Attack is damage per hit before your Defense: once a second up close, or one shot every 2 s for Ranged. Speed is distance per second (a new spire's range is ${SK.range.base}). Weight is how hard an enemy is to push: heavier ones shove lighter ones aside, and it will resist knockback. Greyed-out types can't spawn yet.</p>`}
function spireStats(){const live=run&&!run.over;const v={};for(const s of ST)v[s.k]=live?run.s[s.k]:valAt(s,0,save.ws[s.k]||0);return{live,v}}
function spireHtml(){const {live,v}=spireStats();eSig=JSON.stringify(v)+(live?Math.round(run.hp):'');
  const dps=v.damage*v.aspd*(1+v.crit*(v.critMult-1));
  return`<p class="note">${live?'Current values in this run, Workshop and in-run upgrades included.':'Your starting values (Workshop). Start a run to see in-run upgrades added.'}</p>
  <div class="grid2 winfo"><div><span>Damage per second</span><b>${fmt(dps)}</b> <small>average, crits included</small></div><div><span>Health</span><b>${live?fmt(Math.max(0,run.hp))+' / ':''}${fmt(v.health)}</b></div></div>
  ${GROUPS.map(g=>`<div class="gh">${g}</div><div class="grid2 winfo">${ST.filter(s=>s.g===g&&!(s.ws&&live)).map(s=>`<div><span>${s.n}</span><b>${fv(s,v[s.k])}</b></div>`).join('')}</div>`).join('')}`}
modal.addEventListener('click',e=>{if(e.target===modal)return closeModal();const b=e.target.closest('button');if(!b)return;if(b.dataset.etab){eTab=b.dataset.etab;mBody.innerHTML=enemyHtml();return}if(b.dataset.act)settingsClick(b)});
modal.addEventListener('change',optChange);
const mobIcon=d=>{const z=d.sz/22*.75+.4,pts=SHAPES[d.sh].map(p=>p.map(v=>(v*z).toFixed(3)).join(',')).join(' ');
  return`<svg viewBox="-1.5 -1.5 3 3" width="34" height="34" aria-hidden="true">${d.shield?`<circle r="${(z*1.4).toFixed(2)}" fill="none" stroke="var(--e6)" stroke-width=".1"/>`:''}<polygon points="${pts}" fill="var(--${d.c})" fill-opacity=".3" stroke="var(--${d.c})" stroke-width=".12" stroke-linejoin="round"/></svg>`};
function helpHtml(){const rel=v=>'×'+(+v.toFixed(v<10?2:0)),t2=CFG.tier(2),pct=v=>Math.round((v-1)*100)+'%',rng=SK.range.base;
  return`<div class="help">
  <p>Your spire sits in the middle and fires at the closest enemy in range on its own. Enemies come in from every side. The run ends when the spire's health hits 0.</p>
  <h3>Runs and waves</h3><ul>
  <li>A new wave starts every ${CFG.waveLen} s of game time, with more enemies each time. A boss comes every ${CFG.bossEvery} waves.</li>
  <li>Each wave, enemies get ${pct(CFG.hpGrow)} more health and ${pct(CFG.dmgGrow)} more damage.</li>
  <li>Reach wave ${CFG.tierUnlockWave} to unlock the next tier. Each tier up multiplies enemy health by ${t2.hp}, damage by ${t2.dmg} and coins by ${t2.coin}.</li></ul>
  <h3>Currencies</h3><ul>
  <li><b class="cash">Cash</b> comes from kills and wave bonuses. Spend it on Attack, Defense and Utility upgrades. It resets every run.</li>
  <li><b class="coin">Coins</b> come from kills and are kept forever. Spend them in the Workshop on permanent tower upgrades.</li>
  <li><b class="shard">Shards</b> only drop from enemies on tier 2 and up, and more on higher tiers. Spend them in the Lab.</li></ul>
  <h3>Upgrades</h3><ul>
  <li>The <b>Upgrades</b> tab has three sections. <b>Attack</b>: damage, attack speed, crits and range. <b>Defense</b>: health, regen, damage reduction and thorns (hits back for part of the attacker's max health). <b>Utility</b>: more cash and coins.</li>
  <li><b>Workshop</b> levels are your starting values in every run. In-run levels stack on top.</li>
  <li><b>Lab</b> research raises offline earnings, unlocks faster game speeds, discounts the Workshop and adds auto-buyers.</li>
  <li>Use ×1, ×10 or Max at the top of a tab to buy several levels at once.</li></ul>
  <h3>Offline earnings</h3>
  <p>Your best coins per game-hour, from a run of at least ${CFG.offlineMinRun/60} game-minutes, keeps paying while you're away, up to the Lab's time cap.</p>
  <h3>Enemies</h3><p>Enemies come in three ranks. Normal enemies make up most of every wave. Elites start turning up from wave ${Math.min(...TYPES.filter(t=>ET[t].r===2).map(t=>ET[t].from))}, a few per wave, and pay out much more. A boss arrives every ${CFG.bossEvery} waves. Crowds push each other apart (heavier enemies win), so every enemy stays visible. Tap the Enemy stats in the top bar to see every type's numbers for the current wave.</p>
  ${[1,2,3].map(rk=>`<div class="gh">${RANKS[rk]}</div><div class="mobs">${TYPES.filter(t=>ET[t].r===rk).map(t=>{const d=ET[t];
    const when=rk===3?`every ${CFG.bossEvery} waves`:d.from?`from wave ${d.from}`:'from wave 1';
    return`<div class="mob">${mobIcon(d)}<div><b>${d.n}</b> <span class="v">${when} · ${rel(d.hp/ET.basic.hp)} health · ${rel(d.dmg/ET.basic.dmg)} damage</span><p>${d.d}</p></div></div>`}).join('')}</div>`).join('')}
  <p class="note">Health and damage are relative to a basic enemy on the same wave. A new spire's range is ${rng}; ranged enemies stop at ${ET.ranged.stop}.</p>
  <h3>Controls</h3><p>Space pauses. Number keys pick a game speed. Esc closes this window.</p></div>`}
function buildSpeeds(){$('speeds').innerHTML=speeds().map(s=>`<button data-sp="${s}" class="${save.set.speed===s?'on':''}">${s}×</button>`).join('')}
$('speeds').addEventListener('click',e=>{const b=e.target.closest('button');if(b){save.set.speed=+b.dataset.sp;persist();buildSpeeds()}});
const setPause=v=>{paused=v;$('pause').textContent=v?'Resume':'Pause';$('pause').classList.toggle('on',v)};
$('pause').addEventListener('click',()=>setPause(!paused));
$('perfBtn').addEventListener('click',()=>{save.set.perf=!save.set.perf;persist()});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)return closeModal();if(e.target.matches('input,textarea'))return;
  if(e.code==='Space'){e.preventDefault();if(run&&!run.over)setPause(!paused)}
  const n=+e.key,sp=speeds();if(n>=1&&n<=sp.length){save.set.speed=sp[n-1];persist();buildSpeeds()}});
